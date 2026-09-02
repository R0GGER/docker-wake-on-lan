const REFRESH_INTERVAL = 10000;
const CROW_DURATION = 1800;
const SLEEP_DURATION = 2200;

// Material Symbols path data, inlined so the interface needs no icon font.
const ICONS = {
  bolt: "M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  delete:
    "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  refresh:
    "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-8 8s3.57 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
  logout:
    "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  schedule:
    "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  devices:
    "M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z",
  error:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
  check:
    "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  key: "M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
  power:
    "M13 3h-2v10h2V3zm4.83 2.17-1.42 1.42A6.92 6.92 0 0 1 19 12c0 3.87-3.13 7-7 7A6.995 6.995 0 0 1 7.58 6.58L6.17 5.17A8.932 8.932 0 0 0 3 12c0 4.97 4.02 9 9 9 4.97 0 9-4.03 9-9 0-2.74-1.23-5.18-3.17-6.83z",
  power_off:
    "M12 3c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1zm5.14 2.96c-.32-.32-.84-.32-1.15 0-.32.32-.32.83 0 1.15 1.48 1.49 2.4 3.55 2.4 5.89 0 4.42-3.58 8-8 8s-8-3.58-8-8c0-2.34.92-4.4 2.4-5.89.32-.32.32-.83 0-1.15-.32-.32-.83-.32-1.15 0C3.82 8.15 2.61 10.88 2.61 14c0 5.52 4.48 10 10 10s10-4.48 10-10c0-3.12-1.21-5.85-3.47-8.04z",
  light_mode:
    "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 1 0-1.41 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 1 0-1.41 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z",
  dark_mode:
    "M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.4 5.4 0 0 1-2.26-10.3c-.44-.06-.9-.1-1.36-.1z",
  theme_auto:
    "M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm1-17.93c3.94.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V4.07z",
};

const THEMES = ["auto", "light", "dark"];
const THEME_META = {
  auto: { icon: "theme_auto", label: "Theme: follow system" },
  light: { icon: "light_mode", label: "Theme: light" },
  dark: { icon: "dark_mode", label: "Theme: dark" },
};

function icon(name, size = 24) {
  const path = ICONS[name];
  if (!path) return "";
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" overflow="visible" aria-hidden="true"><path d="${path}"/></svg>`;
}

function hydrateIcons(root = document) {
  for (const node of root.querySelectorAll("[data-icon]")) {
    const size = Number(node.dataset.iconSize) || 24;
    node.insertAdjacentHTML("afterbegin", icon(node.dataset.icon, size));
    delete node.dataset.icon;
  }
}

const el = {
  login: document.getElementById("login"),
  loginForm: document.getElementById("login-form"),
  loginNotice: document.getElementById("login-notice"),
  loginPassword: document.getElementById("login-password"),
  loginError: document.getElementById("login-error"),
  app: document.getElementById("app"),
  devices: document.getElementById("devices"),
  empty: document.getElementById("empty"),
  banner: document.getElementById("banner"),
  bannerText: document.getElementById("banner-text"),
  refresh: document.getElementById("refresh"),
  addDevice: document.getElementById("add-device"),
  logout: document.getElementById("logout"),
  dialog: document.getElementById("device-dialog"),
  form: document.getElementById("device-form"),
  dialogTitle: document.getElementById("dialog-title"),
  dialogError: document.getElementById("dialog-error"),
  dialogCancel: document.getElementById("dialog-cancel"),
  shutdownMethod: document.getElementById("shutdown-method"),
  shutdownHint: document.getElementById("shutdown-hint"),
  shutdownAuth: document.getElementById("shutdown-auth"),
  shutdownCommandField: document.getElementById("shutdown-command-field"),
  quickForm: document.getElementById("quick-form"),
  quickMac: document.getElementById("quick-mac"),
  snackbars: document.getElementById("snackbar-host"),
  mascot: document.getElementById("app-mascot"),
  themeColor: document.getElementById("theme-color"),
  themeToggles: [
    document.getElementById("theme-toggle"),
    document.getElementById("theme-toggle-login"),
  ].filter(Boolean),
};

