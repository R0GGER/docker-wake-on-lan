/* API and webhook generator. Standalone page: it shares the stylesheet with the
   device interface but none of its code, so app.js stays untouched. */

// Material Symbols path data, inlined so the page needs no icon font.
const ICONS = {
  api: "M14 12l-2 2-2-2 2-2 2 2zm-2-6l2.12 2.12 2.5-2.5L12 1 6.88 6.12l2.5 2.5L12 6zm-6 6l2.12-2.12-2.5-2.5L1 12l5.12 5.12 2.5-2.5L6 12zm12 0l-2.12 2.12 2.5 2.5L23 12l-5.12-5.12-2.5 2.5L18 12zm-6 6l-2.12-2.12-2.5 2.5L12 23l5.12-5.12-2.5-2.5L12 18z",
  arrow_back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  refresh:
    "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-8 8s3.57 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
  send: "M2.01 21 23 12 2.01 3 2 10l15 2-15 2z",
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  error:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
  bolt: "M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z",
  visibility:
    "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  visibility_off:
    "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zm5.53 5.53 1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z",
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

const STORAGE = {
  base: "wol-api-base",
  key: "wol-api-key",
  remember: "wol-api-remember",
  keyInUrl: "wol-api-key-in-url",
  endpoint: "wol-api-endpoint",
  format: "wol-api-format",
};

const DEVICE_TEMPLATE = {
  name: "Office PC",
  mac: "11:22:33:44:55:66",
  host: "192.168.1.20",
  ports: [22, 3389],
  broadcast: "",
  repeat: 3,
  schedule: "",
  enabled: true,
};

// Every endpoint the REST API exposes. The wake link comes first because it is
// the one people want as a webhook: a single GET with the key in the URL.
const ENDPOINTS = [
  {
    id: "wake-link",
    group: "Webhook",
    label: "Wake link — a URL anything can call",
    method: "GET",
    path: "/api/devices/{id}/wake",
    needs: "device",
    keyInUrl: true,
    hint:
      "One GET, no headers, key in the URL. Bookmark it, put it behind a button, or paste it " +
      "into any system that can call a URL. A browser session is never accepted here.",
  },
  {
    id: "list-devices",
    group: "Devices",
    label: "List devices",
    method: "GET",
    path: "/api/devices",
    hint: "All devices including online status, plus the groups.",
    params: [
      {
        name: "probe",
        kind: "bool",
        in: "query",
        label: "Probe status now",
        value: true,
        help: "Off returns the cached status and is cheaper to poll.",
      },
    ],
  },
  {
    id: "status",
    group: "Devices",
    label: "Status only",
    method: "GET",
    path: "/api/status",
    hint: "Just id, name and status per device. Cheap to poll.",
  },
  {
    id: "wake",
    group: "Devices",
    label: "Wake a device",
    method: "POST",
    path: "/api/devices/{id}/wake",
    needs: "device",
    params: [
      {
        name: "wait",
        kind: "bool",
        in: "body",
        label: "Wait until it responds",
        value: false,
        help: "Only works when the device has a hostname or IP.",
      },
      {
        name: "timeout",
        kind: "number",
        in: "body",
        label: "Timeout (seconds)",
        value: 60,
        dependsOn: "wait",
        min: 1,
        max: 300,
      },
    ],
  },
  {
    id: "shutdown",
    group: "Devices",
    label: "Shut down a device",
    method: "POST",
    path: "/api/devices/{id}/shutdown",
    needs: "device",
    danger: true,
    hint: "Needs a shutdown method configured on the device.",
    params: [
      {
        name: "wait",
        kind: "bool",
        in: "body",
        label: "Wait until it goes offline",
        value: false,
      },
      {
        name: "timeout",
        kind: "number",
        in: "body",
        label: "Timeout (seconds)",
        value: 60,
        dependsOn: "wait",
        min: 1,
        max: 300,
      },
    ],
  },
  {
    id: "wake-mac",
    group: "Devices",
    label: "Wake a MAC without saving it",
    method: "POST",
    path: "/api/wake",
    params: [
      { name: "mac", kind: "text", in: "body", label: "MAC address", value: "", required: true },
      {
        name: "broadcast",
        kind: "text",
        in: "body",
        label: "Broadcast address",
        value: "",
        help: "Optional, e.g. 192.168.1.255",
      },
      { name: "repeat", kind: "number", in: "body", label: "Repeat packets", value: 3, min: 1, max: 20 },
    ],
  },
  {
    id: "create-device",
    group: "Devices",
    label: "Add a device",
    method: "POST",
    path: "/api/devices",
    mutates: true,
    params: [{ name: "__json", kind: "json", label: "JSON body", value: DEVICE_TEMPLATE }],
  },
  {
    id: "update-device",
    group: "Devices",
    label: "Update a device",
    method: "PUT",
    path: "/api/devices/{id}",
    needs: "device",
    mutates: true,
    hint: "Only the fields you send change; leave shutdown_password out to keep it.",
    params: [{ name: "__json", kind: "json", label: "JSON body", value: { name: "Office PC" } }],
  },
  {
    id: "move-device",
    group: "Devices",
    label: "Move a device to a group",
    method: "PUT",
    path: "/api/devices/{id}/move",
    needs: "device",
    mutates: true,
    params: [
      { name: "group_id", kind: "group", in: "body", label: "Target group", value: "", always: true },
      {
        name: "index",
        kind: "number",
        in: "body",
        label: "Position in the group",
        value: "",
        help: "Optional, 0 puts it first.",
      },
    ],
  },
  {
    id: "delete-device",
    group: "Devices",
    label: "Delete a device",
    method: "DELETE",
    path: "/api/devices/{id}",
    needs: "device",
    danger: true,
    mutates: true,
  },
  {
    id: "list-groups",
    group: "Groups",
    label: "List groups",
    method: "GET",
    path: "/api/groups",
  },
  {
    id: "create-group",
    group: "Groups",
    label: "Add a group",
    method: "POST",
    path: "/api/groups",
    mutates: true,
    params: [{ name: "name", kind: "text", in: "body", label: "Group name", value: "", required: true }],
  },
  {
    id: "rename-group",
    group: "Groups",
    label: "Rename a group",
    method: "PUT",
    path: "/api/groups/{id}",
    needs: "group",
    mutates: true,
    params: [{ name: "name", kind: "text", in: "body", label: "New name", value: "", required: true }],
  },
  {
    id: "reorder-groups",
    group: "Groups",
    label: "Reorder groups",
    method: "PUT",
    path: "/api/groups/reorder",
    mutates: true,
    hint: "Send every group id in the order you want them.",
    params: [{ name: "__json", kind: "json", label: "JSON body", value: { ids: [] } }],
  },
  {
    id: "delete-group",
    group: "Groups",
    label: "Delete a group",
    method: "DELETE",
    path: "/api/groups/{id}",
    needs: "group",
    danger: true,
    mutates: true,
    hint: "Devices in the group become ungrouped; they are not deleted.",
  },
  {
    id: "wake-group",
    group: "Groups",
    label: "Wake a whole group",
    method: "POST",
    path: "/api/groups/{id}/wake",
    needs: "group",
  },
  {
    id: "shutdown-group",
    group: "Groups",
    label: "Shut down a whole group",
    method: "POST",
    path: "/api/groups/{id}/shutdown",
    needs: "group",
    danger: true,
    hint: "Devices without a shutdown method are skipped.",
  },
  {
    id: "session",
    group: "Other",
    label: "Session info",
    method: "GET",
    path: "/api/session",
    noAuth: true,
    hint: "Whether a login is required and whether this browser is signed in.",
  },
  {
    id: "healthz",
    group: "Other",
    label: "Health check",
    method: "GET",
    path: "/healthz",
    noAuth: true,
    hint: "Open endpoint, no authentication at all. Handy for uptime monitors.",
  },
];

const el = {
  banner: document.getElementById("banner"),
  bannerText: document.getElementById("banner-text"),
  baseUrl: document.getElementById("base-url"),
  apiKey: document.getElementById("api-key"),
  toggleKey: document.getElementById("toggle-key"),
  keyInUrl: document.getElementById("key-in-url"),
  rememberKey: document.getElementById("remember-key"),
  reload: document.getElementById("reload-devices"),
  endpoint: document.getElementById("endpoint"),
  endpointHint: document.getElementById("endpoint-hint"),
  params: document.getElementById("params"),
  send: document.getElementById("send"),
  responseEmpty: document.getElementById("response-empty"),
  response: document.getElementById("response"),
  responseStatus: document.getElementById("response-status"),
  responseMeta: document.getElementById("response-meta"),
  responseBody: document.getElementById("response-body"),
  responseHeaders: document.getElementById("response-headers"),
  tabs: document.getElementById("format-tabs"),
  formatHint: document.getElementById("format-hint"),
  output: document.getElementById("output"),
  confirmDialog: document.getElementById("confirm-dialog"),
  confirmForm: document.getElementById("confirm-form"),
  confirmText: document.getElementById("confirm-text"),
  confirmCancel: document.getElementById("confirm-cancel"),
  snackbars: document.getElementById("snackbar-host"),
  themeToggle: document.getElementById("theme-toggle"),
  themeColor: document.getElementById("theme-color"),
};

let devices = [];
let groups = [];
let values = {};
let format = "url";
let sending = false;
let loading = true;
let authRequired = true;
let keyInUrlChoice = false;

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

function store(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (err) {
    /* storage blocked; settings then last for this page view only */
  }
}

function stored(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

/* Theme, mirroring the behaviour of the main interface. */
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(preference) {
  const root = document.documentElement;
  const pref = THEMES.includes(preference) ? preference : "auto";
  const dark = pref === "dark" || (pref === "auto" && systemDark.matches);

  root.dataset.themePreference = pref;
  root.dataset.theme = dark ? "dark" : "light";

  const meta = THEME_META[pref];
  el.themeToggle.replaceChildren();
  el.themeToggle.insertAdjacentHTML("afterbegin", icon(meta.icon, 20));
  el.themeToggle.title = `${meta.label} (click to change)`;
  el.themeToggle.setAttribute("aria-label", meta.label);

  const bar = getComputedStyle(root).getPropertyValue("--md-bar").trim();
  if (bar) el.themeColor.setAttribute("content", bar);
}

function cycleTheme() {
  const current = document.documentElement.dataset.themePreference || "auto";
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  store("wol-theme", next);
  applyTheme(next);
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (err) {
    /* HTTP LAN pages are not a secure context; fall back to execCommand */
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.append(field);
  field.select();
  const ok = document.execCommand("copy");
  field.remove();
  if (!ok) throw new Error("Could not copy");
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

function showBanner(message) {
  el.bannerText.textContent = message;
  el.banner.hidden = false;
}

function hideBanner() {
  el.banner.hidden = true;
}

/* Request building */

function currentEndpoint() {
  return ENDPOINTS.find((item) => item.id === el.endpoint.value) || ENDPOINTS[0];
}

function baseUrl() {
  const raw = el.baseUrl.value.trim() || window.location.origin;
  return raw.replace(/\/+$/, "");
}

function apiKey() {
  return el.apiKey.value.trim();
}

function activeParams(endpoint) {
  return (endpoint.params || []).filter(
    (param) => !param.dependsOn || values[param.dependsOn] === true
  );
}

function paramValue(param) {
  const value = values[param.name];
  if (param.kind === "number") {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  if (param.kind === "bool") return value === true;
  return value === undefined || value === null ? "" : String(value);
}

/* One request object feeds both the tester and every snippet, so what you copy
   is exactly what you sent. */
function buildRequest() {
  const endpoint = currentEndpoint();
  const errors = [];
  const key = apiKey();
  let path = endpoint.path;

  if (endpoint.needs) {
    const id = String(values.__target || "").trim();
    if (!id) errors.push(`Pick a ${endpoint.needs} first`);
    path = path.replace("{id}", encodeURIComponent(id || `<${endpoint.needs}-id>`));
  }

  const query = [];
  const body = {};
  let bodyText = "";

  for (const param of activeParams(endpoint)) {
    if (param.kind === "json") {
      const raw = String(values[param.name] ?? "").trim();
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          errors.push("The JSON body must be an object");
        } else {
          Object.assign(body, parsed);
        }
      } catch (err) {
        errors.push("The JSON body is not valid JSON");
      }
      continue;
    }

    const value = paramValue(param);
    if (param.required && (value === "" || value === null)) {
      errors.push(`${param.label} is required`);
    }
    if (param.kind === "bool") {
      // Booleans match the server default when untouched, so only send the change.
      if (value === param.value) continue;
      if (param.in === "query") query.push([param.name, value ? "1" : "0"]);
      else body[param.name] = value;
      continue;
    }
    if (value === "" || value === null) {
      if (!param.always) continue;
    }
    if (param.in === "query") query.push([param.name, String(value ?? "")]);
    else body[param.name] = value === null ? "" : value;
  }

  // The wake link only accepts a key in the URL; for the rest it is a choice,
  // because plenty of webhook senders cannot set a header.
  const needsKey = !endpoint.noAuth;
  const keyInUrl = needsKey && (endpoint.keyInUrl || el.keyInUrl.checked);
  if (keyInUrl) {
    if (key) query.push(["key", key]);
    else if (endpoint.keyInUrl) errors.push("This link needs an API key");
  }

  const headers = {};
  const hasBody = Object.keys(body).length > 0;
  if (hasBody) {
    bodyText = JSON.stringify(body, null, 2);
    headers["Content-Type"] = "application/json";
  }
  if (needsKey && !keyInUrl && key) headers["X-API-Key"] = key;

  const search = query.length
    ? `?${query.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}`
    : "";

  return {
    endpoint,
    keyInUrl,
    method: endpoint.method,
    url: `${baseUrl()}${path}${search}`,
    target: `${path}${search}`,
    headers,
    body: hasBody ? body : null,
    bodyText,
    valid: errors.length === 0,
    errors,
  };
}

function sameOrigin(url) {
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch (err) {
    return false;
  }
}

/* Output formats */

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function slug(text) {
  return (
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "wol_call"
  );
}

function targetName() {
  const id = String(values.__target || "");
  const match =
    devices.find((device) => device.id === id) || groups.find((group) => group.id === id);
  return match ? match.name : "";
}

function commandName(req) {
  // "Wake link (key in the URL)" reads better as wake_link_office_pc.
  const label = req.endpoint.label.replace(/\s*\([^)]*\)/g, "");
  return slug([label, targetName()].filter(Boolean).join(" "));
}

function asUrl(req) {
  return req.url;
}

function asCurl(req) {
  const lines = [req.method === "GET" ? "curl" : `curl -X ${req.method}`];
  for (const [name, value] of Object.entries(req.headers)) {
    lines.push(`  -H ${shellQuote(`${name}: ${value}`)}`);
  }
  if (req.bodyText) lines.push(`  -d ${shellQuote(JSON.stringify(req.body))}`);
  // A bare GET fits on one line; anything with headers gets continuations.
  if (lines.length === 1) return `curl ${shellQuote(req.url)}`;
  lines.push(`  ${shellQuote(req.url)}`);
  return lines.join(" \\\n");
}

function asHomeAssistant(req) {
  const lines = [];
  if (req.keyInUrl) {
    lines.push("# The key sits in the URL here, so it cannot come from !secret.");
  } else if (req.headers["X-API-Key"]) {
    lines.push("# secrets.yaml:  wol_api_key: your-api-key");
  }
  lines.push("rest_command:");
  lines.push(`  ${commandName(req)}:`);
  lines.push(`    url: ${JSON.stringify(req.url)}`);
  lines.push(`    method: ${req.method.toLowerCase()}`);

  const headers = Object.entries(req.headers).filter(([name]) => name !== "Content-Type");
  if (headers.length) {
    lines.push("    headers:");
    for (const [name, value] of headers) {
      lines.push(`      ${name}: ${name === "X-API-Key" ? "!secret wol_api_key" : JSON.stringify(value)}`);
    }
  }
  if (req.bodyText) {
    lines.push(`    payload: ${JSON.stringify(JSON.stringify(req.body))}`);
    lines.push('    content_type: "application/json"');
  }
  return lines.join("\n");
}

function asFetch(req) {
  const options = [`  method: ${JSON.stringify(req.method)},`];
  const headers = Object.entries(req.headers);
  if (headers.length) {
    options.push("  headers: {");
    for (const [name, value] of headers) {
      options.push(`    ${JSON.stringify(name)}: ${JSON.stringify(value)},`);
    }
    options.push("  },");
  }
  const leansOnSession =
    !req.headers["X-API-Key"] && !req.keyInUrl && !req.endpoint.noAuth;
  if (leansOnSession && sameOrigin(req.url)) {
    options.push('  credentials: "same-origin",');
  }
  if (req.bodyText) {
    options.push(`  body: JSON.stringify(${JSON.stringify(req.body)}),`);
  }
  return [
    `const response = await fetch(${JSON.stringify(req.url)}, {`,
    ...options,
    "});",
    "const data = await response.json();",
    "console.log(response.status, data);",
  ].join("\n");
}

function asPowerShell(req) {
  const lines = [];
  const args = [`-Uri ${psQuote(req.url)}`, `-Method ${req.method.toLowerCase().replace(/^./, (c) => c.toUpperCase())}`];
  const headers = Object.entries(req.headers).filter(([name]) => name !== "Content-Type");

  if (headers.length) {
    lines.push("$headers = @{");
    for (const [name, value] of headers) {
      lines.push(`  ${psQuote(name)} = ${psQuote(value)}`);
    }
    lines.push("}");
    args.push("-Headers $headers");
  }
  if (req.bodyText) {
    lines.push(`$body = ${psQuote(JSON.stringify(req.body))}`);
    args.push('-ContentType "application/json"');
    args.push("-Body $body");
  }
  if (lines.length) lines.push("");
  lines.push(`Invoke-RestMethod ${args.join(" ")}`);
  return lines.join("\n");
}

function asRawHttp(req) {
  let host = "";
  try {
    host = new URL(req.url).host;
  } catch (err) {
    host = "<host>";
  }
  const lines = [`${req.method} ${req.target} HTTP/1.1`, `Host: ${host}`];
  for (const [name, value] of Object.entries(req.headers)) {
    lines.push(`${name}: ${value}`);
  }
  const payload = req.bodyText ? JSON.stringify(req.body) : "";
  if (payload) {
    lines.push(`Content-Length: ${new TextEncoder().encode(payload).length}`);
    lines.push("");
    lines.push(payload);
  } else {
    lines.push("");
  }
  return lines.join("\n");
}

const FORMATS = [
  {
    id: "url",
    label: "URL",
    build: asUrl,
    hint: (req) => {
      if (req.method === "GET" && req.keyInUrl) {
        return "A complete webhook: open it in a browser, bookmark it, or paste it into any system that can call a URL.";
      }
      if (req.method === "GET") return "Open this in a browser or paste it as a webhook.";
      if (req.keyInUrl) return `Webhook URL with the key included. Send it with ${req.method}; no headers needed.`;
      return `Send this with ${req.method}; the key goes in the X-API-Key header.`;
    },
  },
  { id: "curl", label: "curl", build: asCurl, hint: () => "Bash line continuations; use one line on Windows cmd." },
  {
    id: "ha",
    label: "Home Assistant",
    build: asHomeAssistant,
    hint: () => "Add to configuration.yaml, then call the service from an automation.",
  },
  { id: "fetch", label: "fetch", build: asFetch, hint: () => "JavaScript, inside an async function." },
  { id: "ps", label: "PowerShell", build: asPowerShell, hint: () => "Invoke-RestMethod parses the JSON answer for you." },
  {
    id: "raw",
    label: "Raw HTTP",
    build: asRawHttp,
    hint: () => "Method, headers and body for n8n, Node-RED or iOS Shortcuts.",
  },
];

/* Rendering */

function field(label, control, help) {
  const wrapper = document.createElement("label");
  wrapper.className = "textfield";
  wrapper.append(control);

  const floating = document.createElement("span");
  floating.textContent = label;
  wrapper.append(floating);

  if (help) {
    const supporting = document.createElement("span");
    supporting.className = "supporting-text body-small";
    supporting.textContent = help;
    wrapper.append(supporting);
  }
  return wrapper;
}

function switchField(label, checked, onChange, help) {
  const wrapper = document.createElement("div");
  wrapper.className = "api-switch";

  const control = document.createElement("label");
  control.className = "switch";
  control.innerHTML =
    '<input type="checkbox"><span class="track"><span class="handle"></span></span>' +
    '<span class="label-large"></span>';
  const input = control.querySelector("input");
  input.checked = checked;
  input.addEventListener("change", () => onChange(input.checked));
  control.querySelector(".label-large").textContent = label;
  wrapper.append(control);

  if (help) {
    const supporting = document.createElement("p");
    supporting.className = "body-small on-surface-variant";
    supporting.textContent = help;
    wrapper.append(supporting);
  }
  return wrapper;
}

function targetField(endpoint) {
  const options = endpoint.needs === "device" ? devices : groups;
  const current = String(values.__target || "");

  if (!options.length) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = " ";
    input.spellcheck = false;
    input.value = current;
    input.addEventListener("input", () => {
      values.__target = input.value.trim();
      renderOutput();
    });
    return field(
      endpoint.needs === "device" ? "Device ID" : "Group ID",
      input,
      loading
        ? "Loading the list…"
        : "Could not load the list; paste an ID or check the connection above."
    );
  }

  const select = document.createElement("select");
  for (const item of options) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.name} (${item.id})`;
    select.append(option);
  }
  if (options.some((item) => item.id === current)) select.value = current;
  values.__target = select.value;
  select.addEventListener("change", () => {
    values.__target = select.value;
    renderOutput();
  });
  return field(endpoint.needs === "device" ? "Device" : "Group", select);
}

function groupSelectField(param) {
  const select = document.createElement("select");
  const ungrouped = document.createElement("option");
  ungrouped.value = "";
  ungrouped.textContent = "Ungrouped";
  select.append(ungrouped);
  for (const group of groups) {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.name;
    select.append(option);
  }
  select.value = String(values[param.name] ?? "");
  select.addEventListener("change", () => {
    values[param.name] = select.value;
    renderOutput();
  });
  return field(param.label, select, param.help);
}

function jsonField(param) {
  const area = document.createElement("textarea");
  area.rows = 8;
  area.placeholder = " ";
  area.spellcheck = false;
  area.value = String(values[param.name] ?? "");
  area.addEventListener("input", () => {
    values[param.name] = area.value;
    renderOutput();
  });
  return field(param.label, area, "Edit freely; invalid JSON is reported before sending.");
}

function paramField(param) {
  if (param.kind === "json") return jsonField(param);
  if (param.kind === "group") return groupSelectField(param);
  if (param.kind === "bool") {
    return switchField(
      param.label,
      values[param.name] === true,
      (checked) => {
        values[param.name] = checked;
        renderParams();
        renderOutput();
      },
      param.help
    );
  }

  const input = document.createElement("input");
  input.type = param.kind === "number" ? "number" : "text";
  input.placeholder = " ";
  input.spellcheck = false;
  if (param.min !== undefined) input.min = String(param.min);
  if (param.max !== undefined) input.max = String(param.max);
  input.value = String(values[param.name] ?? "");
  input.addEventListener("input", () => {
    values[param.name] = input.value;
    renderOutput();
  });
  return field(param.label, input, param.help);
}

function renderParams() {
  const endpoint = currentEndpoint();
  el.params.replaceChildren();

  if (endpoint.needs) el.params.append(targetField(endpoint));
  for (const param of activeParams(endpoint)) {
    el.params.append(paramField(param));
  }
}

function resetValues() {
  const endpoint = currentEndpoint();
  values = { __target: values.__target || "" };
  for (const param of endpoint.params || []) {
    values[param.name] =
      param.kind === "json" ? JSON.stringify(param.value, null, 2) : param.value;
  }
}

function renderEndpointHint(endpoint) {
  const parts = [`${endpoint.method} ${endpoint.path}`];
  if (endpoint.hint) parts.push(endpoint.hint);
  el.endpointHint.textContent = parts.join(" — ");
}

function renderTabs() {
  el.tabs.replaceChildren();
  for (const item of FORMATS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn text api-tab";
    button.textContent = item.label;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(item.id === format));
    button.addEventListener("click", () => {
      format = item.id;
      store(STORAGE.format, format);
      renderTabs();
      renderOutput();
    });
    el.tabs.append(button);
  }
}

function renderOutput() {
  const req = buildRequest();
  const chosen = FORMATS.find((item) => item.id === format) || FORMATS[0];

  el.output.textContent = chosen.build(req);
  const hints = [chosen.hint(req)];
  if (!req.valid) hints.push(req.errors.join(". "));
  else {
    const carriesKey = Boolean(req.headers["X-API-Key"] || (req.keyInUrl && apiKey()));
    if (authRequired && !req.endpoint.noAuth && !carriesKey) {
      hints.push("No API key set: this only works from a signed-in browser on this origin.");
    }
  }
  el.formatHint.textContent = hints.join(" ");
  el.send.disabled = sending || !req.valid;
}

/* Sending */

function confirmSend(req) {
  el.confirmText.textContent = `${req.method} ${req.target}${
    targetName() ? ` — ${targetName()}` : ""
  }. This changes the state of a machine or the stored configuration.`;
  return new Promise((resolve) => {
    const done = (ok) => {
      el.confirmDialog.close();
      resolve(ok);
    };
    el.confirmForm.onsubmit = (event) => {
      event.preventDefault();
      done(true);
    };
    el.confirmCancel.onclick = () => done(false);
    el.confirmDialog.oncancel = () => resolve(false);
    el.confirmDialog.showModal();
  });
}

/* A wake or shutdown with "wait" on keeps the request open until the machine
   answers, so say something while that runs. */
function renderPending() {
  el.responseEmpty.hidden = true;
  el.response.hidden = false;
  el.responseStatus.className = "chip checking";
  el.responseStatus.replaceChildren();
  el.responseStatus.insertAdjacentHTML("afterbegin", '<span class="dot"></span>');
  el.responseStatus.append(document.createTextNode("Sending"));
  el.responseMeta.textContent = "";
  el.responseBody.textContent =
    "Waiting for the answer. With wait on, this can take until the timeout you set.";
  el.responseHeaders.textContent = "(waiting)";
}

function renderResponse({ status, statusText, ok, headers, body, elapsed }) {
  el.responseEmpty.hidden = true;
  el.response.hidden = false;
  el.responseStatus.className = `chip ${ok ? "online" : "offline"}`;
  el.responseStatus.textContent = `${status} ${statusText}`.trim();

  const size = new TextEncoder().encode(body).length;
  el.responseMeta.textContent = `${Math.round(elapsed)} ms · ${size} bytes`;

  let pretty = body;
  try {
    pretty = JSON.stringify(JSON.parse(body), null, 2);
  } catch (err) {
    /* not JSON, show it as it came in */
  }
  el.responseBody.textContent = pretty || "(empty body)";
  el.responseHeaders.textContent =
    headers.map(([name, value]) => `${name}: ${value}`).join("\n") || "(none)";
}

function renderFailure(message) {
  el.responseEmpty.hidden = true;
  el.response.hidden = false;
  el.responseStatus.className = "chip offline";
  el.responseStatus.textContent = "No response";
  el.responseMeta.textContent = "";
  el.responseBody.textContent = message;
  el.responseHeaders.textContent = "(none)";
}

async function send() {
  const req = buildRequest();
  if (!req.valid) {
    snackbar(req.errors[0], "fail");
    return;
  }
  if (req.endpoint.danger && !(await confirmSend(req))) return;

  sending = true;
  el.send.disabled = true;
  renderPending();
  const started = performance.now();

  try {
    const response = await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.bodyText ? JSON.stringify(req.body) : undefined,
      credentials: sameOrigin(req.url) ? "same-origin" : "omit",
    });
    const text = await response.text();
    renderResponse({
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: [...response.headers.entries()],
      body: text,
      elapsed: performance.now() - started,
    });
    if (response.status === 401) {
      showBanner("Not authenticated: paste the API key above, or sign in to the web interface first.");
    } else if (response.ok) {
      hideBanner();
      if (req.endpoint.mutates) loadData();
    }
  } catch (err) {
    const cross = !sameOrigin(req.url);
    renderFailure(
      cross
        ? `${err.message}\n\nThe Base URL points to another origin. Browsers block those calls (CORS), ` +
            "even though the copied snippets will work fine from curl, Home Assistant or a script."
        : `${err.message}\n\nCould not reach the server. Check the Base URL.`
    );
  } finally {
    sending = false;
    renderOutput();
  }
}

/* Device and group lists for the pickers */

async function loadData() {
  const headers = {};
  const key = apiKey();
  if (key) headers["X-API-Key"] = key;
  const credentials = sameOrigin(baseUrl()) ? "same-origin" : "omit";

  loading = true;
  renderParams();

  try {
    const session = await fetch(`${baseUrl()}/api/session`, { credentials });
    if (session.ok) authRequired = (await session.json()).auth_required !== false;
  } catch (err) {
    /* the devices call below reports the problem */
  }

  try {
    // probe=0 skips the status check, which would otherwise keep the pickers
    // waiting for every device to answer.
    const response = await fetch(`${baseUrl()}/api/devices?probe=0`, {
      headers,
      credentials,
    });
    if (response.status === 401) {
      devices = [];
      groups = [];
      showBanner(
        "Not signed in: paste the API key above, or sign in to the web interface to load your devices."
      );
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    devices = Array.isArray(data.devices) ? data.devices : [];
    groups = Array.isArray(data.groups) ? data.groups : [];
    hideBanner();
  } catch (err) {
    devices = [];
    groups = [];
    showBanner(
      sameOrigin(baseUrl())
        ? `Could not load devices: ${err.message}`
        : "Could not load devices from another origin; browsers block that (CORS). You can still build and copy calls."
    );
  } finally {
    loading = false;
    renderParams();
    renderOutput();
  }
}

/* Wiring */

function fillEndpoints() {
  const byGroup = new Map();
  for (const endpoint of ENDPOINTS) {
    if (!byGroup.has(endpoint.group)) byGroup.set(endpoint.group, []);
    byGroup.get(endpoint.group).push(endpoint);
  }
  for (const [name, items] of byGroup) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = name;
    for (const endpoint of items) {
      const option = document.createElement("option");
      option.value = endpoint.id;
      option.textContent = `${endpoint.method} — ${endpoint.label}`;
      optgroup.append(option);
    }
    el.endpoint.append(optgroup);
  }
  const remembered = stored(STORAGE.endpoint);
  if (remembered && ENDPOINTS.some((item) => item.id === remembered)) {
    el.endpoint.value = remembered;
  }
}

/* The wake link has no header option, so show that as a locked switch instead
   of letting the choice silently do nothing. */
function syncKeyInUrl() {
  const forced = currentEndpoint().keyInUrl === true;
  el.keyInUrl.disabled = forced;
  el.keyInUrl.checked = forced || keyInUrlChoice;
}

function selectEndpoint() {
  const endpoint = currentEndpoint();
  store(STORAGE.endpoint, endpoint.id);
  syncKeyInUrl();
  resetValues();
  renderEndpointHint(endpoint);
  renderParams();
  renderOutput();
}

function toggleKeyVisibility() {
  const showing = el.apiKey.type === "text";
  el.apiKey.type = showing ? "password" : "text";
  el.toggleKey.replaceChildren();
  el.toggleKey.insertAdjacentHTML(
    "afterbegin",
    icon(showing ? "visibility" : "visibility_off", 20)
  );
  const label = showing ? "Show API key" : "Hide API key";
  el.toggleKey.title = label;
  el.toggleKey.setAttribute("aria-label", label);
}

function persistKey() {
  if (el.rememberKey.checked) {
    store(STORAGE.remember, "1");
    store(STORAGE.key, el.apiKey.value.trim());
  } else {
    store(STORAGE.remember, null);
    store(STORAGE.key, null);
  }
}

function init() {
  hydrateIcons();
  applyTheme(document.documentElement.dataset.themePreference || "auto");
  el.toggleKey.insertAdjacentHTML("afterbegin", icon("visibility", 20));
  for (const button of document.querySelectorAll(".code-copy")) {
    button.insertAdjacentHTML("afterbegin", icon("copy", 18));
  }

  el.baseUrl.value = stored(STORAGE.base) || window.location.origin;
  if (stored(STORAGE.remember) === "1") {
    el.rememberKey.checked = true;
    el.apiKey.value = stored(STORAGE.key) || "";
  }
  keyInUrlChoice = stored(STORAGE.keyInUrl) === "1";

  const savedFormat = stored(STORAGE.format);
  if (savedFormat && FORMATS.some((item) => item.id === savedFormat)) format = savedFormat;

  fillEndpoints();
  renderTabs();
  selectEndpoint();

  el.themeToggle.addEventListener("click", cycleTheme);
  systemDark.addEventListener("change", () => {
    if ((document.documentElement.dataset.themePreference || "auto") === "auto") {
      applyTheme("auto");
    }
  });

  el.endpoint.addEventListener("change", selectEndpoint);
  el.send.addEventListener("click", send);
  el.reload.addEventListener("click", loadData);
  el.toggleKey.addEventListener("click", toggleKeyVisibility);

  el.baseUrl.addEventListener("input", renderOutput);
  el.baseUrl.addEventListener("change", () => {
    store(STORAGE.base, el.baseUrl.value.trim());
    loadData();
  });
  el.apiKey.addEventListener("input", renderOutput);
  el.apiKey.addEventListener("change", () => {
    persistKey();
    loadData();
  });
  el.rememberKey.addEventListener("change", persistKey);
  el.keyInUrl.addEventListener("change", () => {
    keyInUrlChoice = el.keyInUrl.checked;
    store(STORAGE.keyInUrl, keyInUrlChoice ? "1" : null);
    renderOutput();
  });

  for (const button of document.querySelectorAll("[data-copy]")) {
    button.addEventListener("click", async () => {
      const source = document.getElementById(button.dataset.copy);
      try {
        await copyText(source.textContent);
        snackbar("Copied to clipboard", "ok");
      } catch (err) {
        snackbar("Could not copy", "fail");
      }
    });
  }

  loadData();
}

init();
