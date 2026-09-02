"""Session login and API key protection for the web interface."""

from __future__ import annotations

import functools
import hmac
import logging
import os
import secrets

from flask import jsonify, render_template, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from . import config

log = logging.getLogger(__name__)

SESSION_KEY = "authenticated"

AUTH_ENABLED = config.env_bool("AUTH_ENABLED", True)
PASSWORD = config.env_str("WEBUI_PASSWORD")
API_KEY = config.env_str("API_KEY")

# The hash is derived once at startup; the plaintext password is never stored.
_PASSWORD_HASH = generate_password_hash(PASSWORD) if PASSWORD else ""


def auth_required() -> bool:
    """Whether requests must be authenticated."""
    if not AUTH_ENABLED:
        return False
    return bool(_PASSWORD_HASH or API_KEY)


def warn_if_unprotected() -> None:
    if not AUTH_ENABLED:
        log.warning("Authentication is disabled (AUTH_ENABLED=false)")
    elif not (_PASSWORD_HASH or API_KEY):
        log.warning(
            "AUTH_ENABLED is true but neither WEBUI_PASSWORD nor API_KEY is set; "
            "the web interface is open to everyone on the network"
        )
    elif not _PASSWORD_HASH:
        log.warning(
            "Only API_KEY is set, so the web interface cannot be used in a browser; "
            "set WEBUI_PASSWORD to enable the login"
        )


def check_password(password: str) -> bool:
    if not _PASSWORD_HASH:
        return False
    return check_password_hash(_PASSWORD_HASH, password or "")


def check_api_key(key: str | None) -> bool:
    if not API_KEY or not key:
        return False
    try:
        return hmac.compare_digest(API_KEY, key)
    except (TypeError, ValueError):
        return False


def request_api_key() -> str | None:
    """API key from header, bearer token, or ``key`` / ``api_key`` query param."""
    key = request.headers.get("X-API-Key")
    if key:
        return key
    header = request.headers.get("Authorization", "")
    if header.lower().startswith("bearer "):
        token = header[7:].strip()
        return token or None
    query = (request.args.get("key") or request.args.get("api_key") or "").strip()
    return query or None


def wants_html() -> bool:
    """True when a browser GET should get an HTML page instead of JSON."""
    if request.method != "GET":
        return False
    return request.accept_mimetypes.best_match(["application/json", "text/html"]) == "text/html"


def no_store_headers() -> dict[str, str]:
    return {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
    }


def login() -> None:
    session[SESSION_KEY] = True
    session.permanent = True


def logout() -> None:
    session.pop(SESSION_KEY, None)


def is_authenticated() -> bool:
    if not auth_required():
        return True
    if session.get(SESSION_KEY):
        return True
    return is_api_key_authenticated()


def is_api_key_authenticated() -> bool:
    """True when auth is off, or the request carries a valid API key.

    Session cookies are ignored so a GET wake link cannot be triggered by a
    logged-in browser visiting a crafted URL.
    """
    if not auth_required():
        return True
    return check_api_key(request_api_key())


def _auth_error(heading: str, message: str):
    payload = {"error": heading}
    headers = no_store_headers()
    if wants_html():
        theme = config.env_str("THEME", "auto").lower()
        if theme not in ("auto", "light", "dark"):
            theme = "auto"
        return (
            render_template(
                "wake.html",
                ok=False,
                heading=heading,
                message=message,
                default_theme=theme,
            ),
            401,
            headers,
        )
    return jsonify(payload), 401, headers


def protected(view):
    """Reject unauthenticated calls to an API endpoint."""

    @functools.wraps(view)
    def wrapper(*args, **kwargs):
        if not is_authenticated():
            return _auth_error(
                "Authentication required",
                "Sign in through the web interface, or pass a valid API key.",
            )
        return view(*args, **kwargs)

    return wrapper


def protected_by_api_key(view):
    """Require the API key. A UI session is not enough (GET wake links)."""

    @functools.wraps(view)
    def wrapper(*args, **kwargs):
        if not is_api_key_authenticated():
            return _auth_error(
                "Authentication required",
                "This wake link needs a valid API key. Set the API_KEY "
                "environment variable, then add ?key=... to the URL.",
            )
        return view(*args, **kwargs)

    return wrapper


def load_secret_key() -> str:
    """Return a stable Flask secret so sessions survive a container restart."""
    from_env = config.env_str("SECRET_KEY")
    if from_env:
        return from_env

    try:
        if os.path.exists(config.SECRET_FILE):
            with open(config.SECRET_FILE, encoding="utf-8") as handle:
                stored = handle.read().strip()
            if stored:
                return stored

        generated = secrets.token_hex(32)
        os.makedirs(os.path.dirname(config.SECRET_FILE) or ".", exist_ok=True)
        with open(config.SECRET_FILE, "w", encoding="utf-8") as handle:
            handle.write(generated)
        os.chmod(config.SECRET_FILE, 0o600)
        return generated
    except OSError:
        log.warning(
            "Could not persist a secret key in %s; sessions will not survive a restart",
            config.SECRET_FILE,
        )
        return secrets.token_hex(32)
