const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
const ADMIN_REQUIRED_ROLE = "admin";
const ADMIN_ALLOWED_EMAILS = [];
const ADMIN_DASHBOARD_BUILD = "2026.05.15-admin-premium-1";
const EVENT_LIST_PAGE_SIZE = 22;

const EVENT_IMAGES_BUCKET = "event-images";
const ADMIN_REPLACE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const ADMIN_REPLACE_ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);
const CROP_EXPORT_MAX_WIDTH = 1600;
const CROP_EXPORT_QUALITY = 0.82;
const CROP_PREVIEW_BASE_W = 360;
const ADMIN_GEOCODING_PROVIDER = "nominatim";
const ADMIN_GEOCODING_MIN_INTERVAL_MS = 850;
const ADMIN_GEOCODING_MAX_RETRIES = 2;
const ADMIN_EDITOR_PLACES_DEBOUNCE_MS = 220;
const ADMIN_EDITOR_PLACES_MIN_CHARS = 3;
let editorLocationAutocompleteDispose = null;
let editorPlacesHideSuggestionsFn = null;
const ADMIN_MAPBOX_ACCESS_TOKEN = (window.PARTYRADAR_MAPBOX_TOKEN || "").toString().trim();
const SOCIAL_REVIEW_PLATFORMS = ["instagram", "facebook"];
const SOCIAL_REVIEW_SLOTS = [
  { id: "week", daysBefore: 7, hour: 10, minute: 30 },
  { id: "three_days", daysBefore: 3, hour: 10, minute: 30 },
  { id: "one_day", daysBefore: 1, hour: 10, minute: 30 },
  { id: "final_call", daysBefore: 0, hour: 10, minute: 30 }
];
const SHORT_NOTICE_EVENT_HOURS = 96;
const URGENT_EVENT_HOURS = 24;
const IMMEDIATE_LAST_CALL_DELAY_MS = 60 * 1000;
const EVENT_START_SAFETY_MS = 15 * 1000;

const VALID_STATUS = new Set(["pending", "approved", "rejected"]);

const state = {
  allEvents: [],
  filteredEvents: [],
  activeTab: "all",
  search: "",
  city: "",
  genre: "",
  statusFilter: "",
  socialQueueFilter: "all",
  adminSession: null,
  navSection: "dashboard",
  lastFilterSignature: "",
  eventsVisibleCount: EVENT_LIST_PAGE_SIZE,
  eventsRendered: 0,
  eventListReset: true,
  searchDebounceTimer: null,
  geoBusyEventIds: new Set(),
  geoPulseEventIds: new Set(),
  socialQueueByEvent: new Map(),
  featureColumns: {
    featured: true,
    promoted: true
  }
};

const dom = {
  authCard: document.getElementById("adminAuthCard"),
  workspace: document.getElementById("adminWorkspace"),
  headerSignOutButton: document.getElementById("adminHeaderSignOutButton"),
  loginForm: document.getElementById("adminLoginForm"),
  loginEmail: document.getElementById("adminEmail"),
  loginPassword: document.getElementById("adminPassword"),
  authFeedback: document.getElementById("adminAuthFeedback"),
  globalFeedback: document.getElementById("adminGlobalFeedback"),
  sessionInfo: document.getElementById("adminSessionInfo"),
  signOutButton: document.getElementById("adminSignOutButton"),
  statusTabs: [...document.querySelectorAll(".admin-status-tab[data-status-filter]")],
  countAll: document.getElementById("countAll"),
  countPending: document.getElementById("countPending"),
  countApproved: document.getElementById("countApproved"),
  countRejected: document.getElementById("countRejected"),
  countTabAll: document.getElementById("countTabAll"),
  countTabPending: document.getElementById("countTabPending"),
  countTabApproved: document.getElementById("countTabApproved"),
  countTabRejected: document.getElementById("countTabRejected"),
  searchInput: document.getElementById("filterSearch"),
  cityFilter: document.getElementById("filterCity"),
  genreFilter: document.getElementById("filterGenre"),
  statusFilter: document.getElementById("filterStatus"),
  resetFiltersButton: document.getElementById("resetFiltersButton"),
  socialQueuePanel: document.getElementById("adminSocialQueuePanel"),
  socialQueueFilters: [...document.querySelectorAll(".admin-social-filter[data-social-filter]")],
  eventGrid: document.getElementById("adminEventGrid"),
  eventSentinel: document.getElementById("adminEventSentinel"),
  emptyState: document.getElementById("adminEmptyState"),
  dashboardGrid: document.getElementById("adminDashboardGrid"),
  analyticsBody: document.getElementById("adminAnalyticsBody"),
  settingsBuild: document.getElementById("adminSettingsBuild"),
  viewDashboard: document.getElementById("adminViewDashboard"),
  viewEvents: document.getElementById("adminViewEvents"),
  viewSocial: document.getElementById("adminViewSocial"),
  viewAnalytics: document.getElementById("adminViewAnalytics"),
  viewSettings: document.getElementById("adminViewSettings")
};

function supabaseClient() {
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function isEmailAllowed(email) {
  if (!email) return false;
  if (!ADMIN_ALLOWED_EMAILS.length) return true;
  const normalized = String(email).trim().toLowerCase();
  return ADMIN_ALLOWED_EMAILS.some((allowed) => String(allowed).trim().toLowerCase() === normalized);
}

function sessionRole(session) {
  return String(session?.user?.app_metadata?.role || "").trim().toLowerCase();
}

function isSessionAdmin(session) {
  return sessionRole(session) === ADMIN_REQUIRED_ROLE && isEmailAllowed(session?.user?.email || "");
}

function setFeedback(element, message, tone = "info") {
  if (!element) return;
  element.hidden = !message;
  element.textContent = message || "";
  element.className = "feedback";
  if (tone === "error") element.classList.add("is-error");
  if (tone === "success") element.classList.add("is-success");
}

function setGlobalFeedback(message, tone = "info") {
  setFeedback(dom.globalFeedback, message, tone);
}

function setAuthFeedback(message, tone = "info") {
  setFeedback(dom.authFeedback, message, tone);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function debounceAdmin(fn, waitMs) {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, waitMs);
  };
}

function parseCoordinate(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  let s = String(value).trim();
  if (!s) return null;
  s = s.replace(/\s+/g, "");
  if (/^nan$/i.test(s)) return null;
  if (/^-?\d+,\d+([eE][+-]?\d+)?$/.test(s)) {
    s = s.replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const parsed = Number(s);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasValidMarkerCoordinates(event) {
  const lat = parseCoordinate(event?.lat);
  const lng = parseCoordinate(event?.lng);
  return lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function parseAdminYmd(rawDate) {
  const value = String(rawDate || "").trim();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}

function parseAdminTime(rawTime) {
  const parts = String(rawTime || "23:59").trim().split(":");
  const hour = Math.min(23, Math.max(0, Number(parts[0]) || 0));
  const minute = Math.min(59, Math.max(0, Number(parts[1]) || 0));
  return { hour, minute };
}

function dateFromAdminEventWallTime(event, fallbackHour = 23, fallbackMinute = 59) {
  const parts = parseAdminYmd(event?.event_date || event?.recurrence_start_date);
  if (!parts) return null;
  const parsedTime = parseAdminTime(event?.event_time || `${fallbackHour}:${String(fallbackMinute).padStart(2, "0")}`);
  return new Date(parts.year, parts.month - 1, parts.day, parsedTime.hour, parsedTime.minute, 0, 0);
}

function shortNoticeInfoForEvent(event, now = new Date()) {
  const eventStart = dateFromAdminEventWallTime(event);
  if (!eventStart || Number.isNaN(eventStart.getTime()) || eventStart <= now) {
    return { active: false, urgent: false, eventStart: null, hoursUntilStart: null };
  }
  const hoursUntilStart = (eventStart.getTime() - now.getTime()) / 3600000;
  return {
    active: hoursUntilStart <= SHORT_NOTICE_EVENT_HOURS,
    urgent: hoursUntilStart <= URGENT_EVENT_HOURS,
    eventStart,
    hoursUntilStart
  };
}

function socialSlotDateForEvent(event, slot) {
  const eventStart = dateFromAdminEventWallTime(event);
  if (!eventStart || Number.isNaN(eventStart.getTime())) return null;
  const slotDate = new Date(eventStart);
  slotDate.setDate(slotDate.getDate() - slot.daysBefore);
  slotDate.setHours(slot.hour, slot.minute, 0, 0);
  if (slot.id === "final_call") {
    const latestSafe = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000);
    if (slotDate > latestSafe) return latestSafe;
  }
  return slotDate;
}

function immediateLastCallDateForEvent(event, now = new Date()) {
  const info = shortNoticeInfoForEvent(event, now);
  if (!info.active || !info.eventStart) return null;
  const eventStartMs = info.eventStart.getTime();
  const preferred = new Date(now.getTime() + IMMEDIATE_LAST_CALL_DELAY_MS);
  if (preferred.getTime() < eventStartMs) return preferred;
  const safeLatest = new Date(eventStartMs - EVENT_START_SAFETY_MS);
  return safeLatest > now ? safeLatest : null;
}

function buildSocialReviewQueueRows(event) {
  const now = new Date();
  const eventStart = dateFromAdminEventWallTime(event);
  if (!eventStart || Number.isNaN(eventStart.getTime()) || eventStart <= now) return [];
  const rows = [];
  const immediateLastCall = immediateLastCallDateForEvent(event, now);
  if (immediateLastCall && immediateLastCall < eventStart) {
    for (const platform of SOCIAL_REVIEW_PLATFORMS) {
      rows.push({
        event_id: event.id,
        platform,
        scheduled_at: immediateLastCall.toISOString(),
        status: "pending",
        retry_count: 0,
        _slot_id: "short_notice_last_call"
      });
    }
  }
  for (const slot of SOCIAL_REVIEW_SLOTS) {
    const scheduled = socialSlotDateForEvent(event, slot);
    if (!scheduled || Number.isNaN(scheduled.getTime())) continue;
    if (scheduled <= now) continue;
    if (scheduled >= eventStart) continue;
    for (const platform of SOCIAL_REVIEW_PLATFORMS) {
      rows.push({
        event_id: event.id,
        platform,
        scheduled_at: scheduled.toISOString(),
        status: "pending",
        retry_count: 0
      });
    }
  }
  return rows;
}

function socialQueueRowsForEvent(eventId) {
  return state.socialQueueByEvent.get(String(eventId || "")) || [];
}

function socialQueueSummary(eventId) {
  const rows = socialQueueRowsForEvent(eventId);
  const counts = rows.reduce(
    (acc, row) => {
      const status = String(row.status || "pending").toLowerCase();
      acc.total += 1;
      if (status === "posted") acc.ready += 1;
      else if (status === "failed") acc.failed += 1;
      else if (status === "processing") acc.processing += 1;
      else if (status === "skipped") acc.skipped += 1;
      else acc.pending += 1;
      return acc;
    },
    { total: 0, ready: 0, failed: 0, processing: 0, pending: 0, skipped: 0 }
  );
  return counts;
}

function isEventPast(event) {
  const start = dateFromAdminEventWallTime(event);
  return Boolean(start && !Number.isNaN(start.getTime()) && start < new Date());
}

function buildEventValidationBadges(event) {
  const badges = [];
  const hasCoords = hasValidMarkerCoordinates(event);
  const hasImage = Boolean(String(event.image_url || "").trim());
  const socialSummary = socialQueueSummary(event.id);
  const shortNotice = shortNoticeInfoForEvent(event);
  const push = (tone, label) => badges.push({ tone, label });

  if (event.featured) push("featured", "⭐ Featured");
  if (!hasImage) push("warning", "⚠️ Kein Bild");
  if (!hasCoords) push("warning", "⚠️ Keine Koordinaten");
  if (!String(event.genre || event.category || "").trim()) push("warning", "⚠️ Keine Kategorie");
  if (!String(event.event_date || "").trim()) push("error", "❌ Kein Datum");
  if (isEventPast(event)) push("error", "❌ Ungültig / Vergangen");
  if (shortNotice.urgent) push("warning", "⚠️ Eilmeldung");
  else if (shortNotice.active) push("warning", "⚠️ Kurzfristig");
  if (event.status === "approved" && socialSummary.total === 0) push("warning", "⚠️ Social Drafts fehlen");

  const hasError = badges.some((b) => b.tone === "error");
  const hasWarn = badges.some((b) => b.tone === "warning");
  if (!hasError && !hasWarn) push("ok", "✅ Bereit");

  return badges;
}

function renderValidationBadges(event) {
  return `<div class="event-card__validation-badges">${buildEventValidationBadges(event)
    .map((badge) => `<span class="event-validation-badge event-validation-badge--${badge.tone}">${escapeHtml(badge.label)}</span>`)
    .join("")}</div>`;
}

function normalizeCountryForGeocoding(countryValue) {
  const raw = String(countryValue || "").trim();
  if (!raw) return "";

  const normalized = raw.toLowerCase();
  if (["deutschland", "germany", "alemania"].includes(normalized)) return "Germany";
  if (["spanien", "spain", "espana", "españa"].includes(normalized)) return "Spain";
  if (["frankreich", "france", "francia"].includes(normalized)) return "France";
  if (["italien", "italy", "italia"].includes(normalized)) return "Italy";
  if (["österreich", "oesterreich", "austria", "austria"].includes(normalized)) return "Austria";
  if (["schweiz", "switzerland", "suiza"].includes(normalized)) return "Switzerland";
  if (["niederlande", "netherlands", "paises bajos", "países bajos", "holland"].includes(normalized)) {
    return "Netherlands";
  }
  return raw;
}

function composeAdminGeocodingQuery(payload) {
  return [
    payload.address,
    payload.postal_code,
    payload.city,
    normalizeCountryForGeocoding(payload.country)
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function buildAdminGeocodingQueries(payload) {
  const existingQuery = String(payload.geocoding_query || "").trim();
  const locationName = String(payload.location_name || "").trim();
  const address = String(payload.address || payload.street || "").trim();
  const postalCode = String(payload.postal_code || "").trim();
  const city = String(payload.city || "").trim();
  const country = normalizeCountryForGeocoding(payload.country);

  const queries = [
    existingQuery,
    [address, postalCode, city, country],
    [address, city, country],
    [locationName, address, postalCode, city, country],
    [locationName, city, country],
    [postalCode, city, country],
    [city, postalCode, country],
    [city, country]
  ]
    .map((entry) => (Array.isArray(entry) ? entry.filter(Boolean).join(", ") : entry))
    .map((query) => String(query || "").trim())
    .filter(Boolean);

  return [...new Set(queries)];
}

function sanitizeFileName(fileName) {
  const raw = String(fileName || "").trim();
  const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function fileExtension(fileName) {
  const parts = String(fileName || "").split(".");
  if (parts.length < 2) return "jpg";
  const ext = String(parts.pop() || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return ext || "jpg";
}

function resolvePrimaryImageUrl(raw) {
  const main = String(raw.image_url || raw.image || "").trim();
  if (main) return main;
  const coll = raw.image_urls;
  if (Array.isArray(coll)) {
    for (const entry of coll) {
      const u =
        typeof entry === "string"
          ? entry.trim()
          : String(entry?.url || entry?.image_url || "").trim();
      if (u) return u;
    }
  }
  return "";
}

function sanitizeEventIdForStoragePath(eventId) {
  const raw = String(eventId || "").trim();
  const safe = raw.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "event";
}

function buildAdminReplacementImagePath(eventId, extForPath) {
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const idPart = sanitizeEventIdForStoragePath(eventId);
  const raw = String(extForPath || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const safeExt = raw === "webp" ? "webp" : ADMIN_REPLACE_ALLOWED_EXT.has(raw) ? raw : "jpg";
  const random = Math.random().toString(36).slice(2, 10);
  return `admin-replacements/${yyyy}/${mm}/${dd}/${idPart}-${random}.${safeExt}`;
}

function validateAdminReplacementImageFile(file) {
  if (!file || !Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, message: "Keine gültige Bilddatei ausgewählt." };
  }
  if (file.size > ADMIN_REPLACE_IMAGE_MAX_BYTES) {
    return { ok: false, message: "Datei ist zu groß (max. 8 MB)." };
  }
  const ext = fileExtension(file.name);
  if (!ADMIN_REPLACE_ALLOWED_EXT.has(ext)) {
    return { ok: false, message: "Nur JPG, PNG oder WEBP sind erlaubt." };
  }
  const mime = String(file.type || "").trim().toLowerCase();
  if (mime) {
    const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedMime.has(mime)) {
      return { ok: false, message: "Nur JPG, PNG oder WEBP sind erlaubt." };
    }
  }
  return { ok: true };
}

function validateAdminReplacementExportBlob(blob) {
  if (!blob || !Number.isFinite(blob.size) || blob.size <= 0) {
    return { ok: false, message: "Exportiertes Bild ist leer." };
  }
  if (blob.size > ADMIN_REPLACE_IMAGE_MAX_BYTES) {
    return { ok: false, message: "Export ist zu groß (max. 8 MB)." };
  }
  const mime = String(blob.type || "").trim().toLowerCase();
  const allowed = new Set(["image/jpeg", "image/webp"]);
  if (mime && !allowed.has(mime)) {
    return { ok: false, message: "Export-Format nicht unterstützt." };
  }
  return { ok: true };
}

function adminCropAspectRatioWoverH(aspectMode) {
  return aspectMode === "11" ? 1 : 4 / 5;
}

function adminCropMaxRectInSource(iw, ih, ar) {
  if (iw / ih >= ar) {
    const sh = ih;
    const sw = ih * ar;
    return { sw, sh };
  }
  const sw = iw;
  const sh = iw / ar;
  return { sw, sh };
}

function adminCropSourceRect(iw, ih, aspectMode, panX, panY) {
  const ar = adminCropAspectRatioWoverH(aspectMode);
  const { sw, sh } = adminCropMaxRectInSource(iw, ih, ar);
  const sx0 = (iw - sw) / 2;
  const sy0 = (ih - sh) / 2;
  let sx = sx0 + panX;
  let sy = sy0 + panY;
  sx = Math.max(0, Math.min(sx, iw - sw));
  sy = Math.max(0, Math.min(sy, ih - sh));
  return { sx, sy, sw, sh, sx0, sy0 };
}

function adminCropPanBounds(iw, ih, aspectMode) {
  const ar = adminCropAspectRatioWoverH(aspectMode);
  const { sw, sh } = adminCropMaxRectInSource(iw, ih, ar);
  const sx0 = (iw - sw) / 2;
  const sy0 = (ih - sh) / 2;
  return {
    panXMin: -sx0,
    panXMax: iw - sw - sx0,
    panYMin: -sy0,
    panYMax: ih - sh - sy0
  };
}

function adminCropPreviewCanvasSize(aspectMode) {
  const w = CROP_PREVIEW_BASE_W;
  if (aspectMode === "11") return { cw: w, ch: w };
  return { cw: w, ch: Math.round((w * 5) / 4) };
}

function adminCropExportCanvasSize(aspectMode) {
  const outW = CROP_EXPORT_MAX_WIDTH;
  if (aspectMode === "11") return { outW, outH: outW };
  return { outW, outH: Math.round((outW * 5) / 4) };
}

function adminCanvasToExportBlob(canvas) {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== "function") {
      reject(new Error("Canvas-Export wird nicht unterstützt."));
      return;
    }
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.size > 0) {
          resolve(webpBlob);
          return;
        }
        canvas.toBlob(
          (jpegBlob) => {
            if (jpegBlob && jpegBlob.size > 0) resolve(jpegBlob);
            else reject(new Error("Export fehlgeschlagen."));
          },
          "image/jpeg",
          CROP_EXPORT_QUALITY
        );
      },
      "image/webp",
      CROP_EXPORT_QUALITY
    );
  });
}

