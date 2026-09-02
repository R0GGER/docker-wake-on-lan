"""Flask application: web interface and REST API."""

from __future__ import annotations

import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

from flask import Flask, jsonify, render_template, request

from . import auth, config, status
from .scheduler import WakeScheduler
from .shutdown import shutdown_configured, shutdown_device
from .store import DeviceStore, ValidationError, export_device
from .wol import InvalidMacError, WakeResult, send_magic_packet

log = logging.getLogger(__name__)

STATUS_CACHE_TTL = 5.0
STATUS_WORKERS = 8
MAX_WAIT_TIMEOUT = 300
THEMES = ("auto", "light", "dark")


def default_theme() -> str:
    """Theme used until the visitor picks one in the interface."""
    theme = config.env_str("THEME", "auto").lower()
    if theme not in THEMES:
        log.warning("Unknown THEME %r, falling back to auto", theme)
        return "auto"
    return theme


class StatusCache:
    """Keeps probe results warm so polling clients do not hammer the network.

    Expired entries stay available via ``peek`` so the interface can paint
    cards immediately with the last known state while a fresh probe runs.
    """

    def __init__(self, ttl: float = STATUS_CACHE_TTL):
        self.ttl = ttl
        self._lock = threading.Lock()
        self._entries: dict[str, tuple[float, bool]] = {}

    def get(self, key: str) -> bool | None:
        with self._lock:
            entry = self._entries.get(key)
            if not entry:
                return None
            timestamp, value = entry
            if time.monotonic() - timestamp > self.ttl:
                return None
            return value

    def peek(self, key: str) -> bool | None:
        """Last known value, even if the TTL has expired. ``None`` if never probed."""
        with self._lock:
            entry = self._entries.get(key)
            return None if entry is None else entry[1]

    def set(self, key: str, value: bool) -> None:
        with self._lock:
            self._entries[key] = (time.monotonic(), value)

    def invalidate(self, key: str) -> None:
        with self._lock:
            self._entries.pop(key, None)


