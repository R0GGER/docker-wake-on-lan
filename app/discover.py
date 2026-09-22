"""LAN discovery for the Edit-mode Discover button.

Hosts on the container's own subnet are found with an ARP scan, which yields
IP, MAC address and vendor. Set ``DISCOVER_SUBNET`` (for example
``192.168.1.0/24``) to scan another network, which is what Docker Desktop
needs: the container is not on the LAN, but it can still reach that subnet.
MAC addresses on that path come from the neighbor table of an SSH device that
is already configured on the subnet. Hostnames and a short list of common
services are filled in afterwards, and only for hosts that answered. The
browser cannot choose the target.
"""

from __future__ import annotations

import ipaddress
import logging
import os
import re
import secrets
import shutil
import socket
import struct
import subprocess
import threading
import time
from concurrent.futures import ThreadPoolExecutor

from . import config, shutdown, status
from .wol import is_valid_mac, normalize_mac

log = logging.getLogger(__name__)

PROBE_PORTS = (22, 80, 443, 139, 445, 3389, 5900, 8080)
SERVICE_NAMES = {
    22: "SSH",
    80: "HTTP",
    443: "HTTPS",
    139: "NetBIOS",
    445: "SMB",
    3389: "RDP",
    5900: "VNC",
    8080: "HTTP-alt",
}
STATUS_PORTS = frozenset({22, 80, 445, 3389})

NAME_TIMEOUT = 1.0
PORT_TIMEOUT = 0.5
SWEEP_TIMEOUT = 0.4
SWEEP_PORTS = (22, 80, 445, 3389)
ARP_TIMEOUT = 20.0
SWEEP_BUDGET = 8.0
ENRICH_BUDGET = max(NAME_TIMEOUT, PORT_TIMEOUT) + 0.3
OUI_FILE = "/usr/share/arp-scan/ieee-oui.txt"

_IFACE_NAME = re.compile(r"^[A-Za-z0-9._:-]{1,15}$")
_NBSTAT_NAME = b"CKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
_NAME_LABEL = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,14}")
_UNKNOWN_VENDOR = {"", "unknown", "(unknown)"}

_scan_lock = threading.Lock()
_oui_cache: dict[str, str] | None = None


class DiscoveryError(Exception):
    """The scan could not run."""


class DiscoveryBusy(DiscoveryError):
    """A scan is already in progress."""


def scan(peers: list[dict] | None = None) -> dict:
    """Scan the local subnet. Raises DiscoveryBusy if one scan is already running."""
    if not _scan_lock.acquire(blocking=False):
        raise DiscoveryBusy("A discovery scan is already running.")
    try:
        return _scan(peers or [])
    finally:
        _scan_lock.release()


def scan_target(ip: str, netmask: str) -> ipaddress.IPv4Network:
    """Subnet to scan. Networks larger than /24 are cut down to the local /24."""
    network = ipaddress.ip_network(f"{ip}/{netmask}", strict=False)
    if not isinstance(network, ipaddress.IPv4Network):
        raise DiscoveryError("Discovery only supports IPv4.")
    if network.prefixlen < 24:
        narrowed = ipaddress.ip_network(f"{ip}/24", strict=False)
        if not isinstance(narrowed, ipaddress.IPv4Network):
            raise DiscoveryError("Discovery only supports IPv4.")
        return narrowed
    return network