function openAdminImageCropModal(file) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "admin-crop-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Bild zuschneiden");

    overlay.innerHTML = `
      <div class="admin-crop-dialog">
        <h3 class="admin-crop-title">Bild zuschneiden</h3>
        <p class="admin-crop-hint">Ziehen Sie mit der Maus, um den Ausschnitt zu verschieben.</p>
        <div class="admin-crop-aspect" role="group" aria-label="Seitenverhältnis">
          <button type="button" class="admin-crop-aspect-btn is-active" data-crop-aspect="45">4:5</button>
          <button type="button" class="admin-crop-aspect-btn" data-crop-aspect="11">1:1</button>
        </div>
        <div class="admin-crop-canvas-wrap">
          <canvas class="admin-crop-canvas" width="360" height="450"></canvas>
        </div>
        <div class="admin-crop-actions">
          <button type="button" class="button-secondary" data-crop-cancel>Abbrechen</button>
          <button type="button" class="button-secondary button-secondary--primary" data-crop-confirm>Übernehmen &amp; hochladen</button>
        </div>
      </div>
    `;

    const canvas = overlay.querySelector(".admin-crop-canvas");
    const ctx = canvas.getContext("2d");
    const btn45 = overlay.querySelector('[data-crop-aspect="45"]');
    const btn11 = overlay.querySelector('[data-crop-aspect="11"]');
    const btnCancel = overlay.querySelector("[data-crop-cancel]");
    const btnConfirm = overlay.querySelector("[data-crop-confirm]");

    let aspectMode = "45";
    let panX = 0;
    let panY = 0;
    let img = null;
    let objectUrl = null;
    let dragging = false;
    let lastClientX = 0;
    let lastClientY = 0;

    const finish = (blob) => {
      document.removeEventListener("keydown", onKeyDown);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      overlay.remove();
      resolve(blob);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(null);
      }
    };

    const resizeCanvasForAspect = () => {
      const { cw, ch } = adminCropPreviewCanvasSize(aspectMode);
      canvas.width = cw;
      canvas.height = ch;
    };

    const draw = () => {
      if (!img || !ctx) return;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return;
      const { sx, sy, sw, sh } = adminCropSourceRect(iw, ih, aspectMode, panX, panY);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    };

    const clampPan = () => {
      if (!img) return;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const { panXMin, panXMax, panYMin, panYMax } = adminCropPanBounds(iw, ih, aspectMode);
      panX = Math.max(panXMin, Math.min(panXMax, panX));
      panY = Math.max(panYMin, Math.min(panYMax, panY));
    };

    const setAspect = (mode) => {
      aspectMode = mode;
      panX = 0;
      panY = 0;
      btn45?.classList.toggle("is-active", mode === "45");
      btn11?.classList.toggle("is-active", mode === "11");
      resizeCanvasForAspect();
      clampPan();
      draw();
    };

    btn45?.addEventListener("click", () => setAspect("45"));
    btn11?.addEventListener("click", () => setAspect("11"));

    btnCancel?.addEventListener("click", () => finish(null));

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) finish(null);
    });

    btnConfirm?.addEventListener("click", async () => {
      if (!img) return;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const { sx, sy, sw, sh } = adminCropSourceRect(iw, ih, aspectMode, panX, panY);
      const { outW, outH } = adminCropExportCanvasSize(aspectMode);
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = outW;
      exportCanvas.height = outH;
      const ex = exportCanvas.getContext("2d");
      if (!ex) {
        setGlobalFeedback("Export nicht möglich.", "error");
        return;
      }
      ex.imageSmoothingEnabled = true;
      ex.imageSmoothingQuality = "high";
      ex.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      try {
        const blob = await adminCanvasToExportBlob(exportCanvas);
        const v = validateAdminReplacementExportBlob(blob);
        if (!v.ok) {
          setGlobalFeedback(v.message, "error");
          return;
        }
        finish(blob);
      } catch (err) {
        console.error("Crop export failed:", err);
        setGlobalFeedback(err.message || "Export fehlgeschlagen.", "error");
      }
    });

    canvas.addEventListener("pointerdown", (e) => {
      if (!img) return;
      dragging = true;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      canvas.classList.add("is-dragging");
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!dragging || !img) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const { sw, sh } = adminCropMaxRectInSource(iw, ih, adminCropAspectRatioWoverH(aspectMode));
      const dx = e.clientX - lastClientX;
      const dy = e.clientY - lastClientY;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      panX -= (dx * sw) / rect.width;
      panY -= (dy * sh) / rect.height;
      clampPan();
      draw();
    });

    const endDrag = () => {
      dragging = false;
      canvas.classList.remove("is-dragging");
    };

    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    objectUrl = URL.createObjectURL(file);
    img = new Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        resizeCanvasForAspect();
        clampPan();
        draw();
        btnConfirm.disabled = false;
      } catch (err) {
        console.error("Crop preview init failed:", err);
        setGlobalFeedback("Bild konnte nicht geladen werden.", "error");
        finish(null);
      }
    };
    img.onerror = () => {
      setGlobalFeedback("Bild konnte nicht geladen werden.", "error");
      finish(null);
    };
    img.src = objectUrl;

    btnConfirm.disabled = true;
    document.body.appendChild(overlay);
    document.addEventListener("keydown", onKeyDown);
    btnCancel?.focus();
  });
}

function buildImageUrlsAfterAdminReplacement(event, newPublicUrl) {
  const newMain = String(newPublicUrl || "").trim();
  const oldMain = String(event.image_url || "").trim();
  const out = [];
  const seen = new Set();

  const pushUnique = (url, featured) => {
    const u = String(url || "").trim();
    if (!u) return;
    const key = u.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ url: u, featured: Boolean(featured) });
  };

  pushUnique(newMain, true);

  if (oldMain && oldMain.toLowerCase() !== newMain.toLowerCase()) {
    pushUnique(oldMain, false);
  }

  const raw = event.image_urls;
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const u =
        typeof entry === "string"
          ? entry.trim()
          : String(entry?.url || entry?.image_url || "").trim();
      if (!u || u.toLowerCase() === newMain.toLowerCase()) continue;
      pushUnique(u, false);
    }
  }

  return out;
}

async function uploadAdminReplacementBlob(client, eventId, blob) {
  const mime = String(blob.type || "").toLowerCase();
  const extForPath = mime.includes("webp") ? "webp" : "jpg";
  const path = buildAdminReplacementImagePath(eventId, extForPath);
  const contentType = extForPath === "webp" ? "image/webp" : "image/jpeg";
  const { error: uploadError } = await client.storage.from(EVENT_IMAGES_BUCKET).upload(path, blob, {
    contentType,
    upsert: false
  });
  if (uploadError) throw uploadError;
  const {
    data: { publicUrl }
  } = client.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(path);
  if (!publicUrl) throw new Error("Öffentliche Bild-URL konnte nicht ermittelt werden.");
  return { path, publicUrl };
}

async function replaceAdminEventMainImageBlob(eventId, blob) {
  if (!isSessionAdmin(state.adminSession)) {
    throw new Error("Admin-Anmeldung erforderlich.");
  }
  const v = validateAdminReplacementExportBlob(blob);
  if (!v.ok) throw new Error(v.message);
  const eventData = state.allEvents.find((e) => String(e.id) === String(eventId));
  if (!eventData) throw new Error("Event nicht gefunden.");
  const client = supabaseClient();
  const { publicUrl } = await uploadAdminReplacementBlob(client, eventId, blob);
  const nextImageUrls = buildImageUrlsAfterAdminReplacement(eventData, publicUrl);
  await updateEventWithFallback(eventId, { image_url: publicUrl, image_urls: nextImageUrls });
  return publicUrl;
}

async function geocodeAddressWithNominatim(query) {
  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("q", query);

  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "de,en,es",
      "User-Agent": "Marcha/1.0 (admin geocoding)"
    }
  });

  if (!response.ok) {
    throw new Error(`Geocoding HTTP ${response.status}`);
  }

  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;
  if (!first) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    formatted_address: String(first.display_name || "").trim()
  };
}