def create_app(store: DeviceStore | None = None, scheduler: WakeScheduler | None = None) -> Flask:
    app = Flask(__name__)
    app.secret_key = auth.load_secret_key()
    app.permanent_session_lifetime = timedelta(days=30)
    app.json.sort_keys = False

    store = store or DeviceStore()
    cache = StatusCache()
    pool = ThreadPoolExecutor(max_workers=STATUS_WORKERS, thread_name_prefix="status")

    auth.warn_if_unprotected()

    def device_status(device: dict) -> bool:
        host = device.get("host")
        if not host:
            return False
        cached = cache.get(device["id"])
        if cached is not None:
            return cached
        online = status.is_online(host, ports=device.get("ports") or None)
        cache.set(device["id"], online)
        return online

    def schedule_probes(devices: list[dict]) -> None:
        for device in devices:
            if device.get("host") and cache.get(device["id"]) is None:
                pool.submit(device_status, device)

    def with_status(devices: list[dict], *, probe: bool = True) -> list[dict]:
        if probe:
            results = list(pool.map(device_status, devices))
        else:
            results = [
                cache.peek(device["id"]) if device.get("host") else False
                for device in devices
            ]
            schedule_probes(devices)
        next_runs = scheduler.next_runs() if scheduler else {}
        enriched = []
        for device, online in zip(devices, results):
            item = export_device(device)
            item["online"] = online
            item["monitored"] = bool(device.get("host"))
            item["next_run"] = next_runs.get(device["id"])
            enriched.append(item)
        return enriched

    schedule_probes(store.list())

    @app.get("/")
    def index():
        needs_auth = auth.auth_required()
        is_authenticated = (not needs_auth) or auth.is_authenticated()
        boot_devices = with_status(store.list(), probe=False) if is_authenticated else []
        return render_template(
            "index.html",
            auth_required=needs_auth,
            authenticated=is_authenticated,
            password_login=bool(auth.PASSWORD),
            default_theme=default_theme(),
            bootstrap={
                "auth_required": needs_auth,
                "authenticated": is_authenticated,
                "password_login": bool(auth.PASSWORD),
                "devices": boot_devices,
                "groups": store.list_groups() if is_authenticated else [],
                "edit_lock": config.edit_lock_seconds(),
            },
        )

    @app.get("/healthz")
    def healthz():
        return jsonify({"status": "ok", "devices": len(store.list())})

    @app.get("/api/session")
    def api_session():
        return jsonify(
            {
                "auth_required": auth.auth_required(),
                "authenticated": auth.is_authenticated(),
                "password_login": bool(auth.PASSWORD),
                "edit_lock": config.edit_lock_seconds(),
            }
        )

    @app.post("/api/login")
    def api_login():
        payload = request.get_json(silent=True) or {}
        if not auth.auth_required():
            return jsonify({"authenticated": True})
        if auth.check_password(payload.get("password", "")):
            auth.login()
            return jsonify({"authenticated": True})
        log.warning("Failed login attempt from %s", request.remote_addr)
        return jsonify({"error": "Invalid password"}), 401

    @app.post("/api/logout")
    def api_logout():
        auth.logout()
        return jsonify({"authenticated": False})

    @app.get("/api/devices")
    @auth.protected
    def api_list_devices():
        return jsonify(
            {
                "devices": with_status(store.list(), probe=_wants_probe()),
                "groups": store.list_groups(),
            }
        )

    @app.post("/api/devices")
    @auth.protected
    def api_create_device():
        payload = request.get_json(silent=True) or {}
        device = store.add(payload)
        return jsonify(export_device(device)), 201

    @app.put("/api/devices/<device_id>")
    @auth.protected
    def api_update_device(device_id: str):
        payload = request.get_json(silent=True) or {}
        device = store.update(device_id, payload)
        cache.invalidate(device_id)
        return jsonify(export_device(device))

    @app.delete("/api/devices/<device_id>")
    @auth.protected
    def api_delete_device(device_id: str):
        store.delete(device_id)
        cache.invalidate(device_id)
        return jsonify({"deleted": device_id})

    @app.put("/api/devices/<device_id>/move")
    @auth.protected
    def api_move_device(device_id: str):
        payload = request.get_json(silent=True) or {}
        index = payload.get("index")
        if index is not None:
            try:
                index = int(index)
            except (TypeError, ValueError) as exc:
                raise ValidationError("Index must be a number") from exc
        device = store.move_device(device_id, payload.get("group_id", ""), index)
        return jsonify(export_device(device))

    @app.get("/api/groups")
    @auth.protected
    def api_list_groups():
        return jsonify({"groups": store.list_groups()})

    @app.post("/api/groups")
    @auth.protected
    def api_create_group():
        payload = request.get_json(silent=True) or {}
        group = store.add_group(payload)
        return jsonify(group), 201

    @app.put("/api/groups/reorder")
    @auth.protected
    def api_reorder_groups():
        payload = request.get_json(silent=True) or {}
        groups = store.reorder_groups(payload.get("ids", []))
        return jsonify({"groups": groups})

    @app.put("/api/groups/<group_id>")
    @auth.protected
    def api_update_group(group_id: str):
        payload = request.get_json(silent=True) or {}
        try:
            group = store.update_group(group_id, payload)
        except KeyError:
            return jsonify({"error": f"Unknown group: {group_id}"}), 404
        return jsonify(group)

    @app.delete("/api/groups/<group_id>")
    @auth.protected
    def api_delete_group(group_id: str):
        try:
            store.delete_group(group_id)
        except KeyError:
            return jsonify({"error": f"Unknown group: {group_id}"}), 404
        return jsonify({"deleted": group_id})

    @app.post("/api/groups/<group_id>/wake")
    @auth.protected
    def api_wake_group(group_id: str):
        group = store.get_group(group_id)
        if not group:
            return jsonify({"error": "Unknown group"}), 404

        results = []
        woke = 0
        failed = 0
        for device in store.devices_in_group(group_id):
            result = send_magic_packet(
                device["mac"],
                broadcast=device.get("broadcast") or None,
                repeat=device.get("repeat"),
                host=device.get("host") or None,
            )
            cache.invalidate(device["id"])
            item = result.as_dict()
            item["id"] = device["id"]
            item["device"] = device["name"]
            results.append(item)
            if result.ok:
                woke += 1
            else:
                failed += 1

        log.info("Wake group %s: %s woke, %s failed", group["name"], woke, failed)
        return jsonify(
            {
                "group": group["name"],
                "results": results,
                "woke": woke,
                "failed": failed,
                "count": len(results),
            }
        )

    @app.post("/api/groups/<group_id>/shutdown")
    @auth.protected
    def api_shutdown_group(group_id: str):
        group = store.get_group(group_id)
        if not group:
            return jsonify({"error": "Unknown group"}), 404

        results = []
        shut_down = 0
        failed = 0
        skipped = 0
        for device in store.devices_in_group(group_id):
            if not shutdown_configured(device):
                skipped += 1
                continue
            result = shutdown_device(device)
            cache.invalidate(device["id"])
            item = result.as_dict()
            item["id"] = device["id"]
            item["device"] = device["name"]
            results.append(item)
            if result.ok:
                shut_down += 1
            else:
                failed += 1

        log.info(
            "Shutdown group %s: %s shut down, %s failed, %s skipped",
            group["name"],
            shut_down,
            failed,
            skipped,
        )
        return jsonify(
            {
                "group": group["name"],
                "results": results,
                "shut_down": shut_down,
                "failed": failed,
                "skipped": skipped,
                "count": shut_down + failed + skipped,
            }
        )

    def _wake_device(device_id: str):
        device = store.get(device_id)
        if not device:
            return _wake_reply(
                {"error": "Unknown device"},
                404,
                heading="Unknown device",
                message="No device is stored with that id.",
            )

        result = send_magic_packet(
            device["mac"],
            broadcast=device.get("broadcast") or None,
            repeat=device.get("repeat"),
            host=device.get("host") or None,
        )
        cache.invalidate(device_id)
        response = result.as_dict()
        response["device"] = device["name"]

        if _wants_wait() and device.get("host"):
            timeout = min(MAX_WAIT_TIMEOUT, _int_arg("timeout", 60))
            online, elapsed = status.wait_until_online(
                device["host"], ports=device.get("ports") or None, timeout=timeout
            )
            cache.set(device_id, online)
            response["online"] = online
            response["elapsed"] = round(elapsed, 1)

        log.info("Wake %s (%s): %s", device["name"], device["mac"], response)
        if result.ok:
            return _wake_reply(
                response,
                200,
                heading=f"Waking {device['name']}",
                message="Magic packet sent.",
            )
        errors = "; ".join(result.errors) or "no packets sent"
        return _wake_reply(
            response,
            502,
            heading=f"Could not wake {device['name']}",
            message=errors,
        )

    @app.get("/api/devices/<device_id>/wake")
    @auth.protected_by_api_key
    def api_wake_device_get(device_id: str):
        return _wake_device(device_id)

    @app.post("/api/devices/<device_id>/wake")
    @auth.protected
    def api_wake_device(device_id: str):
        return _wake_device(device_id)

    @app.post("/api/devices/<device_id>/shutdown")
    @auth.protected
    def api_shutdown_device(device_id: str):
        device = store.get(device_id)
        if not device:
            return jsonify({"error": "Unknown device"}), 404
        if not shutdown_configured(device):
            return jsonify({"error": "Remote shutdown is not configured for this device"}), 400

        result = shutdown_device(device)
        cache.invalidate(device_id)
        response = result.as_dict()
        response["device"] = device["name"]

        if result.ok and _wants_wait() and device.get("host"):
            timeout = min(MAX_WAIT_TIMEOUT, _int_arg("timeout", 60))
            offline, elapsed = status.wait_until_offline(
                device["host"], ports=device.get("ports") or None, timeout=timeout
            )
            cache.set(device_id, not offline)
            response["online"] = not offline
            response["elapsed"] = round(elapsed, 1)

        log.info(
            "Shutdown %s (%s) via %s: %s",
            device["name"],
            device["mac"],
            result.method,
            "ok" if result.ok else result.error or "failed",
        )
        return jsonify(response), (200 if result.ok else 502)

    @app.post("/api/wake")
    @auth.protected
    def api_wake_mac():
        payload = request.get_json(silent=True) or {}
        mac = payload.get("mac") or request.args.get("mac", "")
        result: WakeResult = send_magic_packet(
            mac,
            broadcast=payload.get("broadcast") or None,
            repeat=payload.get("repeat", 3),
            host=payload.get("host") or None,
        )
        return jsonify(result.as_dict()), (200 if result.ok else 502)

    @app.get("/api/status")
    @auth.protected
    def api_status():
        devices = with_status(store.list())
        return jsonify(
            {
                "devices": [
                    {
                        "id": d["id"],
                        "name": d["name"],
                        "online": d["online"],
                        "monitored": d["monitored"],
                        "next_run": d["next_run"],
                        "can_shutdown": d["can_shutdown"],
                    }
                    for d in devices
                ]
            }
        )

    @app.errorhandler(ValidationError)
    def handle_validation_error(exc: ValidationError):
        return jsonify({"error": str(exc)}), 400

    @app.errorhandler(InvalidMacError)
    def handle_invalid_mac(exc: InvalidMacError):
        return jsonify({"error": str(exc)}), 400

    @app.errorhandler(KeyError)
    def handle_missing_device(exc: KeyError):
        return jsonify({"error": f"Unknown device: {exc.args[0]}"}), 404

    app.extensions["device_store"] = store
    app.extensions["status_cache"] = cache
    return app


