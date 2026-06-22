/* Heatmap status sharing — same pattern as Content_flow_Integration (URL ?updated=&s= + scoped localStorage) */

const HeatmapShare = (function () {
  const STORAGE_KEY = "acqHeatmapCellStates-v1";
  const MANUAL_KEY = "acqHeatmapManualOverrides-v1";
  const UPDATED_KEY = "acqHeatmapSharedUpdatedAt-v1";

  /** Pack order: 2 alliances × 4 columns */
  const CELL_ORDER = [
    "content-metadata-artwork",
    "content-av-assets",
    "content-avails-rights",
    "content-s3-ingest",
    "media-metadata-artwork",
    "media-av-assets",
    "media-avails-rights",
    "media-s3-ingest",
  ];

  /** Index: 0=Completed, 1=In Progress, 2=Pending, 3=Risk (matches Content_flow cycle start) */
  const STATUS_CYCLE = [
    { slug: "completed", label: "Completed", className: "completed" },
    { slug: "in-progress", label: "In Progress", className: "in-progress" },
    { slug: "pending", label: "Pending", className: "pending" },
    { slug: "risk", label: "Risk", className: "risk" },
  ];

  const SLUG_TO_INDEX = Object.fromEntries(STATUS_CYCLE.map((s, i) => [s.slug, i]));
  let statesCache = null;
  let manualCache = null;

  function pathKey() {
    try {
      let p = window.location.pathname || "/";
      p = p.replace(/\/index\.html$/i, "");
      if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
      return p || "/";
    } catch {
      return "/";
    }
  }

  function scopedKey(localKey) {
    return `${localKey}:${pathKey()}`;
  }

  function loadJson(localKey) {
    const scoped = scopedKey(localKey);
    try {
      let raw = localStorage.getItem(scoped);
      if (!raw) raw = sessionStorage.getItem(scoped);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveJson(localKey, obj) {
    const scoped = scopedKey(localKey);
    const payload = JSON.stringify(obj);
    try {
      localStorage.setItem(scoped, payload);
    } catch {
      try {
        sessionStorage.setItem(scoped, payload);
      } catch {
        /* ignore */
      }
    }
  }

  function cellId(allianceId, colId) {
    return `${allianceId}-${colId}`;
  }

  function getStates() {
    if (!statesCache) statesCache = loadJson(STORAGE_KEY);
    return statesCache;
  }

  function getManual() {
    if (!manualCache) manualCache = loadJson(MANUAL_KEY);
    return manualCache;
  }

  function isManual(id) {
    return !!getManual()[id];
  }

  function slugToIndex(slug) {
    return SLUG_TO_INDEX[slug] ?? 2;
  }

  function indexToSlug(index) {
    return STATUS_CYCLE[index]?.slug || "pending";
  }

  function effectiveSlug(allianceId, colId, syncedSlug) {
    const id = cellId(allianceId, colId);
    const saved = getStates()[id];
    if (saved !== undefined && saved >= 0 && saved <= 3) {
      return indexToSlug(saved);
    }
    return syncedSlug || "pending";
  }

  function nextSlug(current) {
    const i = slugToIndex(current);
    return indexToSlug((i + 1) % STATUS_CYCLE.length);
  }

  function labelFor(slug) {
    return STATUS_CYCLE.find((s) => s.slug === slug)?.label || "Pending";
  }

  function classFor(slug) {
    return STATUS_CYCLE.find((s) => s.slug === slug)?.className || "pending";
  }

  function setUpdated(iso) {
    try {
      localStorage.setItem(scopedKey(UPDATED_KEY), iso);
    } catch {
      /* ignore */
    }
  }

  function getUpdated() {
    try {
      return localStorage.getItem(scopedKey(UPDATED_KEY)) || "";
    } catch {
      return "";
    }
  }

  function toBase64Url(bytes) {
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fromBase64Url(encoded) {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function packCompact(states) {
    let bits = 0n;
    CELL_ORDER.forEach((id, index) => {
      const v = states[id];
      const packed = BigInt(v !== undefined && v >= 0 && v <= 3 ? v : 7);
      bits |= packed << BigInt(index * 3);
    });
    const byteCount = Math.ceil((CELL_ORDER.length * 3) / 8);
    const bytes = new Uint8Array(byteCount);
    for (let i = 0; i < byteCount; i += 1) {
      bytes[i] = Number((bits >> BigInt(i * 8)) & 0xffn);
    }
    return toBase64Url(bytes);
  }

  function unpackCompact(encoded) {
    const out = {};
    if (!encoded) return out;
    const bytes = fromBase64Url(encoded);
    let bits = 0n;
    for (let i = 0; i < bytes.length; i += 1) {
      bits |= BigInt(bytes[i]) << BigInt(i * 8);
    }
    CELL_ORDER.forEach((id, index) => {
      const v = Number((bits >> BigInt(index * 3)) & 7n);
      if (v <= 3) out[id] = v;
    });
    return out;
  }

  function formatShareTimestamp(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}Z`;
  }

  function parseShareTimestamp(stamp) {
    const m = stamp.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})Z$/);
    if (!m) return "";
    const iso = new Date(
      Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
    ).toISOString();
    return Number.isNaN(Date.parse(iso)) ? "" : iso;
  }

  function canonicalUrl() {
    let path = window.location.pathname || "/";
    path = path.replace(/\/index\.html$/i, "");
    if (path.length > 1 && !path.endsWith("/")) path += "/";
    return `${window.location.origin}${path}`;
  }

  function captureFromDom() {
    const states = { ...getStates() };
    document.querySelectorAll(".ov-status-cell[data-alliance][data-col]").forEach((el) => {
      const id = cellId(el.dataset.alliance, el.dataset.col);
      states[id] = slugToIndex(el.dataset.status || "pending");
    });
    return states;
  }

  function applyPayload(states, updatedIso) {
    statesCache = { ...states };
    saveJson(STORAGE_KEY, statesCache);
    const manual = { ...getManual() };
    Object.keys(states).forEach((id) => {
      manual[id] = true;
    });
    manualCache = manual;
    saveJson(MANUAL_KEY, manual);
    if (updatedIso) setUpdated(updatedIso);
  }

  function applyFromQueryString() {
    try {
      const params = new URLSearchParams(window.location.search);
      const data = params.get("s");
      const updatedParam = params.get("updated");
      if (!updatedParam || !data) return false;
      const updatedIso = parseShareTimestamp(updatedParam);
      const states = unpackCompact(data);
      if (!updatedIso || !Object.keys(states).length) return false;
      applyPayload(states, updatedIso);
      window.__acqHeatmapLoadedFromShare = true;
      return true;
    } catch {
      return false;
    }
  }

  function buildShareUrl(states, updatedIso) {
    const stamp = formatShareTimestamp(updatedIso);
    if (!stamp || !Object.keys(states).length) return canonicalUrl();
    const url = new URL(canonicalUrl());
    url.searchParams.set("updated", stamp);
    url.searchParams.set("s", packCompact(states));
    return url.toString();
  }

  function persistAfterEdit() {
    const states = captureFromDom();
    statesCache = states;
    saveJson(STORAGE_KEY, states);
    const updated = new Date().toISOString();
    setUpdated(updated);
    updateSharePreview(buildShareUrl(states, updated));
    updateUpdatedLabel(updated, false);
    return states;
  }

  function saveCellEdit(allianceId, colId, slug) {
    const id = cellId(allianceId, colId);
    const states = getStates();
    states[id] = slugToIndex(slug);
    statesCache = states;
    saveJson(STORAGE_KEY, states);
    const manual = getManual();
    manual[id] = true;
    manualCache = manual;
    saveJson(MANUAL_KEY, manual);
    persistAfterEdit();
  }

  function formatDate(iso) {
    if (!iso || Number.isNaN(Date.parse(iso))) return "";
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function updateUpdatedLabel(iso, fromShare) {
    const el = document.getElementById("heatmapShareUpdated");
    if (!el) return;
    const when = formatDate(iso || getUpdated());
    if (!when) {
      el.textContent = "";
      return;
    }
    el.textContent = fromShare ? `Loaded shared snapshot: ${when}` : `Last updated: ${when}`;
  }

  function updateSharePreview(url) {
    const el = document.getElementById("heatmapShareUrlPreview");
    if (!el) return;
    if (!url) {
      el.textContent = "";
      return;
    }
    try {
      el.textContent = new URL(url).search || "";
    } catch {
      el.textContent = "";
    }
  }

  function setupShareUI(loadedFromShare) {
    const btn = document.getElementById("copyHeatmapShareLink");
    if (!btn) return;
    updateUpdatedLabel(getUpdated(), loadedFromShare);
    const states = captureFromDom();
    const updated = getUpdated() || new Date().toISOString();
    updateSharePreview(buildShareUrl(states, updated));

    btn.addEventListener("click", async () => {
      const snap = captureFromDom();
      const now = new Date().toISOString();
      applyPayload(snap, now);
      const shareUrl = buildShareUrl(snap, now);
      updateSharePreview(shareUrl);
      updateUpdatedLabel(now, false);
      try {
        await navigator.clipboard.writeText(shareUrl);
        const prev = btn.textContent;
        btn.textContent = "Link copied!";
        setTimeout(() => {
          btn.textContent = prev;
        }, 2500);
      } catch {
        window.prompt("Copy this share link:", shareUrl);
      }
    });
  }

  return {
    CELL_ORDER,
    STATUS_CYCLE,
    cellId,
    slugToIndex,
    indexToSlug,
    effectiveSlug,
    nextSlug,
    labelFor,
    classFor,
    isManual,
    applyFromQueryString,
    setupShareUI,
    captureFromDom,
    saveCellEdit,
  };
})();
