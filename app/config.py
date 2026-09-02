"""Environment driven settings."""

from __future__ import annotations

import os

CONFIG_DIR = os.environ.get("CONFIG_DIR", "/config")
DEVICES_FILE = os.path.join(CONFIG_DIR, "devices.json")
SECRET_FILE = os.path.join(CONFIG_DIR, "secret.key")

HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8080"))

TIMEZONE = os.environ.get("TZ", "UTC")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()


def env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_str(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


def env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default