def _wake_reply(payload: dict, status_code: int, *, heading: str, message: str):
    """JSON for API clients; a short HTML page when a browser opens a wake link."""
    headers = auth.no_store_headers()
    if auth.wants_html():
        return (
            render_template(
                "wake.html",
                ok=status_code < 400,
                heading=heading,
                message=message,
                default_theme=default_theme(),
            ),
            status_code,
            headers,
        )
    return jsonify(payload), status_code, headers


def _wants_probe() -> bool:
    value = request.args.get("probe", "1")
    return str(value).strip().lower() not in {"0", "false", "no", "off"}


def _wants_wait() -> bool:
    payload = request.get_json(silent=True) or {}
    value = payload.get("wait", request.args.get("wait"))
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _int_arg(name: str, default: int) -> int:
    payload = request.get_json(silent=True) or {}
    value = payload.get(name, request.args.get(name, default))
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def run() -> None:
    """Start the web interface with the scheduler attached."""
    store = DeviceStore()
    scheduler = WakeScheduler(store)
    scheduler.start()

    app = create_app(store=store, scheduler=scheduler)
    from waitress import serve

    log.info("Web interface listening on http://%s:%s", config.HOST, config.PORT)
    serve(app, host=config.HOST, port=config.PORT, threads=8, _quiet=True)


__all__ = ["create_app", "run"]
