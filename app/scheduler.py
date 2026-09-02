"""Cron based automatic wake-ups."""

from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from . import config
from .store import DeviceStore
from .wol import send_magic_packet

log = logging.getLogger(__name__)

JOB_PREFIX = "wake:"


class WakeScheduler:
    def __init__(self, store: DeviceStore, timezone: str = config.TIMEZONE):
        self._store = store
        self._scheduler = BackgroundScheduler(timezone=timezone, daemon=True)
        store.on_change(self.reload)

    def start(self) -> None:
        self._scheduler.start()
        self.reload()

    def shutdown(self) -> None:
        if self._scheduler.running:
            self._scheduler.shutdown(wait=False)

    def reload(self) -> None:
        """Rebuild all jobs from the current device list."""
        for job in self._scheduler.get_jobs():
            if job.id.startswith(JOB_PREFIX):
                job.remove()

        for device in self._store.list():
            schedule = (device.get("schedule") or "").strip()
            if not schedule or not device.get("enabled", True):
                continue
            try:
                trigger = CronTrigger.from_crontab(schedule, timezone=self._scheduler.timezone)
            except ValueError:
                log.warning(
                    "Skipping schedule for %s: invalid cron expression %r",
                    device["name"],
                    schedule,
                )
                continue

            self._scheduler.add_job(
                self._wake,
                trigger=trigger,
                id=f"{JOB_PREFIX}{device['id']}",
                name=f"Wake {device['name']}",
                args=[device["id"]],
                replace_existing=True,
                misfire_grace_time=60,
                coalesce=True,
                max_instances=1,
            )
            log.info("Scheduled %s at %r", device["name"], schedule)

    def next_runs(self) -> dict[str, str]:
        """Next run time per device id, as ISO strings."""
        runs = {}
        for job in self._scheduler.get_jobs():
            if job.id.startswith(JOB_PREFIX) and job.next_run_time:
                runs[job.id[len(JOB_PREFIX) :]] = job.next_run_time.isoformat()
        return runs

    def _wake(self, device_id: str) -> None:
        device = self._store.get(device_id)
        if not device:
            return
        result = send_magic_packet(
            device["mac"],
            broadcast=device.get("broadcast") or None,
            repeat=device.get("repeat"),
            host=device.get("host") or None,
        )
        if result.ok:
            log.info(
                "Scheduled wake for %s (%s): %d packets sent",
                device["name"],
                device["mac"],
                result.packets_sent,
            )
        else:
            log.error(
                "Scheduled wake for %s (%s) failed: %s",
                device["name"],
                device["mac"],
                "; ".join(result.errors) or "no packets sent",
            )
