"""Reachability checks for devices."""

from __future__ import annotations

import shutil
import socket
import subprocess
import time

DEFAULT_PROBE_PORTS = (22, 3389, 445, 80)
TCP_TIMEOUT = 1.0
POLL_INTERVAL = 3.0

_PING = shutil.which("ping")


def tcp_check(host: str, port: int, timeout: float = TCP_TIMEOUT) -> bool:
    try:
        with socket.create_connection((host, int(port)), timeout=timeout):
            return True
    except OSError:
        return False


def icmp_check(host: str, timeout: float = TCP_TIMEOUT) -> bool:
    """Ping once. Requires root or CAP_NET_RAW, so this is only a fallback."""
    if not _PING:
        return False
    try:
        completed = subprocess.run(
            [_PING, "-c", "1", "-W", str(max(1, int(timeout))), host],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=timeout + 2,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False
    return completed.returncode == 0


def is_online(
    host: str | None,
    ports: tuple[int, ...] | list[int] | None = None,
    timeout: float = TCP_TIMEOUT,
) -> bool:
    """Check whether ``host`` responds, trying TCP first and ICMP as fallback."""
    if not host:
        return False

    for port in ports or DEFAULT_PROBE_PORTS:
        if tcp_check(host, port, timeout=timeout):
            return True

    return icmp_check(host, timeout=timeout)


def wait_until_online(
    host: str | None,
    ports: tuple[int, ...] | list[int] | None = None,
    timeout: float = 60.0,
    interval: float = POLL_INTERVAL,
) -> tuple[bool, float]:
    """Poll ``host`` until it answers or ``timeout`` seconds elapsed.

    Returns whether the host came up and how long it took.
    """
    started = time.monotonic()
    if not host:
        return False, 0.0

    while True:
        if is_online(host, ports=ports):
            return True, time.monotonic() - started
        if time.monotonic() - started >= timeout:
            return False, time.monotonic() - started
        time.sleep(interval)


def wait_until_offline(
    host: str | None,
    ports: tuple[int, ...] | list[int] | None = None,
    timeout: float = 60.0,
    interval: float = POLL_INTERVAL,
) -> tuple[bool, float]:
    """Poll ``host`` until it stops answering or ``timeout`` seconds elapsed.

    Returns whether the host went down and how long it took.
    """
    started = time.monotonic()
    if not host:
        return False, 0.0

    while True:
        if not is_online(host, ports=ports):
            return True, time.monotonic() - started
        if time.monotonic() - started >= timeout:
            return False, time.monotonic() - started
        time.sleep(interval)
