"""Magic packet creation and sending."""

from __future__ import annotations

import re
import socket
import time
from dataclasses import dataclass, field

DEFAULT_PORTS = (9, 7)
DEFAULT_BROADCAST = "255.255.255.255"
DEFAULT_REPEAT = 3
REPEAT_INTERVAL = 0.15

_SEPARATORS = re.compile(r"[:\-.\s]")
_HEX12 = re.compile(r"^[0-9A-Fa-f]{12}$")


class InvalidMacError(ValueError):
    """Raised when a MAC address cannot be parsed."""


def normalize_mac(mac: str) -> str:
    """Return the MAC in canonical ``aa:bb:cc:dd:ee:ff`` form.

    Accepts colon, dash, dot and space separated input as well as bare hex.
    """
    if not isinstance(mac, str):
        raise InvalidMacError(f"MAC address must be a string, got {type(mac).__name__}")

    cleaned = _SEPARATORS.sub("", mac.strip())
    if not _HEX12.match(cleaned):
        raise InvalidMacError(f"Invalid MAC address: {mac!r}")

    cleaned = cleaned.lower()
    return ":".join(cleaned[i : i + 2] for i in range(0, 12, 2))


def is_valid_mac(mac: str) -> bool:
    try:
        normalize_mac(mac)
    except InvalidMacError:
        return False
    return True


def build_magic_packet(mac: str) -> bytes:
    """Build the 102 byte magic packet: 6x 0xFF followed by the MAC 16 times."""
    payload = bytes.fromhex(normalize_mac(mac).replace(":", ""))
    return b"\xff" * 6 + payload * 16


@dataclass
class WakeResult:
    mac: str
    packets_sent: int = 0
    targets: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.packets_sent > 0

    def as_dict(self) -> dict:
        return {
            "mac": self.mac,
            "ok": self.ok,
            "packets_sent": self.packets_sent,
            "targets": self.targets,
            "errors": self.errors,
        }


def send_magic_packet(
    mac: str,
    broadcast: str | None = None,
    ports: tuple[int, ...] | list[int] | None = None,
    repeat: int = DEFAULT_REPEAT,
    interface_ip: str | None = None,
    host: str | None = None,
) -> WakeResult:
    """Send magic packets for ``mac`` to every broadcast address and port.

    Sending to both port 9 and 7 and repeating a few times costs nothing and
    noticeably improves reliability on flaky switches and NICs.

    When ``host`` is an IPv4 address (or hostname), packets are also sent as
    unicast to that address and to its /24 directed broadcast. That is what
    makes Wake-on-LAN work from Docker Desktop: limited broadcasts stay inside
    the VM, but a packet to ``192.168.1.233`` / ``192.168.1.255`` can be routed
    onto the LAN.
    """
    normalized = normalize_mac(mac)
    packet = build_magic_packet(normalized)

    addresses = _target_addresses(broadcast, host)
    port_list = [int(p) for p in (ports or DEFAULT_PORTS)]
    repeat = max(1, int(repeat or DEFAULT_REPEAT))

    result = WakeResult(mac=normalized)

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        if interface_ip:
            try:
                sock.bind((interface_ip, 0))
            except OSError as exc:
                result.errors.append(f"Could not bind to {interface_ip}: {exc}")

        for attempt in range(repeat):
            for address in addresses:
                for port in port_list:
                    target = f"{address}:{port}"
                    try:
                        sock.sendto(packet, (address, port))
                        result.packets_sent += 1
                        if target not in result.targets:
                            result.targets.append(target)
                    except OSError as exc:
                        message = f"{target}: {exc}"
                        if message not in result.errors:
                            result.errors.append(message)
            if attempt < repeat - 1:
                time.sleep(REPEAT_INTERVAL)

    return result


def _target_addresses(broadcast: str | None, host: str | None = None) -> list[str]:
    """Collect destinations: explicit broadcasts, host unicast, directed /24, global."""
    addresses: list[str] = []

    def add(item: str | None) -> None:
        if item and item not in addresses:
            addresses.append(item)

    if broadcast:
        for item in str(broadcast).replace(",", " ").split():
            add(item.strip())

    for item in _addresses_from_host(host):
        add(item)

    add(DEFAULT_BROADCAST)
    return addresses


def _addresses_from_host(host: str | None) -> list[str]:
    ip = _resolve_ipv4(host)
    if not ip:
        return []
    addresses = [ip]
    directed = _slash24_broadcast(ip)
    if directed and directed not in addresses:
        addresses.append(directed)
    return addresses


def _resolve_ipv4(host: str | None) -> str | None:
    if not host or not str(host).strip():
        return None
    value = str(host).strip()
    try:
        socket.inet_pton(socket.AF_INET, value)
        return value
    except OSError:
        pass
    try:
        return socket.getaddrinfo(value, None, socket.AF_INET, socket.SOCK_DGRAM)[0][4][0]
    except OSError:
        return None


def _slash24_broadcast(ip: str) -> str | None:
    parts = ip.split(".")
    if len(parts) != 4:
        return None
    try:
        octets = [int(part) for part in parts]
    except ValueError:
        return None
    if octets[0] in {0, 127, 255} or any(octet < 0 or octet > 255 for octet in octets):
        return None
    return f"{octets[0]}.{octets[1]}.{octets[2]}.255"


def parse_mac_list(value: str) -> list[str]:
    """Parse a whitespace or comma separated list of MAC addresses."""
    if not value:
        return []
    return [normalize_mac(item) for item in value.replace(",", " ").split()]