let devices = [];
let editingId = null;
let timer = null;
let passwordLogin = true;

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    /* empty body */
  }
  if (response.status === 401) {
    showLogin();
    throw new Error(data.error || "Authentication required");
  }
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(preference) {
  const root = document.documentElement;
  const pref = THEMES.includes(preference) ? preference : "auto";
  const dark = pref === "dark" || (pref === "auto" && systemDark.matches);

  root.dataset.themePreference = pref;
  root.dataset.theme = dark ? "dark" : "light";

  const meta = THEME_META[pref];
  for (const button of el.themeToggles) {
    button.replaceChildren();
    button.insertAdjacentHTML("afterbegin", icon(meta.icon, 20));
    button.title = `${meta.label} (click to change)`;
    button.setAttribute("aria-label", meta.label);
  }

  // Keep the browser chrome in step with the top bar.
  if (el.themeColor) {
    const bar = getComputedStyle(root).getPropertyValue("--md-bar").trim();
    if (bar) el.themeColor.setAttribute("content", bar);
  }
}

function cycleTheme() {
  const current = document.documentElement.dataset.themePreference || "auto";
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  try {
    localStorage.setItem("wol-theme", next);
  } catch (err) {
    /* storage blocked; the choice then lasts for this page view only */
  }
  applyTheme(next);
}

function snackbar(message, kind = "") {
  const node = document.createElement("div");
  node.className = `snackbar ${kind}`.trim();
  const leading = kind === "ok" ? "check" : kind === "fail" ? "error" : "bolt";
  node.innerHTML = `<span class="leading">${icon(leading, 20)}</span><span></span>`;
  node.lastElementChild.textContent = message;
  el.snackbars.append(node);
  setTimeout(() => node.remove(), 5000);
}

// The rooster in the top bar crows on wake and snores when a machine goes to sleep.
let mascotTimer = null;
function playMascot(mode) {
  if (!el.mascot) return;
  const sleeping = mode === "sleep";
  const cls = sleeping ? "is-sleeping" : "is-crowing";
  const duration = sleeping ? SLEEP_DURATION : CROW_DURATION;
  clearTimeout(mascotTimer);
  // Dropping the class and forcing a reflow restarts an animation already in progress.
  el.mascot.classList.remove("is-crowing", "is-sleeping");
  void el.mascot.offsetWidth;
  const bubble = el.mascot.querySelector(".mascot-bubble");
  if (bubble) bubble.textContent = sleeping ? "Zzzzzzzzzzzz..." : "Kukeleku!";
  el.mascot.classList.add(cls);
  mascotTimer = setTimeout(() => el.mascot.classList.remove(cls), duration);
}

function crow() {
  playMascot("crow");
}

function doze() {
  playMascot("sleep");
}

function showBanner(message) {
  el.bannerText.textContent = message;
  el.banner.hidden = !message;
}

function showLogin() {
  stopPolling();
  el.app.hidden = true;
  el.login.hidden = false;
  // Without a password there is nothing to type, so show an explanation instead.
  el.loginForm.hidden = !passwordLogin;
  el.loginNotice.hidden = passwordLogin;
  if (passwordLogin) el.loginPassword.focus();
}

function showApp() {
  el.login.hidden = true;
  el.app.hidden = false;
  el.logout.hidden = document.documentElement.dataset.authRequired !== "true";
  startPolling();
}

function statusLabel(device) {
  if (!device.monitored) return "Unknown";
  if (device.online == null) return "Checking";
  return device.online ? "Online" : "Offline";
}

function chipKind(device) {
  if (!device.monitored) return "unknown";
  if (device.online == null) return "checking";
  return device.online ? "online" : "offline";
}

function shutdownState(device) {
  const disabled = !device.can_shutdown || (device.monitored && device.online !== true);
  const title = !device.can_shutdown
    ? "Configure remote shutdown in the device settings"
    : device.monitored && device.online !== true
      ? device.online === false
        ? "Device is already offline"
        : "Waiting for status"
      : "Shut down";
  return { disabled, title };
}

