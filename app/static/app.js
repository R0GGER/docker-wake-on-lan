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
  folder:
    "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
  expand_more: "M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z",
  drag_indicator:
    "M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  checklist:
    "M22 7h-9v2h9V7zm0 8h-9v2h9v-2zM5.54 11 2 7.46l1.41-1.41 2.12 2.12 4.24-4.24L11.17 5.34 5.54 11zm0 8L2 15.46l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41L5.54 19z",
  close:
    "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  grid_view:
    "M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z",
  view_list:
    "M3 14h4v-4H3v4zm0 5h4v-4H3v4zM3 9h4V5H3v4zm5 5h13v-4H8v4zm0 5h13v-4H8v4zM8 5v4h13V5H8z",
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
  addGroup: document.getElementById("add-group"),
  viewCards: document.getElementById("view-cards"),
  viewList: document.getElementById("view-list"),
  pageEdit: document.getElementById("page-edit"),
  pageSave: document.getElementById("page-save"),
  editCountdown: document.getElementById("edit-countdown"),
  selectMode: document.getElementById("select-mode"),
  selectionBar: document.getElementById("selection-bar"),
  selectionCount: document.getElementById("selection-count"),
  selectionAll: document.getElementById("selection-all"),
  selectionWake: document.getElementById("selection-wake"),
  selectionShutdown: document.getElementById("selection-shutdown"),
  selectionDone: document.getElementById("selection-done"),
  logout: document.getElementById("logout"),
  dialog: document.getElementById("device-dialog"),
  form: document.getElementById("device-form"),
  dialogTitle: document.getElementById("dialog-title"),
  dialogError: document.getElementById("dialog-error"),
  dialogCancel: document.getElementById("dialog-cancel"),
  groupField: document.getElementById("group-field"),
  groupSelect: document.getElementById("device-group"),
  groupDialog: document.getElementById("group-dialog"),
  groupForm: document.getElementById("group-form"),
  groupDialogTitle: document.getElementById("group-dialog-title"),
  groupDialogError: document.getElementById("group-dialog-error"),
  groupDialogCancel: document.getElementById("group-dialog-cancel"),
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
let groups = [];
let editingId = null;
let editingGroupId = null;
let timer = null;
let passwordLogin = true;
let dragDeviceId = null;
let dragGroupId = null;
let selecting = false;
const selectedIds = new Set();
let pageEditing = false;
let editRemainingMs = 0;
let editTickAt = 0;
let editBusy = false;
let editTickTimer = null;
let collapsedGroups = readCollapsed();
let deviceView = readView();

const UNGROUPED_KEY = "__ungrouped__";

