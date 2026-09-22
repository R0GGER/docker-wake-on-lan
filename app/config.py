"""Environment driven settings."""

from __future__ import annotations

import logging
import os
import re
from datetime import timedelta

CONFIG_DIR = os.environ.get("CONFIG_DIR", "/config")
DEVICES_FILE = os.path.join(CONFIG_DIR, "devices.json")
SECRET_FILE = os.path.join(CONFIG_DIR, "secret.key")

HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8080"))

TIMEZONE = os.environ.get("TZ", "UTC")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

log = logging.getLogger(__name__)

# Login cookie lifetime after the last request when SESSION_LIFETIME is unset or invalid.
DEFAULT_SESSION_LIFETIME = timedelta(days=30)
_DURATION = re.compile(r"^(\d+)([mhd])$")
_DURATION_SECONDS = {"m": 60, "h": 3600, "d": 86400}


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


def edit_lock_seconds() -> int:
    """Idle seconds before the layout locks. ``0`` disables auto-lock."""
    value = env_int("EDIT_LOCK", 300)
    if value < 0:
        return 300
    return value


def session_lifetime() -> timedelta:
    """How long a login stays valid after the last request.

    ``SESSION_LIFETIME`` is a number plus ``m`` (minutes), ``h`` (hours), or
    ``d`` (days), for example ``30m``, ``12h``, or ``7d``. The default is 30 days.
    An empty or invalid value also uses that default.
    """
    raw = os.environ.get("SESSION_LIFETIME")
    if raw is None or not raw.strip():
        return DEFAULT_SESSION_LIFETIME
    match = _DURATION.match(raw.strip().lower())
    amount = int(match.group(1)) if match else 0
    if match is None or amount < 1:
        log.warning("Invalid SESSION_LIFETIME %r; using 30d", raw.strip())
        return DEFAULT_SESSION_LIFETIME
    try:
        return timedelta(seconds=amount * _DURATION_SECONDS[match.group(2)])
    except OverflowError:
        log.warning("Invalid SESSION_LIFETIME %r; using 30d", raw.strip())
        return DEFAULT_SESSION_LIFETIME