function applyCardStatus(card, device) {
  card.classList.toggle("is-online", device.online === true);
  card.classList.toggle("is-offline", Boolean(device.monitored && device.online === false));

  const chip = card.querySelector(".chip");
  if (chip) {
    chip.className = `chip ${chipKind(device)}`;
    const label = [...chip.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (label) label.textContent = statusLabel(device);
  }

  const shutdownButton = card.querySelector('[data-action="shutdown"]');
  if (shutdownButton) {
    const { disabled, title } = shutdownState(device);
    shutdownButton.disabled = disabled;
    shutdownButton.title = title;
    shutdownButton.setAttribute("aria-label", title);
  }
}

function renderDevices() {
  el.devices.replaceChildren();
  el.empty.hidden = devices.length > 0;

  for (const device of devices) {
    const card = document.createElement("article");
    card.className = `card device-card${device.online === true ? " is-online" : ""}${
      device.monitored && device.online === false ? " is-offline" : ""
    }${device.enabled ? "" : " disabled"}`;
    card.dataset.id = device.id;

    const chipClass = chipKind(device);
    const scheduleRow = device.schedule
      ? `<div class="row body-small">${icon("schedule", 16)}
           <code>${escapeHtml(device.schedule)}</code>${
          device.next_run ? ` &middot; next ${escapeHtml(formatDate(device.next_run))}` : ""
        }</div>`
      : "";

    const { disabled: shutdownDisabled, title: shutdownTitle } = shutdownState(device);

    card.innerHTML = `
      <div class="device-head">
        <span class="device-avatar">${icon("power", 20)}</span>
        <div class="device-titles">
          <h2 class="title-medium">${escapeHtml(device.name)}</h2>
          <p class="body-small on-surface-variant"><code>${escapeHtml(device.mac)}</code></p>
        </div>
        <span class="chip ${chipClass}"><span class="dot"></span>${statusLabel(device)}</span>
      </div>

      <div class="device-meta">
        ${
          device.host
            ? `<div class="row body-small">${icon("devices", 16)}${escapeHtml(device.host)}</div>`
            : `<div class="row body-small">${icon("devices", 16)}No host set</div>`
        }
        ${scheduleRow}
      </div>

      <div class="device-actions">
        <button class="btn filled has-icon" data-action="wake">
          <span class="btn-icon">${icon("bolt", 18)}</span> Wake
        </button>
        <button class="btn tonal danger has-icon" data-action="shutdown"${
          shutdownDisabled ? " disabled" : ""
        } title="${escapeHtml(shutdownTitle)}" aria-label="${escapeHtml(shutdownTitle)}">
          <span class="btn-icon">${icon("power", 18)}</span> Shutdown
        </button>
        <div class="device-action-icons">
          <button class="icon-btn" data-action="edit" aria-label="Edit" title="Edit">
            ${icon("edit", 20)}
          </button>
          <button class="icon-btn danger" data-action="delete" aria-label="Delete" title="Delete">
            ${icon("delete", 20)}
          </button>
        </div>
      </div>

      <p class="result body-small" data-role="result"></p>
    `;

    el.devices.append(card);
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString([], {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadDevices() {
  try {
    const data = await api("/api/devices?probe=0");
    devices = data.devices;
    showBanner("");
    renderDevices();
    refreshStatus();
  } catch (err) {
    showBanner(err.message);
  }
}

async function refreshStatus() {
  try {
    const data = await api("/api/status");
    const byId = new Map(data.devices.map((d) => [d.id, d]));
    let rebuild = false;
    let wokeUp = false;
    let wentToSleep = false;
    for (const device of devices) {
      const update = byId.get(device.id);
      if (!update) {
        rebuild = true;
        continue;
      }
      if (device.online === false && update.online === true) wokeUp = true;
      if (device.online === true && update.online === false) wentToSleep = true;
      const statusChanged =
        device.online !== update.online || device.can_shutdown !== update.can_shutdown;
      const scheduleChanged = device.next_run !== update.next_run;
      Object.assign(device, update);
      const card = el.devices.querySelector(`[data-id="${CSS.escape(device.id)}"]`);
      if (card && statusChanged && !scheduleChanged) {
        applyCardStatus(card, device);
      } else if (statusChanged || scheduleChanged) {
        rebuild = true;
      }
    }
    if (byId.size !== devices.length) rebuild = true;
    if (rebuild) renderDevices();
    if (wokeUp) crow();
    else if (wentToSleep) doze();
  } catch (err) {
    /* keep the last known state; the banner is handled by loadDevices */
  }
}

function startPolling() {
  stopPolling();
  timer = setInterval(refreshStatus, REFRESH_INTERVAL);
}

function stopPolling() {
  if (timer) clearInterval(timer);
  timer = null;
}

async function wake(device, card) {
  const button = card.querySelector('[data-action="wake"]');
  const shutdownButton = card.querySelector('[data-action="shutdown"]');
  const result = card.querySelector('[data-role="result"]');
  button.disabled = true;
  if (shutdownButton) shutdownButton.disabled = true;
  result.className = "result body-small";
  result.textContent = device.host ? "Waking, waiting for host..." : "Sending magic packet...";
  crow();

  try {
    const wait = Boolean(device.host);
    const data = await api(`/api/devices/${device.id}/wake`, {
      method: "POST",
      body: JSON.stringify({ wait, timeout: 60 }),
    });

    if (data.online === true) {
      result.className = "result body-small ok";
      result.textContent = `Online after ${data.elapsed}s`;
      device.online = true;
      applyCardStatus(card, device);
      snackbar(`${device.name} is online`, "ok");
    } else if (data.online === false) {
      result.className = "result body-small fail";
      result.textContent = `${data.packets_sent} packets sent, still offline after ${data.elapsed}s`;
      snackbar(`${device.name} did not come online`, "fail");
    } else {
      result.className = "result body-small ok";
      result.textContent = `${data.packets_sent} packets sent to ${data.targets.join(", ")}`;
      snackbar(`Magic packet sent to ${device.name}`, "ok");
    }
    renderDevicesSoon();
  } catch (err) {
    result.className = "result body-small fail";
    result.textContent = err.message;
    snackbar(err.message, "fail");
  } finally {
    button.disabled = false;
    if (shutdownButton) {
      shutdownButton.disabled =
        !device.can_shutdown || (device.monitored && device.online !== true);
    }
  }
}

async function shutdown(device, card) {
  const button = card.querySelector('[data-action="shutdown"]');
  const wakeButton = card.querySelector('[data-action="wake"]');
  const result = card.querySelector('[data-role="result"]');
  button.disabled = true;
  if (wakeButton) wakeButton.disabled = true;
  result.className = "result body-small";
  result.textContent = device.host ? "Shutting down, waiting for host..." : "Sending shutdown...";
  doze();

  try {
    const wait = Boolean(device.host);
    const data = await api(`/api/devices/${device.id}/shutdown`, {
      method: "POST",
      body: JSON.stringify({ wait, timeout: 60 }),
    });

    if (data.online === false) {
      result.className = "result body-small ok";
      result.textContent = `Offline after ${data.elapsed}s`;
      device.online = false;
      applyCardStatus(card, device);
      doze();
      snackbar(`${device.name} is offline`, "ok");
    } else if (data.online === true) {
      result.className = "result body-small fail";
      result.textContent = `Command sent, still online after ${data.elapsed}s`;
      snackbar(`${device.name} did not go offline`, "fail");
    } else {
      result.className = "result body-small ok";
      result.textContent = data.detail || "Shutdown requested";
      snackbar(`Shutdown sent to ${device.name}`, "ok");
    }
    renderDevicesSoon();
  } catch (err) {
    result.className = "result body-small fail";
    result.textContent = err.message;
    snackbar(err.message, "fail");
  } finally {
    button.disabled = !device.can_shutdown || (device.monitored && device.online !== true);
    if (wakeButton) wakeButton.disabled = false;
  }
}

const SHUTDOWN_HINTS = {
  "": "How this device should be powered off",
  ssh: "Needs a hostname. Password is optional if you mount an SSH key in /config.",
  rpc: "Needs a hostname and a Windows admin account. SMB port 445 must be reachable.",
  sol: "Sends a reversed-MAC magic packet. Install Sleep-on-LAN on the device.",
};

function syncShutdownFields() {
  const method = el.shutdownMethod.value;
  el.shutdownHint.textContent = SHUTDOWN_HINTS[method] || SHUTDOWN_HINTS[""];
  el.shutdownAuth.hidden = method !== "ssh" && method !== "rpc";
  el.shutdownCommandField.hidden = method !== "ssh";
}

let renderTimer = null;
function renderDevicesSoon() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => refreshStatus(), 2000);
}

function openDialog(device) {
  editingId = device ? device.id : null;
  el.dialogTitle.textContent = device ? "Edit device" : "Add device";
  el.dialogError.hidden = true;

  const form = el.form;
  form.name.value = device?.name ?? "";
  form.mac.value = device?.mac ?? "";
  form.host.value = device?.host ?? "";
  form.ports.value = (device?.ports ?? []).join(", ");
  form.repeat.value = device?.repeat ?? 3;
  form.broadcast.value = device?.broadcast ?? "";
  form.schedule.value = device?.schedule ?? "";
  form.shutdown_method.value = device?.shutdown_method ?? "";
  form.shutdown_user.value = device?.shutdown_user ?? "";
  form.shutdown_password.value = "";
  form.shutdown_command.value = device?.shutdown_command ?? "";
  form.enabled.checked = device ? device.enabled : true;
  syncShutdownFields();

  el.dialog.showModal();
  form.name.focus();
}

async function saveDevice(event) {
  event.preventDefault();
  const form = el.form;
  const payload = {
    name: form.name.value,
    mac: form.mac.value,
    host: form.host.value,
    ports: form.ports.value,
    repeat: Number(form.repeat.value),
    broadcast: form.broadcast.value,
    schedule: form.schedule.value,
    shutdown_method: form.shutdown_method.value,
    shutdown_user: form.shutdown_user.value,
    shutdown_command: form.shutdown_command.value,
    enabled: form.enabled.checked,
  };
  if (form.shutdown_password.value) {
    payload.shutdown_password = form.shutdown_password.value;
  }

  const button = document.getElementById("dialog-save");
  button.disabled = true;
  try {
    if (editingId) {
      await api(`/api/devices/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await api("/api/devices", { method: "POST", body: JSON.stringify(payload) });
    }
    el.dialog.close();
    await loadDevices();
    snackbar(editingId ? "Device updated" : "Device added", "ok");
  } catch (err) {
    el.dialogError.textContent = err.message;
    el.dialogError.hidden = false;
  } finally {
    button.disabled = false;
  }
}

el.devices.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest(".device-card");
  const device = devices.find((d) => d.id === card.dataset.id);
  if (!device) return;

  if (button.dataset.action === "wake") {
    await wake(device, card);
  } else if (button.dataset.action === "shutdown") {
    if (!confirm(`Shut down ${device.name}?`)) return;
    await shutdown(device, card);
  } else if (button.dataset.action === "edit") {
    openDialog(device);
  } else if (button.dataset.action === "delete") {
    if (!confirm(`Delete ${device.name}?`)) return;
    try {
      await api(`/api/devices/${device.id}`, { method: "DELETE" });
      await loadDevices();
      snackbar("Device deleted", "ok");
    } catch (err) {
      snackbar(err.message, "fail");
    }
  }
});

for (const button of el.themeToggles) {
  button.addEventListener("click", cycleTheme);
}

systemDark.addEventListener("change", () => {
  if ((document.documentElement.dataset.themePreference || "auto") === "auto") {
    applyTheme("auto");
  }
});

if (el.mascot) el.mascot.addEventListener("click", crow);

el.addDevice.addEventListener("click", () => openDialog(null));
el.dialogCancel.addEventListener("click", () => el.dialog.close());
el.shutdownMethod.addEventListener("change", syncShutdownFields);
el.form.addEventListener("submit", saveDevice);
el.refresh.addEventListener("click", loadDevices);

el.logout.addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" }).catch(() => {});
  showLogin();
});

el.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  el.loginError.hidden = true;
  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ password: el.loginPassword.value }),
    });
    el.loginPassword.value = "";
    showApp();
    await loadDevices();
  } catch (err) {
    el.loginError.textContent = err.message;
    el.loginError.hidden = false;
  }
});

el.quickForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = el.quickForm.querySelector("button");
  button.disabled = true;
  crow();
  try {
    const data = await api("/api/wake", {
      method: "POST",
      body: JSON.stringify({ mac: el.quickMac.value }),
    });
    snackbar(`${data.packets_sent} packets sent to ${data.mac}`, "ok");
  } catch (err) {
    snackbar(err.message, "fail");
  } finally {
    button.disabled = false;
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopPolling();
  } else if (!el.app.hidden) {
    startPolling();
    refreshStatus();
  }
});

(function init() {
  hydrateIcons();
  applyTheme(document.documentElement.dataset.themePreference);

  const boot = readBootstrap();
  if (boot) {
    passwordLogin = Boolean(boot.password_login);
    if (boot.auth_required && !boot.authenticated) {
      showLogin();
      return;
    }
    devices = Array.isArray(boot.devices) ? boot.devices : [];
    showApp();
    renderDevices();
    refreshStatus();
    return;
  }

  void fallbackInit();
})();

function readBootstrap() {
  const node = document.getElementById("bootstrap");
  if (!node) return null;
  try {
    return JSON.parse(node.textContent || "null");
  } catch (err) {
    return null;
  }
}

async function fallbackInit() {
  try {
    const session = await fetch("/api/session").then((r) => r.json());
    passwordLogin = Boolean(session.password_login);
    if (session.auth_required && !session.authenticated) {
      showLogin();
      return;
    }
    showApp();
    await loadDevices();
  } catch (err) {
    showBanner("Could not reach the server.");
  }
}
