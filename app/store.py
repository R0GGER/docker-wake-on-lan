"""Persistent device store backed by a JSON file."""

from __future__ import annotations

import contextlib
import json
import logging
import os
import tempfile
import threading
import uuid
from typing import Any, Callable

from . import config
from .shutdown import METHODS as SHUTDOWN_METHODS, shutdown_configured
from .wol import DEFAULT_REPEAT, InvalidMacError, normalize_mac

log = logging.getLogger(__name__)

MAX_REPEAT = 20


class ValidationError(ValueError):
    """Raised when submitted device data is not acceptable."""


class DeviceStore:
    def __init__(self, path: str = config.DEVICES_FILE):
        self.path = path
        self._lock = threading.RLock()
        self._devices: list[dict[str, Any]] = []
        self._groups: list[dict[str, Any]] = []
        self._listeners: list[Callable[[], None]] = []
        self._load()

    def on_change(self, callback: Callable[[], None]) -> None:
        self._listeners.append(callback)

    def _notify(self) -> None:
        for callback in self._listeners:
            try:
                callback()
            except Exception:  # noqa: BLE001 - a listener must never break a write
                log.exception("Device store listener failed")

    def _load(self) -> None:
        with self._lock:
            self._devices = []
            self._groups = []
            if not os.path.exists(self.path):
                return
            try:
                with open(self.path, encoding="utf-8") as handle:
                    data = json.load(handle)
            except (OSError, json.JSONDecodeError):
                log.exception("Could not read %s, starting with an empty list", self.path)
                return

            raw_groups = data.get("groups", []) if isinstance(data, dict) else []
            self._groups = _parse_groups(raw_groups)
            known = {group["id"] for group in self._groups}

            devices = data.get("devices", data) if isinstance(data, dict) else data
            if not isinstance(devices, list):
                devices = []
            loaded = []
            for item in devices:
                if not isinstance(item, dict) or not item.get("mac"):
                    continue
                group_id = str(item.get("group_id") or "").strip()
                item["group_id"] = group_id if group_id in known else ""
                loaded.append(item)
            self._devices = loaded

    def _save(self) -> None:
        with self._lock:
            os.makedirs(os.path.dirname(self.path) or ".", exist_ok=True)
            handle = tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=os.path.dirname(self.path) or ".",
                prefix=".devices-",
                suffix=".tmp",
                delete=False,
            )
            try:
                with handle:
                    json.dump(
                        {"groups": self._groups, "devices": self._devices},
                        handle,
                        indent=2,
                    )
                    handle.flush()
                    os.fsync(handle.fileno())
                os.replace(handle.name, self.path)
            except BaseException:
                with contextlib.suppress(OSError):
                    os.unlink(handle.name)
                raise

    def _resolve_group_id(self, group_id: Any) -> str:
        gid = str(group_id or "").strip()
        if gid and any(group["id"] == gid for group in self._groups):
            return gid
        return ""

    def _assert_unique_group_name(self, name: str, exclude_id: str | None = None) -> None:
        needle = name.casefold()
        for group in self._groups:
            if group["id"] != exclude_id and group["name"].casefold() == needle:
                raise ValidationError(f"A group named {name!r} already exists")

    def list_groups(self) -> list[dict[str, Any]]:
        with self._lock:
            return [dict(group) for group in self._groups]

    def get_group(self, group_id: str) -> dict[str, Any] | None:
        with self._lock:
            for group in self._groups:
                if group["id"] == group_id:
                    return dict(group)
        return None

    def add_group(self, payload: dict[str, Any]) -> dict[str, Any]:
        group = validate_group(payload)
        with self._lock:
            self._assert_unique_group_name(group["name"])
            group["id"] = uuid.uuid4().hex[:12]
            self._groups.append(group)
            self._save()
        self._notify()
        return group

    def update_group(self, group_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            for index, existing in enumerate(self._groups):
                if existing["id"] != group_id:
                    continue
                group = validate_group({**existing, **payload})
                group["id"] = group_id
                self._assert_unique_group_name(group["name"], exclude_id=group_id)
                self._groups[index] = group
                self._save()
                break
            else:
                raise KeyError(group_id)
        self._notify()
        return group

    def delete_group(self, group_id: str) -> None:
        with self._lock:
            before = len(self._groups)
            self._groups = [group for group in self._groups if group["id"] != group_id]
            if len(self._groups) == before:
                raise KeyError(group_id)
            for device in self._devices:
                if device.get("group_id") == group_id:
                    device["group_id"] = ""
            self._save()
        self._notify()

    def reorder_groups(self, ids: list[str]) -> list[dict[str, Any]]:
        if not isinstance(ids, list):
            raise ValidationError("ids must be a list")
        with self._lock:
            by_id = {group["id"]: group for group in self._groups}
            ordered: list[dict[str, Any]] = []
            seen: set[str] = set()
            for group_id in ids:
                gid = str(group_id or "").strip()
                group = by_id.get(gid)
                if group is None or gid in seen:
                    continue
                ordered.append(group)
                seen.add(gid)
            for group in self._groups:
                if group["id"] not in seen:
                    ordered.append(group)
            self._groups = ordered
            self._save()
        self._notify()
        return self.list_groups()

    def devices_in_group(self, group_id: str) -> list[dict[str, Any]]:
        gid = str(group_id or "").strip()
        with self._lock:
            return [
                dict(device)
                for device in self._devices
                if (device.get("group_id") or "") == gid
            ]

    def move_device(
        self, device_id: str, group_id: Any, index: int | None = None
    ) -> dict[str, Any]:
        requested = str(group_id or "").strip()
        with self._lock:
            if requested and not any(group["id"] == requested for group in self._groups):
                raise ValidationError("Unknown group")
            found = None
            for position, device in enumerate(self._devices):
                if device["id"] == device_id:
                    found = self._devices.pop(position)
                    break
            if found is None:
                raise KeyError(device_id)

            found["group_id"] = requested
            peers = [
                i
                for i, device in enumerate(self._devices)
                if (device.get("group_id") or "") == requested
            ]
            if index is None:
                dest = len(peers)
            else:
                dest = max(0, min(int(index), len(peers)))
            if not peers:
                insert_at = len(self._devices)
            elif dest >= len(peers):
                insert_at = peers[-1] + 1
            else:
                insert_at = peers[dest]
            self._devices.insert(insert_at, found)
            self._save()
        self._notify()
        return dict(found)

    def list(self) -> list[dict[str, Any]]:
        with self._lock:
            return [dict(device) for device in self._devices]

    def get(self, device_id: str) -> dict[str, Any] | None:
        with self._lock:
            for device in self._devices:
                if device["id"] == device_id:
                    return dict(device)
        return None

    def add(self, payload: dict[str, Any]) -> dict[str, Any]:
        device = validate_device(payload)
        with self._lock:
            device["id"] = uuid.uuid4().hex[:12]
            device["group_id"] = self._resolve_group_id(device.get("group_id"))
            if any(d["mac"] == device["mac"] for d in self._devices):
                raise ValidationError(f"A device with MAC {device['mac']} already exists")
            self._devices.append(device)
            self._save()
        self._notify()
        return device

    def update(self, device_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            for index, existing in enumerate(self._devices):
                if existing["id"] != device_id:
                    continue
                merged = {**existing, **payload}
                if not str(payload.get("shutdown_password") or "").strip():
                    merged["shutdown_password"] = existing.get("shutdown_password", "")
                device = validate_device(merged)
                device["id"] = device_id
                device["group_id"] = self._resolve_group_id(device.get("group_id"))
                if any(
                    d["mac"] == device["mac"] and d["id"] != device_id for d in self._devices
                ):
                    raise ValidationError(
                        f"Another device already uses MAC {device['mac']}"
                    )
                self._devices[index] = device
                self._save()
                break
            else:
                raise KeyError(device_id)
        self._notify()
        return device

    def delete(self, device_id: str) -> None:
        with self._lock:
            before = len(self._devices)
            self._devices = [d for d in self._devices if d["id"] != device_id]
            if len(self._devices) == before:
                raise KeyError(device_id)
            self._save()
        self._notify()


def validate_device(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValidationError("Device must be an object")

    try:
        mac = normalize_mac(payload.get("mac", ""))
    except InvalidMacError as exc:
        raise ValidationError(str(exc)) from exc

    name = str(payload.get("name") or "").strip() or mac
    if len(name) > 64:
        raise ValidationError("Name may not be longer than 64 characters")

    host = str(payload.get("host") or payload.get("ip") or "").strip()
    if len(host) > 255:
        raise ValidationError("Host may not be longer than 255 characters")

    ports = _parse_ports(payload.get("ports"))
    broadcast = str(payload.get("broadcast") or "").strip()

    repeat = payload.get("repeat", DEFAULT_REPEAT)
    try:
        repeat = int(repeat)
    except (TypeError, ValueError) as exc:
        raise ValidationError("Repeat must be a number") from exc
    if not 1 <= repeat <= MAX_REPEAT:
        raise ValidationError(f"Repeat must be between 1 and {MAX_REPEAT}")

    schedule = str(payload.get("schedule") or "").strip()
    if schedule:
        _validate_cron(schedule)

    shutdown_method = str(payload.get("shutdown_method") or "").strip().lower()
    if shutdown_method not in SHUTDOWN_METHODS:
        shutdown_method = ""

    shutdown_user = str(payload.get("shutdown_user") or "").strip()
    if len(shutdown_user) > 64:
        raise ValidationError("Shutdown username may not be longer than 64 characters")

    shutdown_password = str(payload.get("shutdown_password") or "")
    if len(shutdown_password) > 256:
        raise ValidationError("Shutdown password may not be longer than 256 characters")

    shutdown_command = str(payload.get("shutdown_command") or "").strip()
    if len(shutdown_command) > 255:
        raise ValidationError("Shutdown command may not be longer than 255 characters")

    if shutdown_method in {"ssh", "rpc"} and not host:
        raise ValidationError("Hostname or IP is required for remote shutdown")
    if shutdown_method == "ssh" and not shutdown_user:
        raise ValidationError("SSH shutdown needs a username")
    if shutdown_method == "rpc" and not shutdown_user:
        raise ValidationError("Windows shutdown needs a username")
    if shutdown_method == "rpc" and not shutdown_password:
        raise ValidationError("Windows shutdown needs a password")
    if not shutdown_method:
        shutdown_user = ""
        shutdown_password = ""
        shutdown_command = ""

    return {
        "id": str(payload.get("id") or ""),
        "name": name,
        "mac": mac,
        "host": host,
        "ports": ports,
        "broadcast": broadcast,
        "repeat": repeat,
        "schedule": schedule,
        "enabled": bool(payload.get("enabled", True)),
        "shutdown_method": shutdown_method,
        "shutdown_user": shutdown_user,
        "shutdown_password": shutdown_password,
        "shutdown_command": shutdown_command,
        "group_id": str(payload.get("group_id") or "").strip(),
    }


def validate_group(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValidationError("Group must be an object")
    name = str(payload.get("name") or "").strip()
    if not name:
        raise ValidationError("Group name is required")
    if len(name) > 64:
        raise ValidationError("Group name may not be longer than 64 characters")
    return {"id": str(payload.get("id") or ""), "name": name}


def _parse_groups(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    groups: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        group_id = str(item.get("id") or "").strip()
        name = str(item.get("name") or "").strip()
        if not group_id or not name or group_id in seen:
            continue
        seen.add(group_id)
        groups.append({"id": group_id, "name": name[:64]})
    return groups


def export_device(device: dict[str, Any]) -> dict[str, Any]:
    """Copy a device for API clients, without the shutdown password."""
    item = dict(device)
    item.pop("shutdown_password", None)
    item["shutdown_password_set"] = bool(device.get("shutdown_password"))
    item["can_shutdown"] = shutdown_configured(device)
    return item


def _parse_ports(value: Any) -> list[int]:
    if value in (None, "", []):
        return []
    if isinstance(value, (int, float)):
        value = [int(value)]
    if isinstance(value, str):
        value = value.replace(",", " ").split()
    if not isinstance(value, (list, tuple)):
        raise ValidationError("Ports must be a list or a comma separated string")

    ports: list[int] = []
    for item in value:
        try:
            port = int(item)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"Invalid port: {item!r}") from exc
        if not 1 <= port <= 65535:
            raise ValidationError(f"Port out of range: {port}")
        if port not in ports:
            ports.append(port)
    return ports


def _validate_cron(expression: str) -> None:
    from apscheduler.triggers.cron import CronTrigger

    try:
        CronTrigger.from_crontab(expression)
    except ValueError as exc:
        raise ValidationError(f"Invalid cron expression {expression!r}: {exc}") from exc