def container_network_warning(iface: str, ip: str) -> str | None:
    """Explain the result when the container is not attached to the LAN."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return None
    bridge = (
        iface == "docker0"
        or iface.startswith(("br-", "veth", "docker"))
        or addr in ipaddress.ip_network("172.17.0.0/16")
        or addr in ipaddress.ip_network("192.168.65.0/24")
    )
    if not bridge:
        return None
    return (
        "This container is not on your LAN, so the scan only sees the Docker network. "
        "On Linux, run with host networking. On Docker Desktop the container cannot see your home devices."
    )


def parse_arp_output(text: str) -> list[dict]:
    """Parse arp-scan plain output into IP, MAC and vendor rows."""
    hosts = []
    for line in text.splitlines():
        host = _parse_arp_line(line)
        if host:
            hosts.append(host)
    return hosts


def parse_dns_ptr(packet: bytes, query_id: int) -> str:
    """Return the first PTR name in a DNS response, or an empty string."""
    if len(packet) < 12:
        return ""
    tid, _flags, questions, answers, _ns, _ar = struct.unpack_from(">HHHHHH", packet, 0)
    if tid != query_id or answers < 1:
        return ""
    offset = 12
    for _ in range(questions):
        _name, offset = _read_dns_name(packet, offset)
        offset += 4
        if offset > len(packet):
            return ""
    for _ in range(answers):
        _name, offset = _read_dns_name(packet, offset)
        if offset + 10 > len(packet):
            return ""
        rtype, _rclass, _ttl, rdlen = struct.unpack_from(">HHIH", packet, offset)
        offset += 10
        if offset + rdlen > len(packet):
            return ""
        start = offset
        offset += rdlen
        if rtype != 12:
            continue
        name, _end = _read_dns_name(packet, start)
        cleaned = _clean_name(name)
        if cleaned:
            return cleaned
    return ""


def parse_discover_subnet(value: str) -> ipaddress.IPv4Network:
    """Parse ``DISCOVER_SUBNET``. Networks larger than /24 are rejected."""
    try:
        network = ipaddress.ip_network(value.strip(), strict=False)
    except ValueError as exc:
        raise DiscoveryError(
            "DISCOVER_SUBNET must be an IPv4 subnet, for example 192.168.1.0/24."
        ) from exc
    if not isinstance(network, ipaddress.IPv4Network):
        raise DiscoveryError("DISCOVER_SUBNET must be an IPv4 subnet, for example 192.168.1.0/24.")
    if network.prefixlen < 24:
        raise DiscoveryError("DISCOVER_SUBNET must be /24 or smaller, for example 192.168.1.0/24.")
    return network


def parse_netbios(packet: bytes) -> str:
    """Return the workstation name from a NetBIOS node-status response."""
    name, _mac = parse_netbios_record(packet)
    return name


def parse_netbios_record(packet: bytes) -> tuple[str, str]:
    """Return the workstation name and MAC address from a node-status response."""
    if len(packet) < 56 or packet[12] != 0x20:
        return "", ""
    offset = 12 + 34 + 4
    if offset >= len(packet):
        return "", ""
    if packet[offset] == 0x20:
        offset += 34
    elif packet[offset] & 0xC0 == 0xC0:
        offset += 2
    else:
        return "", ""
    if offset + 10 > len(packet):
        return "", ""
    offset += 8
    rdlen = struct.unpack_from(">H", packet, offset)[0]
    offset += 2
    end = min(len(packet), offset + rdlen)
    if offset >= end:
        return "", ""
    count = packet[offset]
    offset += 1
    name = ""
    for _ in range(count):
        if offset + 18 > end:
            break
        raw = packet[offset : offset + 16]
        flags = struct.unpack_from(">H", packet, offset + 16)[0]
        offset += 18
        if name or flags & 0x8000 or raw[15] != 0:
            continue
        label = raw[:15].decode("latin1", "replace").strip(" \x00")
        if _NAME_LABEL.fullmatch(label):
            name = label
    mac = ""
    if offset + 6 <= end:
        raw_mac = packet[offset : offset + 6]
        if any(raw_mac) and raw_mac != b"\xff" * 6:
            mac = ":".join(f"{byte:02x}" for byte in raw_mac)
    return name, mac


def _scan(peers: list[dict]) -> dict:
    iface, own_ip, local, container_warning = _local_network()
    configured = _configured_subnet()
    target = configured or local
    if ipaddress.ip_address(own_ip) not in target:
        found = _scan_routed(target)
        _apply_neighbor_macs(found, target, peers)
        warning = _routed_mac_warning(found, peers, target)
    else:
        found = _scan_arp(iface, own_ip, target)
        warning = None if configured else container_warning
    _enrich(found)
    found.sort(key=lambda host: int(ipaddress.ip_address(host["ip"])))
    log.info("Discovered %d device(s) on %s via %s", len(found), target, iface)
    return {
        "interface": iface,
        "subnet": str(target),
        "warning": warning,
        "devices": found,
    }


def _configured_subnet() -> ipaddress.IPv4Network | None:
    raw = config.env_str("DISCOVER_SUBNET")
    if not raw:
        return None
    return parse_discover_subnet(raw)


def _scan_arp(iface: str, own_ip: str, network: ipaddress.IPv4Network) -> list[dict]:
    found: list[dict] = []
    seen: set[str] = set()
    for host in parse_arp_output(_run_arp_scan(iface, network)):
        if host["ip"] == own_ip or host["ip"] in seen or host["mac"] in seen:
            continue
        if ipaddress.ip_address(host["ip"]) not in network:
            continue
        seen.add(host["ip"])
        seen.add(host["mac"])
        found.append(host)
    return found


def _scan_routed(network: ipaddress.IPv4Network) -> list[dict]:
    """Find hosts on a subnet the container can route to, but is not attached to."""
    ips = [str(host) for host in network.hosts()]
    alive: list[str] = []
    workers = min(256, max(4, len(ips) or 1))
    pool = ThreadPoolExecutor(max_workers=workers, thread_name_prefix="discover-sweep")
    try:
        checks = {
            ip: [pool.submit(status.icmp_check, ip, SWEEP_TIMEOUT)]
            + [pool.submit(status.tcp_check, ip, port, SWEEP_TIMEOUT) for port in SWEEP_PORTS]
            for ip in ips
        }
        deadline = time.monotonic() + SWEEP_BUDGET
        for ip, futures in checks.items():
            up = False
            for fut in futures:
                remaining = deadline - time.monotonic()
                if remaining <= 0 and not fut.done():
                    continue
                try:
                    if fut.result(timeout=max(0.0, remaining)):
                        up = True
                        break
                except Exception:
                    log.debug("Discovery probe failed for %s", ip, exc_info=True)
            if up:
                alive.append(ip)
    finally:
        pool.shutdown(wait=False, cancel_futures=True)
    return [{"ip": ip, "mac": "", "vendor": ""} for ip in alive]


def _apply_neighbor_macs(
    found: list[dict], network: ipaddress.IPv4Network, peers: list[dict]
) -> None:
    """Fill MAC addresses from an SSH host that is actually on the subnet."""
    macs = _macs_via_ssh(network, peers, {host["ip"] for host in found})
    if not macs:
        return
    by_ip = {host["ip"]: host for host in found}
    for ip, mac in macs.items():
        row = by_ip.get(ip)
        if row is None:
            row = {"ip": ip, "mac": mac, "vendor": ""}
            by_ip[ip] = row
            found.append(row)
        elif not row.get("mac"):
            row["mac"] = mac


def _macs_via_ssh(
    network: ipaddress.IPv4Network, peers: list[dict], alive: set[str]
) -> dict[str, str]:
    candidates = []
    for device in peers:
        host = (device.get("host") or "").strip()
        user = (device.get("shutdown_user") or "").strip()
        if (device.get("shutdown_method") or "").strip() != "ssh" or not user:
            continue
        try:
            ip = ipaddress.ip_address(host)
        except ValueError:
            continue
        if not isinstance(ip, ipaddress.IPv4Address) or ip not in network:
            continue
        candidates.append(device)
    candidates.sort(key=lambda device: (device.get("host") not in alive, device.get("host") or ""))
    ips = [str(host) for host in network.hosts()]
    if not candidates or not ips:
        return {}
    script = _neighbor_script(ips)
    for device in candidates[:3]:
        host = (device.get("host") or "").strip()
        if not status.tcp_check(host, 22, timeout=0.8):
            continue
        stdout, error = shutdown.ssh_output(device, script, timeout=35)
        macs = parse_neighbor_table(stdout, network)
        if macs:
            log.info("Read %d MAC address(es) from %s", len(macs), host)
            return macs
        log.info("No neighbor table from %s: %s", host, error or "empty")
    return {}


def _neighbor_script(ips: list[str]) -> str:
    targets = " ".join(ips)
    return (
        "n=0; "
        f"for a in {targets}; do "
        'ping -c 1 -W 1 "$a" >/dev/null 2>&1 & '
        "n=$((n+1)); "
        "if [ $((n % 40)) -eq 0 ]; then wait; fi; "
        "done; "
        "wait; "
        "ip neigh 2>/dev/null || true; "
        "echo ---; "
        "cat /proc/net/arp 2>/dev/null || true; "
        "ip -o -4 addr show scope global 2>/dev/null | "
        "while read -r _ iface _ cidr _; do "
        'case "$iface" in *[!A-Za-z0-9_.:-]*) continue ;; esac; '
        'mac=$(cat "/sys/class/net/${iface}/address" 2>/dev/null) || continue; '
        'echo "${cidr%%/*} $mac"; '
        "done"
    )


def parse_neighbor_table(text: str, network: ipaddress.IPv4Network) -> dict[str, str]:
    """Map IP to MAC from ``ip neigh`` and ``/proc/net/arp`` output."""
    macs: dict[str, str] = {}
    for line in text.splitlines():
        parts = line.split()
        if not parts:
            continue
        try:
            ip = ipaddress.ip_address(parts[0])
        except ValueError:
            continue
        if not isinstance(ip, ipaddress.IPv4Address) or ip not in network:
            continue
        mac = ""
        for part in parts[1:]:
            if is_valid_mac(part):
                mac = normalize_mac(part)
                break
        if not mac or mac in ("00:00:00:00:00:00", "ff:ff:ff:ff:ff:ff"):
            continue
        if mac.startswith(("01:00:5e", "33:33")):
            continue
        macs[str(ip)] = mac
    return macs


def _routed_mac_warning(
    found: list[dict], peers: list[dict], network: ipaddress.IPv4Network
) -> str | None:
    if any(host.get("mac") for host in found):
        return None
    on_subnet = False
    for device in peers:
        host = (device.get("host") or "").strip()
        try:
            ip = ipaddress.ip_address(host)
        except ValueError:
            continue
        if (
            isinstance(ip, ipaddress.IPv4Address)
            and ip in network
            and (device.get("shutdown_method") or "").strip() == "ssh"
            and (device.get("shutdown_user") or "").strip()
        ):
            on_subnet = True
            break
    if on_subnet:
        return (
            "No MAC addresses were read. An SSH device on this subnet has to be "
            "online, because Docker Desktop cannot see LAN MAC addresses itself."
        )
    return (
        "No MAC addresses. Discover reads them from an SSH device on this subnet. "
        "Docker Desktop cannot see LAN MAC addresses itself."
    )


def _local_network() -> tuple[str, str, ipaddress.IPv4Network, str | None]:
    if not os.path.exists("/proc/net/route"):
        raise DiscoveryError(
            "Network discovery needs Linux. This host has no routing table to scan."
        )
    iface = _default_interface()
    if not _IFACE_NAME.fullmatch(iface):
        raise DiscoveryError("Could not choose a network interface to scan.")
    try:
        ip, mask = _iface_ipv4(iface)
    except OSError as exc:
        raise DiscoveryError(f"Could not read an IPv4 address for {iface}.") from exc
    network = scan_target(ip, mask)
    return iface, ip, network, container_network_warning(iface, ip)


def _default_interface() -> str:
    best: tuple[int, str] | None = None
    try:
        with open("/proc/net/route", encoding="utf-8") as handle:
            next(handle, None)
            for line in handle:
                fields = line.split()
                if len(fields) < 7 or fields[1] != "00000000" or fields[0] == "lo":
                    continue
                metric = int(fields[6])
                if best is None or metric < best[0]:
                    best = (metric, fields[0])
    except OSError as exc:
        raise DiscoveryError("Could not read the routing table.") from exc
    if best is None:
        raise DiscoveryError("No default network interface was found.")
    return best[1]


def _iface_ipv4(iface: str) -> tuple[str, str]:
    import fcntl

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        packed = struct.pack("256s", iface.encode("ascii")[:15])
        addr = fcntl.ioctl(sock.fileno(), 0x8915, packed)
        mask = fcntl.ioctl(sock.fileno(), 0x891B, packed)
    finally:
        sock.close()
    ip = socket.inet_ntoa(addr[20:24])
    netmask = socket.inet_ntoa(mask[20:24])
    if ip.startswith("127.") or ip == "0.0.0.0":
        raise DiscoveryError(f"{iface} has no usable IPv4 address.")
    return ip, netmask


def _run_arp_scan(iface: str, network: ipaddress.IPv4Network) -> str:
    binary = shutil.which("arp-scan")
    if not binary:
        raise DiscoveryError("arp-scan is not installed in this container.")
    command = [
        binary,
        "--interface",
        iface,
        "--numeric",
        "--plain",
        str(network),
    ]
    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=ARP_TIMEOUT,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise DiscoveryError("The network scan took too long and was stopped.") from exc
    except OSError as exc:
        raise DiscoveryError("Could not start arp-scan.") from exc
    if completed.stderr.strip():
        log.debug("arp-scan: %s", completed.stderr.strip())
    if completed.returncode != 0 and not completed.stdout.strip():
        detail = (completed.stderr or completed.stdout or "arp-scan failed").strip()
        first = detail.splitlines()[0][:300] if detail else "arp-scan failed"
        raise DiscoveryError(f"Network scan failed: {first}")
    return completed.stdout


def _parse_arp_line(line: str) -> dict | None:
    text = line.strip()
    if not text or text.startswith("#"):
        return None
    parts = [part.strip() for part in text.split("\t") if part.strip()]
    if len(parts) < 2:
        parts = text.split(None, 2)
    if len(parts) < 2:
        return None
    if len(parts) > 3:
        parts = [parts[0], parts[1], " ".join(parts[2:])]
    ip_text, mac_text = parts[0], parts[1]
    vendor = parts[2] if len(parts) > 2 else ""
    try:
        ip = str(ipaddress.ip_address(ip_text))
    except ValueError:
        return None
    if not is_valid_mac(mac_text):
        return None
    return {"ip": ip, "mac": normalize_mac(mac_text), "vendor": _clean_vendor(vendor)}


def _clean_vendor(value: str) -> str:
    vendor = " ".join(value.split())
    if vendor.lower() in _UNKNOWN_VENDOR or vendor.lower().startswith("(unknown"):
        return ""
    return vendor[:128]


def _enrich(hosts: list[dict]) -> None:
    if not hosts:
        return
    tasks = len(hosts) * (3 + len(PROBE_PORTS))
    workers = min(256, max(4, tasks))
    pool = ThreadPoolExecutor(max_workers=workers, thread_name_prefix="discover")
    try:
        lookups = []
        for host in hosts:
            ip = host["ip"]
            lookups.append(
                (
                    host,
                    {
                        "dns": pool.submit(_reverse_dns, ip),
                        "netbios": pool.submit(_netbios_name, ip),
                        "mdns": pool.submit(_mdns_name, ip),
                    },
                    [(pool.submit(status.tcp_check, ip, port, PORT_TIMEOUT), port) for port in PROBE_PORTS],
                )
            )
        deadline = time.monotonic() + ENRICH_BUDGET

        def take(fut, default):
            remaining = deadline - time.monotonic()
            if remaining <= 0 and not fut.done():
                return default
            try:
                return fut.result(timeout=max(0.0, remaining))
            except Exception:
                log.debug("Discovery lookup failed", exc_info=True)
                return default

        for host, names, ports in lookups:
            dns = _clean_name(str(take(names["dns"], "") or ""))
            record = take(names["netbios"], ("", ""))
            netbios_name, netbios_mac = record if isinstance(record, tuple) else ("", "")
            netbios = _clean_name(str(netbios_name or ""))
            mdns = _clean_name(str(take(names["mdns"], "") or ""))
            host["hostname"] = dns or netbios or mdns
            if not host.get("mac") and netbios_mac and is_valid_mac(netbios_mac):
                host["mac"] = normalize_mac(netbios_mac)
            if host.get("mac") and not host.get("vendor"):
                host["vendor"] = _vendor_for_mac(host["mac"])
            services = []
            for fut, port in ports:
                if take(fut, False):
                    services.append(
                        {
                            "port": port,
                            "name": SERVICE_NAMES[port],
                            "status": port in STATUS_PORTS,
                        }
                    )
            host["services"] = services
    finally:
        pool.shutdown(wait=False, cancel_futures=True)


def _reverse_dns(ip: str) -> str:
    server = _nameserver()
    if not server:
        return ""
    qname = ".".join(reversed(ip.split("."))) + ".in-addr.arpa"
    payload, tid = _dns_query(qname, 12)
    return parse_dns_ptr(_udp_query((server, 53), payload, NAME_TIMEOUT), tid)


def _mdns_name(ip: str) -> str:
    qname = ".".join(reversed(ip.split("."))) + ".in-addr.arpa"
    payload, tid = _mdns_query(qname)
    return parse_dns_ptr(_udp_query((ip, 5353), payload, NAME_TIMEOUT), tid)


def _netbios_name(ip: str) -> tuple[str, str]:
    tid = secrets.randbelow(65536)
    packet = struct.pack(">HHHHHH", tid, 0, 1, 0, 0, 0)
    packet += b"\x20" + _NBSTAT_NAME + b"\x00" + struct.pack(">HH", 0x0021, 1)
    return parse_netbios_record(_udp_query((ip, 137), packet, NAME_TIMEOUT))


def _vendor_for_mac(mac: str) -> str:
    if not mac:
        return ""
    prefixes = _oui_prefixes()
    compact = mac.replace(":", "").upper()
    for length in (12, 9, 7, 6):
        vendor = prefixes.get(compact[:length])
        if vendor:
            return _clean_vendor(vendor)
    return ""


def _oui_prefixes() -> dict[str, str]:
    global _oui_cache
    if _oui_cache is not None:
        return _oui_cache
    prefixes: dict[str, str] = {}
    try:
        with open(OUI_FILE, encoding="utf-8", errors="replace") as handle:
            for line in handle:
                text = line.strip()
                if not text or text.startswith("#"):
                    continue
                prefix, separator, vendor = text.partition("\t")
                if not separator:
                    parts = text.split(None, 1)
                    if len(parts) != 2:
                        continue
                    prefix, vendor = parts
                prefix = prefix.replace(":", "").replace("-", "").upper()
                if prefix and vendor:
                    prefixes[prefix] = vendor.strip()
    except OSError:
        log.debug("OUI vendor file is not available", exc_info=True)
    _oui_cache = prefixes
    return prefixes


def _nameserver() -> str:
    try:
        with open("/etc/resolv.conf", encoding="utf-8") as handle:
            for line in handle:
                parts = line.split()
                if len(parts) < 2 or parts[0] != "nameserver" or ":" in parts[1]:
                    continue
                return parts[1]
    except OSError:
        return ""
    return ""


def _dns_query(name: str, qtype: int, qclass: int = 1, flags: int = 0x0100) -> tuple[bytes, int]:
    tid = secrets.randbelow(65536)
    header = struct.pack(">HHHHHH", tid, flags, 1, 0, 0, 0)
    return header + _encode_qname(name) + struct.pack(">HH", qtype, qclass), tid


def _mdns_query(name: str) -> tuple[bytes, int]:
    return _dns_query(name, 12, qclass=0x8001, flags=0)


def _encode_qname(name: str) -> bytes:
    encoded = b"".join(
        bytes([len(label)]) + label.encode("ascii", "ignore")
        for label in name.rstrip(".").split(".")
        if label
    )
    return encoded + b"\x00"


def _udp_query(address: tuple[str, int], payload: bytes, timeout: float) -> bytes:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.settimeout(timeout)
        sock.sendto(payload, address)
        data, _source = sock.recvfrom(1500)
        return data
    except OSError:
        return b""
    finally:
        sock.close()


def _read_dns_name(packet: bytes, offset: int) -> tuple[str, int]:
    labels: list[str] = []
    jumped = False
    end = offset
    for _ in range(16):
        if offset >= len(packet):
            break
        length = packet[offset]
        if length == 0:
            if not jumped:
                end = offset + 1
            break
        if length & 0xC0 == 0xC0:
            if offset + 1 >= len(packet):
                break
            if not jumped:
                end = offset + 2
            offset = ((length & 0x3F) << 8) | packet[offset + 1]
            jumped = True
            continue
        if length & 0xC0:
            break
        offset += 1
        if offset + length > len(packet):
            break
        labels.append(packet[offset : offset + length].decode("utf-8", "replace"))
        offset += length
        if not jumped:
            end = offset
    return ".".join(labels), end


def _clean_name(value: str) -> str:
    name = value.strip().rstrip(".")
    if name.lower().endswith(".local"):
        name = name[: -len(".local")].rstrip(".")
    if not name or len(name) > 255 or any(ord(char) < 32 for char in name):
        return ""
    try:
        ipaddress.ip_address(name)
    except ValueError:
        return name
    return ""