async function geocodeAddressWithMapbox(query) {
  if (!ADMIN_MAPBOX_ACCESS_TOKEN) return null;

  const endpoint = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  endpoint.searchParams.set("access_token", ADMIN_MAPBOX_ACCESS_TOKEN);
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("types", "address,place,poi");
  endpoint.searchParams.set("language", "de,en,es");

  const response = await fetch(endpoint.toString(), {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Mapbox geocoding HTTP ${response.status}`);
  }

  const data = await response.json();
  const first = Array.isArray(data?.features) ? data.features[0] : null;
  if (!first || !Array.isArray(first.center) || first.center.length < 2) return null;

  const lng = Number(first.center[0]);
  const lat = Number(first.center[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    formatted_address: String(first.place_name || "").trim()
  };
}

const ADMIN_GEOCODING_PROVIDERS = {
  nominatim: geocodeAddressWithNominatim,
  mapbox: geocodeAddressWithMapbox
};

let lastAdminGeocodingRequestAt = 0;

async function adminGeocodingRateLimitWait() {
  if (!ADMIN_GEOCODING_MIN_INTERVAL_MS) return;
  const elapsed = Date.now() - lastAdminGeocodingRequestAt;
  if (elapsed >= ADMIN_GEOCODING_MIN_INTERVAL_MS) return;
  await sleep(ADMIN_GEOCODING_MIN_INTERVAL_MS - elapsed);
}

async function geocodeAdminWithRetry(provider, query) {
  const maxAttempts = Math.max(1, ADMIN_GEOCODING_MAX_RETRIES + 1);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await adminGeocodingRateLimitWait();
      const result = await provider(query);
      lastAdminGeocodingRequestAt = Date.now();
      return result;
    } catch (error) {
      lastAdminGeocodingRequestAt = Date.now();
      if (attempt >= maxAttempts) throw error;
      await sleep(250 * attempt);
    }
  }
  return null;
}

async function resolveAdminCoordinates(payload) {
  const queries = buildAdminGeocodingQueries(payload);
  if (!queries.length) throw new Error("Missing geocoding address fields");

  const provider = ADMIN_GEOCODING_PROVIDERS[ADMIN_GEOCODING_PROVIDER] || geocodeAddressWithNominatim;
  for (const query of queries) {
    const coordinates = await geocodeAdminWithRetry(provider, query);
    if (!coordinates) continue;
    return {
      ...coordinates,
      geocoding_query: query
    };
  }

  throw new Error("No geocoding result");
}

async function updateEventLocationWithGeocoding(eventData, locationUpdates = {}) {
  const nextLocation = {
    ...eventData,
    ...locationUpdates
  };
  const coordinates = await resolveAdminCoordinates(nextLocation);
  const payload = {
    ...locationUpdates,
    geocoding_query: coordinates.geocoding_query,
    lat: coordinates.lat,
    lng: coordinates.lng
  };

  if (coordinates.formatted_address) {
    payload.formatted_address = coordinates.formatted_address;
  }

  await updateEventWithFallback(eventData.id, payload);
  return coordinates;
}

function normalizeEvent(event) {
  const status = String(event.status || "").toLowerCase();
  const normalizeRecurrenceType = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "weekly" || normalized === "monthly") return normalized;
    return "none";
  };
  const recurrenceType = normalizeRecurrenceType(event.recurrence_type);
  return {
    id: event.id,
    name: event.name || "-",
    title: event.title || event.name || "",
    title_es: event.title_es || "",
    title_de: event.title_de || "",
    title_en: event.title_en || "",
    location_name: event.location_name || "",
    address: event.address || event.street || "",
    street: event.street || event.address || "",
    postal_code: event.postal_code || "",
    city: event.city || "",
    country: event.country || "",
    formatted_address: event.formatted_address || "",
    geocoding_query: event.geocoding_query || "",
    event_date: event.event_date || "",
    event_time: event.event_time || "",
    end_time: event.end_time || "",
    genre: event.genre || "",
    category: event.category || event.genre || "",
    price_text: event.price_text || "",
    description: event.description || "",
    description_es: event.description_es || event.descrption_es || "",
    description_de: event.description_de || event.descrption_de || "",
    description_en: event.description_en || event.descrption_en || "",
    artist_name: event.artist_name || "",
    tags: event.tags ?? null,
    submitted_by: event.submitted_by || "",
    contact_email: event.contact_email || "",
    status: VALID_STATUS.has(status) ? status : "pending",
    verification_notes: event.verification_notes || "",
    image_url: resolvePrimaryImageUrl(event),
    image_urls: event.image_urls ?? null,
    lat: parseCoordinate(event.lat),
    lng: parseCoordinate(event.lng),
    recurrence_type: recurrenceType,
    recurrence_start_date: String(event.recurrence_start_date || "").trim(),
    recurrence_end_date: String(event.recurrence_end_date || "").trim(),
    recurrence_weekday:
      recurrenceType === "weekly" && Number.isInteger(Number(event.recurrence_weekday))
        ? Number(event.recurrence_weekday)
        : null,
    recurrence_day_of_month:
      recurrenceType === "monthly" && Number.isInteger(Number(event.recurrence_day_of_month))
        ? Number(event.recurrence_day_of_month)
        : null,
    featured: Boolean(event.featured),
    promoted: Boolean(event.promoted)
  };
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "short"
  }).format(parsed);
}

function formatDateTime(event) {
  return `${formatDate(event.event_date)} ${event.event_time || "tbd"}`.trim();
}

function recurrenceLabel(event) {
  if (event.recurrence_type === "weekly") return "Wöchentlich";
  if (event.recurrence_type === "monthly") return "Monatlich";
  return "Einmalig";
}

function recurrenceDetails(event) {
  if (event.recurrence_type === "weekly") {
    const weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const weekdayLabel =
      Number.isInteger(event.recurrence_weekday) && event.recurrence_weekday >= 0 && event.recurrence_weekday <= 6
        ? weekdays[event.recurrence_weekday]
        : "-";
    const start = event.recurrence_start_date ? formatDate(event.recurrence_start_date) : "-";
    const end = event.recurrence_end_date ? formatDate(event.recurrence_end_date) : "offen";
    return `Tag: ${weekdayLabel}, ab ${start}, bis ${end}`;
  }
  if (event.recurrence_type === "monthly") {
    const day = Number.isInteger(event.recurrence_day_of_month) ? event.recurrence_day_of_month : "-";
    const start = event.recurrence_start_date ? formatDate(event.recurrence_start_date) : "-";
    const end = event.recurrence_end_date ? formatDate(event.recurrence_end_date) : "offen";
    return `Tag ${day}, ab ${start}, bis ${end}`;
  }
  return "Kein Wiederholungsmuster";
}

function eventPlace(event) {
  return [event.location_name, event.address, event.city, event.country].filter(Boolean).join(", ") || "-";
}

function statusPillClass(status) {
  if (status === "approved") return "status-pill status-pill--approved";
  if (status === "rejected") return "status-pill status-pill--rejected";
  return "status-pill status-pill--pending";
}

function statusLabel(status) {
  if (status === "approved") return "Freigegeben";
  if (status === "rejected") return "Abgelehnt";
  return "Ausstehend";
}

function updateCounts() {
  const all = state.allEvents.length;
  const pend = state.allEvents.filter((event) => event.status === "pending").length;
  const appr = state.allEvents.filter((event) => event.status === "approved").length;
  const rej = state.allEvents.filter((event) => event.status === "rejected").length;
  if (dom.countAll) dom.countAll.textContent = String(all);
  if (dom.countPending) dom.countPending.textContent = String(pend);
  if (dom.countApproved) dom.countApproved.textContent = String(appr);
  if (dom.countRejected) dom.countRejected.textContent = String(rej);
  if (dom.countTabAll) dom.countTabAll.textContent = String(all);
  if (dom.countTabPending) dom.countTabPending.textContent = String(pend);
  if (dom.countTabApproved) dom.countTabApproved.textContent = String(appr);
  if (dom.countTabRejected) dom.countTabRejected.textContent = String(rej);
}

function getFilterSignature() {
  return [state.activeTab, state.search, state.city, state.genre, state.statusFilter].join("\u001e");
}

function syncFilterOptions() {
  if (!dom.cityFilter || !dom.genreFilter) return;
  const cities = [...new Set(state.allEvents.map((event) => event.city).filter(Boolean))].sort();
  const genres = [...new Set(state.allEvents.map((event) => event.genre).filter(Boolean))].sort();

  const prevCity = state.city;
  const prevGenre = state.genre;
  dom.cityFilter.innerHTML = `<option value="">Alle Städte</option>${cities
    .map((city) => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`)
    .join("")}`;
  dom.genreFilter.innerHTML = `<option value="">Alle Genres</option>${genres
    .map((genre) => `<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`)
    .join("")}`;

  state.city = cities.includes(prevCity) ? prevCity : "";
  state.genre = genres.includes(prevGenre) ? prevGenre : "";
  dom.cityFilter.value = state.city;
  dom.genreFilter.value = state.genre;
}

function applyFilters() {
  const search = state.search.trim().toLowerCase();
  const nextSig = getFilterSignature();
  if (nextSig !== state.lastFilterSignature) {
    state.lastFilterSignature = nextSig;
    state.eventListReset = true;
    state.eventsVisibleCount = EVENT_LIST_PAGE_SIZE;
  }
  state.filteredEvents = state.allEvents.filter((event) => {
    if (state.activeTab !== "all" && event.status !== state.activeTab) return false;
    if (state.statusFilter && event.status !== state.statusFilter) return false;
    if (state.city && event.city !== state.city) return false;
    if (state.genre && event.genre !== state.genre) return false;
    if (!search) return true;

    const haystack = [
      event.name,
      event.location_name,
      event.address,
      event.city,
      event.country,
      event.genre,
      event.description,
      event.submitted_by,
      event.contact_email
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });
}

function countSocialPostedToday() {
  const now = new Date();
  return socialQueueRowsFlat().filter((row) => {
    if (String(row.status || "").toLowerCase() !== "posted") return false;
    const p = row.posted_at ? new Date(row.posted_at) : null;
    return p && !Number.isNaN(p.getTime()) && isSameLocalDay(p, now);
  }).length;
}

function countWeekendEventsAhead() {
  const now = new Date();
  return state.allEvents.filter((e) => {
    if (e.status === "rejected") return false;
    const d = dateFromAdminEventWallTime(e);
    if (!d || Number.isNaN(d.getTime()) || d < now) return false;
    const day = d.getDay();
    const days = (d.getTime() - now.getTime()) / 86400000;
    return days <= 7 && (day === 0 || day === 6);
  }).length;
}

function computeDashboardStats() {
  const pending = state.allEvents.filter((e) => e.status === "pending").length;
  const failedSocial = socialQueueRowsFlat().filter((r) => String(r.status || "").toLowerCase() === "failed").length;
  const missingCoords = state.allEvents.filter(
    (e) => (e.status === "pending" || e.status === "approved") && !hasValidMarkerCoordinates(e)
  ).length;
  const upcomingFeatured = state.allEvents.filter(
    (e) => e.featured && e.status === "approved" && !isEventPast(e)
  ).length;
  return {
    pending,
    liveToday: countSocialPostedToday(),
    failedSocial,
    weekend: countWeekendEventsAhead(),
    missingCoords,
    upcomingFeatured
  };
}

function renderDashboard() {
  if (!dom.dashboardGrid) return;
  const s = computeDashboardStats();
  dom.dashboardGrid.innerHTML = `
    <button type="button" class="admin-dash-card" data-admin-dash="pending">
      <span class="admin-dash-card__k">${s.pending}</span>
      <span class="admin-dash-card__t">Ausstehend</span>
      <span class="admin-dash-card__s">Moderation</span>
    </button>
    <button type="button" class="admin-dash-card admin-dash-card--accent" data-admin-dash="live-today">
      <span class="admin-dash-card__k">${s.liveToday}</span>
      <span class="admin-dash-card__t">Live heute</span>
      <span class="admin-dash-card__s">Social · posted</span>
    </button>
    <button type="button" class="admin-dash-card admin-dash-card--warn" data-admin-dash="failed">
      <span class="admin-dash-card__k">${s.failedSocial}</span>
      <span class="admin-dash-card__t">Social Fehler</span>
      <span class="admin-dash-card__s">Queue</span>
    </button>
    <button type="button" class="admin-dash-card" data-admin-dash="weekend">
      <span class="admin-dash-card__k">${s.weekend}</span>
      <span class="admin-dash-card__t">Wochenende</span>
      <span class="admin-dash-card__s">Events in 7 Tagen</span>
    </button>
    <button type="button" class="admin-dash-card admin-dash-card--warn" data-admin-dash="coords">
      <span class="admin-dash-card__k">${s.missingCoords}</span>
      <span class="admin-dash-card__t">Ohne Koordinaten</span>
      <span class="admin-dash-card__s">Pending &amp; OK</span>
    </button>
    <button type="button" class="admin-dash-card admin-dash-card--ok" data-admin-dash="featured">
      <span class="admin-dash-card__k">${s.upcomingFeatured}</span>
      <span class="admin-dash-card__t">Featured</span>
      <span class="admin-dash-card__s">Kommende Events</span>
    </button>
  `;
}

function renderAnalyticsBody() {
  if (!dom.analyticsBody) return;
  const s = computeDashboardStats();
  dom.analyticsBody.innerHTML = `
    <ul class="admin-analytics-list">
      <li><strong>${state.allEvents.length}</strong> Events gesamt</li>
      <li><strong>${socialQueueRowsFlat().length}</strong> Social-Queue-Zeilen</li>
      <li><strong>${s.failedSocial}</strong> fehlgeschlagene Posts</li>
      <li><strong>${s.missingCoords}</strong> ohne Marker</li>
    </ul>
    <p class="card__intro">Erweiterbar um Postiz-Metriken oder Seitenaufrufe, sobald Daten angebunden sind.</p>
  `;
}

function renderMainNav() {
  document.querySelectorAll("[data-admin-nav]").forEach((el) => {
    const active = el.dataset.adminNav === state.navSection;
    el.classList.toggle("is-active", active);
  });
  if (dom.viewDashboard) dom.viewDashboard.hidden = state.navSection !== "dashboard";
  if (dom.viewEvents) dom.viewEvents.hidden = state.navSection !== "events";
  if (dom.viewSocial) dom.viewSocial.hidden = state.navSection !== "social";
  if (dom.viewAnalytics) dom.viewAnalytics.hidden = state.navSection !== "analytics";
  if (dom.viewSettings) dom.viewSettings.hidden = state.navSection !== "settings";
  document.body.classList.toggle("admin-route-social", state.navSection === "social");
}

function setNavSection(section) {
  state.navSection = section || "dashboard";
  renderMainNav();
  if (state.navSection === "dashboard") renderDashboard();
}

function renderStatusTabs() {
  dom.statusTabs.forEach((tab) => {
    const isActive = tab.dataset.statusFilter === state.activeTab;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function renderEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card event-card--premium";
  card.dataset.eventId = String(event.id);
  const previewGenre = escapeHtml(String(event.genre || "Event").split(",")[0].trim() || "Event");
  const previewTitle = escapeHtml(event.name || "Untitled Event");
  const previewMeta = escapeHtml([event.location_name, event.city].filter(Boolean).join(" · ") || "-");
  const thumbSrc = String(event.image_url || "").trim();
  const imgTag = thumbSrc
    ? `<img class="event-card__image" data-event-preview-img src="${escapeHtml(thumbSrc)}" alt="${previewTitle}" loading="lazy" decoding="async" />`
    : `<img class="event-card__image" data-event-preview-img hidden alt="${previewTitle}" loading="lazy" decoding="async" />`;
  const previewMarkup = `
    <figure class="event-card__preview event-card__preview--hero${thumbSrc ? "" : " event-card__preview--empty"}">
      ${imgTag}
      <figcaption class="event-card__preview-overlay">
        <span class="event-card__preview-badge">${previewGenre}</span>
        <strong>${previewTitle}</strong>
        <span>${previewMeta}</span>
      </figcaption>
    </figure>
  `;
  const replaceBlock =
    event.status === "pending"
      ? `<div class="event-card__replace-row">
          <button type="button" class="btn-pill btn-pill--soft event-card__replace-btn" data-action="replace-image">Bild ersetzen</button>
          <input type="file" class="event-card__replace-input" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" data-admin-replace-input tabindex="-1" aria-hidden="true" />
        </div>`
      : "";
  const hasMarker = hasValidMarkerCoordinates(event);
  const isGeoBusy = state.geoBusyEventIds.has(String(event.id));
  const geoWarningMarkup = hasMarker
    ? ""
    : `<section class="event-card__geo-strip" aria-live="polite">
        <span class="event-card__geo-strip-text"><strong>Karte:</strong> keine Koordinaten · nicht auf der Map sichtbar</span>
        <div class="event-card__geo-strip-actions">
          <button type="button" class="btn-pill btn-pill--soft" data-action="regeocode" data-geo-action ${isGeoBusy ? "disabled" : ""}>📍 Neu berechnen</button>
          <button type="button" class="btn-pill btn-pill--soft" data-action="edit-location" data-geo-action ${isGeoBusy ? "disabled" : ""}>Standort</button>
        </div>
        <p class="event-card__geo-progress" data-geo-status ${isGeoBusy ? "" : "hidden"}>
          <span class="event-card__geo-spinner" aria-hidden="true"></span> Geocoding…
        </p>
      </section>`;
  const socialSummary = socialQueueSummary(event.id);
  const socialClass = [
    "event-card__social-pill",
    socialSummary.failed ? "event-card__social-pill--bad" : "",
    socialSummary.ready && !socialSummary.failed ? "event-card__social-pill--ok" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const socialText = socialSummary.total
    ? `${socialSummary.ready} ready · ${socialSummary.pending} geplant · ${socialSummary.failed} Fehler`
    : "Keine Social-Drafts";
  const shortNoticeInfo = shortNoticeInfoForEvent(event);
  const shortNoticeMarkup = shortNoticeInfo.active
    ? `<div class="event-card__urgent ${shortNoticeInfo.urgent ? "event-card__urgent--hot" : ""}" role="status">
        ${shortNoticeInfo.urgent ? "🔥" : "⏱"} ${shortNoticeInfo.urgent ? "Eilmeldung (<24h)" : "Kurzfristig (<96h)"}
      </div>`
    : "";
  const validationMarkup = renderValidationBadges(event);
  const metaLine = `${escapeHtml(formatDateTime(event))} · ${escapeHtml(event.city || "–")} · ${escapeHtml(recurrenceLabel(event))}`;

  let primaryRow = "";
  if (event.status === "pending") {
    primaryRow = `<div class="event-card__primary-actions">
      <button type="button" class="btn-pill btn-pill--hero btn-pill--approve" data-action="approved">✅ Freigeben</button>
      <button type="button" class="btn-pill btn-pill--hero-ghost" data-action="edit-event">✏️ Bearbeiten</button>
    </div>`;
  } else if (event.status === "approved") {
    primaryRow = `<div class="event-card__primary-actions">
      <button type="button" class="btn-pill btn-pill--hero" data-action="edit-event">✏️ Bearbeiten</button>
      <button type="button" class="btn-pill btn-pill--hero-ghost" data-action="regenerate-drafts">♻️ Drafts neu</button>
    </div>`;
  } else {
    primaryRow = `<div class="event-card__primary-actions">
      <button type="button" class="btn-pill btn-pill--hero-ghost" data-action="edit-event">✏️ Bearbeiten</button>
    </div>`;
  }

  card.innerHTML = `
    <div class="event-card__layout event-card__layout--premium">
      <div class="event-card__media-col">
        ${previewMarkup}
        ${replaceBlock}
      </div>
      <div class="event-card__body-col">
        <header class="event-card__top">
          <div class="event-card__titles">
            <h3 class="event-card__title">${escapeHtml(event.name)}</h3>
            <p class="event-card__venue">${escapeHtml([event.location_name, event.address].filter(Boolean).join(" · ") || "–")}</p>
            <p class="event-card__meta-line">${metaLine}</p>
          </div>
          <span class="${statusPillClass(event.status)} event-card__status-pill">${escapeHtml(statusLabel(event.status))}</span>
        </header>
        ${validationMarkup}
        <div class="event-card__social-row">
          <span class="${socialClass}">${escapeHtml(socialText)}</span>
        </div>
        ${shortNoticeMarkup}
        <p class="event-card__teaser">${escapeHtml((event.description || "").slice(0, 220))}${String(event.description || "").length > 220 ? "…" : ""}</p>
        ${geoWarningMarkup}
        <label class="event-card__notes">
          <span class="event-card__notes-label">Moderation</span>
          <textarea data-notes rows="2" placeholder="Interne Notizen…">${escapeHtml(event.verification_notes)}</textarea>
        </label>
        <div class="event-card__flags">
          <label class="chip-toggle ${event.featured ? "is-on" : ""}">
            <input type="checkbox" data-featured ${event.featured ? "checked" : ""} ${!state.featureColumns.featured ? "disabled" : ""}>
            Featured
          </label>
          <label class="chip-toggle ${event.promoted ? "is-on" : ""}">
            <input type="checkbox" data-promoted ${event.promoted ? "checked" : ""} ${!state.featureColumns.promoted ? "disabled" : ""}>
            Promoted
          </label>
          <button type="button" class="btn-pill btn-pill--soft" data-action="toggle-featured" title="Featured schnell umschalten">⭐ Feature</button>
        </div>
        ${primaryRow}
        <div class="event-card__secondary-actions">
          <button type="button" class="btn-pill btn-pill--outline" data-action="pending">⏸ Pending</button>
          <button type="button" class="btn-pill btn-pill--outline btn-pill--danger" data-action="rejected">❌ Ablehnen</button>
          <button type="button" class="btn-pill btn-pill--outline" data-action="save-notes">💾 Notizen</button>
          <button type="button" class="btn-pill btn-pill--outline" data-action="regeocode" data-geo-action ${isGeoBusy ? "disabled" : ""}>📍 Fix</button>
        </div>
      </div>
    </div>
  `;
  return card;
}

function renderEvents() {
  if (!dom.eventGrid || !dom.emptyState) return;
  const total = state.filteredEvents.length;
  if (!total) {
    dom.eventGrid.innerHTML = "";
    dom.emptyState.hidden = false;
    if (dom.eventSentinel) dom.eventSentinel.hidden = true;
    state.eventsRendered = 0;
    return;
  }
  dom.emptyState.hidden = true;
  if (state.eventListReset) {
    dom.eventGrid.innerHTML = "";
    state.eventsRendered = 0;
    state.eventListReset = false;
  }
  const target = Math.min(total, state.eventsVisibleCount);
  for (let i = state.eventsRendered; i < target; i++) {
    dom.eventGrid.append(renderEventCard(state.filteredEvents[i]));
  }
  state.eventsRendered = target;
  if (dom.eventSentinel) dom.eventSentinel.hidden = target >= total;
}

function render() {
  updateCounts();
  applyFilters();
  renderStatusTabs();
  renderMainNav();
  renderDashboard();
  renderAnalyticsBody();
  if (dom.settingsBuild) dom.settingsBuild.textContent = ADMIN_DASHBOARD_BUILD;
  renderSocialQueuePanel();
  if (state.navSection === "events") {
    renderEvents();
  }
}

function isSameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function socialQueueRowsFlat() {
  return [...state.socialQueueByEvent.values()].flat();
}

function socialQueueRowMatchesFilter(row) {
  const filter = state.socialQueueFilter;
  const status = String(row.status || "pending").toLowerCase();
  if (filter === "all") return true;
  if (filter === "draft") return status === "posted";
  if (filter === "today") {
    const scheduled = new Date(row.scheduled_at);
    return !Number.isNaN(scheduled.getTime()) && scheduled >= new Date() && isSameLocalDay(scheduled, new Date());
  }
  return status === filter;
}

function socialQueueEventTitle(eventId) {
  return state.allEvents.find((event) => String(event.id) === String(eventId))?.name || String(eventId || "-");
}

function formatAdminDateTime(raw) {
  if (!raw) return "-";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? String(raw) : parsed.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function platformVisual(platform) {
  const p = String(platform || "").toLowerCase();
  if (p === "instagram") return { icon: "📸", label: "Instagram" };
  if (p === "facebook") return { icon: "📘", label: "Facebook" };
  return { icon: "🌐", label: platform || "-" };
}

function socialQueueStatusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "posted") return "ok";
  if (s === "failed") return "bad";
  if (s === "processing") return "progress";
  if (s === "skipped") return "muted";
  return "pending";
}

function renderSocialQueuePanel() {
  if (!dom.socialQueuePanel) return;
  dom.socialQueueFilters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.socialFilter === state.socialQueueFilter);
  });
  const rows = socialQueueRowsFlat().filter(socialQueueRowMatchesFilter);
  if (!rows.length) {
    dom.socialQueuePanel.innerHTML = `<p class="empty-state empty-state--premium">Keine Einträge für diesen Filter.</p>`;
    return;
  }
  dom.socialQueuePanel.innerHTML = rows
    .map((row) => {
      const ev = state.allEvents.find((e) => String(e.id) === String(row.event_id));
      const thumb = String(row.resolved_image_url || ev?.image_url || "").trim();
      const cap = String(row.caption || "");
      const pv = platformVisual(row.platform);
      const tone = socialQueueStatusTone(row.status);
      const thumbInner = thumb
        ? `<img src="${escapeHtml(thumb)}" alt="" loading="lazy" class="admin-sq-card__thumb-img" />`
        : `<span class="admin-sq-card__thumb-fallback">${pv.icon}</span>`;
      return `
        <article class="admin-sq-card" data-queue-id="${escapeHtml(row.id)}" data-event-id="${escapeHtml(row.event_id)}">
          <div class="admin-sq-card__thumb">${thumbInner}</div>
          <div class="admin-sq-card__main">
            <header class="admin-sq-card__head">
              <span class="admin-sq-card__platform" title="${escapeHtml(pv.label)}">${pv.icon} ${escapeHtml(pv.label)}</span>
              <span class="admin-sq-badge admin-sq-badge--${tone}">${escapeHtml(row.status || "-")}</span>
            </header>
            <h3 class="admin-sq-card__title">${escapeHtml(socialQueueEventTitle(row.event_id))}</h3>
            <p class="admin-sq-card__when">🗓 ${escapeHtml(formatAdminDateTime(row.scheduled_at))}
              <span class="admin-sq-card__retry"> · Retry ${escapeHtml(String(row.retry_count ?? 0))}</span>
            </p>
            <details class="admin-sq-caption">
              <summary>Caption ${cap.length ? `(${cap.length} Zeichen)` : ""}</summary>
              <div class="admin-sq-caption__body">${cap ? escapeHtml(cap) : "—"}</div>
            </details>
            ${
              row.last_error
                ? `<p class="admin-sq-card__err">${escapeHtml(String(row.last_error).slice(0, 280))}</p>`
                : ""
      }
            <div class="admin-sq-card__actions">
              <button type="button" class="btn-pill btn-pill--soft" data-queue-action="open-event">Event</button>
              <button type="button" class="btn-pill btn-pill--soft" data-queue-action="copy-caption">Copy</button>
              <button type="button" class="btn-pill btn-pill--soft" data-queue-action="open-image">Bild</button>
              <button type="button" class="btn-pill btn-pill--soft" data-queue-action="retry">Retry</button>
              <button type="button" class="btn-pill btn-pill--soft" data-queue-action="regenerate">Neu</button>
              <button type="button" class="btn-pill btn-pill--soft btn-pill--danger" data-queue-action="delete">Löschen</button>
            </div>
          </div>
        </article>`;
    })
    .join("");
}

function parseMissingColumn(error) {
  const text = [error?.message, error?.details, error?.hint].filter(Boolean).join(" | ");
  const raw = text.match(/could not find the ['"]([^'"]+)['"] column/i)?.[1]
    || text.match(/column ["']([^"']+)["'] does not exist/i)?.[1];
  if (!raw) return "";
  return String(raw).split(".").pop().replace(/["']/g, "").trim();
}

function removeMissingColumnFromPayload(payload, error) {
  const missing = parseMissingColumn(error);
  if (!missing || !Object.prototype.hasOwnProperty.call(payload, missing)) return false;
  delete payload[missing];
  if (missing === "featured") state.featureColumns.featured = false;
  if (missing === "promoted") state.featureColumns.promoted = false;
  return true;
}

async function updateEventWithFallback(eventId, updates) {
  const client = supabaseClient();
  const payload = { ...updates };
  const maxAttempts = Object.keys(payload).length + 1;
  let lastError = null;
  let lastData = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data, error } = await client
      .from("events")
      .update(payload)
      .eq("id", eventId)
      .select("id,status")
      .limit(1);
    lastData = data;
    if (!error) {
      if (!Array.isArray(data) || !data.length) {
        throw new Error("No row updated. Check admin role and RLS policies.");
      }
      return data[0];
    }
    lastError = error;
    if (!removeMissingColumnFromPayload(payload, error)) break;
  }

  throw new Error(lastError?.message || "Update failed");
}

async function loadSocialQueueRows() {
  const client = supabaseClient();
  const { data, error } = await client
    .from("social_queue")
    .select("id,event_id,platform,scheduled_at,status,last_error,posted_at,created_at,retry_count,caption,caption_template_id,resolved_image_url")
    .order("scheduled_at", { ascending: true });
  if (error) {
    console.warn("Social queue konnte nicht geladen werden:", error);
    state.socialQueueByEvent = new Map();
    return;
  }
  const grouped = new Map();
  for (const row of data || []) {
    const key = String(row.event_id || "");
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  state.socialQueueByEvent = grouped;
}

async function ensureSocialReviewQueueForEvent(event) {
  const candidates = buildSocialReviewQueueRows(event);
  if (!candidates.length) return 0;
  const client = supabaseClient();
  const { data: existing, error: existingError } = await client
    .from("social_queue")
    .select("platform,scheduled_at,status")
    .eq("event_id", event.id);
  if (existingError) throw new Error(existingError.message || "Social Queue konnte nicht geprüft werden.");

  const existingKeys = new Set(
    (existing || []).map((row) => `${row.platform}:${new Date(row.scheduled_at).toISOString()}`)
  );
  const eventStart = dateFromAdminEventWallTime(event);
  const now = new Date();
  const hasRecentLastCall = (candidate) => {
    if (candidate._slot_id !== "short_notice_last_call" || !eventStart) return false;
    return (existing || []).some((row) => {
      if (String(row.platform) !== String(candidate.platform)) return false;
      if (String(row.status || "").toLowerCase() === "skipped") return false;
      const scheduled = new Date(row.scheduled_at);
      if (Number.isNaN(scheduled.getTime())) return false;
      return scheduled >= new Date(now.getTime() - 6 * 3600000) && scheduled < eventStart;
    });
  };
  const missing = candidates.filter((row) => {
    if (hasRecentLastCall(row)) return false;
    return !existingKeys.has(`${row.platform}:${row.scheduled_at}`);
  });
  if (!missing.length) return 0;

  const insertRows = missing.map(({ _slot_id, ...row }) => row);
  const { error } = await client.from("social_queue").insert(insertRows);
  if (error) throw new Error(error.message || "Social Queue konnte nicht erstellt werden.");
  return missing.length;
}

async function regenerateSocialDraftsForEvent(event) {
  const client = supabaseClient();
  await client
    .from("social_queue")
    .delete()
    .eq("event_id", event.id)
    .in("status", ["pending", "failed", "skipped"]);
  return ensureSocialReviewQueueForEvent(event);
}

async function retrySocialQueueRow(queueId) {
  const client = supabaseClient();
  const { error } = await client
    .from("social_queue")
    .update({
      status: "pending",
      last_error: null,
      last_attempt_at: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", queueId);
  if (error) throw new Error(error.message || "Retry failed.");
}

async function deleteSocialQueueRow(queueId) {
  const client = supabaseClient();
  const { error } = await client.from("social_queue").delete().eq("id", queueId);
  if (error) throw new Error(error.message || "Delete failed.");
}

function findSocialQueueRow(queueId) {
  return socialQueueRowsFlat().find((row) => String(row.id) === String(queueId));
}

function readJsonField(rawValue, fallback = null) {
  const value = String(rawValue || "").trim();
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("JSON field is invalid.");
  }
}

function hasLocationChanged(event, payload) {
  return ["location_name", "address", "postal_code", "city", "country"].some((key) =>
    String(event?.[key] || "").trim() !== String(payload?.[key] || "").trim()
  );
}

function eventEditPayloadFromForm(form) {
  const formData = new FormData(form);
  const latRaw = String(formData.get("lat") || "").trim();
  const lngRaw = String(formData.get("lng") || "").trim();
  const tagsRaw = String(formData.get("tags") || "").trim();
  const payload = {
    name: String(formData.get("title") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    title_es: String(formData.get("title_es") || "").trim() || null,
    title_de: String(formData.get("title_de") || "").trim() || null,
    title_en: String(formData.get("title_en") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    description_es: String(formData.get("description_es") || "").trim() || null,
    description_de: String(formData.get("description_de") || "").trim() || null,
    description_en: String(formData.get("description_en") || "").trim() || null,
    genre: String(formData.get("category") || "").trim() || null,
    category: String(formData.get("category") || "").trim() || null,
    event_date: String(formData.get("event_date") || "").trim() || null,
    event_time: String(formData.get("event_time") || "").trim() || null,
    end_time: String(formData.get("end_time") || "").trim() || null,
    location_name: String(formData.get("location_name") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    street: String(formData.get("address") || "").trim() || null,
    postal_code: String(formData.get("postal_code") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    country: String(formData.get("country") || "").trim() || null,
    artist_name: String(formData.get("artist_name") || "").trim() || null,
    price_text: String(formData.get("price_text") || "").trim() || null,
    image_url: String(formData.get("image_url") || "").trim() || null,
    image_urls: readJsonField(formData.get("image_urls"), null),
    tags: tagsRaw ? tagsRaw.split(",").map((tag) => tag.trim()).filter(Boolean) : null,
    verification_notes: String(formData.get("verification_notes") || "").trim() || null
  };
  if (latRaw || lngRaw) {
    const lat = parseCoordinate(latRaw);
    const lng = parseCoordinate(lngRaw);
    if (lat === null || lng === null) throw new Error("Coordinates are invalid.");
    payload.lat = lat;
    payload.lng = lng;
  } else {
    payload.lat = null;
    payload.lng = null;
  }
  return payload;
}

async function loadEvents() {
  const client = supabaseClient();
  const { data, error } = await client.from("events").select("*").order("event_date", { ascending: true });
  if (error) throw error;
  state.allEvents = (data || []).map(normalizeEvent);
  await loadSocialQueueRows();
  syncFilterOptions();
  render();
}

async function checkSession() {
  const client = supabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  state.adminSession = data?.session || null;
  return state.adminSession;
}

async function signInWithPassword(email, password) {
  const client = supabaseClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

async function signOut() {
  const client = supabaseClient();
  await client.auth.signOut();
}

function renderAuthState() {
  const isAdmin = isSessionAdmin(state.adminSession);
  if (dom.authCard) dom.authCard.hidden = isAdmin;
  if (dom.workspace) dom.workspace.hidden = !isAdmin;
  if (dom.headerSignOutButton) dom.headerSignOutButton.hidden = !isAdmin;
  document.body.classList.toggle("admin-is-logged-in", Boolean(isAdmin));
  document.querySelector(".admin-header")?.classList.toggle("admin-header--compact-hidden", Boolean(isAdmin));
  if (dom.sessionInfo) {
    dom.sessionInfo.textContent = isAdmin ? `${state.adminSession?.user?.email || "-"}` : "–";
  }
}

function findEventByCard(cardElement) {
  const eventId = cardElement?.dataset?.eventId;
  return state.allEvents.find((event) => String(event.id) === String(eventId));
}

function setCardGeoBusy(card, eventId, busy) {
  const id = String(eventId || "");
  if (busy) state.geoBusyEventIds.add(id);
  else state.geoBusyEventIds.delete(id);
  if (!card) return;
  card.classList.toggle("is-geo-busy", busy);
  card.querySelectorAll("[data-geo-action]").forEach((geoButton) => {
    geoButton.disabled = busy;
  });
  const status = card.querySelector("[data-geo-status]");
  if (status) status.hidden = !busy;
}

function markGeoPulse(eventId) {
  const id = String(eventId || "");
  if (!id) return;
  state.geoPulseEventIds.add(id);
  const escapedId = window.CSS?.escape ? window.CSS.escape(id) : id.replace(/"/g, '\\"');
  const cardEl = document.querySelector(`.event-card[data-event-id="${escapedId}"]`);
  cardEl?.classList.add("is-geo-success-flash");
  window.setTimeout(() => {
    state.geoPulseEventIds.delete(id);
    cardEl?.classList.remove("is-geo-success-flash");
  }, 2400);
}

async function handleRegeocodeEvent(eventData, card, button) {
  setCardGeoBusy(card, eventData.id, true);
  if (button) button.disabled = true;
  setGlobalFeedback("Standort wird geprüft...", "info");
  try {
    await updateEventLocationWithGeocoding(eventData);
    setCardGeoBusy(card, eventData.id, false);
    markGeoPulse(eventData.id);
    setGlobalFeedback("Koordinaten aktualisiert.", "success");
    await loadEvents();
  } catch (error) {
    console.error("Admin geocoding failed:", error);
    setGlobalFeedback("Standort konnte nicht gefunden werden.", "error");
  } finally {
    setCardGeoBusy(card, eventData.id, false);
  }
}

function openAdminLocationModal(eventData) {
  const overlay = document.createElement("div");
  overlay.className = "admin-location-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Standort bearbeiten");

  overlay.innerHTML = `
    <div class="admin-location-dialog">
      <h3 class="admin-location-title">Standort bearbeiten</h3>
      <p class="admin-location-hint">Aktualisiere die Location-Daten und berechne danach den Karten-Marker neu.</p>
      <form class="admin-location-form" autocomplete="off">
        <label class="field">
          <span>Venue / Location</span>
          <input name="location_name" type="text" value="${escapeHtml(eventData.location_name)}" placeholder="z. B. Beach Club">
        </label>
        <label class="field">
          <span>Straße</span>
          <input name="address" type="text" value="${escapeHtml(eventData.address)}" placeholder="z. B. Paseo Marítimo 1">
        </label>
        <div class="admin-location-grid">
          <label class="field">
            <span>PLZ</span>
            <input name="postal_code" type="text" value="${escapeHtml(eventData.postal_code)}" placeholder="29660">
          </label>
          <label class="field">
            <span>Stadt</span>
            <input name="city" type="text" value="${escapeHtml(eventData.city)}" placeholder="Marbella">
          </label>
        </div>
        <label class="field">
          <span>Land</span>
          <input name="country" type="text" value="${escapeHtml(eventData.country)}" placeholder="Spain">
        </label>
        <p class="admin-location-status" data-location-status hidden>
          <span class="event-card__geo-spinner" aria-hidden="true"></span>
          Standort wird geprüft...
        </p>
        <div class="admin-location-actions">
          <button type="button" class="button-secondary" data-location-cancel>Abbrechen</button>
          <button type="submit" class="button-secondary button-secondary--primary" data-location-submit>Speichern &amp; neu geocoden</button>
        </div>
      </form>
    </div>
  `;

  const form = overlay.querySelector(".admin-location-form");
  const btnCancel = overlay.querySelector("[data-location-cancel]");
  const btnSubmit = overlay.querySelector("[data-location-submit]");
  const status = overlay.querySelector("[data-location-status]");

  const setModalBusy = (busy) => {
    overlay.classList.toggle("is-busy", busy);
    form?.querySelectorAll("input, button").forEach((control) => {
      control.disabled = busy;
    });
    if (status) status.hidden = !busy;
  };

  const close = () => {
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("is-busy")) {
      e.preventDefault();
      close();
    }
  };

  btnCancel?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay && !overlay.classList.contains("is-busy")) close();
  });

  form?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const formData = new FormData(form);
    const locationUpdates = {
      location_name: String(formData.get("location_name") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      street: String(formData.get("address") || "").trim(),
      postal_code: String(formData.get("postal_code") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      country: String(formData.get("country") || "").trim()
    };
    locationUpdates.geocoding_query =
      composeAdminGeocodingQuery(locationUpdates)
      || [locationUpdates.location_name, locationUpdates.city, locationUpdates.country].filter(Boolean).join(", ");

    setModalBusy(true);
    state.geoBusyEventIds.add(String(eventData.id));
    setGlobalFeedback("Standort wird geprüft...", "info");
    try {
      await updateEventLocationWithGeocoding(eventData, locationUpdates);
      state.geoBusyEventIds.delete(String(eventData.id));
      markGeoPulse(eventData.id);
      setGlobalFeedback("Koordinaten aktualisiert.", "success");
      close();
      await loadEvents();
    } catch (error) {
      console.error("Admin location save/geocoding failed:", error);
      setGlobalFeedback("Standort konnte nicht gefunden werden.", "error");
    } finally {
      state.geoBusyEventIds.delete(String(eventData.id));
      setModalBusy(false);
    }
  });

  document.body.appendChild(overlay);
  document.addEventListener("keydown", onKeyDown);
  btnSubmit?.focus();
}

function disposeEditorLocationAutocomplete() {
  if (typeof editorLocationAutocompleteDispose === "function") {
    try {
      editorLocationAutocompleteDispose();
    } catch (_err) {
      /* ignore */
    }
  }
  editorLocationAutocompleteDispose = null;
  editorPlacesHideSuggestionsFn = null;
}

function getGooglePlacesApiKeyForAdmin() {
  return (
    window.VITE_GOOGLE_MAPS_API_KEY
    || window.__ENV__?.VITE_GOOGLE_MAPS_API_KEY
    || window.PARTYRADAR_GOOGLE_PLACES_KEY
    || window.PARTYRADAR_GOOGLE_MAPS_KEY
    || document.querySelector('meta[name="vite-google-maps-api-key"]')?.getAttribute("content")
    || document.querySelector('meta[name="partyradar-google-places-key"]')?.getAttribute("content")
    || ""
  ).toString().trim();
}

function normalizeGooglePlaceIdAdmin(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  return s.startsWith("places/") ? s.slice("places/".length) : s;
}

function getPlacesTextAdmin(tv) {
  if (!tv) return "";
  if (typeof tv === "string") return tv.trim();
  if (typeof tv?.text === "string") return tv.text.trim();
  return "";
}

function buildPlacesSuggestionsAdmin(predictions) {
  return (Array.isArray(predictions) ? predictions : [])
    .map((prediction) => {
      if (!prediction || typeof prediction !== "object") return null;
      const suggestionText =
        getPlacesTextAdmin(prediction.text)
        || getPlacesTextAdmin(prediction.structuredFormat?.mainText)
        || String(prediction.description || "").trim();
      const secondaryText = getPlacesTextAdmin(prediction.structuredFormat?.secondaryText);
      const rawId =
        prediction.placeId
        || prediction.place_id
        || prediction.place
        || prediction.placeResource
        || "";
      const placeId = normalizeGooglePlaceIdAdmin(rawId);
      if (!suggestionText || !placeId) return null;
      return { placeId, suggestionText, secondaryText };
    })
    .filter(Boolean);
}

async function fetchGooglePlacesAutocompletePredictionsAdmin(searchInput, sessionToken) {
  const apiKey = getGooglePlacesApiKeyForAdmin();
  if (!apiKey) return [];
  const endpoint = "https://places.googleapis.com/v1/places:autocomplete";
  console.log("admin autocomplete request", { len: String(searchInput || "").length });
  const fieldMasks = [
    "suggestions.placePrediction",
    "suggestions.placePrediction.placeId,suggestions.placePrediction.place,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat"
  ];
  let lastRaw = "";
  let lastResponse = null;
  for (let maskIndex = 0; maskIndex < fieldMasks.length; maskIndex += 1) {
    const fieldMask = fieldMasks[maskIndex];
    lastResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask
      },
      body: JSON.stringify({
        input: searchInput,
        languageCode: "de",
        sessionToken
      })
    });
    lastRaw = await lastResponse.text();
    if (lastResponse.ok) break;
    if (lastResponse.status === 400 && maskIndex === 0) {
      console.warn("admin autocomplete error", "Places autocomplete 400 — retrying with explicit field mask");
      continue;
    }
    break;
  }
  let data = {};
  try {
    data = lastRaw ? JSON.parse(lastRaw) : {};
  } catch (_err) {
    console.warn("admin autocomplete error", "Places autocomplete: invalid JSON body");
    throw new Error(`Places autocomplete HTTP ${lastResponse?.status || 0}`);
  }
  if (!lastResponse?.ok) {
    console.warn("admin autocomplete error", lastResponse?.status, lastRaw.slice(0, 400));
    throw new Error(`Places autocomplete HTTP ${lastResponse?.status || 0}`);
  }
  const preds = Array.isArray(data?.suggestions)
    ? data.suggestions
        .map((entry) => entry?.placePrediction || entry?.place_prediction)
        .filter(Boolean)
    : [];
  const built = buildPlacesSuggestionsAdmin(preds);
  console.log("admin autocomplete results", { count: built.length });
  return built;
}

function extractAddressPartAdmin(addressComponents, type) {
  const match = (Array.isArray(addressComponents) ? addressComponents : []).find(
    (part) => Array.isArray(part?.types) && part.types.includes(type)
  );
  return String(match?.longText || match?.shortText || "").trim();
}

function resolveCityFromAddressComponentsAdmin(addressComponents) {
  return (
    extractAddressPartAdmin(addressComponents, "locality")
    || extractAddressPartAdmin(addressComponents, "postal_town")
    || extractAddressPartAdmin(addressComponents, "administrative_area_level_2")
    || extractAddressPartAdmin(addressComponents, "administrative_area_level_1")
  );
}

function resolveProvinceFromAddressComponentsAdmin(addressComponents) {
  return (
    extractAddressPartAdmin(addressComponents, "administrative_area_level_2")
    || extractAddressPartAdmin(addressComponents, "administrative_area_level_1")
  );
}

function resolveRegionFromAddressComponentsAdmin(addressComponents) {
  return extractAddressPartAdmin(addressComponents, "administrative_area_level_1");
}

function resolveStreetFromAddressComponentsAdmin(addressComponents) {
  const route = extractAddressPartAdmin(addressComponents, "route");
  const streetNumber = extractAddressPartAdmin(addressComponents, "street_number");
  const premise = extractAddressPartAdmin(addressComponents, "premise");
  const subpremise = extractAddressPartAdmin(addressComponents, "subpremise");
  const street = [route, streetNumber].filter(Boolean).join(" ").trim();
  if (street) return street;
  return [premise, subpremise].filter(Boolean).join(" ").trim();
}

function splitFormattedAddressPartsAdmin(formattedAddress) {
  return String(formattedAddress || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parsePostalCodeAndCityFromFormattedAddressAdmin(formattedAddress) {
  const parts = splitFormattedAddressPartsAdmin(formattedAddress);
  if (!parts.length) return { postal_code: "", city: "" };
  const candidates = [...parts].reverse();
  const cityPart = candidates.find((part) => /\d/.test(part));
  if (!cityPart) {
    return { postal_code: "", city: parts[parts.length - 2] || "" };
  }
  const postalMatch = cityPart.match(/\b(?:\d{4,6}|[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  const postal_code = postalMatch ? postalMatch[0] : "";
  const city = cityPart.replace(postal_code, "").replace(/\s{2,}/g, " ").trim();
  return { postal_code, city: city || parts[parts.length - 2] || "" };
}

function resolveFallbackCountryFromFormattedAddressAdmin(formattedAddress) {
  const parts = splitFormattedAddressPartsAdmin(formattedAddress);
  if (!parts.length) return "";
  return parts[parts.length - 1] || "";
}

function resolveFallbackCityFromFormattedAddressAdmin(formattedAddress) {
  return parsePostalCodeAndCityFromFormattedAddressAdmin(formattedAddress).city || "";
}

function normalizeCountryNameAdmin(countryValue) {
  const raw = String(countryValue || "").trim();
  if (!raw) return "";
  const aliases = {
    espana: "Spain",
    "españa": "Spain",
    spain: "Spain",
    germany: "Germany",
    deutschland: "Germany",
    france: "France",
    portugal: "Portugal",
    italia: "Italy",
    italy: "Italy",
    uk: "United Kingdom",
    "united kingdom": "United Kingdom",
    usa: "United States",
    "united states": "United States",
    osterreich: "Austria",
    österreich: "Austria",
    austria: "Austria",
    schweiz: "Switzerland",
    switzerland: "Switzerland",
    nederland: "Netherlands",
    netherlands: "Netherlands",
    holland: "Netherlands"
  };
  const normalized = raw.toLowerCase();
  return aliases[normalized] || raw;
}

async function fetchAddressDetailsWithNominatimAdmin(queryText) {
  const query = String(queryText || "").trim();
  if (!query) return null;
  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("addressdetails", "1");
  endpoint.searchParams.set("q", query);
  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "de,en,es",
      "User-Agent": "Marcha/1.0 (admin places enrich)"
    }
  });
  if (!response.ok) return null;
  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;
  if (!first || typeof first !== "object") return null;
  const address = first.address || {};
  const postalCode = String(address.postcode || "").trim();
  const country = normalizeCountryNameAdmin(String(address.country || "").trim());
  const city = String(
    address.city || address.town || address.village || address.municipality || address.county || ""
  ).trim();
  const street = String(
    address.road || address.pedestrian || address.footway || address.cycleway || address.path || ""
  ).trim();
  return { postal_code: postalCode, country, city, street };
}

async function enrichPlaceDataWithFallbackAddressDetailsAdmin(placeData) {
  if (!placeData || typeof placeData !== "object") return placeData;
  const missingPostal = !String(placeData.postal_code || "").trim();
  const missingCountry = !String(placeData.country || "").trim();
  const missingCity = !String(placeData.city || "").trim();
  if (!missingPostal && !missingCountry && !missingCity) return placeData;
  const query = [placeData.formatted_address, placeData.location_name, placeData.street].filter(Boolean).join(", ");
  if (!query) return placeData;
  try {
    const fallbackDetails = await fetchAddressDetailsWithNominatimAdmin(query);
    if (!fallbackDetails) return placeData;
    return {
      ...placeData,
      postal_code: placeData.postal_code || fallbackDetails.postal_code || "",
      country: placeData.country || fallbackDetails.country || "",
      city: placeData.city || fallbackDetails.city || "",
      street: placeData.street || fallbackDetails.street || ""
    };
  } catch (_error) {
    return placeData;
  }
}

async function fetchGooglePlaceDetailsAdmin(placeId) {
  const apiKey = getGooglePlacesApiKeyForAdmin();
  if (!apiKey) throw new Error("Google Places API key missing");
  const normalizedPlaceId = normalizeGooglePlaceIdAdmin(placeId);
  if (!normalizedPlaceId) throw new Error("Google place id missing");
  const endpoint = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(normalizedPlaceId)}`);
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("fields", "id,displayName,formattedAddress,addressComponents,location");
  const response = await fetch(endpoint.toString(), {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`Place details HTTP ${response.status}`);
  }
  const place = await response.json();
  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  const addressComponents = place?.addressComponents || [];
  const street = resolveStreetFromAddressComponentsAdmin(addressComponents);
  const formattedAddress = String(place?.formattedAddress || "").trim();
  const fallbackPostalCity = parsePostalCodeAndCityFromFormattedAddressAdmin(formattedAddress);
  const cityFromComponents = resolveCityFromAddressComponentsAdmin(addressComponents);
  const countryFromComponents = extractAddressPartAdmin(addressComponents, "country");
  return {
    place_id: normalizeGooglePlaceIdAdmin(place?.id || normalizedPlaceId),
    location_name: String(place?.displayName?.text || "").trim(),
    formatted_address: formattedAddress,
    street,
    city: cityFromComponents || resolveFallbackCityFromFormattedAddressAdmin(formattedAddress),
    postal_code: extractAddressPartAdmin(addressComponents, "postal_code") || fallbackPostalCity.postal_code,
    province: resolveProvinceFromAddressComponentsAdmin(addressComponents),
    region: resolveRegionFromAddressComponentsAdmin(addressComponents),
    country: countryFromComponents || resolveFallbackCountryFromFormattedAddressAdmin(formattedAddress),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null
  };
}

function buildFallbackPlaceDataFromSuggestionAdmin(map, placeId) {
  const suggestion = map.get(placeId);
  if (!suggestion) return null;
  const primary = String(suggestion.suggestionText || "").trim();
  const secondary = String(suggestion.secondaryText || "").trim();
  const primaryParts = primary.split(",").map((p) => p.trim()).filter(Boolean);
  const venueName = primaryParts[0] || primary;
  const streetFromPrimary = primaryParts.slice(1).join(", ").trim();
  const formattedAddress = [primary, secondary].filter(Boolean).join(", ");
  const parsed = parsePostalCodeAndCityFromFormattedAddressAdmin(secondary || formattedAddress);
  const city = parsed.city || "";
  const country = resolveFallbackCountryFromFormattedAddressAdmin(formattedAddress);
  const street = streetFromPrimary || primary;
  return {
    place_id: String(placeId || "").trim(),
    location_name: venueName,
    formatted_address: formattedAddress,
    street,
    city,
    postal_code: parsed.postal_code || "",
    province: "",
    region: "",
    country,
    lat: null,
    lng: null
  };
}

function pickAdminEditorFormField(form, name) {
  if (!form?.querySelector) return "";
  const el = form.querySelector(`input[name="${name}"], textarea[name="${name}"]`);
  return String(el?.value ?? "").trim();
}

function buildAdminEditorLocationSearchText(form) {
  if (!form) return "";
  const parts = [
    pickAdminEditorFormField(form, "location_name"),
    pickAdminEditorFormField(form, "address"),
    pickAdminEditorFormField(form, "postal_code"),
    pickAdminEditorFormField(form, "city"),
    pickAdminEditorFormField(form, "country")
  ].filter(Boolean);
  return parts.join(" ").trim();
}

function buildAdminEditorMapIframeHtml(lat, lng) {
  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
    throw new Error("admin editor map: lat/lng not finite");
  }
  if (Math.abs(latN) > 90 || Math.abs(lngN) > 180) {
    throw new Error("admin editor map: lat/lng out of range");
  }
  const half = 0.02;
  const minLng = lngN - half;
  const minLat = latN - half;
  const maxLng = lngN + half;
  const maxLat = latN + half;
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
  const marker = `${latN},${lngN}`;
  return `<iframe class="admin-editor-map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Karte"
          src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}"></iframe>`;
}

function setAdminEditorCoordsWarning(form, visible) {
  const el = form?.querySelector?.("[data-editor-coords-warning]");
  if (!el) return;
  el.hidden = !visible;
}

function refreshAdminEditorMapInForm(form) {
  const wrap = form?.querySelector?.("[data-editor-map-wrap]");
  if (!wrap) return;
  const latEl = form?.elements?.namedItem?.("lat");
  const lngEl = form?.elements?.namedItem?.("lng");
  const rawLat = latEl?.value;
  const rawLng = lngEl?.value;
  try {
    const lat = parseCoordinate(rawLat);
    const lng = parseCoordinate(rawLng);
    console.log("admin editor map coords", { rawLat, rawLng, lat, lng });
    const ok = lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    if (!ok) {
      setAdminEditorCoordsWarning(form, true);
      wrap.innerHTML =
        '<p class="card__intro">Keine gültige Kartenvorschau — Koordinaten ergänzen oder „Adresse suchen“.</p>';
      return;
    }
    setAdminEditorCoordsWarning(form, false);
    wrap.innerHTML = buildAdminEditorMapIframeHtml(lat, lng);
  } catch (err) {
    console.warn("admin editor map refresh failed", err);
    setAdminEditorCoordsWarning(form, true);
    wrap.innerHTML = '<p class="card__intro">Karte konnte nicht geladen werden.</p>';
  }
}

function readAdminEditorLocationSnapshot(form, eventData) {
  const pick = (name) => String(form?.elements?.namedItem(name)?.value ?? "").trim();
  return {
    ...eventData,
    location_name: pick("location_name") || null,
    address: pick("address") || null,
    street: pick("address") || null,
    postal_code: pick("postal_code") || null,
    city: pick("city") || null,
    country: pick("country") || null
  };
}

function applyGooglePlaceToAdminEditorForm(form, placeData) {
  const locName = form.elements.namedItem("location_name");
  const addr = form.elements.namedItem("address");
  const city = form.elements.namedItem("city");
  const postal = form.elements.namedItem("postal_code");
  const country = form.elements.namedItem("country");
  const latEl = form.elements.namedItem("lat");
  const lngEl = form.elements.namedItem("lng");
  if (locName && placeData.location_name) locName.value = placeData.location_name;
  if (addr && (placeData.street || placeData.formatted_address)) {
    addr.value = placeData.street || placeData.formatted_address;
  }
  if (city && placeData.city) city.value = placeData.city;
  if (postal && placeData.postal_code) postal.value = placeData.postal_code;
  if (country && placeData.country) country.value = placeData.country;
  if (latEl && placeData.lat != null && Number.isFinite(Number(placeData.lat))) latEl.value = String(placeData.lat);
  if (lngEl && placeData.lng != null && Number.isFinite(Number(placeData.lng))) lngEl.value = String(placeData.lng);
  refreshAdminEditorMapInForm(form);
}

function initEditorLocationAutocomplete(overlay, form, eventData) {
  console.log("CALLING AUTOCOMPLETE INIT (inside initEditorLocationAutocomplete)");
  try {
    disposeEditorLocationAutocomplete();
  } catch (disposeErr) {
    console.warn("disposeEditorLocationAutocomplete failed", disposeErr);
  }

  if (!overlay) console.error("editor overlay missing");
  if (!form) console.error("editor form missing");

  const drawer =
    overlay?.querySelector?.(".admin-editor-drawer")
    || overlay?.querySelector?.("aside.admin-editor-drawer")
    || (overlay?.firstElementChild?.classList?.contains("admin-editor-drawer") ? overlay.firstElementChild : null);

  if (!drawer) console.error("editor drawer missing (.admin-editor-drawer)");

  const venueInput = form?.querySelector?.("[data-editor-venue-input]");
  const addressInput = form?.querySelector?.("[data-editor-address-input]");
  if (!venueInput) console.error("venue input missing");
  if (!addressInput) console.error("address input missing");

  if (!form || !drawer) {
    console.error("AUTOCOMPLETE INIT ABORTED: form or drawer missing");
    return;
  }

  const hasViteKey = Boolean(String(window.VITE_GOOGLE_MAPS_API_KEY || "").trim());
  const hasPartyKey = Boolean(String(window.PARTYRADAR_GOOGLE_PLACES_KEY || "").trim());
  const resolvedKey = Boolean(getGooglePlacesApiKeyForAdmin());
  console.log("admin places key loaded", {
    hasViteKey,
    hasPartyRadarKey: hasPartyKey,
    resolvedKey
  });

  const locInputs = form.querySelectorAll("[data-editor-loc-field]");
  const manualBtn = form.querySelector("[data-editor-geocode-manual]");
  const searchBtn = form.querySelector("[data-editor-geocode-search]");
  const hintEl = form.querySelector("[data-editor-places-hint]");

  console.log("admin autocomplete init", {
    venue: Boolean(venueInput),
    address: Boolean(addressInput),
    locFieldCount: locInputs.length
  });

  const latInput = form.elements.namedItem("lat");
  const lngInput = form.elements.namedItem("lng");
  let coordTimer = null;

  const onLatLngInput = () => {
    if (coordTimer) window.clearTimeout(coordTimer);
    coordTimer = window.setTimeout(() => refreshAdminEditorMapInForm(form), 120);
  };

  latInput?.addEventListener("input", onLatLngInput);
  lngInput?.addEventListener("input", onLatLngInput);

  const runManualGeocode = async () => {
    const busyBtns = [manualBtn, searchBtn].filter(Boolean);
    busyBtns.forEach((b) => {
      b.disabled = true;
    });
    try {
      const snapshot = readAdminEditorLocationSnapshot(form, eventData);
      const coords = await resolveAdminCoordinates(snapshot);
      if (latInput) latInput.value = String(coords.lat);
      if (lngInput) lngInput.value = String(coords.lng);
      refreshAdminEditorMapInForm(form);
      setGlobalFeedback("Koordinaten aus Adresse berechnet.", "success");
    } catch (error) {
      console.warn("admin autocomplete error", error);
      setGlobalFeedback(error.message || "Geocoding fehlgeschlagen.", "error");
    } finally {
      busyBtns.forEach((b) => {
        b.disabled = false;
      });
    }
  };

  manualBtn?.addEventListener("click", runManualGeocode);
  searchBtn?.addEventListener("click", runManualGeocode);

  if (hintEl && !resolvedKey) {
    hintEl.hidden = false;
    hintEl.textContent =
      "Google Places API-Key fehlt oder ist leer — kein Autocomplete. „Adresse suchen“ / „Adresse neu berechnen“ nutzen OpenStreetMap.";
  }

  if (!addressInput) {
    console.warn("admin autocomplete error", new Error("Editor: address input [data-editor-address-input] not found"));
    editorLocationAutocompleteDispose = () => {
      latInput?.removeEventListener("input", onLatLngInput);
      lngInput?.removeEventListener("input", onLatLngInput);
      manualBtn?.removeEventListener("click", runManualGeocode);
      searchBtn?.removeEventListener("click", runManualGeocode);
      if (coordTimer) window.clearTimeout(coordTimer);
    };
    editorPlacesHideSuggestionsFn = null;
    return;
  }

  const suggestionRoot = document.createElement("div");
  suggestionRoot.className = "admin-editor-address-suggestions-root";
  suggestionRoot.setAttribute("role", "listbox");
  suggestionRoot.id = `admin-editor-ac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  suggestionRoot.hidden = true;
  document.body.appendChild(suggestionRoot);

  let anchorInput = addressInput;
  const ariaTargets = [venueInput, addressInput].filter(Boolean);
  ariaTargets.forEach((el) => el.setAttribute("aria-controls", suggestionRoot.id));

  const inputTargets = new Set([venueInput, addressInput, ...locInputs].filter(Boolean));

  const st = {
    sessionToken: "",
    lastSearchText: "",
    searchCounter: 0,
    activeRequestCounter: 0,
    suggestionsByPlaceId: new Map(),
    suppressNextInput: false,
    isPointerDownOnSuggestions: false,
    disposed: false
  };

  let searchTimer = null;

  const ensureSessionToken = () => {
    if (st.sessionToken) return st.sessionToken;
    st.sessionToken =
      window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    return st.sessionToken;
  };

  const resetSessionToken = () => {
    st.sessionToken = "";
    st.lastSearchText = "";
  };

  const setExpandedAll = (expanded) => {
    ariaTargets.forEach((el) => el.setAttribute("aria-expanded", expanded ? "true" : "false"));
  };

  const clearSuggestionsUi = () => {
    st.suggestionsByPlaceId.clear();
    suggestionRoot.innerHTML = "";
    suggestionRoot.hidden = true;
    setExpandedAll(false);
  };

  const hideSuggestionsUi = () => {
    if (st.isPointerDownOnSuggestions) return;
    clearSuggestionsUi();
  };

  editorPlacesHideSuggestionsFn = hideSuggestionsUi;

  const positionSuggestions = () => {
    if (suggestionRoot.hidden || !suggestionRoot.children.length) return;
    const el = anchorInput || addressInput;
    const r = el.getBoundingClientRect();
    const w = Math.min(Math.max(r.width, 220), window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - w - 8));
    suggestionRoot.style.position = "fixed";
    suggestionRoot.style.left = `${left}px`;
    suggestionRoot.style.top = `${r.bottom + 6}px`;
    suggestionRoot.style.width = `${w}px`;
    suggestionRoot.style.zIndex = "2147483000";
    suggestionRoot.style.pointerEvents = "auto";
  };

  const renderStatus = (message, isError = false) => {
    st.suggestionsByPlaceId.clear();
    suggestionRoot.innerHTML = "";
    const row = document.createElement("div");
    row.className = `location-autocomplete__status${isError ? " is-error" : ""}`;
    row.textContent = message;
    suggestionRoot.append(row);
    suggestionRoot.hidden = false;
    positionSuggestions();
    setExpandedAll(true);
  };

  const renderSuggestions = (items) => {
    st.suggestionsByPlaceId.clear();
    suggestionRoot.innerHTML = "";
    if (!items.length) {
      suggestionRoot.hidden = true;
      setExpandedAll(false);
      return;
    }
    const frag = document.createDocumentFragment();
    items.forEach((item) => {
      st.suggestionsByPlaceId.set(item.placeId, item);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "location-autocomplete__item";
      btn.dataset.placeId = item.placeId;
      btn.setAttribute("role", "option");
      const name = document.createElement("span");
      name.className = "location-autocomplete__name";
      name.textContent = item.suggestionText;
      btn.append(name);
      if (item.secondaryText) {
        const sec = document.createElement("span");
        sec.className = "location-autocomplete__address";
        sec.textContent = item.secondaryText;
        btn.append(sec);
      }
      frag.append(btn);
    });
    suggestionRoot.append(frag);
    suggestionRoot.hidden = false;
    positionSuggestions();
    setExpandedAll(true);
  };

  suggestionRoot.addEventListener("pointerdown", () => {
    st.isPointerDownOnSuggestions = true;
  });
  suggestionRoot.addEventListener("pointerup", () => {
    window.setTimeout(() => {
      st.isPointerDownOnSuggestions = false;
    }, 0);
  });
  suggestionRoot.addEventListener("click", (e) => {
    const opt = e.target instanceof Element ? e.target.closest(".location-autocomplete__item") : null;
    if (!opt) return;
    const placeId = String(opt.dataset.placeId || "").trim();
    if (placeId) selectPlace(placeId);
  });

  const selectPlace = async (placeId) => {
    if (!placeId || st.disposed) return;
    renderStatus("Adresse wird geladen…");
    try {
      const placeData = await fetchGooglePlaceDetailsAdmin(placeId);
      const enriched = await enrichPlaceDataWithFallbackAddressDetailsAdmin(placeData);
      st.suppressNextInput = true;
      applyGooglePlaceToAdminEditorForm(form, enriched);
      hideSuggestionsUi();
      resetSessionToken();
    } catch (error) {
      console.warn("admin autocomplete error", error);
      const fallback = buildFallbackPlaceDataFromSuggestionAdmin(st.suggestionsByPlaceId, placeId);
      if (fallback) {
        const enrichedFb = await enrichPlaceDataWithFallbackAddressDetailsAdmin(fallback);
        st.suppressNextInput = true;
        applyGooglePlaceToAdminEditorForm(form, enrichedFb);
        hideSuggestionsUi();
        resetSessionToken();
        renderStatus("Auswahl übernommen (Details ergänzt wo möglich).");
        window.setTimeout(() => {
          if (!st.disposed) hideSuggestionsUi();
        }, 1400);
        return;
      }
      renderStatus(String(error?.message || "Adresse konnte nicht geladen werden."), true);
    }
  };

  const scheduleAutocompleteSearch = () => {
    if (st.disposed) return;
    if (searchTimer) window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(async () => {
      searchTimer = null;
      if (st.disposed) return;

      const searchText = buildAdminEditorLocationSearchText(form);
      if (searchText.length < ADMIN_EDITOR_PLACES_MIN_CHARS) {
        resetSessionToken();
        hideSuggestionsUi();
        return;
      }

      if (!getGooglePlacesApiKeyForAdmin()) {
        console.warn("admin autocomplete error", new Error("Google Places API key missing"));
        if (hintEl) {
          hintEl.hidden = false;
          hintEl.textContent =
            "Google Places API-Key fehlt — Autocomplete nicht möglich. „Adresse suchen“ nutzt OpenStreetMap.";
        }
        renderStatus("Google Places API-Key fehlt — siehe Hinweis unter den Buttons.", true);
        return;
      }

      if (!st.lastSearchText) resetSessionToken();

      const requestId = ++st.searchCounter;
      st.activeRequestCounter = requestId;
      try {
        const sessionToken = ensureSessionToken();
        const suggestions = await fetchGooglePlacesAutocompletePredictionsAdmin(searchText, sessionToken);
        if (st.disposed || requestId !== st.activeRequestCounter) return;
        st.lastSearchText = searchText;
        if (!suggestions.length) {
          renderStatus("Keine Treffer — genauer eingeben oder „Adresse suchen“.");
          return;
        }
        renderSuggestions(suggestions);
      } catch (error) {
        if (st.disposed || requestId !== st.activeRequestCounter) return;
        console.warn("admin autocomplete error", error);
        const msg = String(error?.message || "");
        if (msg.includes("403")) {
          renderStatus("Google Places für diese Domain gesperrt (API-Key / Website-Restriction).", true);
        } else if (msg.includes("429")) {
          renderStatus("Google Places Rate-Limit — kurz warten.", true);
        } else {
          renderStatus("Vorschläge aktuell nicht verfügbar.", true);
        }
      }
    }, ADMIN_EDITOR_PLACES_DEBOUNCE_MS);
  };

  const onLocInput = () => {
    if (st.suppressNextInput) {
      st.suppressNextInput = false;
      return;
    }
    scheduleAutocompleteSearch();
  };

  const onPlacesFieldFocus = (ev) => {
    if (st.disposed) return;
    const t = ev.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) anchorInput = t;
    scheduleAutocompleteSearch();
  };

  inputTargets.forEach((el) => {
    el.addEventListener("input", onLocInput);
    el.addEventListener("focus", onPlacesFieldFocus);
  });

  const onDocClick = (e) => {
    if (st.disposed || suggestionRoot.hidden) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest(".admin-editor-address-suggestions-root")) return;
    if (t.closest(".admin-editor-places-field")) return;
    hideSuggestionsUi();
  };
  document.addEventListener("click", onDocClick);

  const onScrollOrResize = () => {
    if (!st.disposed) positionSuggestions();
  };
  drawer.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);

  const dispose = () => {
    if (st.disposed) return;
    st.disposed = true;
    if (searchTimer) window.clearTimeout(searchTimer);
    if (coordTimer) window.clearTimeout(coordTimer);
    inputTargets.forEach((el) => {
      el.removeEventListener("input", onLocInput);
      el.removeEventListener("focus", onPlacesFieldFocus);
    });
    latInput?.removeEventListener("input", onLatLngInput);
    lngInput?.removeEventListener("input", onLatLngInput);
    document.removeEventListener("click", onDocClick);
    drawer.removeEventListener("scroll", onScrollOrResize);
    window.removeEventListener("resize", onScrollOrResize);
    manualBtn?.removeEventListener("click", runManualGeocode);
    searchBtn?.removeEventListener("click", runManualGeocode);
    suggestionRoot.remove();
    ariaTargets.forEach((el) => el.removeAttribute("aria-controls"));
    if (editorPlacesHideSuggestionsFn === hideSuggestionsUi) editorPlacesHideSuggestionsFn = null;
  };

  editorLocationAutocompleteDispose = dispose;
}

function openEventEditorModal(eventData) {
  disposeEditorLocationAutocomplete();
  const overlay = document.createElement("div");
  overlay.className = "admin-editor-overlay admin-editor-overlay--drawer";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Event bearbeiten");

  const sqRows = socialQueueRowsForEvent(eventData.id);
  const socialList =
    sqRows.length > 0
      ? `<ul class="admin-editor-sq-list">${sqRows
          .map(
            (r) => `<li class="admin-editor-sq-item">
          <div class="admin-editor-sq-meta"><strong>${escapeHtml(platformVisual(r.platform).label)}</strong>
          · ${escapeHtml(formatAdminDateTime(r.scheduled_at))}
          · <span class="admin-sq-badge admin-sq-badge--${socialQueueStatusTone(r.status)}">${escapeHtml(r.status || "-")}</span></div>
          <p class="admin-editor-sq-cap">${escapeHtml(String(r.caption || "(noch keine Caption)").slice(0, 400))}${String(r.caption || "").length > 400 ? "…" : ""}</p>
        </li>`
          )
          .join("")}</ul>`
      : '<p class="card__intro">Noch keine Einträge in der Social Queue.</p>';

  let mapEmbed = '<p class="card__intro">Keine Koordinaten — „Fix“ auf der Event-Karte oder Ort speichern.</p>';
  try {
    const latN = parseCoordinate(eventData.lat);
    const lngN = parseCoordinate(eventData.lng);
    const rawLat = eventData.lat;
    const rawLng = eventData.lng;
    console.log("admin editor map coords", { rawLat, rawLng, lat: latN, lng: lngN });
    if (latN !== null && lngN !== null && Math.abs(latN) <= 90 && Math.abs(lngN) <= 180) {
      mapEmbed = buildAdminEditorMapIframeHtml(latN, lngN);
    }
  } catch (err) {
    console.warn("admin editor map embed build failed", err);
  }

  overlay.innerHTML = `
    <aside class="admin-editor-drawer">
      <header class="admin-editor-drawer__head">
        <div>
          <h3 class="admin-editor-drawer__title">${escapeHtml(eventData.name || "Event")}</h3>
          <p class="admin-editor-drawer__sub">${escapeHtml(recurrenceLabel(eventData))} · ${escapeHtml(recurrenceDetails(eventData))}</p>
        </div>
        <button type="button" class="btn-pill btn-pill--soft" data-editor-close>✕</button>
      </header>
      <div class="admin-editor-tabs" role="tablist">
        <button type="button" class="admin-editor-tab is-active" data-editor-tab="general" role="tab">Allgemein</button>
        <button type="button" class="admin-editor-tab" data-editor-tab="location" role="tab">Ort</button>
        <button type="button" class="admin-editor-tab" data-editor-tab="media" role="tab">Medien</button>
        <button type="button" class="admin-editor-tab" data-editor-tab="social" role="tab">Social</button>
        <button type="button" class="admin-editor-tab" data-editor-tab="advanced" role="tab">Advanced</button>
      </div>
      <form class="admin-editor-form" autocomplete="off">
        <div class="admin-editor-panel-page is-active" data-editor-panel="general">
          <div class="admin-editor-fields">
          <label class="field"><span>Titel</span><input name="title" value="${escapeHtml(eventData.title || eventData.name)}" required></label>
          <label class="field"><span>Kategorie / Genre</span><input name="category" value="${escapeHtml(eventData.genre || eventData.category)}"></label>
          <label class="field"><span>Artist</span><input name="artist_name" value="${escapeHtml(eventData.artist_name)}"></label>
          <label class="field"><span>Tags (Komma)</span><input name="tags" value="${escapeHtml(Array.isArray(eventData.tags) ? eventData.tags.join(", ") : String(eventData.tags || ""))}"></label>
          <label class="field"><span>Preis</span><input name="price_text" value="${escapeHtml(eventData.price_text)}"></label>
          <label class="field"><span>Datum</span><input name="event_date" type="date" value="${escapeHtml(eventData.event_date)}"></label>
          <label class="field"><span>Start</span><input name="event_time" type="time" value="${escapeHtml(String(eventData.event_time || "").slice(0, 5))}"></label>
          <label class="field"><span>Ende</span><input name="end_time" type="time" value="${escapeHtml(String(eventData.end_time || "").slice(0, 5))}"></label>
          <label class="field admin-editor-span-2"><span>Beschreibung</span><textarea name="description" rows="5">${escapeHtml(eventData.description)}</textarea></label>
          <label class="field"><span>Titel ES</span><input name="title_es" value="${escapeHtml(eventData.title_es)}"></label>
          <label class="field"><span>Titel DE</span><input name="title_de" value="${escapeHtml(eventData.title_de)}"></label>
          <label class="field"><span>Titel EN</span><input name="title_en" value="${escapeHtml(eventData.title_en)}"></label>
          <label class="field admin-editor-span-2"><span>Beschreibung ES</span><textarea name="description_es" rows="2">${escapeHtml(eventData.description_es)}</textarea></label>
          <label class="field admin-editor-span-2"><span>Beschreibung DE</span><textarea name="description_de" rows="2">${escapeHtml(eventData.description_de)}</textarea></label>
          <label class="field admin-editor-span-2"><span>Beschreibung EN</span><textarea name="description_en" rows="2">${escapeHtml(eventData.description_en)}</textarea></label>
          </div>
        </div>
        <div class="admin-editor-panel-page" data-editor-panel="location" hidden>
          <div class="admin-editor-fields">
          <label class="field admin-editor-places-field"><span>Venue</span><input name="location_name" data-editor-venue-input data-editor-loc-field autocomplete="off" value="${escapeHtml(eventData.location_name)}"></label>
          <label class="field admin-editor-span-2 admin-editor-location-autocomplete-field admin-editor-places-field"><span>Adresse</span><input name="address" data-editor-address-input autocomplete="off" aria-expanded="false" aria-haspopup="listbox" value="${escapeHtml(eventData.address)}"></label>
          <label class="field"><span>PLZ</span><input name="postal_code" data-editor-loc-field autocomplete="off" value="${escapeHtml(eventData.postal_code)}"></label>
          <label class="field"><span>Stadt</span><input name="city" data-editor-loc-field autocomplete="off" value="${escapeHtml(eventData.city)}"></label>
          <label class="field"><span>Land</span><input name="country" data-editor-loc-field autocomplete="off" value="${escapeHtml(eventData.country)}"></label>
          <label class="field"><span>Latitude</span><input name="lat" type="text" inputmode="decimal" autocomplete="off" value="${eventData.lat ?? ""}"></label>
          <label class="field"><span>Longitude</span><input name="lng" type="text" inputmode="decimal" autocomplete="off" value="${eventData.lng ?? ""}"></label>
          <div class="admin-editor-span-2 admin-editor-location-toolbar">
            <button type="button" class="btn-pill btn-pill--soft" data-editor-geocode-search>Adresse suchen</button>
            <button type="button" class="btn-pill btn-pill--soft" data-editor-geocode-manual>📍 Adresse neu berechnen</button>
            <span class="card__intro admin-editor-places-hint" data-editor-places-hint hidden></span>
          </div>
          <p class="card__intro admin-editor-span-2" data-editor-coords-warning hidden role="status">Koordinaten ungültig oder fehlen</p>
          <div class="admin-editor-map-wrap admin-editor-span-2" data-editor-map-wrap>${mapEmbed}</div>
          <p class="card__intro admin-editor-span-2">Bei geänderter Adresse aktualisiert Speichern die Koordinaten wie bisher (Geocoding). Adress-Vorschläge wie auf der Hauptseite (Google Places API).</p>
          </div>
        </div>
        <div class="admin-editor-panel-page" data-editor-panel="media" hidden>
          <div class="admin-editor-fields">
          <label class="field admin-editor-span-2"><span>Hauptbild URL</span><input name="image_url" value="${escapeHtml(eventData.image_url)}"></label>
          <label class="field admin-editor-span-2"><span>Weitere Bilder (JSON)</span><textarea name="image_urls" rows="5">${escapeHtml(eventData.image_urls ? JSON.stringify(eventData.image_urls, null, 2) : "")}</textarea></label>
          <p class="card__intro admin-editor-span-2">Crop-Upload: bei Pending-Events auf der Karte „Bild ersetzen“.</p>
          </div>
        </div>
        <div class="admin-editor-panel-page" data-editor-panel="social" hidden>
          <p class="card__intro">Captions &amp; geplante Slots (Read-only); Regeneration unten.</p>
          <div class="admin-editor-share-row">
            <a class="btn-pill btn-pill--soft" href="./index.html?event_id=${encodeURIComponent(String(eventData.id))}" target="_blank" rel="noopener">Share-Vorschau</a>
            <button type="button" class="btn-pill btn-pill--soft" data-editor-regenerate-social>♻️ Drafts regenerieren</button>
          </div>
          ${socialList}
        </div>
        <div class="admin-editor-panel-page" data-editor-panel="advanced" hidden>
          <label class="field admin-editor-span-2"><span>Interne Moderationsnotizen</span>
            <textarea name="verification_notes" rows="4">${escapeHtml(eventData.verification_notes)}</textarea>
          </label>
          <p class="card__intro">Weitere Rohfelder bei Bedarf direkt in Supabase.</p>
        </div>
        <p class="admin-editor-status" data-editor-status hidden></p>
        <div class="admin-editor-actions admin-editor-actions--sticky">
          <button type="button" class="btn-pill btn-pill--outline" data-editor-cancel>Abbrechen</button>
          <button type="submit" class="btn-pill btn-pill--soft" data-editor-save>Speichern</button>
          <button type="submit" class="btn-pill btn-pill--hero" data-editor-save-social>Speichern + Social neu</button>
        </div>
      </form>
    </aside>
  `;

  console.log("DRAWER HTML INSERTED");
  const form = overlay.querySelector(".admin-editor-form");
  const status = overlay.querySelector("[data-editor-status]");
  const tabs = overlay.querySelectorAll("[data-editor-tab]");
  const panels = overlay.querySelectorAll("[data-editor-panel]");

  const activateTab = (name) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.editorTab === name));
    panels.forEach((p) => {
      const on = p.dataset.editorPanel === name;
      p.toggleAttribute("hidden", !on);
      p.classList.toggle("is-active", on);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.editorTab || "general"));
  });

  const close = () => {
    disposeEditorLocationAutocomplete();
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
  };
  const onKeyDown = (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("is-busy")) close();
  };
  const setBusy = (busy, message = "") => {
    if (busy && typeof editorPlacesHideSuggestionsFn === "function") editorPlacesHideSuggestionsFn();
    overlay.classList.toggle("is-busy", busy);
    form?.querySelectorAll("input, textarea, button").forEach((control) => {
      if (control.hasAttribute("data-editor-close")) return;
      control.disabled = busy;
    });
    if (status) {
      status.hidden = !message;
      status.textContent = message;
    }
  };
  overlay.querySelector("[data-editor-close]")?.addEventListener("click", close);
  overlay.querySelector("[data-editor-cancel]")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay && !overlay.classList.contains("is-busy")) close();
  });

  overlay.querySelector("[data-editor-regenerate-social]")?.addEventListener("click", async () => {
    setBusy(true, "Social Drafts…");
    try {
      const n = await regenerateSocialDraftsForEvent(eventData);
      setGlobalFeedback(`Social Drafts neu (${n}).`, "success");
      close();
      await loadEvents();
    } catch (error) {
      console.error("Regenerate social failed:", error);
      setBusy(false, error.message || "Fehler");
      setGlobalFeedback(`Social: ${error.message}`, "error");
    }
  });

  form?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const regenerate = Boolean(submitEvent.submitter?.hasAttribute("data-editor-save-social"));
    try {
      setBusy(true, "Speichern…");
      const payload = eventEditPayloadFromForm(form);
      if (hasLocationChanged(eventData, payload)) {
        const coords = await resolveAdminCoordinates({ ...eventData, ...payload });
        payload.lat = coords.lat;
        payload.lng = coords.lng;
        payload.geocoding_query = coords.geocoding_query;
        if (coords.formatted_address) payload.formatted_address = coords.formatted_address;
      }
      await updateEventWithFallback(eventData.id, payload);
      if (regenerate) {
        await regenerateSocialDraftsForEvent({ ...eventData, ...payload, id: eventData.id });
      }
      setGlobalFeedback(regenerate ? "Gespeichert & Social neu geplant." : "Gespeichert.", "success");
      close();
      await loadEvents();
    } catch (error) {
      console.error("Event edit failed:", error);
      setBusy(false, error.message || "Speichern fehlgeschlagen.");
      setGlobalFeedback(`Speichern fehlgeschlagen: ${error.message || ""}`.trim(), "error");
    }
  });
  document.body.appendChild(overlay);
  console.log("DRAWER RENDERED", {
    overlayOk: Boolean(overlay),
    formOk: Boolean(form),
    drawerOk: Boolean(overlay?.querySelector?.(".admin-editor-drawer"))
  });
  document.addEventListener("keydown", onKeyDown);

  const runAutocompleteInit = () => {
    console.log("CALLING AUTOCOMPLETE INIT");
    try {
      initEditorLocationAutocomplete(overlay, form, eventData);
      console.log("AUTOCOMPLETE INIT COMPLETE");
    } catch (err) {
      console.error("AUTOCOMPLETE INIT FAILED", err);
    }
    try {
      refreshAdminEditorMapInForm(form);
    } catch (mapErr) {
      console.warn("admin editor map refresh (post-init) failed", mapErr);
    }
  };

  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(runAutocompleteInit);
    });
  } else {
    window.setTimeout(runAutocompleteInit, 0);
  }

  form?.querySelector("input[name='title']")?.focus();
}

async function handleCardAction(clickEvent) {
  const button = clickEvent.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "replace-image") {
    const card = button.closest(".event-card");
    const input = card?.querySelector("input[data-admin-replace-input]");
    if (input && !button.disabled) input.click();
    return;
  }
  const card = button.closest(".event-card");
  if (!card) return;
  const eventData = findEventByCard(card);
  if (!eventData) return;

  if (button.dataset.action === "regeocode") {
    await handleRegeocodeEvent(eventData, card, button);
    return;
  }

  if (button.dataset.action === "edit-location") {
    openAdminLocationModal(eventData);
    return;
  }

  if (button.dataset.action === "edit-event") {
    openEventEditorModal(eventData);
    return;
  }

  if (button.dataset.action === "regenerate-drafts") {
    button.disabled = true;
    setGlobalFeedback("");
    try {
      const n = await regenerateSocialDraftsForEvent(eventData);
      setGlobalFeedback(`Social Drafts neu erstellt (${n}).`, "success");
      await loadEvents();
    } catch (error) {
      console.error("Regenerate drafts failed:", error);
      setGlobalFeedback(error.message || "Social Fehler", "error");
    } finally {
      button.disabled = false;
    }
    return;
  }

  if (button.dataset.action === "toggle-featured") {
    button.disabled = true;
    try {
      await updateEventWithFallback(eventData.id, { featured: !eventData.featured });
      setGlobalFeedback("Featured aktualisiert.", "success");
      await loadEvents();
    } catch (error) {
      setGlobalFeedback(error.message || "Update fehlgeschlagen", "error");
    } finally {
      button.disabled = false;
    }
    return;
  }

  const notes = card.querySelector("textarea[data-notes]")?.value.trim() || "";
  const featuredInput = card.querySelector("input[data-featured]");
  const promotedInput = card.querySelector("input[data-promoted]");

  button.disabled = true;
  setGlobalFeedback("");
  try {
    if (button.dataset.action === "save-notes") {
      await updateEventWithFallback(eventData.id, { verification_notes: notes });
      setGlobalFeedback("Notes saved.", "success");
    } else {
      const updatedRow = await updateEventWithFallback(eventData.id, {
        status: button.dataset.action,
        verification_notes: notes
      });
      const persistedStatus = String(updatedRow?.status || button.dataset.action);
      let socialCreated = 0;
      if (persistedStatus === "approved") {
        socialCreated = await ensureSocialReviewQueueForEvent({ ...eventData, status: persistedStatus });
      }
      const socialSuffix = socialCreated ? ` Social Review: ${socialCreated} Draft-Jobs geplant.` : "";
      setGlobalFeedback(`Status updated to ${persistedStatus}.${socialSuffix}`, "success");
    }

    const featuredChanged = state.featureColumns.featured && featuredInput
      ? Boolean(featuredInput.checked) !== Boolean(eventData.featured)
      : false;
    const promotedChanged = state.featureColumns.promoted && promotedInput
      ? Boolean(promotedInput.checked) !== Boolean(eventData.promoted)
      : false;

    if (featuredChanged || promotedChanged) {
      const flagPayload = {};
      if (featuredChanged) flagPayload.featured = Boolean(featuredInput.checked);
      if (promotedChanged) flagPayload.promoted = Boolean(promotedInput.checked);
      await updateEventWithFallback(eventData.id, flagPayload);
    }

    await loadEvents();
  } catch (error) {
    console.error("Admin action failed:", error);
    setGlobalFeedback(`Action failed: ${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
}

function bindEvents() {
  dom.statusTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeTab = tab.dataset.statusFilter || "all";
      render();
    });
  });

  dom.searchInput?.addEventListener("input", () => {
    window.clearTimeout(state.searchDebounceTimer);
    state.searchDebounceTimer = window.setTimeout(() => {
      state.search = dom.searchInput?.value || "";
      render();
    }, 320);
  });

  dom.workspace?.querySelectorAll("[data-admin-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.navSection = btn.dataset.adminNav || "dashboard";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  dom.workspace?.addEventListener("click", (ev) => {
    const dash = ev.target.closest("[data-admin-dash]");
    if (dash) {
      const k = dash.dataset.adminDash || "";
      if (k === "pending") {
        state.navSection = "events";
        state.activeTab = "pending";
      } else if (k === "live-today") {
        state.navSection = "social";
        state.socialQueueFilter = "today";
      } else if (k === "failed") {
        state.navSection = "social";
        state.socialQueueFilter = "failed";
      } else if (k === "weekend") {
        state.navSection = "events";
        state.activeTab = "all";
        setGlobalFeedback("Filter: Events am Wochenende — nutze Suche/Stadt.", "info");
      } else if (k === "coords") {
        state.navSection = "events";
        state.activeTab = "all";
        setGlobalFeedback("Events ohne Marker: Siehe Badges „Keine Koordinaten“.", "info");
      } else if (k === "featured") {
        state.navSection = "events";
        state.activeTab = "approved";
      }
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const short = ev.target.closest("[data-admin-shortcut]");
    if (short) {
      const k = short.dataset.adminShortcut || "";
      if (k === "events-pending") {
        state.navSection = "events";
        state.activeTab = "pending";
      } else if (k === "social-failed") {
        state.navSection = "social";
        state.socialQueueFilter = "failed";
      } else if (k === "missing-coords") {
        state.navSection = "events";
        setGlobalFeedback("Koordinaten: Strip auf der Karte oder 📍 Fix.", "info");
      }
      render();
    }
  });

  dom.workspace?.querySelector("[data-admin-quick-pending]")?.addEventListener("click", () => {
    state.navSection = "events";
    state.activeTab = "pending";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  dom.cityFilter?.addEventListener("change", () => {
    state.city = dom.cityFilter.value || "";
    render();
  });

  dom.genreFilter?.addEventListener("change", () => {
    state.genre = dom.genreFilter.value || "";
    render();
  });

  dom.statusFilter?.addEventListener("change", () => {
    state.statusFilter = dom.statusFilter.value || "";
    render();
  });

  dom.socialQueueFilters.forEach((button) => {
    button.addEventListener("click", () => {
      state.socialQueueFilter = button.dataset.socialFilter || "all";
      renderSocialQueuePanel();
    });
  });

  dom.socialQueuePanel?.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-queue-action]");
    if (!button) return;
    const rowEl = button.closest("[data-queue-id]");
    const queueId = rowEl?.dataset.queueId;
    const eventId = rowEl?.dataset.eventId;
    const row = findSocialQueueRow(queueId);
    const eventData = state.allEvents.find((item) => String(item.id) === String(eventId));
    button.disabled = true;
    try {
      if (button.dataset.queueAction === "open-event" && eventData) {
        state.navSection = "events";
        state.search = eventData.name || "";
        if (dom.searchInput) dom.searchInput.value = state.search;
        render();
        window.requestAnimationFrame(() => {
          const escapedEventId = window.CSS?.escape ? window.CSS.escape(String(eventId)) : String(eventId).replace(/"/g, '\\"');
          document.querySelector(`.event-card[data-event-id="${escapedEventId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      } else if (button.dataset.queueAction === "retry") {
        await retrySocialQueueRow(queueId);
        setGlobalFeedback("Retry geplant.", "success");
        await loadEvents();
      } else if (button.dataset.queueAction === "delete") {
        await deleteSocialQueueRow(queueId);
        setGlobalFeedback("Eintrag gelöscht.", "success");
        await loadEvents();
      } else if (button.dataset.queueAction === "regenerate" && eventData) {
        const count = await regenerateSocialDraftsForEvent(eventData);
        setGlobalFeedback(`Drafts neu (${count}).`, "success");
        await loadEvents();
      } else if (button.dataset.queueAction === "copy-caption") {
        await navigator.clipboard?.writeText(String(row?.caption || ""));
        setGlobalFeedback("Caption kopiert.", "success");
      } else if (button.dataset.queueAction === "open-image") {
        const imageUrl = row?.resolved_image_url || eventData?.image_url;
        if (imageUrl) window.open(imageUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Social queue action failed:", error);
      setGlobalFeedback(`Social: ${error.message || ""}`.trim(), "error");
    } finally {
      button.disabled = false;
    }
  });

  dom.resetFiltersButton?.addEventListener("click", () => {
    state.search = "";
    state.city = "";
    state.genre = "";
    state.statusFilter = "";
    state.lastFilterSignature = "";
    if (dom.searchInput) dom.searchInput.value = "";
    if (dom.cityFilter) dom.cityFilter.value = "";
    if (dom.genreFilter) dom.genreFilter.value = "";
    if (dom.statusFilter) dom.statusFilter.value = "";
    render();
  });

  dom.loginForm?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    setAuthFeedback("");
    try {
      const email = dom.loginEmail?.value.trim().toLowerCase() || "";
      const password = dom.loginPassword?.value || "";
      if (!email || !password) {
        setAuthFeedback("Bitte E-Mail und Passwort ausfüllen.", "error");
        return;
      }

      await signInWithPassword(email, password);
      await checkSession();
      if (!isSessionAdmin(state.adminSession)) {
        await signOut();
        await checkSession();
        renderAuthState();
        setAuthFeedback("Login ok, aber keine Admin-Berechtigung (Role oder erlaubte E-Mail).", "error");
        return;
      }

      renderAuthState();
      await loadEvents();
      setGlobalFeedback(`Welcome ${state.adminSession?.user?.email || ""}.`, "success");
    } catch (error) {
      setAuthFeedback(`Login fehlgeschlagen: ${error.message}`, "error");
    }
  });

  dom.signOutButton?.addEventListener("click", async () => {
    await signOut();
    state.adminSession = null;
    renderAuthState();
    setGlobalFeedback("Abgemeldet.", "info");
  });

  dom.headerSignOutButton?.addEventListener("click", async () => {
    await signOut();
    state.adminSession = null;
    renderAuthState();
    setGlobalFeedback("Abgemeldet.", "info");
  });

  dom.eventGrid?.addEventListener("click", handleCardAction);

  dom.eventGrid?.addEventListener("change", async (changeEvent) => {
    const input = changeEvent.target.closest("input[data-admin-replace-input]");
    if (!input || !input.files?.length) return;
    const file = input.files[0];
    input.value = "";
    const card = input.closest(".event-card");
    const btn = card?.querySelector("button[data-action='replace-image']");
    const previewImg = card?.querySelector("img[data-event-preview-img]");
    const eventId = card?.dataset.eventId;
    if (!eventId) return;

    const v = validateAdminReplacementImageFile(file);
    if (!v.ok) {
      setGlobalFeedback(v.message, "error");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Zuschneiden…";
    }
    setGlobalFeedback("");
    try {
      const blob = await openAdminImageCropModal(file);
      if (!blob) {
        return;
      }
      if (btn) {
        btn.textContent = "Wird hochgeladen…";
      }
      const publicUrl = await replaceAdminEventMainImageBlob(eventId, blob);
      if (previewImg) {
        previewImg.removeAttribute("hidden");
        const sep = publicUrl.includes("?") ? "&" : "?";
        previewImg.src = `${publicUrl}${sep}t=${Date.now()}`;
        const fig = previewImg.closest(".event-card__preview");
        fig?.classList.remove("event-card__preview--empty");
      }
      setGlobalFeedback("Bild wurde ersetzt.", "success");
      await loadEvents();
    } catch (error) {
      console.error("Replace image failed:", error);
      setGlobalFeedback(`Bild konnte nicht ersetzt werden: ${error.message}`, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Bild ersetzen";
      }
    }
  });

  if (dom.eventSentinel && typeof IntersectionObserver !== "undefined") {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          if (state.navSection !== "events") return;
          if (state.eventsRendered >= state.filteredEvents.length) return;
          state.eventsVisibleCount += EVENT_LIST_PAGE_SIZE;
          renderEvents();
        });
      },
      { root: null, rootMargin: "380px", threshold: 0 }
    );
    io.observe(dom.eventSentinel);
  }
}

async function start() {
  bindEvents();
  try {
    await checkSession();
    renderAuthState();
    if (isSessionAdmin(state.adminSession)) {
      await loadEvents();
      setGlobalFeedback("Marcha Admin Studio ready.", "success");
    } else {
      setGlobalFeedback("Bitte als Admin anmelden.", "info");
    }
  } catch (error) {
    console.error("Admin startup failed:", error);
    setGlobalFeedback(`Fehler beim Start: ${error.message}`, "error");
  }
}

start();
