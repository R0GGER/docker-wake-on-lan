"""Container entrypoint: one-shot CLI wake or the web interface."""

from __future__ import annotations

import argparse
import logging
import os
import shlex
import sys

from . import config
from .status import wait_until_online
from .wol import DEFAULT_PORTS, InvalidMacError, parse_mac_list, send_magic_packet

log = logging.getLogger("wol")


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    parser = build_parser()
    args = parser.parse_args(argv)

    setup_logging(args.verbose)

    mode = (args.mode or os.environ.get("MODE") or "auto").lower()
    macs = args.mac or parse_env_macs()

    if mode == "web" or (mode == "auto" and not macs):
        return run_web()
    if not macs:
        parser.error("No MAC address given. Set the MAC environment variable or pass one as argument.")
    return run_cli(macs, args)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="wake-on-lan",
        description="Send Wake-on-LAN magic packets or run the web interface.",
    )
    parser.add_argument("mac", nargs="*", help="one or more MAC addresses to wake")
    parser.add_argument("--mode", choices=["auto", "cli", "web"], help="what to run (default: auto)")
    parser.add_argument("-b", "--broadcast", help="broadcast address, e.g. 192.168.1.255")
    parser.add_argument("-p", "--port", type=int, action="append", help="UDP port (repeatable)")
    parser.add_argument("-r", "--repeat", type=int, help="how often to send each packet")
    parser.add_argument("--host", help="host to poll after waking")
    parser.add_argument("--wait", type=int, help="seconds to wait for the host to come online")
    parser.add_argument("-v", "--verbose", action="store_true", help="debug logging")
    return parser


def setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else getattr(logging, config.LOG_LEVEL, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    logging.getLogger("apscheduler").setLevel(logging.WARNING)


def parse_env_macs() -> list[str]:
    """Read the MAC environment variable used by the original image."""
    raw = config.env_str("MAC")
    if not raw:
        return []
    try:
        return parse_mac_list(raw)
    except InvalidMacError as exc:
        log.error("%s", exc)
        raise SystemExit(2) from exc


def parse_legacy_options() -> dict:
    """Support the old OPTIONS variable that was passed straight to `awake`."""
    raw = config.env_str("OPTIONS")
    if not raw:
        return {}

    options: dict = {}
    tokens = shlex.split(raw)
    index = 0
    while index < len(tokens):
        token = tokens[index]
        value = tokens[index + 1] if index + 1 < len(tokens) else None
        if token in ("-p", "--port") and value:
            try:
                options.setdefault("ports", []).append(int(value))
            except ValueError:
                log.warning("Ignoring invalid port in OPTIONS: %s", value)
            index += 2
            continue
        if token in ("-b", "--broadcast") and value:
            options["broadcast"] = value
            index += 2
            continue
        log.warning("Ignoring unsupported OPTIONS entry: %s", token)
        index += 1
    return options


def run_cli(macs: list[str], args: argparse.Namespace) -> int:
    legacy = parse_legacy_options()
    broadcast = args.broadcast or legacy.get("broadcast") or config.env_str("BROADCAST") or None
    ports = args.port or legacy.get("ports") or list(DEFAULT_PORTS)
    repeat = args.repeat or config.env_int("REPEAT", 3)

    failures = 0
    for mac in macs:
        result = send_magic_packet(
            mac,
            broadcast=broadcast,
            ports=ports,
            repeat=repeat,
            host=args.host or config.env_str("WAIT_HOST") or None,
        )
        if result.ok:
            log.info(
                "Sent %d magic packets for %s to %s",
                result.packets_sent,
                result.mac,
                ", ".join(result.targets),
            )
            for error in result.errors:
                log.warning("Partial failure: %s", error)
        else:
            failures += 1
            log.error(
                "Could not wake %s: %s", result.mac, "; ".join(result.errors) or "no packets sent"
            )

    host = args.host or config.env_str("WAIT_HOST")
    timeout = args.wait if args.wait is not None else config.env_int("WAIT_TIMEOUT", 0)
    if host and timeout > 0:
        log.info("Waiting up to %ds for %s to come online...", timeout, host)
        online, elapsed = wait_until_online(host, timeout=timeout)
        if online:
            log.info("%s is online after %.1fs", host, elapsed)
        else:
            log.error("%s is still offline after %.1fs", host, elapsed)
            failures += 1

    return 1 if failures else 0


def run_web() -> int:
    from .server import run

    log.info("Starting web interface on %s:%s", config.HOST, config.PORT)
    run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