function readCollapsed() {
  try {
    const raw = JSON.parse(localStorage.getItem("wol-collapsed-groups") || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch (err) {
    return {};
  }
}

function writeCollapsed() {
  try {
    localStorage.setItem("wol-collapsed-groups", JSON.stringify(collapsedGroups));
  } catch (err) {
    /* storage blocked; collapse then lasts for this page view only */
  }
}

function readView() {
  try {
    return localStorage.getItem("wol-view") === "list" ? "list" : "cards";
  } catch (err) {
    return "cards";
  }
}

function writeView(view) {
  try {
    localStorage.setItem("wol-view", view);
  } catch (err) {
    /* storage blocked; the view then lasts for this page view only */
  }
}

function applyView() {
  const list = deviceView === "list";
  el.app.classList.toggle("is-list-view", list);
  if (el.viewCards) el.viewCards.setAttribute("aria-pressed", String(!list));
  if (el.viewList) el.viewList.setAttribute("aria-pressed", String(list));
}

function setView(view) {
  deviceView = view === "list" ? "list" : "cards";
  writeView(deviceView);
  applyView();
}

const EDIT_LOCK_DEFAULT_MS = 300000;
let EDIT_LOCK_MS = EDIT_LOCK_DEFAULT_MS;
const LAYOUT_ACTIONS = new Set([
  "edit",
  "delete",
  "add-to-group",
  "edit-group",
  "delete-group",
]);

function layoutDialogOpen() {
  return Boolean(el.dialog?.open || el.groupDialog?.open);
}

function formatLockCountdown(ms) {
  const secs = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(secs / 60);
  const rest = String(secs % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function applyEditLockSeconds(seconds) {
  const secs = Number(seconds);
  if (!Number.isFinite(secs) || secs < 0) {
    EDIT_LOCK_MS = EDIT_LOCK_DEFAULT_MS;
    return;
  }
  EDIT_LOCK_MS = Math.round(secs) * 1000;
}

function touchEditTimer() {
  if (!pageEditing) return;
  editBusy = true;
  editTickAt = Date.now();
  updateEditCountdown();
}

function applyEditMode() {
  el.app.classList.toggle("is-editing", pageEditing);
  if (el.pageEdit) el.pageEdit.hidden = pageEditing;
  if (el.pageSave) el.pageSave.hidden = !pageEditing;
  if (el.editCountdown) el.editCountdown.hidden = !pageEditing || EDIT_LOCK_MS <= 0;
  for (const card of el.devices.querySelectorAll(".device-card")) {
    const inSection = Boolean(card.closest(".device-section"));
    card.draggable = pageEditing && !selecting && inSection;
  }
}

function startPageEdit() {
  if (selecting) setSelecting(false);
  pageEditing = true;
  editRemainingMs = EDIT_LOCK_MS;
  editTickAt = Date.now();
  if (editTickTimer) clearInterval(editTickTimer);
  editTickTimer = EDIT_LOCK_MS > 0 ? setInterval(updateEditCountdown, 250) : null;
  applyEditMode();
  if (EDIT_LOCK_MS > 0) updateEditCountdown();
}

function lockPage({ auto = false } = {}) {
  if (!pageEditing) return;
  pageEditing = false;
  if (editTickTimer) {
    clearInterval(editTickTimer);
    editTickTimer = null;
  }
  if (el.dialog?.open) el.dialog.close();
  if (el.groupDialog?.open) el.groupDialog.close();
  applyEditMode();
  snackbar(auto ? "Saved and locked" : "Saved", "ok");
}

function updateEditCountdown() {
  if (!pageEditing || !el.editCountdown || EDIT_LOCK_MS <= 0) return;
  const now = Date.now();
  const busy = editBusy || layoutDialogOpen();
  if (busy) {
    editTickAt = now;
    editBusy = false;
  } else {
    editRemainingMs -= now - editTickAt;
    editTickAt = now;
  }
  if (editRemainingMs <= 0) {
    lockPage({ auto: true });
    return;
  }
  el.editCountdown.textContent = layoutDialogOpen()
    ? "Auto-lock paused"
    : `Auto-lock in ${formatLockCountdown(editRemainingMs)}`;
}

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

function deviceGroupId(device) {
  const gid = device?.group_id || "";
  return gid && groups.some((group) => group.id === gid) ? gid : "";
}

function devicesInGroup(groupId) {
  return devices.filter((device) => deviceGroupId(device) === groupId);
}

function collapseKey(groupId) {
  return groupId || UNGROUPED_KEY;
}

function isCollapsed(groupId) {
  return Boolean(collapsedGroups[collapseKey(groupId)]);
}

function setCollapsed(groupId, collapsed) {
  const key = collapseKey(groupId);
  if (collapsed) collapsedGroups[key] = true;
  else delete collapsedGroups[key];
  writeCollapsed();
}

function fillGroupSelect(selected) {
  if (!el.groupSelect || !el.groupField) return;
  el.groupField.hidden = groups.length === 0;
  el.groupSelect.replaceChildren();
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "Ungrouped";
  el.groupSelect.append(none);
  for (const group of groups) {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.name;
    el.groupSelect.append(option);
  }
  el.groupSelect.value = selected || "";
}

function createCard(device, { draggable = false } = {}) {
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
      <label class="device-check">
        <input type="checkbox" data-role="select">
        <span class="check-box">${icon("check", 16)}</span>
      </label>
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
      <button class="btn filled has-icon" data-action="wake" aria-label="Wake">
        <span class="btn-icon">${icon("bolt", 18)}</span>
        <span class="btn-label">Wake</span>
      </button>
      <button class="btn tonal danger has-icon" data-action="shutdown"${
        shutdownDisabled ? " disabled" : ""
      } title="${escapeHtml(shutdownTitle)}" aria-label="${escapeHtml(shutdownTitle)}">
        <span class="btn-icon">${icon("power", 18)}</span>
        <span class="btn-label">Shutdown</span>
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

  if (draggable) {
    card.draggable = true;
    card.addEventListener("dragstart", (event) => {
      if (!pageEditing || selecting || event.target.closest("button, label")) {
        event.preventDefault();
        return;
      }
      dragDeviceId = device.id;
      dragGroupId = null;
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", device.id);
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      dragDeviceId = null;
      clearDropTargets();
    });
  }

  return card;
}

function createSection(groupId, name, sectionDevices, { managed }) {
  const section = document.createElement("section");
  section.className = "device-section";
  section.dataset.groupId = groupId;
  const collapsed = isCollapsed(groupId);
  if (collapsed) section.classList.add("is-collapsed");

  const canShutdown = sectionDevices.some((device) => device.can_shutdown);
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    ${
      managed
        ? `<span class="section-drag" draggable="true" title="Reorder group" aria-label="Reorder group">${icon("drag_indicator", 20)}</span>`
        : ""
    }
    <button type="button" class="icon-btn section-toggle" data-action="toggle" aria-expanded="${!collapsed}" aria-label="${collapsed ? "Expand" : "Collapse"}">
      ${icon("expand_more", 20)}
    </button>
    <label class="section-check" title="Select group">
      <input type="checkbox" data-action="select-group">
      <span class="check-box">${icon("check", 16)}</span>
    </label>
    <h2 class="title-medium section-title">${escapeHtml(name)}</h2>
    <span class="body-small on-surface-variant section-count">${sectionDevices.length}</span>
    <div class="section-actions">
      <button type="button" class="btn tonal has-icon" data-action="wake-group"${
        sectionDevices.length ? "" : " disabled"
      }>
        <span class="btn-icon">${icon("bolt", 18)}</span> Wake
      </button>
      <button type="button" class="btn tonal danger has-icon" data-action="shutdown-group"${
        canShutdown ? "" : " disabled"
      }>
        <span class="btn-icon">${icon("power", 18)}</span> Shutdown
      </button>
      ${
        managed
          ? `<button type="button" class="icon-btn" data-action="add-to-group" aria-label="Add device" title="Add device">${icon("add", 20)}</button>
        <button type="button" class="icon-btn" data-action="edit-group" aria-label="Rename group" title="Rename">${icon("edit", 20)}</button>
        <button type="button" class="icon-btn danger" data-action="delete-group" aria-label="Delete group" title="Delete">${icon("delete", 20)}</button>`
          : ""
      }
    </div>
  `;

  const handle = header.querySelector(".section-drag");
  if (handle) {
    handle.addEventListener("dragstart", (event) => {
      if (!pageEditing || selecting) {
        event.preventDefault();
        return;
      }
      dragGroupId = groupId;
      dragDeviceId = null;
      section.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", groupId);
    });
    handle.addEventListener("dragend", () => {
      section.classList.remove("is-dragging");
      dragGroupId = null;
      clearDropTargets();
    });
  }

  const grid = document.createElement("div");
  grid.className = "device-grid";
  grid.hidden = collapsed;
  if (!sectionDevices.length) grid.classList.add("is-empty");
  for (const device of sectionDevices) {
    grid.append(createCard(device, { draggable: true }));
  }

  section.append(header, grid);
  return section;
}

function renderDevices() {
  el.devices.replaceChildren();
  const hasGroups = groups.length > 0;
  el.empty.hidden = devices.length > 0 || hasGroups;
  el.devices.className = hasGroups ? "device-list" : "device-grid";

  if (!hasGroups) {
    for (const device of devices) {
      el.devices.append(createCard(device));
    }
    applySelection();
    applyEditMode();
    return;
  }

  for (const group of groups) {
    el.devices.append(
      createSection(group.id, group.name, devicesInGroup(group.id), { managed: true })
    );
  }
  const ungrouped = devicesInGroup("");
  if (ungrouped.length) {
    el.devices.append(createSection("", "Ungrouped", ungrouped, { managed: false }));
  }
  applySelection();
  applyEditMode();
}

function selectedDevices() {
  return devices.filter((device) => selectedIds.has(device.id));
}

function setSelecting(on) {
  selecting = Boolean(on) && devices.length > 0;
  if (!selecting) selectedIds.clear();
  el.app.classList.toggle("is-selecting", selecting);
  if (el.selectMode) {
    el.selectMode.setAttribute("aria-pressed", String(selecting));
    el.selectMode.classList.toggle("filled", selecting);
    el.selectMode.classList.toggle("tonal", !selecting);
    el.selectMode.disabled = devices.length === 0;
  }
  applySelection();
  applyEditMode();
}

function toggleSelect(deviceId, force) {
  if (force === true) selectedIds.add(deviceId);
  else if (force === false) selectedIds.delete(deviceId);
  else if (selectedIds.has(deviceId)) selectedIds.delete(deviceId);
  else selectedIds.add(deviceId);
  applySelection();
}

function applySelection() {
  const known = new Set(devices.map((device) => device.id));
  for (const id of [...selectedIds]) {
    if (!known.has(id)) selectedIds.delete(id);
  }
  if (selecting && devices.length === 0) {
    selecting = false;
    selectedIds.clear();
  }
  el.app.classList.toggle("is-selecting", selecting);
  if (el.selectMode) {
    el.selectMode.setAttribute("aria-pressed", String(selecting));
    el.selectMode.classList.toggle("filled", selecting);
    el.selectMode.classList.toggle("tonal", !selecting);
    el.selectMode.disabled = devices.length === 0;
  }

  for (const card of el.devices.querySelectorAll(".device-card")) {
    const on = selectedIds.has(card.dataset.id);
    card.classList.toggle("is-selected", on);
    const input = card.querySelector('input[data-role="select"]');
    if (input) input.checked = on;
  }

  for (const section of el.devices.querySelectorAll(".device-section")) {
    const members = devicesInGroup(section.dataset.groupId || "");
    const input = section.querySelector('input[data-action="select-group"]');
    if (!input) continue;
    const count = members.filter((device) => selectedIds.has(device.id)).length;
    input.checked = members.length > 0 && count === members.length;
    input.indeterminate = count > 0 && count < members.length;
  }

  const chosen = selectedDevices();
  if (el.selectionBar) el.selectionBar.hidden = !selecting;
  if (el.selectionCount) {
    const n = chosen.length;
    el.selectionCount.textContent = `${n} selected`;
  }
  if (el.selectionWake) el.selectionWake.disabled = chosen.length === 0;
  if (el.selectionShutdown) {
    el.selectionShutdown.disabled = !chosen.some((device) => device.can_shutdown);
  }
  if (el.selectionAll) {
    const allOn = devices.length > 0 && chosen.length === devices.length;
    el.selectionAll.textContent = allOn ? "Clear all" : "Select all";
  }
}

async function wakeMany(list) {
  let woke = 0;
  for (const device of list) {
    try {
      await api(`/api/devices/${device.id}/wake`, { method: "POST", body: "{}" });
      woke += 1;
    } catch (err) {
      /* keep going so the rest of the selection still wakes */
    }
  }
  snackbar(`Woke ${woke} ${woke === 1 ? "device" : "devices"}`, "ok");
  crow();
  await refreshStatus();
}

async function shutdownMany(list) {
  let shut = 0;
  let skipped = 0;
  for (const device of list) {
    if (!device.can_shutdown) {
      skipped += 1;
      continue;
    }
    try {
      await api(`/api/devices/${device.id}/shutdown`, { method: "POST", body: "{}" });
      shut += 1;
    } catch (err) {
      /* keep going so the rest of the selection still shuts down */
    }
  }
  const parts = [`Shut down ${shut}`];
  if (skipped) parts.push(`skipped ${skipped}`);
  snackbar(parts.join(", "), "ok");
  doze();
  await refreshStatus();
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
    groups = Array.isArray(data.groups) ? data.groups : [];
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

function openDialog(device, options = {}) {
  if (!pageEditing) return;
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
  fillGroupSelect(device ? deviceGroupId(device) : options.groupId || "");
  syncShutdownFields();

  el.dialog.showModal();
  form.name.focus();
}

function openGroupDialog(group) {
  if (!pageEditing) return;
  editingGroupId = group ? group.id : null;
  el.groupDialogTitle.textContent = group ? "Rename group" : "Add group";
  el.groupDialogError.hidden = true;
  el.groupForm.name.value = group?.name ?? "";
  el.groupDialog.showModal();
  el.groupForm.name.focus();
}

async function saveGroup(event) {
  event.preventDefault();
  const payload = { name: el.groupForm.name.value };
  const button = document.getElementById("group-dialog-save");
  button.disabled = true;
  try {
    if (editingGroupId) {
      await api(`/api/groups/${editingGroupId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await api("/api/groups", { method: "POST", body: JSON.stringify(payload) });
    }
    el.groupDialog.close();
    await loadDevices();
    touchEditTimer();
    snackbar(editingGroupId ? "Group updated" : "Group added", "ok");
  } catch (err) {
    el.groupDialogError.textContent = err.message;
    el.groupDialogError.hidden = false;
  } finally {
    button.disabled = false;
  }
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
    group_id: form.group_id ? form.group_id.value : "",
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
    touchEditTimer();
    snackbar(editingId ? "Device updated" : "Device added", "ok");
  } catch (err) {
    el.dialogError.textContent = err.message;
    el.dialogError.hidden = false;
  } finally {
    button.disabled = false;
  }
}

function clearDropTargets() {
  for (const node of el.devices.querySelectorAll(".is-drop-target")) {
    node.classList.remove("is-drop-target");
  }
}

function dropIndex(grid, event) {
  const cards = [...grid.querySelectorAll(".device-card")];
  const overCard = event.target.closest(".device-card");
  if (!overCard || !cards.includes(overCard)) return cards.length;
  let index = cards.indexOf(overCard);
  const rect = overCard.getBoundingClientRect();
  const pastMid =
    deviceView === "list"
      ? event.clientY > rect.top + rect.height / 2
      : event.clientX > rect.left + rect.width / 2;
  if (pastMid) index += 1;
  return index;
}

async function moveDraggedDevice(section, event) {
  const deviceId = dragDeviceId;
  if (!deviceId) return;
  const groupId = section.dataset.groupId || "";
  const grid = section.querySelector(".device-grid");
  let index = dropIndex(grid, event);
  const device = devices.find((item) => item.id === deviceId);
  if (device && deviceGroupId(device) === groupId) {
    const fromIndex = devicesInGroup(groupId).findIndex((item) => item.id === deviceId);
    if (fromIndex !== -1 && fromIndex < index) index -= 1;
  }
  try {
    await api(`/api/devices/${deviceId}/move`, {
      method: "PUT",
      body: JSON.stringify({ group_id: groupId, index }),
    });
    await loadDevices();
    touchEditTimer();
  } catch (err) {
    snackbar(err.message, "fail");
  }
}

async function reorderDraggedGroup(section) {
  const sourceId = dragGroupId;
  const targetId = section.dataset.groupId || "";
  if (!sourceId || !targetId || sourceId === targetId) return;
  const ids = groups.map((group) => group.id);
  const from = ids.indexOf(sourceId);
  const to = ids.indexOf(targetId);
  if (from === -1 || to === -1) return;
  ids.splice(from, 1);
  ids.splice(to, 0, sourceId);
  try {
    await api("/api/groups/reorder", {
      method: "PUT",
      body: JSON.stringify({ ids }),
    });
    await loadDevices();
    touchEditTimer();
  } catch (err) {
    snackbar(err.message, "fail");
  }
}

async function wakeGroup(groupId, sectionDevices) {
  try {
    if (groupId) {
      const data = await api(`/api/groups/${groupId}/wake`, { method: "POST" });
      const label = data.woke === 1 ? "device" : "devices";
      snackbar(`Woke ${data.woke} ${label}`, data.failed ? "fail" : "ok");
    } else {
      let woke = 0;
      for (const device of sectionDevices) {
        try {
          await api(`/api/devices/${device.id}/wake`, { method: "POST", body: "{}" });
          woke += 1;
        } catch (err) {
          /* keep going so the rest of the group still wakes */
        }
      }
      snackbar(`Woke ${woke} ${woke === 1 ? "device" : "devices"}`, "ok");
    }
    crow();
    await refreshStatus();
  } catch (err) {
    snackbar(err.message, "fail");
  }
}

async function shutdownGroup(groupId, sectionDevices) {
  try {
    if (groupId) {
      const data = await api(`/api/groups/${groupId}/shutdown`, { method: "POST" });
      const parts = [`Shut down ${data.shut_down}`];
      if (data.skipped) parts.push(`skipped ${data.skipped}`);
      snackbar(parts.join(", "), data.failed ? "fail" : "ok");
    } else {
      let shut = 0;
      let skipped = 0;
      for (const device of sectionDevices) {
        if (!device.can_shutdown) {
          skipped += 1;
          continue;
        }
        try {
          await api(`/api/devices/${device.id}/shutdown`, { method: "POST", body: "{}" });
          shut += 1;
        } catch (err) {
          /* keep going so the rest of the group still shuts down */
        }
      }
      const parts = [`Shut down ${shut}`];
      if (skipped) parts.push(`skipped ${skipped}`);
      snackbar(parts.join(", "), "ok");
    }
    doze();
    await refreshStatus();
  } catch (err) {
    snackbar(err.message, "fail");
  }
}

el.devices.addEventListener("change", (event) => {
  const deviceInput = event.target.closest('input[data-role="select"]');
  if (deviceInput) {
    const card = deviceInput.closest(".device-card");
    if (card) toggleSelect(card.dataset.id, deviceInput.checked);
    return;
  }
  const groupInput = event.target.closest('input[data-action="select-group"]');
  if (!groupInput) return;
  const section = groupInput.closest(".device-section");
  if (!section) return;
  for (const device of devicesInGroup(section.dataset.groupId || "")) {
    if (groupInput.checked) selectedIds.add(device.id);
    else selectedIds.delete(device.id);
  }
  applySelection();
});

el.devices.addEventListener("click", async (event) => {
  if (selecting) {
    const interactive = event.target.closest("button, input, a, label");
    const card = event.target.closest(".device-card");
    if (card && !interactive) {
      toggleSelect(card.dataset.id);
      return;
    }
  }

  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (LAYOUT_ACTIONS.has(action) && !pageEditing) return;
  const section = button.closest(".device-section");
  const card = button.closest(".device-card");

  if (action === "toggle" && section) {
    const groupId = section.dataset.groupId || "";
    const next = !isCollapsed(groupId);
    setCollapsed(groupId, next);
    section.classList.toggle("is-collapsed", next);
    const grid = section.querySelector(".device-grid");
    if (grid) grid.hidden = next;
    button.setAttribute("aria-expanded", String(!next));
    button.setAttribute("aria-label", next ? "Expand" : "Collapse");
    return;
  }

  if (action === "wake-group" && section) {
    const groupId = section.dataset.groupId || "";
    await wakeGroup(groupId, devicesInGroup(groupId));
    return;
  }

  if (action === "shutdown-group" && section) {
    const groupId = section.dataset.groupId || "";
    await shutdownGroup(groupId, devicesInGroup(groupId));
    return;
  }

  if (action === "add-to-group" && section) {
    openDialog(null, { groupId: section.dataset.groupId || "" });
    return;
  }

  if (action === "edit-group" && section) {
    const group = groups.find((item) => item.id === section.dataset.groupId);
    if (group) openGroupDialog(group);
    return;
  }

  if (action === "delete-group" && section) {
    const group = groups.find((item) => item.id === section.dataset.groupId);
    if (!group) return;
    if (!confirm(`Delete group "${group.name}"? Devices will become ungrouped.`)) return;
    try {
      await api(`/api/groups/${group.id}`, { method: "DELETE" });
      await loadDevices();
      touchEditTimer();
      snackbar("Group deleted", "ok");
    } catch (err) {
      snackbar(err.message, "fail");
    }
    return;
  }

  if (!card) return;
  const device = devices.find((item) => item.id === card.dataset.id);
  if (!device) return;

  if (action === "wake") {
    await wake(device, card);
  } else if (action === "shutdown") {
    if (!confirm(`Shut down ${device.name}?`)) return;
    await shutdown(device, card);
  } else if (action === "edit") {
    openDialog(device);
  } else if (action === "delete") {
    if (!confirm(`Delete ${device.name}?`)) return;
    try {
      await api(`/api/devices/${device.id}`, { method: "DELETE" });
      await loadDevices();
      touchEditTimer();
      snackbar("Device deleted", "ok");
    } catch (err) {
      snackbar(err.message, "fail");
    }
  }
});

el.devices.addEventListener("dragover", (event) => {
  if (!pageEditing || selecting) return;
  const section = event.target.closest(".device-section");
  if (!section || (!dragDeviceId && !dragGroupId)) return;
  if (dragGroupId && !section.dataset.groupId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  clearDropTargets();
  section.classList.add("is-drop-target");
  touchEditTimer();
});

el.devices.addEventListener("dragleave", (event) => {
  const section = event.target.closest(".device-section");
  if (!section || section.contains(event.relatedTarget)) return;
  section.classList.remove("is-drop-target");
});

el.devices.addEventListener("drop", async (event) => {
  if (!pageEditing) return;
  const section = event.target.closest(".device-section");
  if (!section) return;
  event.preventDefault();
  clearDropTargets();
  if (dragGroupId) {
    await reorderDraggedGroup(section);
    dragGroupId = null;
    return;
  }
  if (dragDeviceId) {
    await moveDraggedDevice(section, event);
    dragDeviceId = null;
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

el.addDevice.addEventListener("click", () => {
  if (!pageEditing) return;
  openDialog(null);
});
el.addGroup.addEventListener("click", () => {
  if (!pageEditing) return;
  openGroupDialog(null);
});
el.pageEdit.addEventListener("click", () => startPageEdit());
el.pageSave.addEventListener("click", () => lockPage());

function noteEditActivity(event) {
  if (!pageEditing) return;
  if (event?.target?.closest?.("#page-save")) return;
  touchEditTimer();
}

el.app.addEventListener("pointerdown", noteEditActivity);
el.app.addEventListener("keydown", noteEditActivity);
el.app.addEventListener("input", noteEditActivity);
el.dialog.addEventListener("pointerdown", noteEditActivity);
el.dialog.addEventListener("keydown", noteEditActivity);
el.dialog.addEventListener("input", noteEditActivity);
el.groupDialog.addEventListener("pointerdown", noteEditActivity);
el.groupDialog.addEventListener("keydown", noteEditActivity);
el.groupDialog.addEventListener("input", noteEditActivity);
el.viewCards?.addEventListener("click", () => setView("cards"));
el.viewList?.addEventListener("click", () => setView("list"));
el.selectMode.addEventListener("click", () => setSelecting(!selecting));
el.selectionDone.addEventListener("click", () => setSelecting(false));
el.selectionAll.addEventListener("click", () => {
  const allOn = devices.length > 0 && selectedDevices().length === devices.length;
  for (const device of devices) {
    if (allOn) selectedIds.delete(device.id);
    else selectedIds.add(device.id);
  }
  applySelection();
});
el.selectionWake.addEventListener("click", async () => {
  const list = selectedDevices();
  if (!list.length) return;
  el.selectionWake.disabled = true;
  try {
    await wakeMany(list);
  } finally {
    applySelection();
  }
});
el.selectionShutdown.addEventListener("click", async () => {
  const list = selectedDevices();
  if (!list.length) return;
  el.selectionShutdown.disabled = true;
  try {
    await shutdownMany(list);
  } finally {
    applySelection();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && selecting) setSelecting(false);
});
el.dialogCancel.addEventListener("click", () => el.dialog.close());
el.groupDialogCancel.addEventListener("click", () => el.groupDialog.close());
el.groupForm.addEventListener("submit", saveGroup);
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
  applyView();
  applyTheme(document.documentElement.dataset.themePreference);

  const boot = readBootstrap();
  if (boot) {
    passwordLogin = Boolean(boot.password_login);
    if (boot.auth_required && !boot.authenticated) {
      showLogin();
      return;
    }
    devices = Array.isArray(boot.devices) ? boot.devices : [];
    groups = Array.isArray(boot.groups) ? boot.groups : [];
    applyEditLockSeconds(boot.edit_lock);
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
    applyEditLockSeconds(session.edit_lock);
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
