"""Remote shutdown via SSH, Windows RPC or Sleep-on-LAN."""

from __future__ import annotations

import logging
import os
import shutil
import stat
import subprocess
import tempfile
from dataclasses import dataclass

from . import config
from .wol import normalize_mac, send_magic_packet

log = logging.getLogger(__name__)

COMMAND_TIMEOUT = 25
DEFAULT_SSH_COMMAND = "sudo -n poweroff"
SSH_IDENTITY_NAMES = ("id_ed25519", "id_rsa", "id_ecdsa")
METHODS = ("ssh", "rpc", "sol")


@dataclass
class ShutdownResult:
    ok: bool
    method: str
    error: str = ""
    detail: str = ""

    def as_dict(self) -> dict:
        payload = {"ok": self.ok, "method": self.method}
        if self.detail:
            payload["detail"] = self.detail
        if self.error:
            payload["error"] = self.error
        return payload


def shutdown_configured(device: dict) -> bool:
    """Whether this device has enough settings to attempt a remote shutdown."""
    method = (device.get("shutdown_method") or "").strip()
    if method == "sol":
        return True
    if method == "ssh":
        return bool(device.get("host") and device.get("shutdown_user"))
    if method == "rpc":
        return bool(
            device.get("host")
            and device.get("shutdown_user")
            and device.get("shutdown_password")
        )
    return False


def shutdown_device(device: dict) -> ShutdownResult:
    method = (device.get("shutdown_method") or "").strip()
    if method == "ssh":
        return _shutdown_ssh(device)
    if method == "rpc":
        return _shutdown_windows(device)
    if method == "sol":
        return _shutdown_sol(device)
    return ShutdownResult(
        ok=False,
        method=method,
        error="Remote shutdown is not configured for this device",
    )


def reversed_mac(mac: str) -> str:
    """Sleep-on-LAN listens for a magic packet whose MAC bytes are reversed."""
    parts = normalize_mac(mac).split(":")
    return ":".join(reversed(parts))


def _shutdown_sol(device: dict) -> ShutdownResult:
    mac = reversed_mac(device["mac"])
    result = send_magic_packet(
        mac,
        broadcast=device.get("broadcast") or None,
        repeat=device.get("repeat"),
        host=device.get("host") or None,
    )
    if result.ok:
        return ShutdownResult(
            ok=True,
            method="sol",
            detail=f"{result.packets_sent} Sleep-on-LAN packets sent",
        )
    return ShutdownResult(
        ok=False,
        method="sol",
        error="; ".join(result.errors) or "Could not send Sleep-on-LAN packet",
    )


def _shutdown_ssh(device: dict) -> ShutdownResult:
    ssh = shutil.which("ssh")
    if not ssh:
        return ShutdownResult(
            ok=False, method="ssh", error="SSH client is not available in this image"
        )

    host = (device.get("host") or "").strip()
    user = (device.get("shutdown_user") or "").strip()
    password = device.get("shutdown_password") or ""
    command = (device.get("shutdown_command") or "").strip() or DEFAULT_SSH_COMMAND
    if not host or not user:
        return ShutdownResult(
            ok=False, method="ssh", error="SSH shutdown needs a host and a username"
        )

    ssh_cmd = [
        ssh,
        "-o",
        "BatchMode=yes" if not password else "BatchMode=no",
        "-o",
        "StrictHostKeyChecking=accept-new",
        "-o",
        f"UserKnownHostsFile={os.path.join(config.CONFIG_DIR, 'known_hosts')}",
        "-o",
        "ConnectTimeout=10",
        "-o",
        "LogLevel=ERROR",
    ]
    for path in _ssh_identity_files():
        ssh_cmd.extend(["-o", f"IdentityFile={path}"])
    ssh_cmd.append(f"{user}@{host}")
    ssh_cmd.append(command)

    env = os.environ.copy()
    if password:
        sshpass = shutil.which("sshpass")
        if not sshpass:
            return ShutdownResult(
                ok=False,
                method="ssh",
                error="sshpass is not available; mount an SSH key in /config instead",
            )
        ssh_cmd = [sshpass, "-e", *ssh_cmd]
        env["SSHPASS"] = password

    completed, error = _run(ssh_cmd, env=env)
    if error:
        return ShutdownResult(ok=False, method="ssh", error=_redact(error, password))
    if completed.returncode != 0:
        return ShutdownResult(
            ok=False,
            method="ssh",
            error=_redact(_stderr_or_stdout(completed) or "SSH shutdown failed", password),
        )
    return ShutdownResult(ok=True, method="ssh", detail="Shutdown command sent over SSH")


def _shutdown_windows(device: dict) -> ShutdownResult:
    net = shutil.which("net")
    if not net:
        return ShutdownResult(
            ok=False,
            method="rpc",
            error="Windows RPC shutdown is not available in this image",
        )

    host = (device.get("host") or "").strip()
    user = (device.get("shutdown_user") or "").strip()
    password = device.get("shutdown_password") or ""
    if not host or not user or not password:
        return ShutdownResult(
            ok=False,
            method="rpc",
            error="Windows shutdown needs a host, username and password",
        )

    handle = tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        prefix=".wol-auth-",
        suffix=".tmp",
        delete=False,
    )
    try:
        os.chmod(handle.name, stat.S_IRUSR | stat.S_IWUSR)
        handle.write(f"username = {user}\npassword = {password}\n")
        handle.close()

        cmd = [
            net,
            "rpc",
            "shutdown",
            "-I",
            host,
            "-f",
            "-t",
            "0",
            "-A",
            handle.name,
        ]
        completed, error = _run(cmd)
        if error:
            return ShutdownResult(ok=False, method="rpc", error=_redact(error, password))
        if completed.returncode != 0:
            return ShutdownResult(
                ok=False,
                method="rpc",
                error=_redact(
                    _stderr_or_stdout(completed) or "Windows RPC shutdown failed",
                    password,
                ),
            )
        return ShutdownResult(ok=True, method="rpc", detail="Windows shutdown requested")
    finally:
        try:
            os.unlink(handle.name)
        except OSError:
            pass


def _ssh_identity_files() -> list[str]:
    files = []
    for name in SSH_IDENTITY_NAMES:
        path = os.path.join(config.CONFIG_DIR, name)
        if os.path.isfile(path):
            files.append(path)
    return files


def _run(cmd: list[str], env: dict | None = None) -> tuple[subprocess.CompletedProcess | None, str]:
    try:
        completed = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=COMMAND_TIMEOUT,
            env=env,
        )
    except subprocess.TimeoutExpired:
        return None, f"Shutdown command timed out after {COMMAND_TIMEOUT}s"
    except OSError as exc:
        return None, str(exc)
    return completed, ""


def _stderr_or_stdout(completed: subprocess.CompletedProcess) -> str:
    return (completed.stderr or completed.stdout or "").strip()


def _redact(text: str, secret: str) -> str:
    if secret:
        text = text.replace(secret, "***")
    return text.strip()


__all__ = [
    "METHODS",
    "ShutdownResult",
    "reversed_mac",
    "shutdown_configured",
    "shutdown_device",
]
