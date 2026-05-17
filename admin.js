const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
const ADMIN_REQUIRED_ROLE = "admin";
const ADMIN_ALLOWED_EMAILS = [];
const ADMIN_DASHBOARD_BUILD = "2026.05.17-description-only-cleanup";
if (typeof window !== "undefined") {
  window.PARTYRADAR_ADMIN_BUILD = ADMIN_DASHBOARD_BUILD;
  console.log("[admin-build]", ADMIN_DASHBOARD_BUILD);
}
const SOCIAL_QUEUE_MIN_SCHEDULE_AHEAD_MS = 2 * 60 * 1000;
const SOCIAL_QUEUE_POSTIZ_HANDOFF_MSG = "An Postiz übergeben – wartet auf Freigabe.";
const SOCIAL_QUEUE_POSTIZ_SUCCESS_MSG = `✅ ${SOCIAL_QUEUE_POSTIZ_HANDOFF_MSG}`;
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

const SOCIAL_QUEUE_INSERT_COLUMNS = new Set([
  "event_id",
  "platform",
  "status",
  "scheduled_at",
  "title",
  "caption",
  "image_url",
  "resolved_image_url",
  "event_date",
  "location_name",
  "city",
  "retry_count",
  "hashtags",
  "cta_text",
  "postiz_response",
  "post_stage"
]);

/** Auto-delete posted rows older than N days (0 = disabled). */
const SOCIAL_QUEUE_POSTED_RETENTION_DAYS = 30;

const SOCIAL_QUEUE_UPDATE_COLUMNS = new Set([
  "platform",
  "status",
  "scheduled_at",
  "title",
  "caption",
  "image_url",
  "resolved_image_url",
  "hashtags",
  "cta_text",
  "postiz_response",
  "postiz_post_id",
  "postiz_synced_at",
  "admin_confirmed_at",
  "last_error",
  "updated_at"
]);

const SOCIAL_QUEUE_STATUS_ACTIONS = ["pending", "draft", "ready_for_postiz", "sent_to_postiz", "posted", "failed"];
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

const EVENT_ANALYTICS_TABLE = "event_analytics";

const VALID_STATUS = new Set(["pending", "approved", "rejected"]);
const ADMIN_CARD_STATUS_ACTIONS = new Set(["pending", "approved", "rejected", "save-notes"]);
const ADMIN_EVENT_APPROVAL_INCOMPLETE_MSG =
  "Event unvollständig: Bitte Titel, Datum, Uhrzeit, Ort, Kategorie und Bild prüfen.";
const ADMIN_EVENT_MISSING_FIELD_LABELS_DE = Object.freeze({
  name: "Titel",
  event_date: "Datum",
  event_time: "Uhrzeit",
  location: "Ort",
  image: "Bild",
  genre: "Kategorie"
});
const adminEventActionLocks = new Set();

/**
 * Admin save/update: only these public.events columns are sent to Supabase.
 * UI mapping: form "title" → name; "category" → genre; "address" → address (never street).
 */
const ADMIN_EVENT_SAVE_COLUMN_WHITELIST = new Set([
  "name",
  "description",
  "description_es",
  "description_de",
  "description_en",
  "title_de",
  "title_en",
  "title_es",
  "location_name",
  "address",
  "postal_code",
  "city",
  "country",
  "province",
  "region",
  "event_date",
  "event_time",
  "end_time",
  "genre",
  "artist_name",
  "price_text",
  "image_url",
  "image_urls",
  "lat",
  "lng",
  "status",
  "verification_notes",
  "featured",
  "promoted",
  "geocoding_query",
  "formatted_address",
  "place_id",
  "recurrence_type",
  "recurrence_start_date",
  "recurrence_end_date",
  "recurrence_weekday",
  "recurrence_day_of_month",
  "is_recurring",
  "recurring_social_enabled",
  "recurring_group_id",
  "original_event_id",
  "archived_at"
]);

const RECURRING_SOCIAL_SLOT_SPECS = [
  { stage: "early_reminder", daysBefore: 3, hour: 18, minute: 0 },
  { stage: "tomorrow", daysBefore: 1, hour: 18, minute: 0 },
  { stage: "last_call", minutesBefore: 90 }
];
/** Weekly auto-prep: child events + social drafts for occurrences within this window. */
const RECURRING_SOCIAL_AUTO_PREP_HORIZON_DAYS = 7;

const ADMIN_SMART_ACTION_ENDPOINT = `${SUPABASE_URL}/functions/v1/smart-action`;
const ADMIN_TRANSLATION_TARGET_LANGUAGE_BY_CODE = Object.freeze({
  de: "German",
  en: "English",
  es: "Spanish"
});
const ADMIN_DESCRIPTION_LOCALIZED_FIELDS = Object.freeze([
  { code: "es", field: "description_es", label: "Beschreibung ES" },
  { code: "de", field: "description_de", label: "Beschreibung DE" },
  { code: "en", field: "description_en", label: "Beschreibung EN" }
]);
const ADMIN_GERMAN_LANGUAGE_INDICATORS = [
  "erlebe",
  "erleben",
  "genieße",
  "geniesse",
  "genießen",
  "entspannter",
  "atmosphäre",
  "atmosphare",
  "abend",
  "musik",
  "meer",
  "direkt am",
  "die besten",
  "und den",
  "unvergesslich",
  "unvergesslichen",
  "besonderen",
  "freuen sie",
  "können sie",
  "veranstaltung"
];
const ADMIN_SPANISH_LANGUAGE_INDICATORS = [
  "vive",
  "disfruta",
  "disfrute",
  "ambiente",
  "música",
  "musica",
  "mar",
  "atardecer",
  "buen rollo",
  "junto al",
  "una noche",
  "los mejores",
  "velada",
  "experiencia",
  "noche especial"
];
const ADMIN_ENGLISH_LANGUAGE_INDICATORS = [
  "experience",
  "enjoy",
  "atmosphere",
  "music",
  "sunset",
  "good vibes",
  "by the sea",
  "by the beach",
  "by the",
  "with",
  "the soul",
  "beach",
  "evening",
  "night"
];
const ADMIN_SMART_ACTION_TARGET_SPANISH = "Spanish";

/** Known missing on live DB — never send (avoids repeated 400 schema errors). */
const ADMIN_EVENT_SAVE_COLUMNS_DISALLOWED = new Set([
  "street",
  "tags",
  "title",
  "category",
  "is_featured"
]);

function pickAdminEventSavePayload(payload) {
  const out = {};
  for (const key of Object.keys(payload || {})) {
    if (ADMIN_EVENT_SAVE_COLUMNS_DISALLOWED.has(key)) continue;
    if (!ADMIN_EVENT_SAVE_COLUMN_WHITELIST.has(key)) continue;
    out[key] = payload[key];
  }
  return out;
}

const state = {
  allEvents: [],
  filteredEvents: [],
  activeTab: "all",
  archiveTimeline: "active",
  search: "",
  city: "",
  genre: "",
  statusFilter: "",
  socialQueueFilter: "all",
  socialQueueFilterPlatform: "",
  socialQueueFilterEventId: "",
  socialQueueFilterRecurringOnly: false,
  socialQueueFilterDateFrom: "",
  socialQueueFilterDateTo: "",
  socialQueueExpandedId: null,
  socialQueuePostizSendingId: null,
  recurringSocialAutoPrepRunning: false,
  recurringSocialAutoPrepScheduled: false,
  socialQueueDraftSnapshots: new Map(),
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
  },
  analyticsTimeRange: "7d",
  analyticsRowsRaw: [],
  analyticsPanelRequestId: 0,
  analyticsLoading: false,
  analyticsLastFetchAt: 0,
  prevNavSection: "dashboard",
  /** @type {null | (() => void)} */
  adminEditorClose: null
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
  archiveTabs: [...document.querySelectorAll(".admin-archive-tab[data-archive-filter]")],
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
  socialDeleteInvalidButton: document.getElementById("adminSocialDeleteInvalid"),
  socialQueueFilters: [...document.querySelectorAll(".admin-social-filter[data-social-filter]")],
  socialQueueStats: document.getElementById("adminSocialQueueStats"),
  socialQueueAdvancedFilters: document.getElementById("adminSocialQueueAdvancedFilters"),
  socialQueueFilterPlatform: document.getElementById("adminSocialFilterPlatform"),
  socialQueueFilterEvent: document.getElementById("adminSocialFilterEvent"),
  socialQueueFilterRecurring: document.getElementById("adminSocialFilterRecurring"),
  socialQueueFilterDateFrom: document.getElementById("adminSocialFilterDateFrom"),
  socialQueueFilterDateTo: document.getElementById("adminSocialFilterDateTo"),
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
  const appRole = String(session?.user?.app_metadata?.role || "").trim().toLowerCase();
  const userRole = String(session?.user?.user_metadata?.role || "").trim().toLowerCase();
  return appRole || userRole;
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

function patchAdminEventInState(eventId, patch) {
  const key = String(eventId ?? "").trim();
  if (!key) return null;
  const idx = state.allEvents.findIndex((e) => String(e.id) === key);
  if (idx < 0) return null;
  const prev = { ...state.allEvents[idx] };
  state.allEvents[idx] = normalizeEvent({ ...prev, ...patch, id: prev.id });
  return prev;
}

function removeAdminEventFromState(eventId) {
  const key = String(eventId ?? "").trim();
  if (!key) return;
  state.allEvents = state.allEvents.filter((e) => String(e.id) !== key);
  state.socialQueueByEvent.delete(key);
  state.eventListReset = true;
}

async function refreshAdminData({ reloadEvents = false, reloadSocial = false } = {}) {
  if (reloadEvents) {
    await loadEvents();
    return;
  }
  if (reloadSocial) {
    await loadSocialQueueRows();
  }
  syncFilterOptions();
  render();
}

function acquireAdminEventLock(eventId) {
  const key = String(eventId ?? "").trim();
  if (!key || adminEventActionLocks.has(key)) return false;
  adminEventActionLocks.add(key);
  return true;
}

function releaseAdminEventLock(eventId) {
  adminEventActionLocks.delete(String(eventId ?? "").trim());
}

async function withAdminButtonBusy(button, busyText, fn) {
  if (!button || button.disabled) return;
  const prevText = button.textContent;
  button.disabled = true;
  if (busyText) button.textContent = busyText;
  try {
    await fn();
  } finally {
    button.disabled = false;
    if (busyText) button.textContent = prevText;
  }
}

function adminStatusSuccessMessage(status) {
  if (status === "approved") return "Event freigegeben.";
  if (status === "rejected") return "Event abgelehnt.";
  if (status === "pending") return "Status: Ausstehend.";
  return "Status aktualisiert.";
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
  const lat = parseCoordinate(event?.latitude ?? event?.lat);
  const lng = parseCoordinate(event?.longitude ?? event?.lng);
  return lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/** Save path: accept lat/lng or latitude/longitude on payload. */
function adminSaveCoordsFromPayload(payload) {
  const lat = parseCoordinate(payload?.latitude ?? payload?.lat);
  const lng = parseCoordinate(payload?.longitude ?? payload?.lng);
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function adminSavePayloadHasSkippableGeocodeCoords(payload) {
  return adminSaveCoordsFromPayload(payload) !== null;
}

/**
 * FormData can omit fields on hidden tabs; map still reads namedItem. Merge into payload before save.
 */
function adminEditorMergeLatLngIntoPayload(rawPayload, form, eventData) {
  const latEl = form?.elements?.namedItem?.("lat") ?? form?.elements?.namedItem?.("latitude");
  const lngEl = form?.elements?.namedItem?.("lng") ?? form?.elements?.namedItem?.("longitude");
  let lat = parseCoordinate(latEl?.value);
  let lng = parseCoordinate(lngEl?.value);
  if (lat !== null && lng !== null) {
    rawPayload.lat = lat;
    rawPayload.lng = lng;
    return;
  }
  lat = parseCoordinate(eventData?.latitude ?? eventData?.lat);
  lng = parseCoordinate(eventData?.longitude ?? eventData?.lng);
  if (lat !== null && lng !== null) {
    rawPayload.lat = lat;
    rawPayload.lng = lng;
  }
}

function closeActiveAdminEditorIfAny() {
  if (typeof state.adminEditorClose === "function") {
    try {
      state.adminEditorClose();
    } catch (_err) {
      /* ignore */
    }
  }
  state.adminEditorClose = null;
}

/**
 * Drawer / „Adresse suchen“: Geocoding nur hier erzwingen (nicht im Save-Handler).
 */
async function adminEditorGeocodeFromForm(form, eventData, busyButtons = []) {
  const manualBtn = form?.querySelector?.("[data-editor-geocode-manual]");
  const searchBtn = form?.querySelector?.("[data-editor-geocode-search]");
  const busyBtns = [...new Set([...busyButtons, manualBtn, searchBtn].filter(Boolean))];
  busyBtns.forEach((b) => {
    b.disabled = true;
  });
  console.log("admin geocode start", { eventId: eventData?.id });
  try {
    const snapshot = readAdminEditorLocationSnapshot(form, eventData);
    const coords = await resolveAdminCoordinates(snapshot);
    const latInput = form?.elements?.namedItem("lat");
    const lngInput = form?.elements?.namedItem("lng");
    if (latInput) latInput.value = String(coords.lat);
    if (lngInput) lngInput.value = String(coords.lng);
    refreshAdminEditorMapInForm(form);
    console.log("admin geocode success", { lat: coords.lat, lng: coords.lng });
    setGlobalFeedback("Koordinaten aus Adresse berechnet.", "success");
  } catch (error) {
    console.error("admin geocode error", error);
    setGlobalFeedback(error.message || "Geocoding fehlgeschlagen.", "error");
    throw error;
  } finally {
    busyBtns.forEach((b) => {
      b.disabled = false;
    });
  }
}

/**
 * Speichern aus dem Event-Editor (ein Codepfad für „Speichern“ und „Speichern + Social neu“).
 */
async function adminEditorSaveEventPayload(form, eventData, { regenerateSocial }) {
  const eventId = eventData?.id;
  if (!eventId) throw new Error("Event-ID fehlt.");

  console.log("admin save start", { eventId, regenerateSocial });

  const rawPayload = eventEditPayloadFromForm(form);
  adminStripEmptyFormOverrides(rawPayload, eventData);
  adminEditorMergeLatLngIntoPayload(rawPayload, form, eventData);
  let payload = sanitizeEventPayloadForDb(rawPayload);

  if (hasLocationChanged(eventData, payload)) {
    const skipCoords = adminSavePayloadHasSkippableGeocodeCoords(payload);
    if (skipCoords) {
      const pair = adminSaveCoordsFromPayload(payload);
      console.log("admin save skip geocode existing coords", {
        lat: pair?.lat,
        lng: pair?.lng
      });
    } else {
      try {
        const coords = await resolveAdminCoordinates({ ...eventData, ...payload });
        payload.lat = coords.lat;
        payload.lng = coords.lng;
        payload.geocoding_query = coords.geocoding_query;
        if (coords.formatted_address) payload.formatted_address = coords.formatted_address;
      } catch (geoErr) {
        const stored = adminSaveCoordsFromPayload(eventData);
        if (stored) {
          payload.lat = stored.lat;
          payload.lng = stored.lng;
          console.warn("admin save geocode failed, using stored coordinates", geoErr);
        } else {
          throw geoErr;
        }
      }
      payload = sanitizeEventPayloadForDb(payload);
    }
  }

  const merged = adminCoerceEventForValidation({ ...eventData, ...payload, id: eventId });
  const effectiveStatus = String(merged.status || "").toLowerCase();
  if (effectiveStatus === "approved" && isAdminEventIncompleteForApproval(merged)) {
    throw new Error(reportAdminEventValidationFailure(merged, "editor-save", payload));
  }

  console.log("admin save payload", { eventId, payload });
  await updateEventWithFallback(eventId, payload);
  console.log("admin save success", { eventId });

  if (regenerateSocial) {
    if (isAdminEventIncompleteForApproval(merged)) {
      throw new Error(reportAdminEventValidationFailure(merged, "editor-regenerate-social", payload));
    }
    try {
      await regenerateSocialDraftsForEvent(merged);
      console.log("admin social regenerate success", { eventId });
      return { saved: true, socialOk: true };
    } catch (socErr) {
      console.error("admin save social error", socErr);
      return { saved: true, socialOk: false, socialError: socErr };
    }
  }
  return { saved: true, socialOk: true };
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

function normalizeAdminRecurrenceType(value) {
  const normalized = String(value || "none").trim().toLowerCase();
  if (normalized === "weekly" || normalized === "monthly") return normalized;
  return "none";
}

function isAdminRecurringEvent(event) {
  return getAdminEffectiveRecurrenceType(event) !== "none";
}

/** Stored recurrence_type only — never infer weekly from orphan weekday fields. */
function getAdminEffectiveRecurrenceType(event) {
  if (event?.is_recurring !== true) return "none";
  const type = normalizeAdminRecurrenceType(event?.recurrence_type);
  if (type !== "weekly" && type !== "monthly") return "none";
  return type;
}

function adminHasValidRecurrencePattern(event) {
  const type = getAdminEffectiveRecurrenceType(event);
  if (type === "none") return false;
  const start = String(event?.recurrence_start_date || event?.event_date || "").trim();
  if (!start) return false;
  if (type === "weekly") {
    return normalizeAdminRecurrenceWeekday(event?.recurrence_weekday, start) !== null;
  }
  if (type === "monthly") {
    return normalizeAdminRecurrenceDayOfMonth(event?.recurrence_day_of_month, start) !== null;
  }
  return false;
}

/**
 * In-memory normalization: one-time events must not keep dirty recurrence columns.
 * Invalid is_recurring + pattern combos are treated as single events in admin UI state.
 */
function adminNormalizeRecurrenceState(event) {
  if (!event || typeof event !== "object") return event;
  const storedType = normalizeAdminRecurrenceType(event.recurrence_type);
  const explicitRecurring = event.is_recurring === true;
  const validWeeklyMonthly =
    explicitRecurring && (storedType === "weekly" || storedType === "monthly") && adminHasValidRecurrencePattern(event);

  if (!validWeeklyMonthly) {
    const hadDirty =
      explicitRecurring ||
      storedType !== "none" ||
      event.recurrence_weekday != null ||
      event.recurrence_day_of_month != null ||
      String(event.recurrence_start_date || "").trim() ||
      String(event.recurrence_end_date || "").trim();
    const normalized = {
      ...event,
      is_recurring: false,
      recurrence_type: "none",
      recurrence_start_date: null,
      recurrence_end_date: null,
      recurrence_weekday: null,
      recurrence_day_of_month: null,
      recurring_social_enabled: false
    };
    if (Object.prototype.hasOwnProperty.call(event, "recurring_group_id")) {
      normalized.recurring_group_id = null;
    }
    if (hadDirty) {
      console.log("admin recurrence normalized", {
        eventId: event.id ?? null,
        storedType,
        is_recurring: explicitRecurring,
        result: "one-time"
      });
    }
    return normalized;
  }

  const coerced = adminCoerceRecurrenceFields({
    ...event,
    is_recurring: true,
    recurrence_type: storedType
  });
  console.log("admin recurrence normalized", {
    eventId: event.id ?? null,
    result: storedType,
    recurrence_weekday: coerced.recurrence_weekday ?? null,
    recurrence_day_of_month: coerced.recurrence_day_of_month ?? null
  });
  return coerced;
}

/** Explicit DB flag; missing/false keeps legacy one-time behaviour unchanged. */
function eventIsRecurringSocialFlag(event) {
  return event?.is_recurring === true;
}

/** Master series eligible for recurring social prepare (Phase B). */
function isRecurringSocialMaster(event) {
  return eventIsRecurringSocialFlag(event) && isAdminRecurringEvent(adminCoerceRecurrenceFields(event));
}

function adminFormatLocalYmd(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** In-memory + filter coercion: start date and weekday/day-of-month from event_date when missing. */
function adminCoerceRecurrenceFields(event) {
  if (!event || typeof event !== "object") return event;
  const type = getAdminEffectiveRecurrenceType(event);
  if (type === "none") return adminNormalizeRecurrenceState(event);

  const recurrence_start_date =
    String(event.recurrence_start_date || "").trim() || String(event.event_date || "").trim();
  const fallbackYmd = recurrence_start_date || event.event_date;
  const coerced = {
    ...event,
    recurrence_type: type,
    recurrence_start_date
  };
  if (type === "weekly") {
    coerced.recurrence_weekday = normalizeAdminRecurrenceWeekday(event.recurrence_weekday, fallbackYmd);
  }
  if (type === "monthly") {
    coerced.recurrence_day_of_month = normalizeAdminRecurrenceDayOfMonth(
      event.recurrence_day_of_month,
      fallbackYmd
    );
  }
  return coerced;
}

function detectAdminRecurrenceTextHint(event) {
  const haystack = [
    event?.name,
    event?.title,
    event?.description,
    event?.description_de,
    event?.description_en,
    event?.verification_notes,
    event?.genre
  ]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");
  if (/wöchentlich|woechentlich|\bweekly\b|jeden\s+(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)/i.test(haystack)) {
    return "weekly";
  }
  if (/monatlich|\bmonthly\b/i.test(haystack)) return "monthly";
  return null;
}

function inferAdminRecurrenceType(event) {
  const stored = normalizeAdminRecurrenceType(event?.recurrence_type);
  if (stored !== "none") return stored;
  if (Number.isInteger(Number(event?.recurrence_weekday))) return "weekly";
  if (Number.isInteger(Number(event?.recurrence_day_of_month))) return "monthly";
  return detectAdminRecurrenceTextHint(event) || "none";
}

function adminNormalizeEventDateForValidation(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const de = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (de) {
    const day = String(de[1]).padStart(2, "0");
    const month = String(de[2]).padStart(2, "0");
    return `${de[3]}-${month}-${day}`;
  }
  return s;
}

function adminNormalizeEventTimeForValidation(raw) {
  const s = String(raw || "").trim();
  if (!s || /^tbd$/i.test(s)) return "";
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return s;
  const hh = String(Math.min(23, Math.max(0, parseInt(m[1], 10)))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, parseInt(m[2], 10)))).padStart(2, "0");
  const ss = m[3] !== undefined && m[3] !== "" ? String(Math.min(59, Math.max(0, parseInt(m[3], 10)))).padStart(2, "0") : "";
  return ss ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
}

function adminCoerceEventForValidation(event) {
  const base = event && typeof event === "object" ? { ...event } : {};
  const dateNorm = adminNormalizeEventDateForValidation(base.event_date);
  if (dateNorm) base.event_date = dateNorm;
  const timeNorm = adminNormalizeEventTimeForValidation(base.event_time);
  if (timeNorm) base.event_time = timeNorm;
  const primaryImage = resolvePrimaryImageUrl(base);
  if (primaryImage && !String(base.image_url || "").trim()) {
    base.image_url = primaryImage;
  }
  return adminNormalizeRecurrenceState(base);
}

function adminEventHasImage(event) {
  return Boolean(String(resolvePrimaryImageUrl(event) || "").trim());
}

function adminEventHasName(event) {
  const name = String(event?.name || event?.title || "").trim();
  return Boolean(name && name !== "-" && name !== "–" && name !== "—");
}

function adminEventHasDate(event) {
  return Boolean(adminNormalizeEventDateForValidation(event?.event_date));
}

function adminEventHasTime(event) {
  return Boolean(adminNormalizeEventTimeForValidation(event?.event_time));
}

function adminEventHasLocation(event) {
  return Boolean(
    String(event?.location_name || event?.venue || "").trim() ||
      String(event?.address || "").trim()
  );
}

function adminEventHasGenre(event) {
  return Boolean(String(event?.genre || event?.category || "").trim());
}

function adminBuildEventValidationChecks(event) {
  const coerced = adminCoerceEventForValidation(event);
  return {
    name: adminEventHasName(coerced),
    event_date: adminEventHasDate(coerced),
    event_time: adminEventHasTime(coerced),
    location_name: Boolean(String(coerced.location_name || coerced.venue || "").trim()),
    address: Boolean(String(coerced.address || "").trim()),
    genre: Boolean(String(coerced.genre || "").trim()),
    category: Boolean(String(coerced.category || "").trim()),
    image_url: Boolean(String(coerced.image_url || "").trim()),
    image_urls: adminEventHasImage(coerced)
  };
}

function getAdminEventApprovalMissingFields(event) {
  const coerced = adminCoerceEventForValidation(event);
  const missing = [];
  if (!adminEventHasName(coerced)) missing.push("name");
  if (!adminEventHasDate(coerced)) missing.push("event_date");
  if (!adminEventHasTime(coerced)) missing.push("event_time");
  if (!adminEventHasLocation(coerced)) missing.push("location");
  if (!adminEventHasImage(coerced)) missing.push("image");
  if (!adminEventHasGenre(coerced)) missing.push("genre");
  return missing;
}

function formatAdminEventIncompleteMessage(missing) {
  if (!missing?.length) return ADMIN_EVENT_APPROVAL_INCOMPLETE_MSG;
  const labels = missing.map((key) => ADMIN_EVENT_MISSING_FIELD_LABELS_DE[key] || key);
  if (labels.length === 1) return `Event unvollständig: ${labels[0]} fehlt.`;
  if (labels.length === 2) return `Event unvollständig: ${labels[0]} und ${labels[1]} fehlen.`;
  return `Event unvollständig: ${labels.slice(0, -1).join(", ")} und ${labels[labels.length - 1]} fehlen.`;
}

function reportAdminEventValidationFailure(event, context = "approval", payload = null) {
  const missing = getAdminEventApprovalMissingFields(event);
  const checks = adminBuildEventValidationChecks(event);
  console.error("EVENT VALIDATION FAILED", {
    eventId: event?.id ?? null,
    context,
    payload,
    missing,
    checks
  });
  const message = formatAdminEventIncompleteMessage(missing);
  setGlobalFeedback(message, "error");
  return message;
}

function isAdminEventIncompleteForApproval(event) {
  return getAdminEventApprovalMissingFields(event).length > 0;
}

function blockAdminEventApprovalIfIncomplete(event, context = "approval", payload = null) {
  if (!isAdminEventIncompleteForApproval(event)) return false;
  reportAdminEventValidationFailure(event, context, payload);
  return true;
}

function isAdminDefectiveEvent(event) {
  if (String(event?.status || "").toLowerCase() !== "approved") return false;
  return isAdminEventIncompleteForApproval(event);
}

function isAdminRecurringIncomplete(event) {
  if (event?.is_recurring !== true) return false;
  const storedType = normalizeAdminRecurrenceType(event?.recurrence_type);
  if (storedType !== "weekly" && storedType !== "monthly") return false;
  const start = String(event?.recurrence_start_date || event?.event_date || "").trim();
  if (!start) return true;
  const coerced = adminCoerceRecurrenceFields(event);
  if (storedType === "weekly" && coerced.recurrence_weekday === null) return true;
  if (storedType === "monthly" && coerced.recurrence_day_of_month === null) return true;
  return false;
}

function buildAdminRecurrenceRepairPatch(event) {
  let type = inferAdminRecurrenceType(event);
  if (type === "none") return null;

  const eventDate = String(event?.event_date || "").trim();
  const startDate = String(event?.recurrence_start_date || "").trim() || eventDate;
  if (!startDate) return null;

  const patch = {
    recurrence_type: type,
    recurrence_start_date: startDate
  };
  if (type === "weekly") {
    const weekday = normalizeAdminRecurrenceWeekday(event?.recurrence_weekday, startDate);
    if (weekday === null) return null;
    patch.recurrence_weekday = weekday;
  }
  if (type === "monthly") {
    const dom = normalizeAdminRecurrenceDayOfMonth(event?.recurrence_day_of_month, startDate);
    if (dom === null) return null;
    patch.recurrence_day_of_month = dom;
  }
  const end = String(event?.recurrence_end_date || "").trim();
  if (end) patch.recurrence_end_date = end;
  return patch;
}

function isAdminStoredRecurrenceNone(event) {
  const raw = String(event?.recurrence_type ?? "").trim().toLowerCase();
  return !raw || raw === "none";
}

function canShowAdminWeeklyRepairButton(event) {
  if (!isAdminStoredRecurrenceNone(event)) return false;
  if (!String(event?.event_date || "").trim()) return false;
  return isEventPast(event);
}

function buildAdminWeeklyRepairPatch(event) {
  if (!isAdminStoredRecurrenceNone(event)) return null;
  const eventDate = String(event?.event_date || "").trim();
  if (!eventDate) return null;
  const weekday = normalizeAdminRecurrenceWeekday(null, eventDate);
  if (weekday === null) return null;
  return {
    recurrence_type: "weekly",
    recurrence_start_date: eventDate,
    recurrence_weekday: weekday,
    recurrence_end_date: null
  };
}

function normalizeAdminRecurrenceWeekday(raw, fallbackDateYmd) {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 0 && n <= 6) return n;
  const parts = parseAdminYmd(fallbackDateYmd);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day).getDay();
}

function normalizeAdminRecurrenceDayOfMonth(raw, fallbackDateYmd) {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= 31) return n;
  const parts = parseAdminYmd(fallbackDateYmd);
  if (!parts) return null;
  return parts.day;
}

function adminDateFromYmdParts(parts) {
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0);
}

function adminResolveWeeklyOccurrence(cursorDate, targetWeekday) {
  const occurrence = new Date(cursorDate);
  const delta = (targetWeekday - occurrence.getDay() + 7) % 7;
  occurrence.setDate(occurrence.getDate() + delta);
  occurrence.setHours(0, 0, 0, 0);
  return occurrence;
}

function adminResolveMonthlyOccurrence(cursorDate, dayOfMonth) {
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (dayOfMonth > daysInMonth) return null;
  return new Date(year, month, dayOfMonth, 0, 0, 0, 0);
}

function applyAdminEventWallTime(dayDate, event) {
  const timeParts = parseAdminTime(event?.event_time || "0:00");
  const d = new Date(dayDate);
  d.setHours(timeParts.hour, timeParts.minute, 0, 0);
  return d;
}

/**
 * Next future occurrence for weekly/monthly series (ignores stale event_date alone).
 * Returns null when recurrence ended or no future occurrence remains.
 */
function getNextRecurringOccurrence(event, now = new Date()) {
  const coerced = adminCoerceRecurrenceFields(event);
  const type = normalizeAdminRecurrenceType(coerced?.recurrence_type);
  if (type === "none") return null;

  const startDate = adminDateFromYmdParts(
    parseAdminYmd(coerced?.recurrence_start_date || coerced?.event_date)
  );
  if (!startDate) return null;

  const endParts = parseAdminYmd(coerced?.recurrence_end_date);
  const endDate = endParts ? adminDateFromYmdParts(endParts) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (endDate && endDate < today) return null;

  if (type === "weekly") {
    const fallbackYmd = coerced.recurrence_start_date || coerced.event_date;
    const targetWeekday = normalizeAdminRecurrenceWeekday(coerced.recurrence_weekday, fallbackYmd);
    if (targetWeekday === null) return null;
    let candidate = adminResolveWeeklyOccurrence(startDate > today ? startDate : today, targetWeekday);
    for (let i = 0; i < 520; i += 1) {
      if (endDate && candidate > endDate) return null;
      if (candidate >= startDate) {
        const withTime = applyAdminEventWallTime(candidate, coerced);
        if (withTime > now) return withTime;
      }
      candidate = new Date(candidate);
      candidate.setDate(candidate.getDate() + 7);
      candidate.setHours(0, 0, 0, 0);
    }
    return null;
  }

  if (type === "monthly") {
    const fallbackYmd = coerced.recurrence_start_date || coerced.event_date;
    const dayOfMonth = normalizeAdminRecurrenceDayOfMonth(coerced.recurrence_day_of_month, fallbackYmd);
    if (dayOfMonth === null) return null;
    let cursor = new Date(today.getFullYear(), today.getMonth(), 1);
    if (startDate > today) cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    for (let i = 0; i < 36; i += 1) {
      const occ = adminResolveMonthlyOccurrence(cursor, dayOfMonth);
      if (occ && occ >= startDate && (!endDate || occ <= endDate)) {
        const withTime = applyAdminEventWallTime(occ, coerced);
        if (withTime > now) return withTime;
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return null;
  }

  return null;
}

/** Occurrence starts within the next N days (7-day weekly prep window). */
function getRecurringOccurrencesWithinHorizon(
  event,
  horizonDays = RECURRING_SOCIAL_AUTO_PREP_HORIZON_DAYS,
  now = new Date()
) {
  if (!isRecurringSocialMaster(event)) return [];
  const days = Math.min(Math.max(Number(horizonDays) || 7, 1), 30);
  const horizonEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const out = [];
  let cursor = now;
  for (let i = 0; i < 24 && out.length < 16; i += 1) {
    const next = getNextRecurringOccurrence(event, cursor);
    if (!next || Number.isNaN(next.getTime())) break;
    if (next.getTime() > horizonEnd.getTime()) break;
    const key = next.toISOString();
    if (out.some((d) => d.toISOString() === key)) break;
    out.push(next);
    cursor = new Date(next.getTime() + 60_000);
  }
  return out;
}

function isRecurringEventPast(event, now = new Date()) {
  return getNextRecurringOccurrence(event, now) === null;
}

function socialEffectiveEventStart(event, now = new Date()) {
  const coerced = adminCoerceRecurrenceFields(event);
  if (isAdminRecurringEvent(coerced)) {
    const next = getNextRecurringOccurrence(coerced, now);
    if (next && !Number.isNaN(next.getTime())) return next;
    return null;
  }
  return dateFromAdminEventWallTime(coerced);
}

function adminSocialEventDateYmd(event, eventStart) {
  if (eventStart instanceof Date && !Number.isNaN(eventStart.getTime())) {
    return adminFormatLocalYmd(eventStart);
  }
  return String(event?.event_date || event?.recurrence_start_date || "").trim() || null;
}

const SOCIAL_CAPTION_STYLE_MODES = [
  "natural",
  "emotional",
  "premium",
  "party",
  "elegant",
  "beach",
  "latin",
  "short",
  "promo"
];

const SOCIAL_CAPTION_SPANISH_MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
];

const SOCIAL_CAPTION_BANNED = [/planazo/gi, /\b\d{4}-\d{2}-\d{2}\b/g, /\bAI\b/g, /don't miss/gi];

function detectSocialCaptionLanguage(event) {
  const country = String(event?.country || "").trim().toLowerCase();
  if (/espa|spain|españa|andaluc/i.test(country)) return "es";
  if (String(event?.description_es || "").trim().length > 20) return "es";
  if (/deutsch|germany|deutschland|österreich|austria|schweiz/i.test(country)) return "de";
  if (String(event?.description_de || "").trim().length > 20) return "de";
  if (String(event?.description_en || "").trim().length > 20) return "en";
  return "es";
}

function formatSocialCaptionDate(date, lang = "es", { withWeekday = false, withTime = false } = {}) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  let line = "";
  if (lang === "de") {
    line = `${String(day).padStart(2, "0")}.${String(month + 1).padStart(2, "0")}.${year}`;
  } else if (lang === "en") {
    const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    line = `${enMonths[month]} ${day}`;
  } else {
    const monthName = SOCIAL_CAPTION_SPANISH_MONTHS[month] || "";
    const cap = monthName ? monthName.charAt(0).toUpperCase() + monthName.slice(1) : "";
    if (withWeekday) {
      const wd = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][date.getDay()];
      line = `${wd} ${day} ${cap}`;
    } else {
      line = `${day} ${cap}`;
    }
  }
  if (withTime) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    line = line ? `${line} · ${hh}:${mm}` : `${hh}:${mm}`;
  }
  return line;
}

function slugHashtagToken(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 28);
}

function buildSocialHashtags(event, platform = "instagram") {
  const tags = [];
  const seen = new Set();
  const push = (raw) => {
    const token = slugHashtagToken(raw);
    if (!token || token.length < 3 || seen.has(token.toLowerCase())) return;
    seen.add(token.toLowerCase());
    tags.push(`#${token}`);
  };
  const city = String(event?.city || "").trim();
  const venue = String(event?.location_name || "").trim();
  const genre = String(event?.genre || "").trim().split(/[,/|]/)[0];
  if (city) push(city.replace(/\s+/g, ""));
  if (genre) push(genre);
  if (venue) push(venue.split(/\s+/)[0]);
  const vibes = {
    instagram: ["LiveMusic", "NightOut"],
    facebook: ["Events", "Local"],
    tiktok: ["FYP", "Vibes"]
  };
  for (const v of vibes[String(platform).toLowerCase()] || vibes.instagram) push(v);
  if (tags.length < 3) push("GoMarcha");
  return tags.slice(0, 5).join(" ");
}

function sanitizeHumanCaptionText(text) {
  let out = String(text || "").trim();
  for (const re of SOCIAL_CAPTION_BANNED) out = out.replace(re, "").trim();
  out = out.replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n");
  return out;
}

function socialCaptionTemplatePool(styleMode, platform, lang) {
  const p = String(platform || "instagram").toLowerCase();
  const s = SOCIAL_CAPTION_STYLE_MODES.includes(styleMode) ? styleMode : "natural";
  const pools = {
    es: {
      natural: [
        (c) => `${c.venue ? `Esta noche suena bien en ${c.venue}` : "Buen plan para salir"}${c.city ? ` (${c.city})` : ""}.`,
        (c) => (c.genre ? `${c.genre} en vivo` : "Música en vivo") + (c.venue ? ` · ${c.venue}` : "") + ".",
        (c) => `Si te apetece ambiente, ${c.name}${c.venue ? ` en ${c.venue}` : ""}.`
      ],
      emotional: [
        (c) => `Hay noches que se quedan. Esta puede ser una.${c.venue ? `\n${c.venue}` : ""}`,
        (c) => `Cuando la música encaja, no hace falta más.${c.city ? `\n${c.city}` : ""}`,
        (c) => `Vibra buena, gente cercana${c.venue ? `, ${c.venue}` : ""}.`
      ],
      premium: [
        (c) => `Una velada cuidada${c.venue ? ` en ${c.venue}` : ""}${c.city ? ` · ${c.city}` : ""}.`,
        (c) => `Directo con estilo. ${c.name}${c.genre ? ` · ${c.genre}` : ""}.`,
        (c) => `Plan elegante para quien busca algo distinto.`
      ],
      party: [
        (c) => `Súbete el volumen: ${c.name}${c.venue ? ` @ ${c.venue}` : ""}.`,
        (c) => `Noche larga, buena energía${c.city ? ` en ${c.city}` : ""}.`,
        (c) => `A bailar se ha dicho.`
      ],
      elegant: [
        (c) => `Detalles que marcan la diferencia${c.venue ? ` en ${c.venue}` : ""}.`,
        (c) => `${c.name} — ambiente refinado, sin prisas.`
      ],
      beach: [
        (c) => `Brisa, música y buena compañía${c.city ? ` · ${c.city}` : ""}.`,
        (c) => `Tarde-noche con sabor a Costa.`
      ],
      latin: [
        (c) => `Ritmo, calor y escena viva${c.venue ? ` en ${c.venue}` : ""}.`,
        (c) => `${c.genre || "Latin"} que se siente en el cuerpo.`
      ],
      short: [(c) => `${c.name}${c.venue ? ` · ${c.venue}` : ""}.`, (c) => `Hoy toca ${c.genre || "música"}.`],
      promo: [
        (c) => `Entradas / info en el enlace.`,
        (c) => `Reserva tu sitio — ${c.name}.`
      ]
    },
    de: {
      natural: [
        (c) => `${c.name}${c.venue ? ` im ${c.venue}` : ""}${c.city ? `, ${c.city}` : ""}.`,
        (c) => `Live-Musik, gute Stimmung.`
      ],
      emotional: [(c) => `Ein Abend, der bleibt — ${c.name}.`, (c) => `Gänsehaut-Momente inklusive.`],
      premium: [(c) => `Stilvoller Abend${c.venue ? ` im ${c.venue}` : ""}.`],
      party: [(c) => `Heute wird gefeiert: ${c.name}.`],
      elegant: [(c) => `${c.name} — elegant & entspannt.`],
      beach: [(c) => `Sonnenuntergang & Beats.`],
      latin: [(c) => `Latin-Feeling live on stage.`],
      short: [(c) => `${c.name}. Heute.`],
      promo: [(c) => `Tickets & Infos im Link.`]
    },
    en: {
      natural: [
        (c) => `${c.name}${c.venue ? ` at ${c.venue}` : ""}${c.city ? `, ${c.city}` : ""}.`,
        (c) => `Good crowd, good sound.`
      ],
      emotional: [(c) => `Nights like this stay with you.`, (c) => `Feel-it-in-your-chest kind of show.`],
      premium: [(c) => `A polished night out${c.venue ? ` at ${c.venue}` : ""}.`],
      party: [(c) => `Turn it up — ${c.name} tonight.`],
      elegant: [(c) => `${c.name} — refined & unhurried.`],
      beach: [(c) => `Coastline energy & live music.`],
      latin: [(c) => `Latin heat on stage.`],
      short: [(c) => `${c.name}. Tonight.`],
      promo: [(c) => `Tickets & info in bio.`]
    }
  };
  const langPool = pools[lang] || pools.es;
  const stylePool = langPool[s] || langPool.natural;
  const platformTweaks =
    p === "facebook"
      ? [(c) => `${stylePool[0](c)}\n${c.venue ? `Ort: ${c.venue}` : ""}${c.dateLine ? `\n${c.dateLine}` : ""}`.trim()]
      : p === "tiktok"
        ? [(c) => `${c.name}${c.venue ? ` · ${c.venue}` : ""}`.slice(0, 90)]
        : stylePool;
  return platformTweaks.length ? platformTweaks : stylePool;
}

function pickSocialCaptionTemplate(event, styleMode, platform, lang, seed = 0) {
  const pool = socialCaptionTemplatePool(styleMode, platform, lang);
  const key = `${event?.id}:${platform}:${styleMode}:${seed}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return pool[h % pool.length];
}

function buildHumanSocialCaptionContext(event, eventStart, lang) {
  const name = String(event?.name || event?.title || "").trim() || "Event";
  const venue = String(event?.location_name || "").trim();
  const city = String(event?.city || "").trim();
  const genre = String(event?.genre || "").trim();
  const dateLine = eventStart ? formatSocialCaptionDate(eventStart, lang, { withWeekday: lang === "es" }) : "";
  return { name, venue, city, genre, dateLine };
}

function generateHumanSocialCaptionBundle(event, platform, eventStartOrScheduled, options = {}) {
  const platformKey = String(platform || "instagram").toLowerCase();
  const styleMode = SOCIAL_CAPTION_STYLE_MODES.includes(options.styleMode) ? options.styleMode : "natural";
  const lang = options.lang || detectSocialCaptionLanguage(event);
  const includeDate = options.includeDate !== false;
  const seed = Number(options.seed) || 0;
  const start =
    eventStartOrScheduled instanceof Date && !Number.isNaN(eventStartOrScheduled.getTime())
      ? eventStartOrScheduled
      : socialEffectiveEventStart(event, new Date());

  const ctx = buildHumanSocialCaptionContext(event, start, lang);
  const templateFn = pickSocialCaptionTemplate(event, styleMode, platformKey, lang, seed);
  let caption = sanitizeHumanCaptionText(templateFn(ctx));

  if (includeDate && ctx.dateLine && !caption.includes(ctx.dateLine)) {
    if (platformKey === "facebook") caption = `${caption}\n${ctx.dateLine}`;
    else if (platformKey !== "tiktok" && Math.random() > 0.35) caption = `${caption}\n${ctx.dateLine}`;
  }

  if (platformKey === "instagram" && caption.length > 280) {
    caption = `${caption.slice(0, 277).trim()}…`;
  }
  if (platformKey === "tiktok" && caption.length > 120) {
    caption = `${caption.slice(0, 117).trim()}…`;
  }

  const hashtags = options.hashtags ?? buildSocialHashtags(event, platformKey);
  const cta_text =
    options.cta_text ??
    (styleMode === "promo" || platformKey === "facebook"
      ? lang === "es"
        ? "Más info en el enlace."
        : lang === "de"
          ? "Infos im Link."
          : "Details in bio."
      : "");

  console.log("caption regenerate", { eventId: event?.id, platform: platformKey, styleMode, lang });

  return { caption, hashtags, cta_text, styleMode, lang };
}

function buildAdminSocialCaption(event, eventStartOrScheduled, platform = "instagram", styleMode = "natural") {
  return generateHumanSocialCaptionBundle(event, platform, eventStartOrScheduled, { styleMode }).caption;
}

function buildSocialQueuePayload(event, platform, scheduledAt) {
  const scheduled =
    scheduledAt instanceof Date
      ? scheduledAt
      : new Date(String(scheduledAt || ""));
  const scheduledIso = Number.isNaN(scheduled.getTime()) ? null : scheduled.toISOString();
  const eventStart = socialEffectiveEventStart(event, scheduled);
  const imageUrl = String(resolvePrimaryImageUrl(event) || "").trim();
  const title = String(event?.name || event?.title || "").trim();
  const platformKey = String(platform || "instagram").toLowerCase();
  const bundle = generateHumanSocialCaptionBundle(event, platformKey, eventStart || scheduled, {
    styleMode: "natural"
  });

  return {
    event_id: event?.id ?? null,
    platform: platformKey,
    status: "pending",
    scheduled_at: scheduledIso,
    title,
    caption: bundle.caption,
    hashtags: bundle.hashtags,
    cta_text: bundle.cta_text || null,
    image_url: imageUrl,
    resolved_image_url: imageUrl,
    event_date: adminSocialEventDateYmd(event, eventStart),
    location_name: String(event?.location_name || "").trim() || null,
    city: String(event?.city || "").trim() || null,
    retry_count: 0,
    postiz_response: mergeSocialQueuePostizResponse(null, bundle.hashtags, bundle.cta_text, {
      style_mode: bundle.styleMode
    })
  };
}

function pickSocialQueueInsertRow(row) {
  const out = {};
  for (const key of Object.keys(row || {})) {
    if (key.startsWith("_")) continue;
    if (!SOCIAL_QUEUE_INSERT_COLUMNS.has(key)) continue;
    out[key] = row[key];
  }
  return out;
}

function isValidSocialQueuePayload(payload) {
  const eventId = String(payload?.event_id ?? "").trim();
  const title = String(payload?.title ?? "").trim();
  const imageUrl = String(payload?.image_url || payload?.resolved_image_url || "").trim();
  const platform = String(payload?.platform || "").toLowerCase();
  const scheduled = payload?.scheduled_at;
  return Boolean(
    eventId &&
    title &&
    imageUrl &&
    SOCIAL_REVIEW_PLATFORMS.includes(platform) &&
    scheduled &&
    !Number.isNaN(new Date(scheduled).getTime())
  );
}

function isSocialQueueRowInvalid(row) {
  const hasEventId = Boolean(String(row?.event_id ?? "").trim());
  const hasTitle = Boolean(String(row?.title || "").trim());
  const hasCaption = Boolean(String(row?.caption || "").trim());
  const hasImage = Boolean(String(row?.image_url || row?.resolved_image_url || "").trim());
  const isInvalid = !hasEventId && !hasTitle && !hasCaption && !hasImage;
  console.log("social invalid check", {
    id: row?.id,
    status: row?.status,
    invalid: isInvalid,
    title: Boolean(String(row?.title || "").trim()),
    caption: Boolean(String(row?.caption || "").trim()),
    image: Boolean(String(row?.image_url || "").trim())
  });
  return isInvalid;
}

function readSocialQueueExtras(row) {
  const fromCol = {
    hashtags: String(row?.hashtags || "").trim(),
    cta_text: String(row?.cta_text || "").trim(),
    style_mode: "natural"
  };
  const pr = row?.postiz_response;
  const meta =
    pr && typeof pr === "object" && pr._marcha_admin && typeof pr._marcha_admin === "object"
      ? pr._marcha_admin
      : null;
  if (meta) {
    if (!fromCol.hashtags && meta.hashtags) fromCol.hashtags = String(meta.hashtags).trim();
    if (!fromCol.cta_text && meta.cta_text) fromCol.cta_text = String(meta.cta_text).trim();
    if (meta.style_mode && SOCIAL_CAPTION_STYLE_MODES.includes(meta.style_mode)) {
      fromCol.style_mode = meta.style_mode;
    }
  }
  return fromCol;
}

function mergeSocialQueuePostizResponse(existing, hashtags, ctaText, adminMeta = {}) {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing) ? { ...existing } : {};
  base._marcha_admin = {
    hashtags: String(hashtags || "").trim(),
    cta_text: String(ctaText || "").trim(),
    style_mode: SOCIAL_CAPTION_STYLE_MODES.includes(adminMeta.style_mode) ? adminMeta.style_mode : "natural"
  };
  return base;
}

function socialQueueFullCaption(row, extras) {
  const parts = [String(row?.caption || "").trim()];
  const tags = String(extras?.hashtags || "").trim();
  const cta = String(extras?.cta_text || "").trim();
  if (tags) parts.push(tags);
  if (cta) parts.push(cta);
  return parts.filter(Boolean).join("\n\n");
}

const DATETIME_LOCAL_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATETIME_LOCAL_VALUE_STRICT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const GERMAN_DATETIME_DISPLAY_RE = /^\d{1,2}\.\d{1,2}\.\d{4}/;

function isGermanScheduledAtDisplay(value) {
  const raw = String(value ?? "").trim();
  return GERMAN_DATETIME_DISPLAY_RE.test(raw) || raw.includes(",");
}

function warnIfInvalidSocialQueueDatetimeInput(input, context = "") {
  if (!input) return;
  const raw = String(input.value ?? "").trim();
  if (!raw) return;
  if (!DATETIME_LOCAL_VALUE_STRICT_RE.test(raw)) {
    console.warn("[social-queue] invalid datetime-local input value", {
      context,
      type: input.type,
      value: raw,
      germanDisplay: isGermanScheduledAtDisplay(raw),
      attributeValue: input.getAttribute("value"),
      canonical: input.dataset.canonicalScheduledAt || null,
      queueId: input.closest("[data-queue-id]")?.dataset?.queueId || null,
      build: ADMIN_DASHBOARD_BUILD
    });
  }
}

/** datetime-local value (YYYY-MM-DDTHH:mm) from ISO / DB timestamp — browser local wall clock (e.g. Europe/Madrid). */
function toDatetimeLocalValue(iso) {
  const normalizedIso = normalizeSocialQueueScheduledAtIso(iso) || iso;
  if (!normalizedIso) return "";
  const d = new Date(normalizedIso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Safe value for <input type="datetime-local"> — never German display text. */
function socialQueueScheduledAtInputValue(row) {
  return toDatetimeLocalValue(row?.scheduled_at);
}

function isDatetimeLocalInputValue(value) {
  return DATETIME_LOCAL_VALUE_STRICT_RE.test(String(value ?? "").trim());
}

/**
 * Sole writer for the social-queue scheduled_at datetime-local input.
 * Only ever assigns YYYY-MM-DDTHH:mm derived from row ISO via toDatetimeLocalValue().
 */
function setSocialQueueScheduledAtInputValue(input, scheduledAtSource) {
  if (!input) return "";
  const next = toDatetimeLocalValue(scheduledAtSource);
  input.type = "datetime-local";
  input.setAttribute("lang", "en");
  input.setAttribute("step", "60");
  if (next) {
    input.setAttribute("value", next);
    input.value = next;
    input.dataset.canonicalScheduledAt = next;
  } else {
    input.removeAttribute("value");
    input.value = "";
    delete input.dataset.canonicalScheduledAt;
  }
  warnIfInvalidSocialQueueDatetimeInput(input, "setSocialQueueScheduledAtInputValue");
  return next;
}

/** Never put German display strings into datetime-local inputs — coerce to YYYY-MM-DDTHH:mm or "". */
function coerceDatetimeLocalInputValue(value, fallbackIso) {
  const raw = String(value ?? "").trim();
  if (isDatetimeLocalInputValue(raw)) return raw.slice(0, 16);
  const fromIso = toDatetimeLocalValue(fallbackIso);
  return fromIso || "";
}

function normalizeSocialQueueScheduledAtIso(value) {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (isDatetimeLocalInputValue(raw)) return parseDatetimeLocalInput(raw);
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  const de = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4}),?\s*(\d{1,2}):(\d{2})/);
  if (de) {
    const local = new Date(
      Number(de[3]),
      Number(de[2]) - 1,
      Number(de[1]),
      Number(de[4]),
      Number(de[5]),
      0
    );
    if (!Number.isNaN(local.getTime())) return local.toISOString();
  }
  return null;
}

function syncSocialQueueScheduledAtInput(editorEl, row) {
  const input = editorEl?.querySelector('[name="scheduled_at"]');
  if (!input) return;
  setSocialQueueScheduledAtInputValue(input, row?.scheduled_at);
}

/**
 * Before save: recover datetime-local from row ISO if the input shows German/invalid text.
 * @returns {{ ok: true, scheduled_at_local: string } | { ok: false, error: string }}
 */
function ensureSocialQueueScheduledAtInput(editorEl, row) {
  const input = editorEl?.querySelector('[name="scheduled_at"]');
  if (!input) return { ok: false, error: "Bitte wähle den Zeitpunkt erneut über den Kalender aus." };
  const raw = String(input.value ?? "").trim();
  if (isDatetimeLocalInputValue(raw)) {
    return { ok: true, scheduled_at_local: raw };
  }
  const recovered = setSocialQueueScheduledAtInputValue(input, row?.scheduled_at);
  if (isDatetimeLocalInputValue(recovered)) {
    console.warn("[social-queue] recovered scheduled_at input from row ISO", {
      queueId: row?.id,
      previousValue: raw,
      recovered,
      rowScheduledAt: row?.scheduled_at
    });
    return { ok: true, scheduled_at_local: recovered };
  }
  warnIfInvalidSocialQueueDatetimeInput(input, "ensureSocialQueueScheduledAtInput");
  return { ok: false, error: "Bitte wähle den Zeitpunkt erneut über den Kalender aus." };
}

function sanitizeSocialQueueDraftSnapshots() {
  for (const [id, snapJson] of state.socialQueueDraftSnapshots) {
    try {
      const form = JSON.parse(snapJson);
      const row = findSocialQueueRow(id);
      const fixed = coerceDatetimeLocalInputValue(form.scheduled_at_local, row?.scheduled_at);
      if (fixed !== form.scheduled_at_local) {
        form.scheduled_at_local = fixed;
        state.socialQueueDraftSnapshots.set(id, JSON.stringify(form));
      }
    } catch {
      state.socialQueueDraftSnapshots.delete(id);
    }
  }
}

function ensureSocialQueueVisibleToolbar(editorEl, row) {
  if (!editorEl || !row) return;
  console.log("[visible-toolbar-render]", { queueId: row?.id, status: row?.status });
  const actions = editorEl.querySelector(".admin-sq-editor__actions");
  if (!actions) return;
  const alreadySent =
    String(row.status || "").toLowerCase() === "sent_to_postiz" || Boolean(String(row.postiz_post_id || "").trim());
  let postizBtn = actions.querySelector('[data-queue-action="send-to-postiz"]');
  if (!postizBtn) {
    postizBtn = document.createElement("button");
    postizBtn.type = "button";
    postizBtn.className = "admin-btn admin-btn-primary";
    postizBtn.setAttribute("data-queue-action", "send-to-postiz");
    const saveBtn = actions.querySelector('[data-queue-action="save-draft"]');
    if (saveBtn) saveBtn.insertAdjacentElement("afterend", postizBtn);
    else actions.prepend(postizBtn);
  }
  postizBtn.textContent = alreadySent ? "✅ An Postiz übergeben" : "🚀 An Postiz senden";
  postizBtn.disabled = alreadySent;
  if (alreadySent) postizBtn.setAttribute("aria-disabled", "true");
  else postizBtn.removeAttribute("aria-disabled");
}

function syncExpandedSocialQueueEditors() {
  const queueId = state.socialQueueExpandedId;
  if (!queueId || !dom.socialQueuePanel) return;
  const card = dom.socialQueuePanel.querySelector(`[data-queue-id="${CSS.escape(String(queueId))}"]`);
  const editor = card?.querySelector("[data-sq-editor]");
  const row = findSocialQueueRow(queueId);
  if (editor && row) {
    ensureSocialQueueVisibleToolbar(editor, row);
    syncSocialQueueScheduledAtInput(editor, row);
    warnIfInvalidSocialQueueDatetimeInput(
      editor.querySelector('[name="scheduled_at"]'),
      "syncExpandedSocialQueueEditors"
    );
  }
}

/**
 * Parse <input type="datetime-local"> value as local wall time (not localized display strings).
 * Returns ISO string for Supabase or null if invalid.
 */
function parseDatetimeLocalInput(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d{1,2}\.\d{1,2}\.\d{4}/.test(raw) || raw.includes(",")) return null;
  const m = raw.match(DATETIME_LOCAL_INPUT_RE);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = m[6] !== undefined ? Number(m[6]) : 0;
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }
  const local = new Date(year, month, day, hour, minute, second, 0);
  if (Number.isNaN(local.getTime())) return null;
  if (
    local.getFullYear() !== year ||
    local.getMonth() !== month ||
    local.getDate() !== day ||
    local.getHours() !== hour ||
    local.getMinutes() !== minute
  ) {
    return null;
  }
  return local.toISOString();
}

function fromDatetimeLocalValue(value) {
  return parseDatetimeLocalInput(value);
}

function isSocialQueueScheduledAtInFuture(isoString, minAheadMs = SOCIAL_QUEUE_MIN_SCHEDULE_AHEAD_MS) {
  const ms = new Date(isoString).getTime();
  if (Number.isNaN(ms)) return false;
  return ms >= Date.now() + minAheadMs;
}

function socialQueueStatusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "sent_to_postiz") return SOCIAL_QUEUE_POSTIZ_HANDOFF_MSG;
  if (s === "ready_for_postiz") return "Bereit für Postiz";
  if (s === "posted") return "In Postiz (legacy)";
  if (s === "processing") return "Wird verarbeitet…";
  if (s === "failed") return "Fehlgeschlagen";
  if (s === "skipped") return "Übersprungen";
  if (s === "draft") return "Entwurf";
  return s || "pending";
}

function isSocialQueuePostizHandoffDone(row) {
  if (!row) return false;
  const st = String(row.status || "").toLowerCase();
  if (st === "sent_to_postiz") return true;
  if (String(row.postiz_post_id || "").trim()) return true;
  return false;
}

function renderSocialQueueSendToPostizButton(row) {
  const queueId = String(row?.id || "");
  const done = isSocialQueuePostizHandoffDone(row);
  const loading = String(state.socialQueuePostizSendingId || "") === queueId;

  if (done) {
    return `<button type="button" class="btn-pill btn-pill--soft btn-pill--postiz-done" data-queue-action="send-to-postiz" disabled aria-disabled="true">✅ An Postiz übergeben</button>`;
  }
  if (loading) {
    return `<button type="button" class="btn-pill btn-pill--soft btn-pill--postiz-loading" data-queue-action="send-to-postiz" disabled aria-busy="true">Sende an Postiz…</button>`;
  }
  return `<button type="button" class="btn-pill btn-pill--hero btn-pill--send-postiz" data-queue-action="send-to-postiz">🚀 An Postiz senden</button>`;
}

function validateSocialQueueDraftForm(data) {
  const errors = [];
  if (!String(data.caption || "").trim()) errors.push("Caption fehlt");
  if (!String(data.image_url || "").trim()) errors.push("Bild fehlt");
  const rawScheduled = String(data.scheduled_at_local ?? "").trim();
  if (!rawScheduled || !isDatetimeLocalInputValue(rawScheduled)) {
    errors.push("Bitte wähle den Zeitpunkt erneut über den Kalender aus.");
  } else {
    const scheduled = parseDatetimeLocalInput(rawScheduled);
    if (!scheduled) {
      errors.push("Bitte wähle den Zeitpunkt erneut über den Kalender aus.");
    } else if (!isSocialQueueScheduledAtInFuture(scheduled)) {
      errors.push("Bitte mindestens 2 Minuten in der Zukunft wählen.");
    } else {
      return { ok: true, errors: [], scheduled_at: scheduled };
    }
  }
  return { ok: false, errors, scheduled_at: null };
}

function pickSocialQueueUpdateRow(patch) {
  const out = { updated_at: new Date().toISOString() };
  for (const key of Object.keys(patch || {})) {
    if (SOCIAL_QUEUE_UPDATE_COLUMNS.has(key)) out[key] = patch[key];
  }
  return out;
}

function patchSocialQueueRowInState(queueId, patch) {
  const key = String(queueId ?? "").trim();
  if (!key) return;
  for (const [groupKey, rows] of state.socialQueueByEvent.entries()) {
    const idx = rows.findIndex((r) => String(r.id) === key);
    if (idx < 0) continue;
    rows[idx] = { ...rows[idx], ...patch };
    state.socialQueueByEvent.set(groupKey, rows);
    return;
  }
}

/** Editor for social-queue save — includes the [data-sq-editor] element itself, not only descendants. */
function resolveSocialQueueEditorEl(button, queueId = null) {
  if (button?.matches?.("[data-sq-editor]")) return button;
  const fromClosest = button?.closest?.("[data-sq-editor]");
  if (fromClosest) return fromClosest;
  const id = String(
    queueId ||
      button?.dataset?.queueId ||
      button?.closest?.(".admin-sq-card")?.dataset?.queueId ||
      button?.closest?.("[data-queue-id]")?.dataset?.queueId ||
      ""
  ).trim();
  if (!id || !dom.socialQueuePanel) return null;
  return (
    dom.socialQueuePanel.querySelector(`[data-sq-editor][data-queue-id="${CSS.escape(id)}"]`) ||
    dom.socialQueuePanel.querySelector(`.admin-sq-card[data-queue-id="${CSS.escape(id)}"] [data-sq-editor]`)
  );
}

/** Resolve social-queue click target: editor + card + row (queueId primary, eventId optional). */
function resolveSocialQueueActionContext(button) {
  const cardEl = button?.closest?.(".admin-sq-card") || null;
  const queueId =
    String(
      button?.closest?.("[data-sq-editor]")?.dataset?.queueId ||
        cardEl?.dataset?.queueId ||
        button?.closest?.("[data-queue-id]")?.dataset?.queueId ||
        ""
    ).trim() || null;
  const editorEl = resolveSocialQueueEditorEl(button, queueId);
  const row = queueId ? findSocialQueueRow(queueId) : null;
  const eventId = row?.event_id ?? cardEl?.dataset?.eventId ?? null;
  const eventData = eventId ? state.allEvents.find((item) => String(item.id) === String(eventId)) : null;
  return { editorEl, cardEl, queueId, row, eventId, eventData };
}

function readSocialQueueActionName(button) {
  return String(button?.getAttribute?.("data-queue-action") || button?.dataset?.queueAction || "").trim();
}

const SOCIAL_QUEUE_SAVE_SUCCESS_MSG = "✅ Draft gespeichert.";
const SOCIAL_QUEUE_SAVE_STATUS_VISIBLE_MS = 4000;
const socialQueueEditorStatusTimers = new WeakMap();

function clearSocialQueueEditorStatusTimer(editorEl) {
  if (!editorEl) return;
  const prev = socialQueueEditorStatusTimers.get(editorEl);
  if (prev) window.clearTimeout(prev);
  socialQueueEditorStatusTimers.delete(editorEl);
}

function formatSocialQueueSaveErrorMessage(error) {
  const detail = String(error?.message || error || "Unbekannter Fehler").trim();
  return `❌ Speichern fehlgeschlagen: ${detail}`;
}

function setSocialQueueEditorStatus(editorEl, message, { tone = "info", persistMs = 0 } = {}) {
  if (!editorEl) return;
  const el = editorEl.querySelector("[data-sq-editor-status]");
  if (!el) return;
  clearSocialQueueEditorStatusTimer(editorEl);
  const text = String(message ?? "").trim();
  el.textContent = text;
  el.hidden = !text;
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.classList.remove(
    "admin-sq-editor-status--success",
    "admin-sq-editor-status--error",
    "admin-sq-editor-status--info",
    "is-visible"
  );
  if (!text) return;
  el.classList.add(`admin-sq-editor-status--${tone}`, "is-visible");
  if (persistMs > 0) {
    const timerId = window.setTimeout(() => {
      if (el.textContent === text) {
        el.textContent = "";
        el.hidden = true;
        el.classList.remove("is-visible", "admin-sq-editor-status--success", "admin-sq-editor-status--error");
      }
      socialQueueEditorStatusTimers.delete(editorEl);
    }, persistMs);
    socialQueueEditorStatusTimers.set(editorEl, timerId);
  }
}

function showSocialQueueSaveSuccess(editorEl) {
  if (!editorEl) {
    setGlobalFeedback(SOCIAL_QUEUE_SAVE_SUCCESS_MSG, "success");
    return;
  }
  setSocialQueueEditorStatus(editorEl, SOCIAL_QUEUE_SAVE_SUCCESS_MSG, {
    tone: "success",
    persistMs: SOCIAL_QUEUE_SAVE_STATUS_VISIBLE_MS
  });
  setGlobalFeedback(SOCIAL_QUEUE_SAVE_SUCCESS_MSG, "success");
}

function showSocialQueueSaveError(editorEl, error) {
  const msg = formatSocialQueueSaveErrorMessage(error);
  if (editorEl) {
    setSocialQueueEditorStatus(editorEl, msg, { tone: "error", persistMs: SOCIAL_QUEUE_SAVE_STATUS_VISIBLE_MS });
  }
  return msg;
}

function showSocialQueuePostizHandoffSuccess(editorEl, row) {
  const postizId = row?.postiz_post_id ? ` (Postiz: ${row.postiz_post_id})` : "";
  const msg = `${SOCIAL_QUEUE_POSTIZ_SUCCESS_MSG}${postizId}`;
  if (editorEl) {
    setSocialQueueEditorStatus(editorEl, msg, { tone: "success", persistMs: SOCIAL_QUEUE_SAVE_STATUS_VISIBLE_MS });
  }
  setGlobalFeedback(msg, "success");
}

function computeSocialQueueStats(rows) {
  const now = new Date();
  let pending = 0;
  let failed = 0;
  let postedToday = 0;
  let nextScheduled = null;
  for (const row of rows) {
    const st = String(row.status || "").toLowerCase();
    if (st === "pending" || st === "draft") pending += 1;
    if (st === "failed") failed += 1;
    if (st === "posted" && row.posted_at) {
      const posted = new Date(row.posted_at);
      if (!Number.isNaN(posted.getTime()) && isSameLocalDay(posted, now)) postedToday += 1;
    }
    const sched = new Date(row.scheduled_at);
    if ((st === "pending" || st === "draft") && !Number.isNaN(sched.getTime()) && sched >= now) {
      if (!nextScheduled || sched < nextScheduled) nextScheduled = sched;
    }
  }
  return { pending, failed, postedToday, nextScheduled };
}

function renderSocialQueueStats() {
  if (!dom.socialQueueStats) return;
  const rows = socialQueueRowsFlat();
  const stats = computeSocialQueueStats(rows);
  const nextLabel = stats.nextScheduled ? formatAdminDateTime(stats.nextScheduled.toISOString()) : "—";
  dom.socialQueueStats.innerHTML = `
    <div class="admin-sq-stat"><span class="admin-sq-stat__n">${stats.pending}</span><span>Pending</span></div>
    <div class="admin-sq-stat"><span class="admin-sq-stat__n">${stats.postedToday}</span><span>Posted heute</span></div>
    <div class="admin-sq-stat"><span class="admin-sq-stat__n">${stats.failed}</span><span>Failed</span></div>
    <div class="admin-sq-stat admin-sq-stat--wide"><span class="admin-sq-stat__n admin-sq-stat__n--sm">${escapeHtml(nextLabel)}</span><span>Nächster Post</span></div>
  `;
}

function renderSocialPostPreviewCard(platform, draft) {
  const pv = platformVisual(platform);
  const imageUrl = String(draft.image_url || "").trim();
  const caption = escapeHtml(draft.fullCaption || "").replace(/\n/g, "<br />");
  const title = escapeHtml(cleanSocialQueueDisplayText(draft.title) || "Event");
  const img = imageUrl
    ? `<img class="admin-sq-preview__img" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" />`
    : `<div class="admin-sq-preview__img admin-sq-preview__img--empty">Kein Bild</div>`;
  const p = String(platform || "instagram").toLowerCase();
  const platformClass =
    p === "facebook" ? "admin-sq-preview--fb" : p === "tiktok" ? "admin-sq-preview--tt" : "admin-sq-preview--ig";
  const frameClass = p === "instagram" ? " admin-sq-preview--phone" : "";
  return `
    <div class="admin-sq-preview ${platformClass}${frameClass}">
      <div class="admin-sq-preview__head">${pv.icon} ${escapeHtml(pv.label)}</div>
      ${img}
      <div class="admin-sq-preview__body">
        <strong>${title}</strong>
        <p>${caption || "—"}</p>
      </div>
    </div>`;
}

function renderCaptionStyleOptions(selected) {
  return SOCIAL_CAPTION_STYLE_MODES.map(
    (mode) =>
      `<option value="${mode}"${mode === selected ? " selected" : ""}>${mode.charAt(0).toUpperCase() + mode.slice(1)}</option>`
  ).join("");
}

function renderSocialQueueEditor(row) {
  const ev = state.allEvents.find((e) => String(e.id) === String(row.event_id));
  const extras = readSocialQueueExtras(row);
  const imageUrl = String(row.image_url || row.resolved_image_url || ev?.image_url || "").trim();
  const fullCaption = socialQueueFullCaption(row, extras);
  const draftPreview = {
    title: resolveSocialQueueDisplayTitle(row),
    image_url: imageUrl,
    fullCaption
  };
  const statusChips = SOCIAL_QUEUE_STATUS_ACTIONS.map(
    (st) =>
      `<button type="button" class="admin-sq-status-chip${String(row.status).toLowerCase() === st ? " is-active" : ""}" data-sq-status="${st}">${st}</button>`
  ).join("");
  const platformOptions = SOCIAL_REVIEW_PLATFORMS.map(
    (p) =>
      `<option value="${p}"${String(row.platform).toLowerCase() === p ? " selected" : ""}>${platformVisual(p).label}</option>`
  ).join("");

  const postizAlreadySent =
    String(row.status || "").toLowerCase() === "sent_to_postiz" || Boolean(String(row.postiz_post_id || "").trim());

  console.log("[visible-toolbar-render]", { queueId: row?.id, status: row?.status });

  return `
    <div class="admin-sq-editor" data-sq-editor data-queue-id="${escapeHtml(row.id)}">
      <section class="admin-sq-caption-studio">
        <header class="admin-sq-caption-studio__head">
          <span class="admin-sq-caption-studio__label">Caption Studio</span>
          <span class="admin-sq-save-state" data-sq-save-state>Gespeichert</span>
          <span class="admin-sq-char-count" data-sq-char-count>${String(row.caption || "").length} Zeichen</span>
        </header>
        <textarea class="admin-sq-caption-input" name="caption" rows="4" data-autosize-caption>${escapeHtml(String(row.caption || ""))}</textarea>
        <div class="admin-sq-caption-toolbar">
          <label class="admin-sq-caption-style">
            <span>Stil</span>
            <select name="style_mode">${renderCaptionStyleOptions(extras.style_mode)}</select>
          </label>
          <div class="admin-sq-caption-pills">
            <button type="button" class="btn-pill btn-pill--hero btn-pill--xs" data-caption-action="save">Speichern</button>
            <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-caption-action="regenerate">Regenerate</button>
            <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-caption-action="shorter">Shorter</button>
            <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-caption-action="emotional">More Emotional</button>
            <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-caption-action="local">More Local</button>
            <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-caption-action="premium">More Premium</button>
            <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-caption-action="strip-hashtags">Remove Hashtags</button>
            <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-caption-action="add-cta">Add CTA</button>
          </div>
        </div>
      </section>
      <div class="admin-sq-editor__previews" data-sq-previews>
        ${renderSocialPostPreviewCard("instagram", draftPreview)}
        ${renderSocialPostPreviewCard("facebook", draftPreview)}
        ${String(row.platform || "").toLowerCase() === "tiktok" ? renderSocialPostPreviewCard("tiktok", draftPreview) : ""}
      </div>
      <div class="admin-sq-editor__grid admin-sq-editor__grid--meta">
        <label class="admin-sq-field admin-sq-field--full">
          <span>Titel</span>
          <input type="text" name="title" value="${escapeHtml(String(row.title || resolveSocialQueueTitleForSave(row) || ""))}" />
        </label>
        <label class="admin-sq-field">
          <span>Geplant</span>
          <input type="datetime-local" lang="en" name="scheduled_at" step="60" value="${escapeHtml(socialQueueScheduledAtInputValue(row))}" />
        </label>
        <label class="admin-sq-field">
          <span>Platform</span>
          <select name="platform">${platformOptions}</select>
        </label>
        <label class="admin-sq-field admin-sq-field--full">
          <span>Hashtags</span>
          <input type="text" name="hashtags" value="${escapeHtml(extras.hashtags)}" placeholder="#Calahonda #SalsaNight" />
        </label>
        <label class="admin-sq-field admin-sq-field--full">
          <span>CTA</span>
          <input type="text" name="cta_text" value="${escapeHtml(extras.cta_text)}" placeholder="Link in Bio" />
        </label>
      </div>
      <div class="admin-sq-editor__status">${statusChips}</div>
      <p class="admin-sq-editor-status" data-sq-editor-status role="status" aria-live="polite" hidden></p>
      <div class="admin-sq-editor__actions" data-sq-visible-toolbar>
        <button type="button" class="btn-pill btn-pill--hero" data-queue-action="save-draft">Speichern</button>
        <button
          type="button"
          class="admin-btn admin-btn-primary"
          data-queue-action="send-to-postiz"
          ${postizAlreadySent ? 'disabled aria-disabled="true"' : ""}
        >${postizAlreadySent ? "✅ An Postiz übergeben" : "🚀 An Postiz senden"}</button>
        <button type="button" class="btn-pill btn-pill--soft" data-queue-action="duplicate-draft">Duplizieren</button>
        <button type="button" class="btn-pill btn-pill--soft" data-queue-action="open-event">Event öffnen</button>
        <button type="button" class="btn-pill btn-pill--soft" data-queue-action="preview-image">Bild</button>
        <button type="button" class="btn-pill btn-pill--outline btn-pill--danger" data-queue-action="delete">Löschen</button>
      </div>
    </div>`;
}

function readSocialQueueEditorForm(editorEl) {
  const queueId = editorEl?.dataset?.queueId || editorEl?.closest("[data-queue-id]")?.dataset?.queueId;
  const row = findSocialQueueRow(queueId);
  const title = editorEl.querySelector('[name="title"]')?.value ?? "";
  const caption = editorEl.querySelector('[name="caption"]')?.value ?? "";
  const scheduledInput = editorEl.querySelector('[name="scheduled_at"]');
  const rawScheduled = String(scheduledInput?.value ?? "").trim();
  let scheduled_at_local;
  if (scheduledInput) {
    if (isDatetimeLocalInputValue(rawScheduled)) {
      scheduled_at_local = rawScheduled;
    } else {
      scheduled_at_local = setSocialQueueScheduledAtInputValue(scheduledInput, row?.scheduled_at);
    }
    warnIfInvalidSocialQueueDatetimeInput(scheduledInput, "readSocialQueueEditorForm");
  } else {
    scheduled_at_local = coerceDatetimeLocalInputValue(rawScheduled, row?.scheduled_at);
  }
  const platform = editorEl.querySelector('[name="platform"]')?.value ?? "";
  const hashtags = editorEl.querySelector('[name="hashtags"]')?.value ?? "";
  const cta_text = editorEl.querySelector('[name="cta_text"]')?.value ?? "";
  const style_mode = editorEl.querySelector('[name="style_mode"]')?.value ?? "natural";
  return { title, caption, scheduled_at_local, platform, hashtags, cta_text, style_mode };
}

function serializeSocialDraftForm(form, rowFallback = null) {
  const scheduled_at_local = coerceDatetimeLocalInputValue(
    form?.scheduled_at_local,
    rowFallback?.scheduled_at
  );
  return JSON.stringify({ ...form, scheduled_at_local });
}

function autosizeSocialCaptionTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 96), 320)}px`;
}

function updateSocialCaptionEditorUi(editorEl, { dirty = null } = {}) {
  if (!editorEl) return;
  const form = readSocialQueueEditorForm(editorEl);
  const fullCaption = socialQueueFullCaption({ caption: form.caption }, { hashtags: form.hashtags, cta_text: form.cta_text });
  const charEl = editorEl.querySelector("[data-sq-char-count]");
  if (charEl) charEl.textContent = `${fullCaption.length} Zeichen`;
  const saveEl = editorEl.querySelector("[data-sq-save-state]");
  const queueId = editorEl.dataset.queueId || editorEl.closest("[data-queue-id]")?.dataset?.queueId;
  const snap = queueId ? state.socialQueueDraftSnapshots.get(String(queueId)) : null;
  const isDirty = dirty !== null ? dirty : snap ? serializeSocialDraftForm(form, row) !== snap : false;
  if (saveEl) {
    saveEl.textContent = isDirty ? "Ungespeichert" : "Gespeichert";
    saveEl.classList.toggle("is-dirty", isDirty);
  }
  const row = findSocialQueueRow(queueId);
  const ev = getSocialQueueRelatedEvent(row);
  const thumb = String(row?.image_url || row?.resolved_image_url || ev?.image_url || "").trim();
  const draftPreview = {
    title: cleanSocialQueueDisplayText(form.title) || (row ? resolveSocialQueueDisplayTitle(row) : ""),
    image_url: thumb,
    fullCaption
  };
  const previews = editorEl.querySelector("[data-sq-previews]");
  if (previews) {
    previews.innerHTML =
      renderSocialPostPreviewCard("instagram", draftPreview) +
      renderSocialPostPreviewCard("facebook", draftPreview) +
      (String(form.platform).toLowerCase() === "tiktok" ? renderSocialPostPreviewCard("tiktok", draftPreview) : "");
    console.log("preview updated", { queueId, chars: fullCaption.length });
  }
}

function initSocialCaptionEditor(editorEl, row) {
  if (!editorEl || !row) return;
  ensureSocialQueueVisibleToolbar(editorEl, row);
  syncSocialQueueScheduledAtInput(editorEl, row);
  const ta = editorEl.querySelector("[data-autosize-caption]");
  autosizeSocialCaptionTextarea(ta);
  const form = readSocialQueueEditorForm(editorEl);
  state.socialQueueDraftSnapshots.set(String(row.id), serializeSocialDraftForm(form, row));
  updateSocialCaptionEditorUi(editorEl, { dirty: false });
}

function applyCaptionStudioTransform(editorEl, action, row) {
  const ev = state.allEvents.find((e) => String(e.id) === String(row.event_id));
  const form = readSocialQueueEditorForm(editorEl);
  const lang = detectSocialCaptionLanguage(ev || row);
  let caption = sanitizeHumanCaptionText(form.caption);
  let hashtags = form.hashtags;
  let cta_text = form.cta_text;

  if (action === "regenerate") {
    const scheduled = parseDatetimeLocalInput(form.scheduled_at_local);
    const bundle = generateHumanSocialCaptionBundle(ev || row, form.platform, scheduled ? new Date(scheduled) : null, {
      styleMode: form.style_mode,
      seed: Date.now()
    });
    caption = bundle.caption;
    hashtags = bundle.hashtags;
    cta_text = bundle.cta_text;
    console.log("style mode", { style_mode: form.style_mode });
  } else if (action === "shorter") {
    const parts = caption.split(/(?<=[.!?])\s+/).filter(Boolean);
    caption = sanitizeHumanCaptionText((parts.slice(0, 2).join(" ") || caption).slice(0, 200));
  } else if (action === "emotional") {
    const openers =
      lang === "es"
        ? ["Se siente en el aire.", "Esta noche pide música."]
        : lang === "de"
          ? ["Das wird emotional.", "Heute zählt die Stimmung."]
          : ["You'll feel this one.", "Tonight hits different."];
    caption = `${openers[Date.now() % openers.length]}\n${caption}`.trim();
  } else if (action === "local") {
    const city = String(ev?.city || row?.city || "").trim();
    const venue = String(ev?.location_name || row?.location_name || "").trim();
    if (city && !caption.toLowerCase().includes(city.toLowerCase())) caption = `${caption}\n${city}.`.trim();
    if (venue && !caption.toLowerCase().includes(venue.toLowerCase())) caption = `${caption}\n${venue}`.trim();
    hashtags = buildSocialHashtags(ev || row, form.platform);
  } else if (action === "premium") {
    caption = caption
      .replace(/\b(noche|night)\b/gi, lang === "es" ? "velada" : "evening")
      .replace(/\bfiesta\b/gi, lang === "es" ? "celebración" : "celebration");
  } else if (action === "strip-hashtags") {
    caption = caption.replace(/#\w+/g, "").trim();
    hashtags = "";
  } else if (action === "add-cta") {
    cta_text =
      cta_text ||
      (lang === "es" ? "Reserva / info en el enlace." : lang === "de" ? "Infos im Link." : "Tap link for details.");
  }

  const ta = editorEl.querySelector('[name="caption"]');
  const hashInput = editorEl.querySelector('[name="hashtags"]');
  const ctaInput = editorEl.querySelector('[name="cta_text"]');
  if (ta) ta.value = caption;
  if (hashInput) hashInput.value = hashtags;
  if (ctaInput) ctaInput.value = cta_text;
  autosizeSocialCaptionTextarea(ta);
  updateSocialCaptionEditorUi(editorEl, { dirty: true });
}

function showAdminConfirmModal(message, { confirmLabel = "Löschen", danger = true } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "admin-modal-overlay";
    overlay.innerHTML = `
      <div class="admin-modal" role="dialog" aria-modal="true">
        <p class="admin-modal__text">${escapeHtml(message)}</p>
        <div class="admin-modal__actions">
          <button type="button" class="btn-pill btn-pill--soft" data-modal-cancel>Abbrechen</button>
          <button type="button" class="btn-pill ${danger ? "btn-pill--danger" : "btn-pill--hero"}" data-modal-confirm>${escapeHtml(confirmLabel)}</button>
        </div>
      </div>`;
    const close = (result) => {
      overlay.remove();
      resolve(result);
    };
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
    overlay.querySelector("[data-modal-cancel]")?.addEventListener("click", () => close(false));
    overlay.querySelector("[data-modal-confirm]")?.addEventListener("click", () => close(true));
    document.body.appendChild(overlay);
  });
}

function showAdminImageLightbox(imageUrl, title = "") {
  const overlay = document.createElement("div");
  overlay.className = "admin-lightbox-overlay";
  overlay.innerHTML = `
    <button type="button" class="admin-lightbox__close" aria-label="Schließen">✕</button>
    <figure class="admin-lightbox__figure">
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" class="admin-lightbox__img" />
      ${title ? `<figcaption>${escapeHtml(title)}</figcaption>` : ""}
    </figure>`;
  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest(".admin-lightbox__close")) close();
  });
  document.addEventListener(
    "keydown",
    function onKey(e) {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", onKey);
      }
    },
    { once: true }
  );
  document.body.appendChild(overlay);
}

async function repairSocialQueueTitle(queueId) {
  const row = findSocialQueueRow(queueId);
  if (!row) throw new Error("Draft nicht gefunden.");
  const ev = getSocialQueueRelatedEvent(row);
  const title =
    resolveSocialQueueTitleForSave(row) ||
    extractTitleFromCaption(row?.caption, [row?.event_title, row?._event?.name, ev?.name, ev?.title]);
  if (!title) throw new Error("Kein Titel ableitbar.");
  const patch = pickSocialQueueUpdateRow({ title });
  const client = supabaseClient();
  const { error } = await client.from("social_queue").update(patch).eq("id", queueId);
  if (error) throw new Error(error.message || "Titel konnte nicht gespeichert werden.");
  patchSocialQueueRowInState(queueId, { title, event_title: title });
  console.log("social queue title repaired", { queueId, title });
  return title;
}

/**
 * Save existing social_queue row by queueId (eventId optional).
 * Step logs [save-draft] 1–7 for debugging.
 */
async function handleSocialQueueSaveDraftClick(button) {
  console.log("[save-draft] 1 branch start");

  const queueId = String(
    button?.closest?.("[data-sq-editor]")?.dataset?.queueId ||
      button?.closest?.(".admin-sq-card")?.dataset?.queueId ||
      button?.closest?.("[data-queue-id]")?.dataset?.queueId ||
      ""
  ).trim();
  const editorEl = resolveSocialQueueEditorEl(button, queueId);

  console.log("[save-draft] 2 editorEl exists", Boolean(editorEl));
  console.log("[save-draft] 3 queueId", queueId || null);

  if (!queueId) {
    const msg = "Queue-ID fehlt.";
    const display = showSocialQueueSaveError(editorEl, new Error(msg));
    throw new Error(display);
  }

  const row = findSocialQueueRow(queueId);
  if (!editorEl) {
    const msg = "Editor nicht gefunden — bitte Bearbeiten öffnen.";
    const display = showSocialQueueSaveError(null, new Error(msg));
    throw new Error(display);
  }
  if (!row) {
    const msg = "Draft nicht gefunden.";
    const display = showSocialQueueSaveError(editorEl, new Error(msg));
    throw new Error(display);
  }

  clearSocialQueueEditorStatusTimer(editorEl);
  setSocialQueueEditorStatus(editorEl, "", { tone: "info" });

  const scheduledGuard = ensureSocialQueueScheduledAtInput(editorEl, row);
  if (!scheduledGuard.ok) {
    const display = showSocialQueueSaveError(editorEl, new Error(scheduledGuard.error));
    throw new Error(display);
  }

  const form = readSocialQueueEditorForm(editorEl);
  console.log("[save-draft] 4 form", form);

  const ev = row.event_id ? state.allEvents.find((e) => String(e.id) === String(row.event_id)) : null;
  const imageUrl = String(row.image_url || row.resolved_image_url || ev?.image_url || "").trim();
  const validation = validateSocialQueueDraftForm({ ...form, image_url: imageUrl });
  console.log("[save-draft] 5 validation", validation);
  if (!validation.ok) {
    const msg = validation.errors.join(" · ");
    const display = showSocialQueueSaveError(editorEl, new Error(msg));
    throw new Error(display);
  }

  const platform = String(form.platform || row.platform || "").toLowerCase();
  const payload = pickSocialQueueUpdateRow({
    title: String(form.title || "").trim(),
    caption: String(form.caption || "").trim(),
    scheduled_at: validation.scheduled_at,
    platform,
    image_url: imageUrl,
    resolved_image_url: imageUrl,
    hashtags: String(form.hashtags || "").trim() || null,
    cta_text: String(form.cta_text || "").trim() || null,
    postiz_response: mergeSocialQueuePostizResponse(row.postiz_response, form.hashtags, form.cta_text, {
      style_mode: form.style_mode
    })
  });

  console.log("social queue save-draft payload", {
    queueId,
    eventId: row.event_id ?? null,
    scheduled_at: validation.scheduled_at,
    platform,
    status: row.status ?? null,
    payload
  });
  console.log("[save-draft] 6 supabase payload", payload);

  const client = supabaseClient();
  let body = { ...payload };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await client.from("social_queue").update(body).eq("id", queueId).select("id,scheduled_at,platform,status");
    console.log("[save-draft] 7 supabase response", { attempt, data, error });
    if (!error) {
      patchSocialQueueRowInState(queueId, body);
      const savedRow = { ...row, ...body, scheduled_at: validation.scheduled_at };
      syncSocialQueueScheduledAtInput(editorEl, savedRow);
      state.socialQueueDraftSnapshots.set(
        String(queueId),
        serializeSocialDraftForm(
          { ...form, scheduled_at_local: toDatetimeLocalValue(validation.scheduled_at) },
          savedRow
        )
      );
      console.log("social queue save-draft success", {
        queueId,
        eventId: row.event_id ?? null,
        scheduled_at: validation.scheduled_at,
        platform,
        status: row.status ?? null,
        data
      });
      return savedRow;
    }
    const missing = parseMissingColumn(error);
    const errMsg = error.message || "Speichern fehlgeschlagen.";
    if (!missing || !Object.prototype.hasOwnProperty.call(body, missing)) {
      const display = showSocialQueueSaveError(editorEl, new Error(errMsg));
      throw new Error(display);
    }
    delete body[missing];
  }
  const display = showSocialQueueSaveError(editorEl, new Error("Speichern fehlgeschlagen."));
  throw new Error(display);
}

async function invokeSocialQueueRunnerHandoff(queueId) {
  const idKey = String(queueId ?? "").trim();
  if (!idKey) throw new Error("Queue-ID fehlt.");
  const client = supabaseClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw new Error(sessionError.message || "Session konnte nicht geladen werden.");
  let token = sessionData?.session?.access_token || "";
  if (!token) throw new Error("Admin session missing.");
  const { data: refreshed, error: refreshError } = await client.auth.refreshSession();
  if (!refreshError && refreshed?.session?.access_token) {
    token = refreshed.session.access_token;
  }

  console.log("social queue postiz handoff start", {
    queueId: idKey,
    hasToken: Boolean(token),
    userEmail: sessionData?.session?.user?.email ?? refreshed?.session?.user?.email ?? null
  });
  const res = await fetch(`${SUPABASE_URL}/functions/v1/social-queue-runner`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ queue_id: idKey, admin_handoff: true, limit: 1 })
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  console.log("social queue postiz handoff response", { queueId: idKey, http: res.status, json });
  if (!res.ok) {
    throw new Error(String(json.error || json.message || `Runner HTTP ${res.status}`));
  }
  const result = Array.isArray(json.results) ? json.results[0] : null;
  if (result?.ok) return result;
  if (result?.skipped) throw new Error(String(result.reason || "Postiz-Übergabe übersprungen."));
  if (result?.error) throw new Error(String(result.error));
  throw new Error("Postiz-Übergabe fehlgeschlagen.");
}

async function confirmSocialQueueDraftForPostiz(queueId, editorEl, button) {
  const idKey = String(queueId ?? "").trim();
  const editor = editorEl || resolveSocialQueueEditorEl(button, idKey);
  console.log("social queue confirm-postiz start", { queueId: idKey });

  await handleSocialQueueSaveDraftClick(
    button || {
      closest(selector) {
        if (selector === "[data-sq-editor]" && editor) return editor;
        return editor?.closest?.(selector) ?? null;
      },
      matches: () => false,
      dataset: editor?.dataset || {}
    }
  );

  const client = supabaseClient();
  const now = new Date().toISOString();
  const markPatch = pickSocialQueueUpdateRow({
    status: "ready_for_postiz",
    admin_confirmed_at: now,
    last_error: null
  });
  const { error: markError } = await client.from("social_queue").update(markPatch).eq("id", idKey);
  if (markError) throw new Error(markError.message || "Status konnte nicht gesetzt werden.");
  patchSocialQueueRowInState(idKey, markPatch);

  const handoff = await invokeSocialQueueRunnerHandoff(idKey);
  await refreshAdminData({ reloadSocial: true });
  const row = findSocialQueueRow(idKey);
  console.log("social queue confirm-postiz success", {
    queueId: idKey,
    eventId: row?.event_id ?? null,
    scheduled_at: row?.scheduled_at ?? null,
    platform: row?.platform ?? null,
    status: row?.status ?? null,
    postiz_post_id: row?.postiz_post_id ?? handoff?.postiz_post_id ?? null
  });
  return row;
}

async function saveSocialQueueDraftFromEditor(queueId, editorEl) {
  const idKey = String(queueId ?? "").trim();
  const el = editorEl || resolveSocialQueueEditorEl(null, idKey);
  return handleSocialQueueSaveDraftClick({
    closest(selector) {
      if (selector === "[data-sq-editor]" && el) return el;
      return el?.closest?.(selector) ?? null;
    },
    matches(selector) {
      return Boolean(el?.matches?.(selector));
    },
    dataset: el?.dataset || {}
  });
}

async function duplicateSocialQueueDraft(row, editorEl) {
  const form = editorEl ? readSocialQueueEditorForm(editorEl) : null;
  const ev = state.allEvents.find((e) => String(e.id) === String(row.event_id));
  const parsedScheduled = form?.scheduled_at_local ? parseDatetimeLocalInput(form.scheduled_at_local) : null;
  const baseScheduled = parsedScheduled || row.scheduled_at;
  const nextDate = new Date(baseScheduled || Date.now());
  if (Number.isNaN(nextDate.getTime())) nextDate.setTime(Date.now() + 7 * 86400000);
  else nextDate.setDate(nextDate.getDate() + 7);

  const platform = form?.platform || row.platform;
  const payload = buildSocialQueuePayload(ev || row, platform, nextDate);
  if (form) {
    payload.title = String(form.title || payload.title || "").trim();
    payload.caption = String(form.caption || payload.caption || "").trim();
    payload.hashtags = String(form.hashtags || "").trim() || null;
    payload.cta_text = String(form.cta_text || "").trim() || null;
    payload.postiz_response = mergeSocialQueuePostizResponse(null, form.hashtags, form.cta_text, {
      style_mode: form.style_mode
    });
  }
  const n = await insertSocialQueueRows([payload]);
  if (!n) throw new Error("Duplikat konnte nicht erstellt werden (ungültige Daten).");
  return n;
}

async function updateSocialQueueDraftStatus(queueId, status) {
  const patch = pickSocialQueueUpdateRow({ status });
  if (status !== "failed") patch.last_error = null;
  const client = supabaseClient();
  const { error } = await client.from("social_queue").update(patch).eq("id", queueId);
  if (error) throw new Error(error.message || "Status-Update fehlgeschlagen.");
  patchSocialQueueRowInState(queueId, patch);
}

async function purgeOldPostedSocialQueueRows() {
  if (SOCIAL_QUEUE_POSTED_RETENTION_DAYS <= 0) return 0;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SOCIAL_QUEUE_POSTED_RETENTION_DAYS);
  const client = supabaseClient();
  const { data, error } = await client
    .from("social_queue")
    .select("id,posted_at")
    .eq("status", "posted")
    .lt("posted_at", cutoff.toISOString());
  if (error) {
    console.warn("social queue purge skipped", error.message);
    return 0;
  }
  const ids = (data || []).map((r) => r.id).filter(Boolean);
  if (!ids.length) return 0;
  const { error: delErr } = await client.from("social_queue").delete().in("id", ids);
  if (delErr) {
    console.warn("social queue purge delete failed", delErr.message);
    return 0;
  }
  console.log("social queue purged old posted", { count: ids.length, days: SOCIAL_QUEUE_POSTED_RETENTION_DAYS });
  return ids.length;
}

function shortNoticeInfoForEvent(event, now = new Date()) {
  const eventStart = socialEffectiveEventStart(event, now);
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
  const eventStart = socialEffectiveEventStart(event);
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
  const eventStart = socialEffectiveEventStart(event, now);
  if (!eventStart || Number.isNaN(eventStart.getTime()) || eventStart <= now) {
    console.log("social draft skipped", { event_id: event?.id, reason: "no_future_event_start" });
    return [];
  }
  const rows = [];
  const immediateLastCall = immediateLastCallDateForEvent(event, now);
  if (immediateLastCall && immediateLastCall < eventStart) {
    for (const platform of SOCIAL_REVIEW_PLATFORMS) {
      const payload = buildSocialQueuePayload(event, platform, immediateLastCall);
      payload._slot_id = "short_notice_last_call";
      rows.push(payload);
    }
  }
  for (const slot of SOCIAL_REVIEW_SLOTS) {
    const scheduled = socialSlotDateForEvent(event, slot);
    if (!scheduled || Number.isNaN(scheduled.getTime())) continue;
    if (scheduled <= now) continue;
    if (scheduled >= eventStart) continue;
    for (const platform of SOCIAL_REVIEW_PLATFORMS) {
      rows.push(buildSocialQueuePayload(event, platform, scheduled));
    }
  }
  return rows;
}

/**
 * Recurring-only slot planner (early_reminder / tomorrow / last_call). No "today" post.
 * Does not run for one-time events — call only from recurring prepare flow.
 */
function buildRecurringSocialSlots(event, occurrenceStart) {
  const eventStart =
    occurrenceStart instanceof Date ? occurrenceStart : new Date(String(occurrenceStart || ""));
  if (Number.isNaN(eventStart.getTime())) return [];
  const now = new Date();
  const slots = [];

  for (const spec of RECURRING_SOCIAL_SLOT_SPECS) {
    let scheduledAt;
    if (Number.isFinite(spec.minutesBefore)) {
      scheduledAt = new Date(eventStart.getTime() - spec.minutesBefore * 60 * 1000);
    } else {
      scheduledAt = new Date(eventStart);
      scheduledAt.setDate(scheduledAt.getDate() - Number(spec.daysBefore || 0));
      scheduledAt.setHours(spec.hour ?? 18, spec.minute ?? 0, 0, 0);
    }
    if (scheduledAt <= now) {
      console.log("recurring social slot skipped", {
        reason: "past",
        stage: spec.stage,
        scheduled_at: scheduledAt.toISOString(),
        event_id: event?.id ?? null
      });
      continue;
    }
    if (scheduledAt >= eventStart) {
      console.log("recurring social slot skipped", {
        reason: "after_event_start",
        stage: spec.stage,
        scheduled_at: scheduledAt.toISOString(),
        event_start: eventStart.toISOString(),
        event_id: event?.id ?? null
      });
      continue;
    }
    slots.push({ stage: spec.stage, scheduledAt });
  }
  return slots;
}

function buildRecurringSocialQueueRowsForOccurrence(event, occurrenceStart) {
  const slotPlan = buildRecurringSocialSlots(event, occurrenceStart);
  const rows = [];
  for (const slot of slotPlan) {
    for (const platform of SOCIAL_REVIEW_PLATFORMS) {
      const payload = buildSocialQueuePayload(event, platform, slot.scheduledAt);
      payload.post_stage = slot.stage;
      rows.push(payload);
    }
  }
  return rows;
}

async function insertSocialQueueRows(rows) {
  const client = supabaseClient();
  const toInsert = [];
  for (const row of rows || []) {
    const payload = pickSocialQueueInsertRow(row);
    if (!isValidSocialQueuePayload(payload)) {
      console.error("INVALID SOCIAL PAYLOAD", payload);
      console.log("social draft invalid", {
        event_id: payload?.event_id,
        platform: payload?.platform,
        scheduled_at: payload?.scheduled_at
      });
      continue;
    }
    console.log("social draft generated", {
      event_id: payload.event_id,
      platform: payload.platform,
      scheduled_at: payload.scheduled_at
    });
    toInsert.push(payload);
  }
  if (!toInsert.length) return 0;

  let batch = toInsert;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { error } = await client.from("social_queue").insert(batch);
    if (!error) return batch.length;
    const missing = parseMissingColumn(error);
    console.error("admin social_queue insert error", {
      attempt,
      missingColumn: missing || null,
      message: error.message,
      code: error.code
    });
    if (!missing || !SOCIAL_QUEUE_INSERT_COLUMNS.has(missing)) throw new Error(error.message || "Social Queue konnte nicht erstellt werden.");
    batch = batch.map((row) => {
      const next = { ...row };
      delete next[missing];
      return next;
    });
    if (!batch.every((row) => Object.keys(row).length)) break;
  }
  throw new Error("Social Queue Insert fehlgeschlagen (Schema-Spalten prüfen).");
}

async function insertRecurringSocialQueueRows(occurrenceEvent, occurrenceStart) {
  const candidates = buildRecurringSocialQueueRowsForOccurrence(occurrenceEvent, occurrenceStart);
  if (!candidates.length) return 0;
  const client = supabaseClient();
  const eventId = String(occurrenceEvent?.id || "").trim();
  const { data: existing, error: existingError } = await client
    .from("social_queue")
    .select("platform,post_stage,status")
    .eq("event_id", eventId);
  if (existingError) throw new Error(existingError.message || "Social Queue konnte nicht geprüft werden.");

  const existingKeys = new Set(
    (existing || [])
      .filter((row) => String(row.status || "").toLowerCase() !== "skipped")
      .map((row) => `${String(row.platform).toLowerCase()}:${String(row.post_stage || "").trim()}`)
      .filter((k) => !k.endsWith(":"))
  );

  const missing = candidates.filter((row) => {
    const stage = String(row.post_stage || "").trim();
    const key = `${String(row.platform).toLowerCase()}:${stage}`;
    if (stage && existingKeys.has(key)) {
      console.log("recurring social row skipped", {
        reason: "duplicate",
        event_id: eventId,
        platform: row.platform,
        post_stage: stage
      });
      return false;
    }
    return true;
  });
  if (!missing.length) return 0;
  return insertSocialQueueRows(missing);
}

function buildRecurringChildEventInsertPayload(master, occurrenceStart) {
  const ymd = adminFormatLocalYmd(occurrenceStart);
  return pickAdminEventSavePayload({
    name: master.name || master.title || "Event",
    title_es: master.title_es || null,
    title_de: master.title_de || null,
    title_en: master.title_en || null,
    description: master.description || null,
    description_es: master.description_es || null,
    description_de: master.description_de || null,
    description_en: master.description_en || null,
    location_name: master.location_name || null,
    address: master.address || master.street || null,
    postal_code: master.postal_code || null,
    city: master.city || null,
    country: master.country || null,
    province: master.province || null,
    region: master.region || null,
    formatted_address: master.formatted_address || null,
    place_id: master.place_id || null,
    geocoding_query: master.geocoding_query || null,
    lat: master.lat ?? null,
    lng: master.lng ?? null,
    genre: master.genre || master.category || null,
    artist_name: master.artist_name || null,
    price_text: master.price_text || null,
    image_url: master.image_url || null,
    image_urls: master.image_urls ?? null,
    status: master.status || "approved",
    featured: Boolean(master.featured),
    promoted: Boolean(master.promoted),
    verification_notes: master.verification_notes || null,
    event_date: ymd,
    event_time: master.event_time || null,
    end_time: master.end_time || null,
    recurrence_type: "none",
    recurrence_start_date: null,
    recurrence_end_date: null,
    recurrence_weekday: null,
    recurrence_day_of_month: null,
    is_recurring: false,
    recurring_social_enabled: false,
    original_event_id: master.id
  });
}

async function findRecurringChildEventByDate(masterId, ymd) {
  const client = supabaseClient();
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("original_event_id", masterId)
    .eq("event_date", ymd)
    .maybeSingle();
  if (error) throw new Error(error.message || "Kind-Event konnte nicht geladen werden.");
  return data;
}

async function createRecurringChildEventForOccurrence(master, occurrenceStart) {
  const ymd = adminFormatLocalYmd(occurrenceStart);
  const existing = await findRecurringChildEventByDate(master.id, ymd);
  if (existing) {
    console.log("recurring child event skipped", { reason: "exists", master_id: master.id, event_date: ymd });
    return { event: existing, created: false };
  }
  const client = supabaseClient();
  let body = buildRecurringChildEventInsertPayload(master, occurrenceStart);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await client.from("events").insert(body).select("*").maybeSingle();
    if (!error && data) {
      console.log("recurring child event created", {
        master_id: master.id,
        child_id: data.id,
        event_date: ymd
      });
      return { event: data, created: true };
    }
    const missing = parseMissingColumn(error);
    if (!missing || !(missing in body)) throw new Error(error?.message || "Kind-Event konnte nicht erstellt werden.");
    delete body[missing];
  }
  throw new Error("Kind-Event Insert fehlgeschlagen (Schema-Spalten prüfen).");
}

async function prepareRecurringOccurrencesForDates(master, occurrenceStarts) {
  let childrenCreated = 0;
  let draftsInserted = 0;
  for (const occurrenceStart of occurrenceStarts) {
    const { event: child, created } = await createRecurringChildEventForOccurrence(master, occurrenceStart);
    if (created) childrenCreated += 1;
    draftsInserted += await insertRecurringSocialQueueRows(child, occurrenceStart);
  }
  return { occurrences: occurrenceStarts.length, childrenCreated, draftsInserted };
}

/**
 * Prepare child events + social queue drafts for occurrences in the 7-day window.
 * Idempotent (skips duplicates). Does not call Postiz.
 */
async function prepareRecurringOccurrencesWithinHorizon(
  masterEvent,
  horizonDays = RECURRING_SOCIAL_AUTO_PREP_HORIZON_DAYS
) {
  const master = adminCoerceRecurrenceFields(masterEvent);
  if (!isRecurringSocialMaster(master) || master.recurring_social_enabled !== true) {
    return { skipped: true, occurrences: 0, childrenCreated: 0, draftsInserted: 0, horizonDays };
  }
  const occurrences = getRecurringOccurrencesWithinHorizon(master, horizonDays);
  if (!occurrences.length) {
    return { skipped: false, occurrences: 0, childrenCreated: 0, draftsInserted: 0, horizonDays };
  }
  const result = await prepareRecurringOccurrencesForDates(master, occurrences);
  console.log("recurring social prepare done", {
    mode: "horizon",
    master_id: master.id,
    horizon_days: horizonDays,
    occurrences: result.occurrences,
    children_created: result.childrenCreated,
    drafts_inserted: result.draftsInserted
  });
  return { skipped: false, horizonDays, ...result };
}

/** Weekly auto-prep: all approved recurring masters with social automation enabled. */
async function runWeeklyRecurringSocialAutoPrep() {
  const masters = state.allEvents.filter((ev) => {
    if (String(ev.status || "").toLowerCase() !== "approved") return false;
    const coerced = adminCoerceRecurrenceFields(ev);
    return isRecurringSocialMaster(coerced) && coerced.recurring_social_enabled === true;
  });
  const totals = {
    masters: 0,
    occurrences: 0,
    childrenCreated: 0,
    draftsInserted: 0,
    horizonDays: RECURRING_SOCIAL_AUTO_PREP_HORIZON_DAYS
  };
  for (const master of masters) {
    try {
      const res = await prepareRecurringOccurrencesWithinHorizon(master);
      if (res.skipped) continue;
      totals.masters += 1;
      totals.occurrences += res.occurrences;
      totals.childrenCreated += res.childrenCreated;
      totals.draftsInserted += res.draftsInserted;
    } catch (error) {
      console.warn("recurring weekly auto prep failed", {
        master_id: master.id,
        message: error?.message || String(error)
      });
    }
  }
  console.log("recurring weekly auto prep", totals);
  return totals;
}

function scheduleRecurringSocialAutoPrep() {
  if (!isSessionAdmin(state.adminSession) || state.recurringSocialAutoPrepRunning) return;
  if (state.recurringSocialAutoPrepScheduled) return;
  state.recurringSocialAutoPrepScheduled = true;
  window.setTimeout(async () => {
    state.recurringSocialAutoPrepScheduled = false;
    if (state.navSection !== "social" || state.recurringSocialAutoPrepRunning) return;
    state.recurringSocialAutoPrepRunning = true;
    try {
      const res = await runWeeklyRecurringSocialAutoPrep();
      if (res.draftsInserted > 0 || res.childrenCreated > 0) {
        await loadSocialQueueRows();
        renderSocialQueuePanel();
        if (res.draftsInserted > 0) {
          setGlobalFeedback(
            `Auto-Vorbereitung (${res.horizonDays} Tage): ${res.draftsInserted} neue Drafts für ${res.masters} Serie(n).`,
            "success"
          );
        }
      }
    } catch (error) {
      console.warn("recurring weekly auto prep error", error);
    } finally {
      state.recurringSocialAutoPrepRunning = false;
    }
  }, 0);
}

/** Manual prepare — same 7-day window as weekly auto-prep. */
async function prepareNextRecurringOccurrences(masterEvent) {
  const master = adminCoerceRecurrenceFields(masterEvent);
  if (!isRecurringSocialMaster(master)) {
    throw new Error("Nur für wiederkehrende Events mit aktivierter Option „Wiederkehrendes Event“.");
  }
  if (master.recurring_social_enabled !== true) {
    throw new Error("Bitte „Social Automation (Serie)“ im Editor aktivieren und speichern.");
  }
  const res = await prepareRecurringOccurrencesWithinHorizon(master, RECURRING_SOCIAL_AUTO_PREP_HORIZON_DAYS);
  if (!res.occurrences) {
    throw new Error(`Keine Termine in den nächsten ${RECURRING_SOCIAL_AUTO_PREP_HORIZON_DAYS} Tagen gefunden.`);
  }
  return {
    occurrences: res.occurrences,
    childrenCreated: res.childrenCreated,
    draftsInserted: res.draftsInserted
  };
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
      if (status === "posted" || status === "sent_to_postiz") acc.ready += 1;
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
  const now = new Date();
  const coerced = adminCoerceRecurrenceFields(event);
  if (isAdminRecurringEvent(coerced)) {
    return getNextRecurringOccurrence(coerced, now) === null;
  }
  const start = dateFromAdminEventWallTime(coerced);
  return Boolean(start && !Number.isNaN(start.getTime()) && start < now);
}

function buildEventValidationBadges(event) {
  const badges = [];
  const hasCoords = hasValidMarkerCoordinates(event);
  const hasImage = adminEventHasImage(event);
  const socialSummary = socialQueueSummary(event.id);
  const shortNotice = shortNoticeInfoForEvent(event);
  const push = (tone, label) => badges.push({ tone, label });

  if (isAdminDefectiveEvent(event)) push("error", "Defektes Event");
  if (isAdminRecurringIncomplete(event)) push("warning", "Recurring unvollständig");
  if (event.featured) push("featured", "⭐ Featured");
  if (!hasImage && !isAdminDefectiveEvent(event)) push("warning", "⚠️ Kein Bild");
  if (!hasCoords) push("warning", "⚠️ Keine Koordinaten");
  if (!String(event.genre || event.category || "").trim()) push("warning", "⚠️ Keine Kategorie");
  if (!String(event.event_date || "").trim() && !isAdminRecurringEvent(adminCoerceRecurrenceFields(event))) {
    push("error", "❌ Kein Datum");
  }
  if (isEventPast(event) && !isAdminDefectiveEvent(event)) push("error", "❌ Archiviert / Vergangen");
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

function tryExtractEventImagesStoragePath(url) {
  const u = String(url || "").trim();
  if (!u) return null;
  let pathname = "";
  try {
    pathname = new URL(u).pathname;
  } catch {
    return null;
  }
  const segments = pathname.split("/").filter(Boolean);
  const pub = segments.indexOf("public");
  if (pub === -1 || pub + 2 >= segments.length) return null;
  if (segments[pub + 1] !== EVENT_IMAGES_BUCKET) return null;
  return decodeURIComponent(segments.slice(pub + 2).join("/"));
}

function collectEventImageStoragePaths(event) {
  const out = [];
  const seen = new Set();
  const push = (rawUrl) => {
    const p = tryExtractEventImagesStoragePath(rawUrl);
    if (!p || seen.has(p)) return;
    seen.add(p);
    out.push(p);
  };
  push(event?.image_url);
  const gallery = event?.image_urls;
  if (Array.isArray(gallery)) {
    for (const entry of gallery) {
      const u =
        typeof entry === "string"
          ? entry
          : String(entry?.url || entry?.image_url || "").trim();
      push(u);
    }
  }
  return out;
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
  const base = {
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
    province: String(event.province || "").trim(),
    region: String(event.region || "").trim(),
    formatted_address: event.formatted_address || "",
    geocoding_query: event.geocoding_query || "",
    place_id: String(event.place_id || "").trim(),
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
    lat: parseCoordinate(event.lat ?? event.latitude),
    lng: parseCoordinate(event.lng ?? event.longitude),
    recurrence_type: recurrenceType,
    recurrence_start_date: String(event.recurrence_start_date || event.event_date || "").trim(),
    recurrence_end_date: String(event.recurrence_end_date || "").trim(),
    recurrence_weekday:
      recurrenceType === "weekly"
        ? normalizeAdminRecurrenceWeekday(
            event.recurrence_weekday,
            event.recurrence_start_date || event.event_date
          )
        : null,
    recurrence_day_of_month:
      recurrenceType === "monthly"
        ? normalizeAdminRecurrenceDayOfMonth(
            event.recurrence_day_of_month,
            event.recurrence_start_date || event.event_date
          )
        : null,
    featured: Boolean(event.featured),
    promoted: Boolean(event.promoted),
    archived_at: event.archived_at ?? null,
    original_event_id: event.original_event_id ?? null,
    is_recurring: event.is_recurring === true,
    recurring_social_enabled: event.recurring_social_enabled === true
  };
  const normalized = adminNormalizeRecurrenceState(base);
  return {
    ...base,
    is_recurring: normalized.is_recurring === true,
    recurrence_type: normalized.recurrence_type || "none",
    recurrence_start_date: normalized.recurrence_start_date || "",
    recurrence_end_date: normalized.recurrence_end_date || "",
    recurrence_weekday: normalized.recurrence_weekday ?? null,
    recurrence_day_of_month: normalized.recurrence_day_of_month ?? null,
    recurring_social_enabled: normalized.recurring_social_enabled === true,
    recurring_group_id: normalized.recurring_group_id ?? base.recurring_group_id ?? null
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
  const type = getAdminEffectiveRecurrenceType(event);
  if (type === "weekly") return "Wöchentlich";
  if (type === "monthly") return "Monatlich";
  return "Einzel-Event";
}

function renderEventRepairActionsMarkup(event) {
  const defective = isAdminDefectiveEvent(event);
  const incomplete = isAdminRecurringIncomplete(event);
  const weeklyRepair = canShowAdminWeeklyRepairButton(event);
  const showArchive = defective || incomplete || isEventPast(event);
  if (!defective && !incomplete && !weeklyRepair && !showArchive) return "";

  const parts = [];
  if (weeklyRepair) {
    parts.push(
      `<button type="button" class="btn-pill btn-pill--soft" data-action="repair-weekly">Wöchentlich reparieren</button>`
    );
  }
  if (incomplete) {
    parts.push(
      `<button type="button" class="btn-pill btn-pill--soft" data-action="repair-recurrence">Wiederholung reparieren</button>`
    );
  }
  if (showArchive) {
    parts.push(
      `<button type="button" class="btn-pill btn-pill--outline" data-action="move-to-archive">In Archiv verschieben</button>`
    );
  }
  if (defective) {
    parts.push(
      `<button type="button" class="btn-pill btn-pill--outline btn-pill--danger-glow" data-action="delete-defective-event">Defektes Event löschen</button>`
    );
  }
  return `<div class="event-card__repair-row">${parts.join("")}</div>`;
}

function recurrenceDetails(event) {
  const type = getAdminEffectiveRecurrenceType(event);
  if (type === "none") return "";
  const coerced = adminCoerceRecurrenceFields({ ...event, is_recurring: true, recurrence_type: type });
  if (coerced.recurrence_type === "weekly") {
    const weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const weekdayLabel =
      Number.isInteger(coerced.recurrence_weekday) && coerced.recurrence_weekday >= 0 && coerced.recurrence_weekday <= 6
        ? weekdays[coerced.recurrence_weekday]
        : "-";
    const start = coerced.recurrence_start_date ? formatDate(coerced.recurrence_start_date) : "-";
    const end = coerced.recurrence_end_date ? formatDate(coerced.recurrence_end_date) : "offen";
    return `Tag: ${weekdayLabel}, ab ${start}, bis ${end}`;
  }
  if (coerced.recurrence_type === "monthly") {
    const day = Number.isInteger(coerced.recurrence_day_of_month) ? coerced.recurrence_day_of_month : "-";
    const start = coerced.recurrence_start_date ? formatDate(coerced.recurrence_start_date) : "-";
    const end = coerced.recurrence_end_date ? formatDate(coerced.recurrence_end_date) : "offen";
    return `Tag ${day}, ab ${start}, bis ${end}`;
  }
  return "";
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
  return [state.activeTab, state.archiveTimeline, state.search, state.city, state.genre, state.statusFilter].join("\u001e");
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

  const filtered = state.allEvents.filter((event) => {
    if (state.activeTab !== "all" && event.status !== state.activeTab) return false;
    const timeline = state.archiveTimeline || "all";
    const past = isEventPast(event);
    if (timeline === "active" && past) return false;
    if (timeline === "archive" && !past) return false;
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

  state.filteredEvents = filtered;
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

function startOfLocalDayMs(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function filterAnalyticsRowsByRange(rows, range) {
  if (range === "all") return [...(rows || [])];
  const now = Date.now();
  if (range === "today") {
    const s = startOfLocalDayMs();
    return (rows || []).filter((r) => new Date(r.created_at).getTime() >= s);
  }
  const days = range === "30d" ? 30 : 7;
  const cut = now - days * 86400000;
  return (rows || []).filter((r) => new Date(r.created_at).getTime() >= cut);
}

function computeAnalyticsKpis(allRows) {
  const rows = allRows || [];
  const now = Date.now();
  const t0 = startOfLocalDayMs();
  const t7 = now - 7 * 86400000;
  let viewsToday = 0;
  let views7 = 0;
  let shares7 = 0;
  const scoreByEvent = new Map();
  for (const r of rows) {
    const t = new Date(r.created_at).getTime();
    if (Number.isNaN(t)) continue;
    const id = String(r.event_id || "");
    if (!id) continue;
    if (r.action === "event_view") {
      if (t >= t0) viewsToday += 1;
      if (t >= t7) {
        views7 += 1;
        scoreByEvent.set(id, (scoreByEvent.get(id) || 0) + 1);
      }
    } else if (r.action === "share" && t >= t7) {
      shares7 += 1;
      scoreByEvent.set(id, (scoreByEvent.get(id) || 0) + 1);
    }
  }
  let topId = null;
  let topScore = 0;
  for (const [id, sc] of scoreByEvent) {
    if (sc > topScore) {
      topScore = sc;
      topId = id;
    }
  }
  return { viewsToday, views7, shares7, topId, topScore };
}

function eventTitleForAnalytics(eventId) {
  const ev = state.allEvents.find((e) => String(e.id) === String(eventId));
  return ev?.name || ev?.title || String(eventId).slice(0, 40) || "–";
}

function topSourceLabelFromCounts(sourceCounts) {
  let best = "";
  let n = 0;
  for (const [k, v] of sourceCounts) {
    if (v > n) {
      n = v;
      best = k;
    }
  }
  return best || "–";
}

function aggregateAnalyticsTableRows(rows) {
  const byId = new Map();
  for (const r of rows || []) {
    const id = String(r.event_id || "");
    if (!id) continue;
    if (!byId.has(id)) {
      byId.set(id, {
        eventId: id,
        views: 0,
        shares: 0,
        sourceCounts: new Map(),
        lastMs: 0
      });
    }
    const o = byId.get(id);
    const t = new Date(r.created_at).getTime();
    if (!Number.isNaN(t) && t > o.lastMs) o.lastMs = t;
    if (r.action === "event_view") o.views += 1;
    else if (r.action === "share") {
      o.shares += 1;
      const hint = [r.share_channel, r.source].filter(Boolean).join(" · ") || "direkt";
      o.sourceCounts.set(hint, (o.sourceCounts.get(hint) || 0) + 1);
    }
  }
  return [...byId.values()].sort((a, b) => b.views + b.shares - (a.views + a.shares));
}

function buildAdminAnalyticsHtml(allRows) {
  const kpis = computeAnalyticsKpis(allRows);
  const filtered = filterAnalyticsRowsByRange(allRows, state.analyticsTimeRange);
  const agg = aggregateAnalyticsTableRows(filtered);
  const topTitle = kpis.topId ? escapeHtml(eventTitleForAnalytics(kpis.topId)) : "–";
  const range = state.analyticsTimeRange;
  const mkBtn = (id, label) =>
    `<button type="button" class="admin-analytics-range-btn ${range === id ? "is-active" : ""}" data-analytics-range="${id}">${escapeHtml(
      label
    )}</button>`;

  const kpiHtml = `<div class="admin-analytics-kpis">
    <div class="admin-analytics-kpi"><span class="admin-analytics-kpi__v">${kpis.viewsToday}</span><span class="admin-analytics-kpi__l">Views heute</span></div>
    <div class="admin-analytics-kpi"><span class="admin-analytics-kpi__v">${kpis.views7}</span><span class="admin-analytics-kpi__l">Views 7 Tage</span></div>
    <div class="admin-analytics-kpi"><span class="admin-analytics-kpi__v">${kpis.shares7}</span><span class="admin-analytics-kpi__l">Shares 7 Tage</span></div>
    <div class="admin-analytics-kpi admin-analytics-kpi--wide"><span class="admin-analytics-kpi__v admin-analytics-kpi__v--sm">${topTitle}</span><span class="admin-analytics-kpi__l">Top Event (7 Tage)</span></div>
  </div>`;

  const filterHtml = `<div class="admin-analytics-toolbar" role="group" aria-label="Zeitraum Liste">
    ${mkBtn("today", "Heute")}
    ${mkBtn("7d", "7 Tage")}
    ${mkBtn("30d", "30 Tage")}
    ${mkBtn("all", "Alle")}
  </div>
  <p class="card__intro admin-analytics-hint">KPIs aus den letzten 120 Tagen Rohdaten; die Tabelle filtert nach Zeitraum.</p>`;

  const tableRows = agg
    .map((row) => {
      const title = escapeHtml(eventTitleForAnalytics(row.eventId));
      const topSrc = escapeHtml(topSourceLabelFromCounts(row.sourceCounts));
      const last = row.lastMs ? escapeHtml(formatAdminDateTime(new Date(row.lastMs).toISOString())) : "–";
      return `<tr>
        <td><strong>${title}</strong><div class="admin-analytics-mono">${escapeHtml(String(row.eventId).slice(0, 56))}</div></td>
        <td class="admin-analytics-num">${row.views}</td>
        <td class="admin-analytics-num">${row.shares}</td>
        <td>${topSrc}</td>
        <td>${last}</td>
      </tr>`;
    })
    .join("");

  const tableHtml = `<div class="admin-analytics-table-wrap"><table class="admin-analytics-table">
    <thead><tr><th>Event</th><th>Views</th><th>Shares</th><th>Top Quelle</th><th>Letzte Aktivität</th></tr></thead>
    <tbody>${tableRows || `<tr><td colspan="5">Keine Daten im gewählten Zeitraum.</td></tr>`}</tbody>
  </table></div>`;

  return `${kpiHtml}${filterHtml}${tableHtml}`;
}

function renderAdminAnalyticsPanelFromCache() {
  if (!dom.analyticsBody || !isSessionAdmin(state.adminSession)) return;
  if (state.analyticsLoading) return;
  dom.analyticsBody.innerHTML = buildAdminAnalyticsHtml(state.analyticsRowsRaw);
}

async function loadAdminEventAnalyticsData() {
  const rid = ++state.analyticsPanelRequestId;
  state.analyticsLoading = true;
  if (dom.analyticsBody) dom.analyticsBody.innerHTML = `<p class="card__intro">Lade Analytics…</p>`;
  try {
    const client = supabaseClient();
    const since = new Date(Date.now() - 120 * 86400000).toISOString();
    const { data, error } = await client
      .from(EVENT_ANALYTICS_TABLE)
      .select("id,created_at,event_id,action,share_channel,source,metadata")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(15000);
    if (error) throw error;
    if (rid !== state.analyticsPanelRequestId) return;
    state.analyticsRowsRaw = data || [];
    state.analyticsLastFetchAt = Date.now();
    renderAdminAnalyticsPanelFromCache();
  } catch (err) {
    if (rid !== state.analyticsPanelRequestId) return;
    state.analyticsRowsRaw = [];
    if (dom.analyticsBody) dom.analyticsBody.innerHTML = `<p class="feedback is-error">${escapeHtml(err.message || String(err))}</p>`;
  } finally {
    if (rid === state.analyticsPanelRequestId) {
      state.analyticsLoading = false;
    }
  }
}

function renderAnalyticsBody() {
  if (!dom.analyticsBody) return;
  if (!isSessionAdmin(state.adminSession)) {
    dom.analyticsBody.innerHTML = `<p class="card__intro">Analytics nach Admin-Login.</p>`;
    return;
  }
  if (state.navSection !== "analytics") return;
  const reEntered = state.navSection === "analytics" && state.prevNavSection !== "analytics";
  const stale = Date.now() - (state.analyticsLastFetchAt || 0) > 120000;
  if (reEntered || !state.analyticsRowsRaw.length || stale) {
    void loadAdminEventAnalyticsData();
  } else {
    renderAdminAnalyticsPanelFromCache();
  }
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

function renderArchiveTabs() {
  dom.archiveTabs.forEach((tab) => {
    const isActive = tab.dataset.archiveFilter === state.archiveTimeline;
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
  const archivePill = isEventPast(event)
    ? `<span class="event-card__archive-pill" title="Auf der öffentlichen Seite ausgeblendet">Archiv</span>`
    : "";
  const reuseButton = isEventPast(event)
    ? `<button type="button" class="btn-pill btn-pill--outline btn-pill--soft" data-action="reuse-event">↪ Erneut verwenden</button>`
    : "";
  const validationMarkup = renderValidationBadges(event);
  const repairMarkup = renderEventRepairActionsMarkup(event);
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
            <h3 class="event-card__title">${escapeHtml(event.name)}${archivePill}</h3>
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
        ${repairMarkup}
        <div class="event-card__secondary-actions">
          ${reuseButton}
          <button type="button" class="btn-pill btn-pill--outline" data-action="pending">⏸ Pending</button>
          <button type="button" class="btn-pill btn-pill--outline btn-pill--danger" data-action="rejected">❌ Ablehnen</button>
          <button type="button" class="btn-pill btn-pill--outline btn-pill--danger-glow" data-action="delete-event">🗑 Event löschen</button>
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
  renderArchiveTabs();
  renderMainNav();
  renderDashboard();
  renderAnalyticsBody();
  if (dom.settingsBuild) dom.settingsBuild.textContent = ADMIN_DASHBOARD_BUILD;
  renderSocialQueuePanel();
  if (state.navSection === "events") {
    renderEvents();
  }
  if (state.navSection === "social" && state.prevNavSection !== "social") {
    scheduleRecurringSocialAutoPrep();
  }
  state.prevNavSection = state.navSection;
}

function isSameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function socialQueueRowsFlat() {
  return [...state.socialQueueByEvent.values()].flat();
}

function socialQueueRowMatchesAdvancedFilters(row) {
  if (state.socialQueueFilterPlatform && String(row.platform) !== state.socialQueueFilterPlatform) return false;
  if (state.socialQueueFilterEventId && String(row.event_id) !== String(state.socialQueueFilterEventId)) return false;
  if (state.socialQueueFilterRecurringOnly) {
    const ev = state.allEvents.find((e) => String(e.id) === String(row.event_id));
    if (!ev || !isAdminRecurringEvent(adminCoerceRecurrenceFields(ev))) return false;
  }
  if (state.socialQueueFilterDateFrom) {
    const from = new Date(`${state.socialQueueFilterDateFrom}T00:00:00`);
    const scheduled = new Date(row.scheduled_at);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(scheduled.getTime()) && scheduled < from) return false;
  }
  if (state.socialQueueFilterDateTo) {
    const to = new Date(`${state.socialQueueFilterDateTo}T23:59:59`);
    const scheduled = new Date(row.scheduled_at);
    if (!Number.isNaN(to.getTime()) && !Number.isNaN(scheduled.getTime()) && scheduled > to) return false;
  }
  return true;
}

function socialQueueRowMatchesFilter(row) {
  if (!socialQueueRowMatchesAdvancedFilters(row)) return false;
  const filter = state.socialQueueFilter;
  const status = String(row.status || "pending").toLowerCase();
  if (filter === "all") return true;
  if (filter === "draft") {
    return status === "draft" || status === "posted" || status === "sent_to_postiz" || status === "ready_for_postiz";
  }
  if (filter === "posted") return status === "posted" || status === "sent_to_postiz";
  if (filter === "today") {
    const scheduled = new Date(row.scheduled_at);
    return !Number.isNaN(scheduled.getTime()) && isSameLocalDay(scheduled, new Date());
  }
  return status === filter;
}

function cleanSocialQueueDisplayText(value) {
  if (value === null || value === undefined) return "";
  const s = String(value).trim();
  if (!s) return "";
  if (/^[-–—‐‑‒―]+$/u.test(s)) return "";
  return s;
}

function socialQueuePlatformPostLabel(platform) {
  const pv = platformVisual(platform);
  const label = cleanSocialQueueDisplayText(pv.label) || "Social";
  return `${label} Post`;
}

function finalizeSocialQueueCardDisplayTitle(row, resolvedTitle) {
  let title = cleanSocialQueueDisplayText(resolvedTitle);
  if (!title || /^[-–—]+$/u.test(title)) {
    title = socialQueuePlatformPostLabel(row?.platform);
  }
  return title;
}

function getSocialQueueRelatedEvent(row) {
  if (row?._event && typeof row._event === "object") return row._event;
  return state.allEvents.find((e) => String(e.id) === String(row?.event_id)) || null;
}

function extractTitleFromCaption(caption, knownNames = []) {
  const cap = String(caption || "").trim();
  if (!cap) return "";

  for (const raw of knownNames) {
    const name = cleanSocialQueueDisplayText(raw);
    if (name.length >= 3 && cap.toLowerCase().includes(name.toLowerCase())) return name;
  }

  const phrasePatterns = [
    /\b([A-Z][\w'&À-ÿ]+(?:\s+[A-Za-z0-9'&À-ÿ]+){0,8}\s+by\s+the\s+[A-Za-z\s]+)/i,
    /\b([A-Z][\w'&À-ÿ]+(?:\s+[A-Za-z0-9'&À-ÿ]+){0,8}\s+@\s+[\w\s]+)/i,
    /\b([A-Z][\w'&À-ÿ]+(?:\s+[A-Za-z0-9'&À-ÿ]+){1,8})\s+(?:·|—|–|-)\s+/,
    /(?:^|\n)\s*([A-Z][\w'&À-ÿ][^\n#@]{6,78})\s*(?:\n|$)/
  ];
  for (const re of phrasePatterns) {
    const m = cap.match(re);
    const candidate = cleanSocialQueueDisplayText(m?.[1]);
    if (candidate.length >= 6 && candidate.length <= 80 && !/^https?:/i.test(candidate)) {
      return candidate;
    }
  }

  const lines = cap.split(/\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const stripped = cleanSocialQueueDisplayText(line.replace(/\s+#\w+.*$/, "").trim());
    if (
      stripped.length >= 6 &&
      stripped.length <= 80 &&
      /^[A-ZÀ-Ý]/.test(stripped) &&
      !stripped.startsWith("#") &&
      !/^https?:/i.test(stripped)
    ) {
      if (/\bby\s+the\b/i.test(stripped) || stripped.split(/\s+/).length <= 10) return stripped;
    }
  }

  const firstLine = cleanSocialQueueDisplayText(lines[0]?.replace(/\s+#\w+.*$/, "").trim() || "");
  if (firstLine.length >= 3 && firstLine.length <= 120 && !firstLine.startsWith("#")) return firstLine;
  return "";
}

function resolveSocialQueueDisplayTitle(row) {
  const ev = getSocialQueueRelatedEvent(row);
  const platformPost = socialQueuePlatformPostLabel(row?.platform);
  const knownNames = [row?.title, row?.event_title, row?._event?.name, row?._event?.title, ev?.name, ev?.title];

  const candidates = [
    { value: row?.title, source: "row.title" },
    { value: row?.event_title, source: "row.event_title" },
    { value: row?._event?.name, source: "row._event.name" },
    { value: row?._event?.title, source: "row._event.title" },
    { value: ev?.name, source: "allEvents.name" },
    { value: ev?.title, source: "allEvents.title" }
  ];

  let finalTitle = "";
  let source = "platform";

  for (const c of candidates) {
    const cleaned = cleanSocialQueueDisplayText(c.value);
    if (cleaned) {
      finalTitle = cleaned;
      source = c.source;
      break;
    }
  }

  if (!finalTitle) {
    const fromCaption = extractTitleFromCaption(row?.caption, knownNames);
    if (fromCaption) {
      finalTitle = fromCaption;
      source = "caption";
    }
  }

  finalTitle = finalizeSocialQueueCardDisplayTitle(row, finalTitle || platformPost);
  if (source === "platform" && finalTitle === platformPost) {
    source = "platform";
  }

  console.log("resolved social title", { id: row?.id, finalTitle, source });
  return finalTitle;
}

function resolveSocialQueueTitleForSave(row) {
  const ev = getSocialQueueRelatedEvent(row);
  return (
    cleanSocialQueueDisplayText(row?.title) ||
    cleanSocialQueueDisplayText(row?.event_title) ||
    cleanSocialQueueDisplayText(row?._event?.name) ||
    cleanSocialQueueDisplayText(ev?.name) ||
    cleanSocialQueueDisplayText(ev?.title) ||
    ""
  );
}

function normalizeSocialQueueRow(row) {
  const join = row?.events;
  const evFromState = state.allEvents.find((e) => String(e.id) === String(row?.event_id));
  const joinedName = cleanSocialQueueDisplayText(join?.name);
  const stateName = cleanSocialQueueDisplayText(evFromState?.name) || cleanSocialQueueDisplayText(evFromState?.title);
  let eventRef = evFromState || null;
  if (join && typeof join === "object" && !Array.isArray(join)) {
    eventRef = {
      id: row.event_id,
      name: joinedName || stateName,
      title: joinedName || stateName,
      location_name: join.location_name,
      city: join.city,
      image_url: join.image_url
    };
  } else if (eventRef) {
    eventRef = {
      ...eventRef,
      name: stateName || cleanSocialQueueDisplayText(eventRef.name),
      title: stateName || cleanSocialQueueDisplayText(eventRef.title)
    };
  }
  const event_title = joinedName || stateName || "";
  const out = { ...(row || {}) };
  delete out.events;
  const cleanTitle = cleanSocialQueueDisplayText(out.title);
  const scheduledIso = normalizeSocialQueueScheduledAtIso(out.scheduled_at);
  return {
    ...out,
    title: cleanTitle || null,
    event_title,
    _event: eventRef,
    scheduled_at: scheduledIso ?? out.scheduled_at
  };
}

function socialQueueEventTitle(eventId, row = null) {
  if (row) return resolveSocialQueueDisplayTitle(row);
  const ev = state.allEvents.find((event) => String(event.id) === String(eventId));
  return cleanSocialQueueDisplayText(ev?.name) || cleanSocialQueueDisplayText(ev?.title) || "";
}

/** Read-only display for cards/previews — never use for <input type="datetime-local"> value. */
function formatAdminDateTime(raw) {
  if (!raw) return "-";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? String(raw) : parsed.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function platformVisual(platform) {
  const p = String(platform || "").toLowerCase();
  if (p === "instagram") return { icon: "📸", label: "Instagram" };
  if (p === "facebook") return { icon: "📘", label: "Facebook" };
  if (p === "tiktok") return { icon: "🎵", label: "TikTok" };
  return { icon: "🌐", label: platform || "-" };
}

function socialQueueStatusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "sent_to_postiz" || s === "posted") return "ok";
  if (s === "ready_for_postiz" || s === "draft") return "ok";
  if (s === "failed") return "bad";
  if (s === "processing") return "progress";
  if (s === "skipped") return "muted";
  return "pending";
}

function renderSocialQueuePanel() {
  if (!dom.socialQueuePanel) return;
  renderSocialQueueStats();
  dom.socialQueueFilters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.socialFilter === state.socialQueueFilter);
  });
  syncSocialQueueAdvancedFilterOptions();
  const rows = socialQueueRowsFlat().filter(socialQueueRowMatchesFilter);
  if (!rows.length) {
    dom.socialQueuePanel.innerHTML = `<p class="empty-state empty-state--premium">Keine Einträge für diesen Filter.</p>`;
    return;
  }
  dom.socialQueuePanel.innerHTML = rows.map((row) => renderSocialQueueCard(row)).join("");
  console.log("social queue panel render", { build: ADMIN_DASHBOARD_BUILD, rows: rows.length, editor: "caption-studio" });
  requestAnimationFrame(() => syncExpandedSocialQueueEditors());
}

function syncSocialQueueAdvancedFilterOptions() {
  if (dom.socialQueueFilterEvent) {
    const prev = state.socialQueueFilterEventId;
    const eventIds = [...new Set(socialQueueRowsFlat().map((r) => String(r.event_id)).filter(Boolean))];
    dom.socialQueueFilterEvent.innerHTML = [
      `<option value="">Alle Events</option>`,
      ...eventIds.map((id) => {
        const sample = socialQueueRowsForEvent(id)[0];
        const label = resolveSocialQueueDisplayTitle(sample || { event_id: id }) || "Event";
        return `<option value="${escapeHtml(id)}"${id === prev ? " selected" : ""}>${escapeHtml(label)}</option>`;
      })
    ].join("");
  }
  if (dom.socialQueueFilterRecurring) {
    dom.socialQueueFilterRecurring.checked = Boolean(state.socialQueueFilterRecurringOnly);
  }
  if (dom.socialQueueFilterPlatform) {
    dom.socialQueueFilterPlatform.value = state.socialQueueFilterPlatform || "";
  }
  if (dom.socialQueueFilterDateFrom) dom.socialQueueFilterDateFrom.value = state.socialQueueFilterDateFrom || "";
  if (dom.socialQueueFilterDateTo) dom.socialQueueFilterDateTo.value = state.socialQueueFilterDateTo || "";
}

function renderSocialQueueItem(row) {
  return renderSocialQueueCard(row);
}

function renderSocialQueueCard(row) {
  const ev = getSocialQueueRelatedEvent(row);
  const pv = platformVisual(row.platform);
  const platformLabel = cleanSocialQueueDisplayText(pv.label) || "Social";
  const invalid = isSocialQueueRowInvalid(row);
  const thumb = String(row.image_url || row.resolved_image_url || ev?.image_url || "").trim();
  const cap = String(row.caption || "");
  const resolvedTitle = invalid ? "Ungültiger Draft" : resolveSocialQueueDisplayTitle(row);
  let displayTitle = resolvedTitle;
  if (!invalid) {
    if (!displayTitle || displayTitle === "-" || displayTitle === "–" || displayTitle === "—") {
      displayTitle = socialQueuePlatformPostLabel(row.platform);
    }
    displayTitle = finalizeSocialQueueCardDisplayTitle(row, displayTitle);
  }
  const htmlTitleUsed = escapeHtml(displayTitle);
  console.log("SOCIAL TITLE RENDER FINAL", {
    rowId: row.id,
    rawTitle: row.title,
    eventTitle: row.event_title,
    caption: row.caption,
    resolvedTitle,
    htmlTitleUsed
  });
  const repairableTitle =
    resolveSocialQueueTitleForSave(row) ||
    extractTitleFromCaption(row?.caption, [row?.event_title, row?._event?.name, ev?.name, ev?.title]);
  const needsTitleRepair = !invalid && !cleanSocialQueueDisplayText(row?.title) && Boolean(repairableTitle);
  const tone = socialQueueStatusTone(row.status);
  const expanded = String(state.socialQueueExpandedId) === String(row.id);
  if (expanded) {
    console.log("[visible-toolbar-render]", { queueId: row?.id, status: row?.status, phase: "card-expand" });
  }
  const thumbInner = thumb
    ? `<img src="${escapeHtml(thumb)}" alt="" loading="lazy" class="admin-sq-card__thumb-img" />`
    : `<span class="admin-sq-card__thumb-fallback">${invalid ? "⚠️" : pv.icon}</span>`;
  const capPreview = cap
    ? escapeHtml(cap.length > 120 ? `${cap.slice(0, 120)}…` : cap)
    : "—";
  const errBlock = row.last_error
    ? `<p class="admin-sq-card__err">${escapeHtml(String(row.last_error).slice(0, 280))}</p>`
    : "";
  const postizBlock =
    String(row.status || "").toLowerCase() === "sent_to_postiz"
      ? `<p class="admin-sq-card__postiz" role="status">${escapeHtml(SOCIAL_QUEUE_POSTIZ_HANDOFF_MSG)}${
          row.postiz_post_id ? ` · ID ${escapeHtml(String(row.postiz_post_id))}` : ""
        }</p>`
      : "";
  return `
    <article class="admin-sq-card${invalid ? " admin-sq-card--invalid" : ""}${expanded ? " is-expanded" : ""}" data-queue-id="${escapeHtml(row.id)}" data-event-id="${escapeHtml(row.event_id)}">
      <div class="admin-sq-card__top">
        <div class="admin-sq-card__thumb">${thumbInner}</div>
        <div class="admin-sq-card__summary-main">
          <div class="admin-sq-card__head">
            <span class="admin-sq-card__platform">${pv.icon} ${escapeHtml(platformLabel)}</span>
            <span class="admin-sq-badge admin-sq-badge--${tone}">${escapeHtml(socialQueueStatusLabel(row.status))}</span>
            ${invalid ? `<span class="admin-sq-badge admin-sq-badge--bad">Ungültig</span>` : ""}
          </div>
          <h3 class="admin-sq-card__title">${htmlTitleUsed}</h3>
          <p class="admin-sq-card__when">🗓 ${escapeHtml(formatAdminDateTime(row.scheduled_at))}
            <span class="admin-sq-card__retry"> · Retry ${escapeHtml(String(row.retry_count ?? 0))}</span>
            · ${cap.length} Zeichen</p>
          ${expanded ? "" : `<p class="admin-sq-card__cap-preview">${capPreview}</p>`}
        </div>
        <button type="button" class="btn-pill btn-pill--hero btn-pill--xs admin-sq-card__edit-btn" data-queue-action="toggle-expand" aria-expanded="${expanded}">
          ${expanded ? "Schließen" : "Bearbeiten"}
        </button>
      </div>
      ${errBlock}
      ${postizBlock}
      <div class="admin-sq-card__expand"${expanded ? "" : " hidden"}>
        ${expanded ? renderSocialQueueEditor(row) : ""}
      </div>
      <div class="admin-sq-card__actions">
        ${needsTitleRepair ? `<button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-queue-action="repair-title">Titel reparieren</button>` : ""}
        <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-queue-action="open-event">Event</button>
        <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-queue-action="copy-caption">Copy</button>
        <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-queue-action="open-image">Bild</button>
        <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-queue-action="retry">Retry</button>
        <button type="button" class="btn-pill btn-pill--soft btn-pill--xs" data-queue-action="regenerate">Neu</button>
        <button type="button" class="btn-pill btn-pill--soft btn-pill--xs btn-pill--danger" data-queue-action="delete">Löschen</button>
      </div>
    </article>`;
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

/** Insert-only: drop unknown column from error without mutating feature-column UI state. */
function removeUnknownInsertColumn(payload, error) {
  const missing = parseMissingColumn(error);
  if (!missing || !Object.prototype.hasOwnProperty.call(payload, missing)) return false;
  delete payload[missing];
  return true;
}

async function updateEventWithFallback(eventId, updates) {
  const client = supabaseClient();
  const idKey = String(eventId ?? "").trim();
  if (!idKey) throw new Error("Event-ID fehlt.");

  let payload = pickAdminEventSavePayload(sanitizeEventPayloadForDb({ ...updates }));
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await client
      .from("events")
      .update(payload)
      .eq("id", idKey)
      .select("id,status")
      .limit(1);
    if (!error) {
      if (!Array.isArray(data) || !data.length) {
        throw new Error("No row updated. Check admin role and RLS policies.");
      }
      return data[0];
    }
    lastError = error;
    const missing = parseMissingColumn(error);
    console.error("admin save error", {
      attempt,
      eventId: idKey,
      missingColumn: missing || null,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payloadKeys: Object.keys(payload)
    }, error);
    if (missing && ADMIN_EVENT_SAVE_COLUMNS_DISALLOWED.has(missing)) break;
    if (!removeMissingColumnFromPayload(payload, error)) break;
    payload = pickAdminEventSavePayload(payload);
  }

  throw new Error(lastError?.message || "Update failed");
}

async function loadSocialQueueRows() {
  await purgeOldPostedSocialQueueRows();
  const client = supabaseClient();
  let data = null;
  let error = null;
  const enriched = await client
    .from("social_queue")
    .select("*, events(name, location_name, city, image_url)")
    .order("scheduled_at", { ascending: true });
  if (enriched.error) {
    console.warn("Social queue join load fallback:", enriched.error.message || enriched.error);
    const plain = await client.from("social_queue").select("*").order("scheduled_at", { ascending: true });
    data = plain.data;
    error = plain.error;
  } else {
    data = enriched.data;
  }
  if (error) {
    console.warn("Social queue konnte nicht geladen werden:", error);
    state.socialQueueByEvent = new Map();
    return;
  }
  const grouped = new Map();
  for (const raw of data || []) {
    const row = normalizeSocialQueueRow(raw);
    const key = String(row.event_id || "");
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  state.socialQueueByEvent = grouped;
  if (state.socialQueueExpandedId && !findSocialQueueRow(state.socialQueueExpandedId)) {
    state.socialQueueExpandedId = null;
  }
  sanitizeSocialQueueDraftSnapshots();
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

  return insertSocialQueueRows(missing);
}

async function deleteBrokenSocialDraftsForEvent(eventId) {
  const client = supabaseClient();
  const { data, error } = await client
    .from("social_queue")
    .select("id,event_id,platform,status,title,image_url,resolved_image_url,caption")
    .eq("event_id", eventId)
    .in("status", ["pending", "failed", "skipped"]);
  if (error) throw new Error(error.message || "Social Queue konnte nicht geprüft werden.");
  const brokenIds = (data || []).filter((row) => isSocialQueueRowInvalid(row)).map((row) => row.id);
  if (!brokenIds.length) return 0;
  const { error: delErr } = await client.from("social_queue").delete().in("id", brokenIds);
  if (delErr) throw new Error(delErr.message || "Ungültige Drafts konnten nicht gelöscht werden.");
  return brokenIds.length;
}

async function deleteInvalidSocialDrafts() {
  const client = supabaseClient();
  const { data, error } = await client
    .from("social_queue")
    .select("id,event_id,title,image_url,resolved_image_url,caption,status")
    .in("status", ["pending", "failed"]);
  if (error) throw new Error(error.message || "Social Queue konnte nicht geladen werden.");
  const ids = (data || []).filter((row) => isSocialQueueRowInvalid(row)).map((row) => row.id);
  if (!ids.length) return 0;
  const { error: delErr } = await client.from("social_queue").delete().in("id", ids);
  if (delErr) throw new Error(delErr.message || "Ungültige Drafts konnten nicht gelöscht werden.");
  return ids.length;
}

async function regenerateSocialDraftsForEvent(event) {
  if (isAdminEventIncompleteForApproval(event)) {
    throw new Error(reportAdminEventValidationFailure(event, "regenerate-social-drafts"));
  }
  const client = supabaseClient();
  const removedBroken = await deleteBrokenSocialDraftsForEvent(event.id);
  if (removedBroken) {
    console.log("social draft invalid removed", { event_id: event.id, count: removedBroken });
  }
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
      admin_confirmed_at: null,
      postiz_post_id: null,
      postiz_synced_at: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", queueId);
  if (error) throw new Error(error.message || "Retry failed.");
  patchSocialQueueRowInState(queueId, { status: "pending", last_error: null });
}

async function deleteSocialQueueRow(queueId) {
  const client = supabaseClient();
  const { error } = await client.from("social_queue").delete().eq("id", queueId);
  if (error) throw new Error(error.message || "Delete failed.");
}

function isMissingRelationError(error) {
  const msg = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;
  return /does not exist|relation.*not found|42P01/i.test(msg) || error?.code === "42P01";
}

async function adminPerformEventDelete(eventId, eventSnapshot, { busyButton = null, closeEditor = null } = {}) {
  const idKey = String(eventId ?? "").trim();
  if (!idKey) throw new Error("Event-ID fehlt.");
  if (!isSessionAdmin(state.adminSession)) throw new Error("Admin-Anmeldung erforderlich.");

  const runDelete = async () => {
    await deleteEventById(idKey, eventSnapshot);
    removeAdminEventFromState(idKey);
    render();
    setGlobalFeedback("Event gelöscht", "success");
    if (typeof closeEditor === "function") closeEditor();
    await refreshAdminData({ reloadSocial: true });
  };

  if (busyButton) {
    await withAdminButtonBusy(busyButton, "Lösche…", runDelete);
  } else {
    await runDelete();
  }
}

async function adminMoveEventToArchive(eventData) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const ymd = adminFormatLocalYmd(yesterday);
  if (!ymd) throw new Error("Archiv-Datum konnte nicht berechnet werden.");

  const coerced = adminCoerceRecurrenceFields(eventData);
  let patch;
  if (isAdminRecurringEvent(coerced)) {
    patch = { recurrence_end_date: ymd };
  } else {
    patch = { event_date: ymd, event_time: "23:59" };
  }
  await updateEventWithFallback(eventData.id, patch);
  patchAdminEventInState(eventData.id, patch);
  render();
  setGlobalFeedback("Event ins Archiv verschoben.", "success");
}

async function adminRepairRecurrenceAndSave(eventData) {
  const patch = buildAdminRecurrenceRepairPatch(eventData);
  if (!patch) {
    throw new Error("Wiederholung kann nicht automatisch repariert werden (Datum/Art fehlt).");
  }
  await updateEventWithFallback(eventData.id, patch);
  patchAdminEventInState(eventData.id, patch);
  render();
  setGlobalFeedback("Wiederholung repariert.", "success");
}

async function adminRepairWeeklyAndSave(eventData) {
  const patch = buildAdminWeeklyRepairPatch(eventData);
  if (!patch) {
    throw new Error("Wöchentliche Reparatur nicht möglich (nur einmalige vergangene Events mit Datum).");
  }
  console.log("repair recurring", {
    id: eventData.id,
    recurrence_type: patch.recurrence_type,
    recurrence_weekday: patch.recurrence_weekday
  });
  await updateEventWithFallback(eventData.id, patch);
  patchAdminEventInState(eventData.id, patch);
  render();
  setGlobalFeedback("Wiederholung repariert", "success");
}

async function deleteEventById(eventId, eventSnapshot) {
  const idKey = String(eventId ?? "").trim();
  console.log("admin delete start", { eventId: idKey, typeofId: typeof eventId });
  console.log("admin delete eventId", idKey);
  if (!idKey) return;
  if (!isSessionAdmin(state.adminSession)) {
    const err = new Error("Admin-Anmeldung erforderlich.");
    console.error("admin delete failed", { eventId: idKey, message: err.message });
    throw err;
  }
  const client = supabaseClient();

  const storagePaths = eventSnapshot ? collectEventImageStoragePaths(eventSnapshot) : [];
  if (storagePaths.length) {
    const { error: storageError } = await client.storage.from(EVENT_IMAGES_BUCKET).remove(storagePaths);
    if (storageError) {
      console.warn("Event-Bilder Storage cleanup:", storageError);
    }
  }

  const { data: queueData, error: queueErr, count: queueCount } = await client
    .from("social_queue")
    .delete({ count: "exact" })
    .eq("event_id", idKey)
    .select("id");
  console.error("admin delete supabase response", {
    table: "social_queue",
    data: queueData,
    error: queueErr,
    count: queueCount
  });
  if (queueErr) {
    console.error("admin delete failed", { eventId: idKey, step: "social_queue", message: queueErr.message });
    throw new Error(queueErr.message || "social_queue konnte nicht gelöscht werden.");
  }

  const { data: capData, error: capErr, count: capCount } = await client
    .from("social_caption_usage")
    .delete({ count: "exact" })
    .eq("event_id", idKey)
    .select("id");
  console.error("admin delete supabase response", {
    table: "social_caption_usage",
    data: capData,
    error: capErr,
    count: capCount
  });
  if (capErr && !isMissingRelationError(capErr)) {
    console.error("admin delete failed", {
      eventId: idKey,
      step: "social_caption_usage",
      message: capErr.message
    });
    throw new Error(capErr.message || "social_caption_usage konnte nicht gelöscht werden.");
  }
  if (capErr) {
    console.warn("admin delete: social_caption_usage skipped (table missing?)", capErr);
  }

  const { data: analyticsData, error: analyticsErr, count: analyticsCount } = await client
    .from(EVENT_ANALYTICS_TABLE)
    .delete({ count: "exact" })
    .eq("event_id", idKey)
    .select("id");
  console.error("admin delete supabase response", {
    table: EVENT_ANALYTICS_TABLE,
    data: analyticsData,
    error: analyticsErr,
    count: analyticsCount
  });
  if (analyticsErr && !isMissingRelationError(analyticsErr)) {
    console.warn("admin delete: event_analytics cleanup failed (non-fatal)", analyticsErr);
  }

  const { data: deletedRows, error: evErr, count: evCount } = await client
    .from("events")
    .delete({ count: "exact" })
    .eq("id", idKey)
    .select("id");
  console.error("admin delete supabase response", {
    table: "events",
    data: deletedRows,
    error: evErr,
    count: evCount
  });
  if (evErr) {
    console.error("admin delete failed", { eventId: idKey, step: "events", message: evErr.message });
    throw new Error(evErr.message || "Event konnte nicht gelöscht werden.");
  }
  if (!Array.isArray(deletedRows) || !deletedRows.length) {
    const msg = "Kein Event gelöscht – ID nicht gefunden oder RLS blockiert";
    console.error("admin delete failed", { eventId: idKey, step: "events", message: msg });
    throw new Error(msg);
  }
  console.log("admin delete success", { eventId: idKey, count: evCount });
}

function duplicateInsertPayloadFromEvent(source) {
  const sid = source?.id ?? null;
  const payload = {
    name: source.name || source.title || "Event",
    title_es: source.title_es || null,
    title_de: source.title_de || null,
    title_en: source.title_en || null,
    description: source.description || null,
    description_es: source.description_es || null,
    description_de: source.description_de || null,
    description_en: source.description_en || null,
    location_name: source.location_name || null,
    address: source.address || source.street || null,
    postal_code: source.postal_code || null,
    city: source.city || null,
    country: source.country || null,
    province: source.province || null,
    region: source.region || null,
    formatted_address: source.formatted_address || null,
    place_id: source.place_id || null,
    geocoding_query: source.geocoding_query || null,
    lat: source.lat ?? null,
    lng: source.lng ?? null,
    genre: source.genre || source.category || null,
    artist_name: source.artist_name || null,
    price_text: source.price_text || null,
    image_url: source.image_url || null,
    image_urls: source.image_urls ?? null,
    status: "pending",
    featured: false,
    promoted: false,
    verification_notes: null,
    recurrence_type: "none",
    recurrence_start_date: null,
    recurrence_end_date: null,
    recurrence_weekday: null,
    recurrence_day_of_month: null,
    event_date: null,
    event_time: null,
    end_time: null
  };
  if (isLikelyUuidForOriginalEventRef(sid)) {
    payload.original_event_id = sid;
  }
  return sanitizeEventPayloadForDb(payload);
}

function isLikelyUuidForOriginalEventRef(value) {
  const s = String(value || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function todayLocalYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function stripUndefinedValues(obj) {
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k];
  }
  return out;
}

function logDuplicateInsertSupabaseError(error, phase) {
  const e = error && typeof error === "object" ? error : {};
  console.error("[duplicate-event] supabase", phase, {
    code: e.code,
    message: e.message,
    details: e.details,
    hint: e.hint
  }, error);
}

async function insertDuplicateEventRow(payload) {
  const client = supabaseClient();
  const run = async (body) => {
    const cleaned = stripUndefinedValues(body);
    return client.from("events").insert(cleaned).select("id").limit(1);
  };

  let body = pickAdminEventSavePayload(sanitizeEventPayloadForDb(payload));
  console.log("admin reuse payload", { keys: Object.keys(body), body });
  let lastError = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    body = pickAdminEventSavePayload(body);
    const { data, error } = await run(body);
    if (!error) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.id) return row.id;
      logDuplicateInsertSupabaseError({ message: "Insert returned no row (empty select)", data }, `attempt-${attempt}`);
      throw new Error("Duplikat: keine ID zurück — bitte RLS/SELECT für neue Events prüfen.");
    }
    lastError = error;
    logDuplicateInsertSupabaseError(error, `attempt-${attempt}`);

    const msg = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`;

    if (/original_event_id|archived_at/i.test(msg) && ("original_event_id" in body || "archived_at" in body)) {
      delete body.original_event_id;
      delete body.archived_at;
      continue;
    }

    if (removeUnknownInsertColumn(body, error)) continue;

    const needsDate =
      /event_date/i.test(msg)
      && (/not null|null value|violates/i.test(msg) || /23502/i.test(String(error.code || "")));
    if (needsDate && (body.event_date === undefined || body.event_date === null || body.event_date === "")) {
      body.event_date = todayLocalYmd();
      body.event_time = body.event_time ?? null;
      body.end_time = body.end_time ?? null;
      continue;
    }

    break;
  }

  console.error("admin reuse error", {
    code: lastError?.code,
    message: lastError?.message,
    details: lastError?.details,
    hint: lastError?.hint
  }, lastError);
  throw new Error(lastError?.message || "Duplikat konnte nicht angelegt werden.");
}

async function duplicateEventForReuse(sourceEvent) {
  if (!isSessionAdmin(state.adminSession)) {
    throw new Error("Admin-Anmeldung erforderlich.");
  }
  const payload = duplicateInsertPayloadFromEvent(sourceEvent);
  return insertDuplicateEventRow(payload);
}

function findSocialQueueRow(queueId) {
  return socialQueueRowsFlat().find((row) => String(row.id) === String(queueId));
}

/** Parse JSON from form field; never throws — invalid JSON → null + console warning. */
function readJsonFieldFromFormLoose(rawValue, fallback = null) {
  const value = String(rawValue ?? "").trim();
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn("admin form JSON parse failed, using null:", err?.message || err);
    return fallback;
  }
}

/** HTML time → Postgres-friendly HH:MM:SS; empty → null */
function normalizeAdminTimeForDb(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const hh = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  const ss = m[3] !== undefined && m[3] !== "" ? Math.min(59, Math.max(0, parseInt(m[3], 10))) : 0;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** Empty string → null; trim strings; drop undefined; normalize date/time keys. */
function sanitizeEventPayloadForDb(payload) {
  const out = { ...payload };
  if ("event_date" in out) {
    const raw = out.event_date;
    if (raw === null || raw === undefined || raw === "") {
      out.event_date = null;
    } else {
      const d = adminNormalizeEventDateForValidation(String(raw).trim());
      out.event_date = d || null;
    }
  }
  if ("event_time" in out) out.event_time = normalizeAdminTimeForDb(out.event_time);
  if ("end_time" in out) out.end_time = normalizeAdminTimeForDb(out.end_time);
  for (const key of Object.keys(out)) {
    const v = out[key];
    if (v === undefined) {
      delete out[key];
      continue;
    }
    if (key === "name") {
      if (typeof v === "string") out[key] = v.trim();
      continue;
    }
    if (typeof v === "string") {
      const t = v.trim();
      out[key] = t === "" ? null : t;
    }
  }
  return pickAdminEventSavePayload(out);
}

function hasLocationChanged(event, payload) {
  return ["location_name", "address", "postal_code", "city", "country"].some((key) =>
    String(event?.[key] || "").trim() !== String(payload?.[key] || "").trim()
  );
}

function adminTokenizeLanguageQuality(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function adminLanguageMarkerScore(text, languageCode) {
  const tokens = new Set(adminTokenizeLanguageQuality(text));
  const markersByLanguage = {
    en: ["the", "and", "for", "with", "event", "description", "this", "is", "are", "to", "an", "of", "you"],
    es: ["el", "la", "los", "las", "y", "para", "con", "evento", "descripcion", "es", "de", "una", "un", "que"],
    de: ["der", "die", "das", "und", "mit", "fuer", "für", "veranstaltung", "beschreibung", "ist", "zu", "ein", "sie", "ihr"]
  };
  const markers = markersByLanguage[languageCode] || [];
  return markers.reduce((count, marker) => count + (tokens.has(marker) ? 1 : 0), 0);
}

function adminHasLanguageQuality(translatedText, languageCode) {
  const tokens = adminTokenizeLanguageQuality(translatedText);
  if (!tokens.length) return false;
  const targetScore = adminLanguageMarkerScore(translatedText, languageCode);
  if (targetScore < 1) return false;
  const competitorScores = ["de", "en", "es"]
    .filter((code) => code !== languageCode)
    .map((code) => adminLanguageMarkerScore(translatedText, code));
  const strongestCompetitor = Math.max(0, ...competitorScores);
  if (targetScore < strongestCompetitor) return false;
  if (targetScore === strongestCompetitor && targetScore < 2) return false;
  return true;
}

function adminNormalizeTextForPhraseMatch(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function adminCountLanguageIndicators(text, indicators) {
  const lower = adminNormalizeTextForPhraseMatch(text);
  if (!lower) return 0;
  let hits = 0;
  for (const indicator of indicators) {
    const needle = adminNormalizeTextForPhraseMatch(indicator);
    if (needle && lower.includes(needle)) hits += 1;
  }
  return hits;
}

function adminLanguageScores(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    return { german: 0, spanish: 0, english: 0 };
  }
  return {
    german:
      adminCountLanguageIndicators(raw, ADMIN_GERMAN_LANGUAGE_INDICATORS) +
      adminLanguageMarkerScore(raw, "de") * 0.25,
    spanish:
      adminCountLanguageIndicators(raw, ADMIN_SPANISH_LANGUAGE_INDICATORS) +
      adminLanguageMarkerScore(raw, "es") * 0.25,
    english:
      adminCountLanguageIndicators(raw, ADMIN_ENGLISH_LANGUAGE_INDICATORS) +
      adminLanguageMarkerScore(raw, "en") * 0.25
  };
}

function isProbablyGerman(text) {
  const { german, spanish, english } = adminLanguageScores(text);
  return german > 0 && german >= spanish && german >= english;
}

function isProbablySpanish(text) {
  const { german, spanish, english } = adminLanguageScores(text);
  return spanish > 0 && spanish >= german && spanish >= english;
}

function isProbablyEnglish(text) {
  const { german, spanish, english } = adminLanguageScores(text);
  return english > 0 && english >= german && english >= spanish;
}

function adminDetectDominantLanguage(text) {
  if (isProbablySpanish(text)) return "es";
  if (isProbablyGerman(text)) return "de";
  if (isProbablyEnglish(text)) return "en";
  return "unknown";
}

function adminLocalizedFieldLanguageValid(field, text) {
  const raw = String(text || "").trim();
  const fieldName = String(field || "").toLowerCase();
  if (!fieldName.startsWith("description_")) return true;
  const { german, spanish, english } = adminLanguageScores(raw);
  let accepted = false;

  if (!raw) return false;

  if (fieldName.endsWith("_es")) {
    accepted = german <= spanish && english <= spanish && spanish > 0;
    if (german > spanish || english > spanish) accepted = false;
    if (spanish === 0 && (german > 0 || english > 0)) accepted = false;
    if (isProbablyGerman(raw) && !isProbablySpanish(raw)) accepted = false;
  } else if (fieldName.endsWith("_de")) {
    accepted = spanish <= german;
    if (spanish > german) accepted = false;
    if (isProbablySpanish(raw) && !isProbablyGerman(raw)) accepted = false;
    if (english > german && english >= spanish) accepted = false;
  } else if (fieldName.endsWith("_en")) {
    accepted = german <= english && spanish <= english;
    if (german > english || spanish > english) accepted = false;
    if ((isProbablyGerman(raw) || isProbablySpanish(raw)) && !isProbablyEnglish(raw)) accepted = false;
  } else {
    accepted = true;
  }

  return accepted;
}

function adminRejectLocalizedLanguage(field, text, reason = "language_mismatch") {
  console.warn("TRANSLATION LANGUAGE REJECTED", {
    field,
    reason,
    sample: String(text || "").slice(0, 160)
  });
  return "";
}

function adminLocalizedFieldFromCode(code) {
  const c = String(code || "").toLowerCase();
  if (c === "es" || c === "de" || c === "en") return `description_${c}`;
  return "";
}

function isClearlyWrongLocalizedField(field, text) {
  const value = String(text || "").trim();
  if (!value) return false;
  return !adminLocalizedFieldLanguageValid(field, value);
}

function isClearlyWrongLocalizedDescription(text, languageCode) {
  const field = adminLocalizedFieldFromCode(languageCode);
  return isClearlyWrongLocalizedField(field, text);
}

function adminTextLooksGerman(text) {
  return isProbablyGerman(text);
}

function adminDetectDescriptionSourceLanguage(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  if (isProbablyGerman(raw)) return "de";
  if (isProbablySpanish(raw)) return "es";
  if (isProbablyEnglish(raw)) return "en";
  return "de";
}

function adminNormalizeDescriptionCandidate(raw) {
  let text = String(raw ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  if (text === "-" || text === "–" || text === "—") return "";
  if (/^(tbd|n\/a|null|undefined|none)$/i.test(text)) return "";
  return text;
}

/**
 * Main Beschreibung only — user-entered description defines source language.
 */
function resolveAdminPrimaryDescription(eventData, form) {
  const editorMain = adminNormalizeDescriptionCandidate(form?.querySelector?.('[name="description"]')?.value);
  const eventMain = adminNormalizeDescriptionCandidate(eventData?.description);
  const text = editorMain || eventMain || "";
  const source = editorMain ? "editor.description" : eventMain ? "eventData.description" : null;
  if (!text) {
    console.log("DESCRIPTION SOURCE LANGUAGE", {
      source: null,
      sourceLanguageCode: "",
      length: 0,
      preview: ""
    });
    return { text: "", source: null, sourceLanguageCode: "" };
  }
  const sourceLanguageCode = adminDetectDescriptionSourceLanguage(text);
  console.log("DESCRIPTION SOURCE LANGUAGE", {
    source,
    sourceLanguageCode,
    length: text.length,
    preview: text.slice(0, 120)
  });
  return { text, source, sourceLanguageCode };
}

function adminShouldRegenerateDescriptionField(field, currentValue, targetLang, sourceLang, forceOverwrite) {
  const text = String(currentValue || "").trim();
  const target = String(targetLang || "").toLowerCase();
  const source = String(sourceLang || "").toLowerCase();
  if (forceOverwrite) return true;
  if (!text) return true;
  if (target === source) {
    return !adminLocalizedFieldLanguageValid(field, text);
  }
  return !adminLocalizedFieldLanguageValid(field, text);
}

function adminApplyDescriptionTranslationUpdate(updates, field, value) {
  const applied = value == null ? "" : String(value);
  updates[field] = applied;
  console.log("DESCRIPTION TRANSLATION APPLY", {
    field,
    appliedValue: applied.slice(0, 160),
    length: applied.length
  });
  return applied;
}

async function translateAdminDescriptionText(sourceText, targetLangCode, meta = {}) {
  const code = String(targetLangCode || "").toLowerCase();
  const fieldName = meta.field || adminLocalizedFieldFromCode(code);
  const targetLanguage =
    code === "es" ? ADMIN_SMART_ACTION_TARGET_SPANISH : ADMIN_TRANSLATION_TARGET_LANGUAGE_BY_CODE[code];
  if (!targetLanguage) throw new Error(`Unknown language code: ${targetLangCode}`);

  console.log("DESCRIPTION TRANSLATION REQUEST", {
    targetLang: targetLanguage,
    sourceLang: meta.sourceLang || null,
    field: fieldName,
    preview: String(sourceText || "").slice(0, 160)
  });

  const tryTranslate = async (text) => {
    const translated = await translateAdminText(text, targetLanguage, {
      source: meta.source || null,
      sourceLang: meta.sourceLang || null,
      eventId: meta.eventId ?? null,
      field: fieldName
    });
    return normalizeAdminTranslationOutput(translated, text);
  };

  let lastError = null;
  let result = null;
  try {
    const normalized = await tryTranslate(sourceText);
    if (adminAcceptTranslatedText(normalized, code, fieldName)) {
      result = normalized;
    } else {
      adminRejectLocalizedLanguage(fieldName, normalized, "post_translate_validation");
      lastError = new Error(`${code} translation rejected after normalization`);
    }
  } catch (error) {
    lastError = error;
  }

  if (!result) {
    const strictPrompt = buildAdminStrictTranslationPrompt(sourceText, code);
    if (strictPrompt) {
      try {
        const normalized = await tryTranslate(strictPrompt);
        if (adminAcceptTranslatedText(normalized, code, fieldName)) {
          result = normalized;
        } else {
          adminRejectLocalizedLanguage(fieldName, normalized, "strict_post_translate_validation");
          lastError = new Error(`${code} strict translation rejected after normalization`);
        }
      } catch (error) {
        lastError = error;
      }
    }
  }

  console.log("DESCRIPTION TRANSLATION RESPONSE", {
    targetLang: targetLanguage,
    field: fieldName,
    ok: Boolean(result),
    resultPreview: result ? result.slice(0, 160) : null,
    error: result ? null : lastError?.message || String(lastError)
  });

  if (!result) throw lastError || new Error(`Translation failed for ${code}`);
  return result;
}

function adminResolveTranslationTargetLanguage(targetLang) {
  const raw = String(targetLang || "").trim();
  if (!raw) return "";
  const code = raw.toLowerCase();
  return ADMIN_TRANSLATION_TARGET_LANGUAGE_BY_CODE[code] || raw;
}

function adminAcceptTranslatedText(normalized, languageCode, fieldName = null) {
  if (!normalized) return false;
  const field = fieldName || adminLocalizedFieldFromCode(languageCode);
  if (!field) return false;
  return adminLocalizedFieldLanguageValid(field, normalized);
}

function adminExtractTranslationFromApiResponse(data) {
  if (!data || typeof data !== "object") return "";
  return String(
    data.translated || data.translation || data.text || data.result || data.output || ""
  ).trim();
}

async function translateAdminText(text, targetLang, { source = null, sourceLang = null, eventId = null, field = null } = {}) {
  const sourceText = String(text || "").trim();
  const targetLanguage = adminResolveTranslationTargetLanguage(targetLang);
  if (!sourceText || !targetLanguage) return "";
  const response = await fetch(ADMIN_SMART_ACTION_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ text: sourceText, targetLang: targetLanguage })
  });
  const rawBody = await response.text();
  let data = null;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    throw new Error(`Translation HTTP ${response.status}: ${rawBody.slice(0, 200)}`);
  }
  const translated = adminExtractTranslationFromApiResponse(data);
  if (!translated) {
    throw new Error("Translation response missing translated text.");
  }
  return translated;
}

function normalizeAdminTranslationOutput(translatedText, sourceText = "") {
  const raw = String(translatedText || "").trim();
  if (!raw) return "";
  const source = String(sourceText || "").trim();
  if (source && raw.toLowerCase() === source.toLowerCase()) return "";
  return raw.replace(/^["“”'`]+|["“”'`]+$/g, "").trim();
}

function buildAdminStrictTranslationPrompt(sourceText, languageCode) {
  const cleanSource = String(sourceText || "").trim();
  if (!cleanSource) return "";
  const targetLanguageName = ADMIN_TRANSLATION_TARGET_LANGUAGE_BY_CODE[languageCode] || languageCode;
  return [
    `Translate the following text into ${targetLanguageName}.`,
    "Return only the translated text in the target language.",
    "Do not include explanations, labels, or prefixes.",
    "",
    cleanSource
  ].join("\n");
}

const ADMIN_LOCALIZED_EDITOR_SYNC_FIELDS = ["description_es", "description_de", "description_en"];

function adminFindEditorFieldControl(form, root, fieldName) {
  const selector = `[name="${fieldName}"]`;
  return form?.querySelector(selector) || root?.querySelector(selector) || null;
}

function adminSetFormControlValue(el, value) {
  if (!el) return false;
  const after = value == null ? "" : String(value);
  const wasDisabled = el.disabled;
  if (wasDisabled) el.disabled = false;
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLInputElement
        ? HTMLInputElement.prototype
        : null;
  if (proto) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor?.set) {
      descriptor.set.call(el, after);
    } else {
      el.value = after;
    }
  } else {
    el.value = after;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  if (wasDisabled) el.disabled = true;
  return true;
}

function applyAdminTranslationUpdatesToForm(form, updates, eventData = null, editorRoot = null) {
  if (!form || !updates) return { synced: [], missing: [] };
  const synced = [];
  const missing = [];
  for (const [fieldName, value] of Object.entries(updates)) {
    const el = adminFindEditorFieldControl(form, editorRoot, fieldName);
    if (!el) {
      missing.push(fieldName);
      continue;
    }
    const after = value == null ? "" : String(value);
    const domUpdated = adminSetFormControlValue(el, after);
    console.log("TRANSLATION UI SYNC", {
      field: fieldName,
      appliedValue: after.slice(0, 120),
      domUpdated
    });
    if (eventData && Object.prototype.hasOwnProperty.call(eventData, fieldName)) {
      eventData[fieldName] = value == null ? null : after;
    }
    synced.push(fieldName);
  }
  return { synced, missing };
}

/**
 * Push translation updates into editor DOM + in-memory event/state (call after setBusy(false)).
 */
function syncAdminTranslationUpdatesToEditor(form, overlay, updates, eventData) {
  if (!form || !updates) return;
  const applyResult = applyAdminTranslationUpdatesToEditor(form, overlay, updates, eventData);
  if (eventData?.id) {
    const statePatch = {};
    for (const field of ADMIN_LOCALIZED_EDITOR_SYNC_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        statePatch[field] = updates[field] == null ? null : String(updates[field]);
      }
    }
    if (Object.keys(statePatch).length) {
      patchAdminEventInState(eventData.id, statePatch);
    }
  }
  if (applyResult.missing.length) {
    console.warn("translation ui sync missing fields", applyResult.missing);
  }
  window.requestAnimationFrame(() => {
    for (const field of applyResult.synced) {
      const el = adminFindEditorFieldControl(form, overlay, field);
      if (!el) continue;
      const expected = updates[field] == null ? "" : String(updates[field]);
      if (String(el.value) !== expected) {
        adminSetFormControlValue(el, expected);
        console.log("TRANSLATION UI SYNC", {
          field,
          appliedValue: expected.slice(0, 120),
          domUpdated: true,
          retry: true
        });
      }
    }
  });
}

function applyAdminTranslationUpdatesToEditor(form, overlay, updates, eventData) {
  return applyAdminTranslationUpdatesToForm(form, updates, eventData, overlay);
}

/**
 * Regenerate description_es / description_de / description_en from main Beschreibung only.
 * Source language field gets the main text; the other two are translated.
 */
async function regenerateAdminEventTranslations(eventData, form, { forceOverwrite = false } = {}) {
  const primary = resolveAdminPrimaryDescription(eventData, form);
  if (!primary.text) {
    throw new Error("Bitte zuerst eine Beschreibung eingeben.");
  }

  const sourceText = primary.text;
  const sourceLang = String(primary.sourceLanguageCode || "").toLowerCase();
  const eventId = eventData?.id ?? null;
  const updates = {};
  const failedFields = [];
  const skippedManual = [];
  const needsConfirm = [];

  const readDescriptionField = (fieldName) => {
    const editorVal = adminNormalizeDescriptionCandidate(form?.querySelector?.(`[name="${fieldName}"]`)?.value);
    if (editorVal) return editorVal;
    return adminNormalizeDescriptionCandidate(eventData?.[fieldName]);
  };

  for (const { code, field, label } of ADMIN_DESCRIPTION_LOCALIZED_FIELDS) {
    const targetLang = String(code || "").toLowerCase();
    const current = readDescriptionField(field);
    const shouldUpdate = adminShouldRegenerateDescriptionField(
      field,
      current,
      targetLang,
      sourceLang,
      forceOverwrite
    );

    if (!shouldUpdate) {
      if (current && adminLocalizedFieldLanguageValid(field, current)) {
        skippedManual.push(label);
        needsConfirm.push({ field, label });
      }
      continue;
    }

    if (targetLang === sourceLang) {
      adminApplyDescriptionTranslationUpdate(updates, field, sourceText);
      continue;
    }

    try {
      const translated = await translateAdminDescriptionText(sourceText, targetLang, {
        source: primary.source,
        sourceLang: sourceLang,
        eventId,
        field
      });
      if (!translated || !adminLocalizedFieldLanguageValid(field, translated)) {
        if (translated) adminRejectLocalizedLanguage(field, translated, "target_language_mismatch");
        failedFields.push(label);
        adminApplyDescriptionTranslationUpdate(updates, field, "");
      } else {
        adminApplyDescriptionTranslationUpdate(updates, field, translated);
      }
    } catch (error) {
      console.warn("admin description translation failed", {
        field,
        targetLang,
        message: error?.message || error
      });
      failedFields.push(label);
      adminApplyDescriptionTranslationUpdate(updates, field, "");
    }
  }

  const updatedFields = Object.keys(updates);
  console.log("DESCRIPTION TRANSLATION FINAL", {
    sourceLanguage: sourceLang,
    updatedFields
  });

  return {
    updates,
    failedFields,
    skippedManual,
    needsConfirm,
    sourceLanguageCode: sourceLang
  };
}

function adminOptionalFormString(formData, name) {
  const value = String(formData.get(name) || "").trim();
  return value || null;
}

/** Prevent empty editor inputs from wiping persisted DB values on merge/save. */
function adminStripEmptyFormOverrides(payload, eventData) {
  if (!payload || !eventData) return payload;
  const preserveKeys = [
    "name",
    "description",
    "genre",
    "event_date",
    "event_time",
    "end_time",
    "location_name",
    "address",
    "postal_code",
    "city",
    "country",
    "image_url",
    "artist_name",
    "price_text"
  ];
  for (const key of preserveKeys) {
    const formVal = payload[key];
    const stored = eventData[key];
    if ((formVal === null || formVal === "") && stored != null && String(stored).trim()) {
      delete payload[key];
    }
  }
  if (payload.image_urls === null && eventData.image_urls) {
    delete payload.image_urls;
  }
  return payload;
}

function eventEditPayloadFromForm(form) {
  const formData = new FormData(form);
  const latRaw = String(formData.get("lat") || "").trim();
  const lngRaw = String(formData.get("lng") || "").trim();
  const titleVal = String(formData.get("title") || "").trim();
  const categoryVal = String(formData.get("category") || "").trim();
  const eventDateRaw = String(formData.get("event_date") || "").trim();
  const eventTimeRaw = String(formData.get("event_time") || "").trim();
  const payload = {
    name: titleVal || null,
    title_de: adminOptionalFormString(formData, "title_de"),
    title_en: adminOptionalFormString(formData, "title_en"),
    title_es: adminOptionalFormString(formData, "title_es"),
    description: adminOptionalFormString(formData, "description"),
    description_es: adminOptionalFormString(formData, "description_es"),
    description_de: adminOptionalFormString(formData, "description_de"),
    description_en: adminOptionalFormString(formData, "description_en"),
    genre: categoryVal || null,
    event_date: adminNormalizeEventDateForValidation(eventDateRaw) || null,
    event_time: adminNormalizeEventTimeForValidation(eventTimeRaw) || null,
    end_time: adminNormalizeEventTimeForValidation(String(formData.get("end_time") || "").trim()) || null,
    location_name: adminOptionalFormString(formData, "location_name"),
    address: adminOptionalFormString(formData, "address"),
    postal_code: adminOptionalFormString(formData, "postal_code"),
    city: adminOptionalFormString(formData, "city"),
    country: adminOptionalFormString(formData, "country"),
    artist_name: adminOptionalFormString(formData, "artist_name"),
    price_text: adminOptionalFormString(formData, "price_text"),
    image_url: adminOptionalFormString(formData, "image_url"),
    image_urls: readJsonFieldFromFormLoose(formData.get("image_urls"), null),
    verification_notes: adminOptionalFormString(formData, "verification_notes")
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
  applyRecurringEditorFieldsToPayload(payload, form);
  return payload;
}

function applyRecurringEditorFieldsToPayload(payload, form) {
  const isRecurring = Boolean(form?.querySelector?.('[name="is_recurring"]')?.checked);
  payload.is_recurring = isRecurring;
  if (!isRecurring) {
    payload.recurrence_type = "none";
    payload.recurrence_start_date = null;
    payload.recurrence_end_date = null;
    payload.recurrence_weekday = null;
    payload.recurrence_day_of_month = null;
    payload.recurring_social_enabled = false;
    if (Object.prototype.hasOwnProperty.call(payload, "recurring_group_id")) {
      payload.recurring_group_id = null;
    }
    console.log("admin recurrence payload", {
      is_recurring: false,
      recurrence_type: "none",
      cleared: true
    });
    return payload;
  }
  const type = normalizeAdminRecurrenceType(form.querySelector('[name="recurrence_type"]')?.value);
  payload.recurrence_type = type;
  payload.recurrence_start_date = String(form.querySelector('[name="recurrence_start_date"]')?.value || "").trim() || null;
  payload.recurrence_end_date = String(form.querySelector('[name="recurrence_end_date"]')?.value || "").trim() || null;
  payload.recurring_social_enabled = Boolean(form.querySelector('[name="recurring_social_enabled"]')?.checked);
  if (type === "weekly") {
    const wd = form.querySelector('[name="recurrence_weekday"]')?.value;
    payload.recurrence_weekday = wd === "" || wd === null || wd === undefined ? null : Number(wd);
    payload.recurrence_day_of_month = null;
  } else if (type === "monthly") {
    const dom = form.querySelector('[name="recurrence_day_of_month"]')?.value;
    payload.recurrence_day_of_month = dom === "" || dom === null || dom === undefined ? null : Number(dom);
    payload.recurrence_weekday = null;
  } else {
    payload.recurrence_weekday = null;
    payload.recurrence_day_of_month = null;
  }
  console.log("admin recurrence payload", {
    is_recurring: true,
    recurrence_type: payload.recurrence_type,
    recurrence_weekday: payload.recurrence_weekday ?? null,
    recurrence_day_of_month: payload.recurrence_day_of_month ?? null
  });
  return payload;
}

function renderAdminEditorRecurringFields(eventData) {
  const normalized = adminNormalizeRecurrenceState(eventData || {});
  const isRecurring = normalized.is_recurring === true;
  const type = getAdminEffectiveRecurrenceType(normalized);
  const weekday = normalized.recurrence_weekday;
  const dom = normalized.recurrence_day_of_month;
  const weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const weekdayOptions = weekdays
    .map(
      (label, i) =>
        `<option value="${i}"${Number(weekday) === i ? " selected" : ""}>${label}</option>`
    )
    .join("");
  return `
    <fieldset class="admin-editor-recurring admin-editor-span-2">
      <legend class="admin-editor-recurring__legend">Wiederkehrendes Event</legend>
      <label class="field admin-editor-recurring__toggle">
        <input type="checkbox" name="is_recurring" value="1" data-editor-is-recurring${isRecurring ? " checked" : ""} />
        <span>Serie aktivieren</span>
      </label>
      <div class="admin-editor-recurring__detail" data-editor-recurring-detail${isRecurring ? "" : " hidden"}>
        <label class="field"><span>Rhythmus</span>
          <select name="recurrence_type" data-editor-recurrence-type>
            <option value="weekly"${type === "weekly" ? " selected" : ""}>Wöchentlich</option>
            <option value="monthly"${type === "monthly" ? " selected" : ""}>Monatlich</option>
          </select>
        </label>
        <label class="field"><span>Serien-Start</span>
          <input type="date" name="recurrence_start_date" value="${escapeHtml(String(normalized.recurrence_start_date || normalized.event_date || ""))}" />
        </label>
        <label class="field"><span>Serien-Ende (optional)</span>
          <input type="date" name="recurrence_end_date" value="${escapeHtml(String(normalized.recurrence_end_date || ""))}" />
        </label>
        <label class="field" data-editor-recurrence-weekly${type === "weekly" ? "" : " hidden"}><span>Wochentag</span>
          <select name="recurrence_weekday">${weekdayOptions}</select>
        </label>
        <label class="field" data-editor-recurrence-monthly${type === "monthly" ? "" : " hidden"}><span>Tag im Monat</span>
          <input type="number" name="recurrence_day_of_month" min="1" max="31" value="${escapeHtml(String(dom ?? ""))}" />
        </label>
        <label class="field admin-editor-span-2 admin-editor-recurring__social-flag">
          <input type="checkbox" name="recurring_social_enabled" value="1"${normalized.recurring_social_enabled === true ? " checked" : ""} />
          <span>Social Automation (Serie) — wöchentliche Auto-Vorbereitung ${RECURRING_SOCIAL_AUTO_PREP_HORIZON_DAYS} Tage voraus · Slots: −3 Tage 18:00, −1 Tag 18:00, −90 min</span>
        </label>
      </div>
    </fieldset>`;
}

function wireAdminEditorRecurringPanel(form) {
  if (!form) return;
  const toggle = form.querySelector("[data-editor-is-recurring]");
  const detail = form.querySelector("[data-editor-recurring-detail]");
  const typeSelect = form.querySelector("[data-editor-recurrence-type]");
  const weekly = form.querySelector("[data-editor-recurrence-weekly]");
  const monthly = form.querySelector("[data-editor-recurrence-monthly]");
  const syncVisibility = () => {
    const on = Boolean(toggle?.checked);
    detail?.toggleAttribute("hidden", !on);
    const t = normalizeAdminRecurrenceType(typeSelect?.value);
    weekly?.toggleAttribute("hidden", t !== "weekly");
    monthly?.toggleAttribute("hidden", t !== "monthly");
  };
  toggle?.addEventListener("change", syncVisibility);
  typeSelect?.addEventListener("change", syncVisibility);
  syncVisibility();
}

async function loadEvents() {
  const client = supabaseClient();
  const pageSize = 1000;
  let offset = 0;
  let rows = [];
  let totalCount = null;
  let lastError = null;

  while (true) {
    const query = client
      .from("events")
      .select("*", offset === 0 ? { count: "exact" } : undefined)
      .order("event_date", { ascending: true, nullsFirst: true })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
    if (error) {
      lastError = error;
      console.error("admin load events query error", {
        offset,
        pageSize,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        adminRole: sessionRole(state.adminSession)
      });
      break;
    }
    if (offset === 0 && typeof count === "number") totalCount = count;
    const chunk = data || [];
    rows = rows.concat(chunk);
    if (chunk.length < pageSize) break;
    offset += pageSize;
  }

  if (lastError && !rows.length) throw lastError;

  console.log("admin load events result", {
    count: rows.length,
    dbCount: totalCount,
    ids: rows.map((e) => e.id),
    statuses: rows.map((e) => e.status),
    adminRole: sessionRole(state.adminSession),
    truncated: typeof totalCount === "number" && totalCount > rows.length
  });

  if (typeof totalCount === "number" && totalCount > rows.length) {
    console.error("admin load events truncated by RLS or paging", {
      loaded: rows.length,
      dbCount: totalCount
    });
  }

  if (lastError && rows.length) {
    console.warn("admin load events partial after error", {
      loaded: rows.length,
      message: lastError.message
    });
  }

  state.allEvents = rows.map(normalizeEvent);
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
  console.log("admin geocode start", { eventId: eventData?.id, context: "event-card" });
  try {
    await updateEventLocationWithGeocoding(eventData);
    setCardGeoBusy(card, eventData.id, false);
    markGeoPulse(eventData.id);
    console.log("admin geocode success", { eventId: eventData?.id, context: "event-card" });
    setGlobalFeedback("Koordinaten aktualisiert.", "success");
    await refreshAdminData({ reloadEvents: true });
  } catch (error) {
    console.error("admin geocode error", error);
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
    const locationUpdates = pickAdminEventSavePayload({
      location_name: String(formData.get("location_name") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      postal_code: String(formData.get("postal_code") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      country: String(formData.get("country") || "").trim()
    });
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

  /* Geocode buttons: delegated from editor overlay via data-admin-action="editor-geocode" (keeps a single listener). */

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
    suggestionRoot.remove();
    ariaTargets.forEach((el) => el.removeAttribute("aria-controls"));
    if (editorPlacesHideSuggestionsFn === hideSuggestionsUi) editorPlacesHideSuggestionsFn = null;
  };

  editorLocationAutocompleteDispose = dispose;
}

function openEventEditorModal(eventData) {
  closeActiveAdminEditorIfAny();
  disposeEditorLocationAutocomplete();
  eventData = adminNormalizeRecurrenceState(eventData || {});
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
    const latN = parseCoordinate(eventData.lat ?? eventData.latitude);
    const lngN = parseCoordinate(eventData.lng ?? eventData.longitude);
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
          <p class="admin-editor-drawer__sub">${escapeHtml(
            (() => {
              const label = recurrenceLabel(eventData);
              const details = recurrenceDetails(eventData);
              return details ? `${label} · ${details}` : label;
            })()
          )}</p>
        </div>
        <button type="button" class="btn-pill btn-pill--soft" data-editor-close data-admin-action="editor-close">✕</button>
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
          <div class="admin-editor-span-2 admin-editor-translation-row">
            <button type="button" class="btn-pill btn-pill--soft" data-editor-regenerate-translations data-admin-action="editor-regenerate-translations">Übersetzungen neu erzeugen</button>
            <span class="card__intro">Übersetzt nur Beschreibung ES/DE/EN aus der Haupt-Beschreibung (Quellsprache → zwei Zielsprachen). Titel bleiben unverändert.</span>
          </div>
          ${renderAdminEditorRecurringFields(adminCoerceRecurrenceFields(eventData))}
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
            <button type="button" class="btn-pill btn-pill--soft" data-editor-geocode-search data-admin-action="editor-geocode">Adresse suchen</button>
            <button type="button" class="btn-pill btn-pill--soft" data-editor-geocode-manual data-admin-action="editor-geocode">📍 Adresse neu berechnen</button>
            <span class="card__intro admin-editor-places-hint" data-editor-places-hint hidden></span>
          </div>
          <p class="card__intro admin-editor-span-2" data-editor-coords-warning hidden role="status">Koordinaten ungültig oder fehlen</p>
          <div class="admin-editor-map-wrap admin-editor-span-2" data-editor-map-wrap>${mapEmbed}</div>
          <p class="card__intro admin-editor-span-2">Koordinaten: „Adresse suchen“ / „Adresse neu berechnen“ setzt den Marker neu. Speichern nutzt vorhandene gültige Koordinaten und blockiert nicht bei Geocoder-Ausfällen.</p>
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
            <button type="button" class="btn-pill btn-pill--soft" data-editor-regenerate-social data-admin-action="editor-regenerate-social">♻️ Drafts regenerieren</button>
            <button type="button" class="btn-pill btn-pill--hero" data-editor-prepare-recurring data-admin-action="editor-prepare-recurring"${isRecurringSocialMaster(adminCoerceRecurrenceFields(eventData)) ? "" : " hidden"}>Jetzt vorbereiten (${RECURRING_SOCIAL_AUTO_PREP_HORIZON_DAYS} Tage)</button>
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
          <button type="button" class="btn-pill btn-pill--outline btn-pill--danger-glow admin-editor-delete-event" data-editor-delete-event data-admin-action="editor-delete">🗑 Event löschen</button>
          <button type="button" class="btn-pill btn-pill--outline" data-editor-cancel data-admin-action="editor-cancel">Abbrechen</button>
          <button type="submit" class="btn-pill btn-pill--soft" data-editor-save>Speichern</button>
          <button type="submit" class="btn-pill btn-pill--hero" data-editor-save-social>Speichern + Social neu</button>
        </div>
      </form>
    </aside>
  `;

  const form = overlay.querySelector(".admin-editor-form");
  const status = overlay.querySelector("[data-editor-status]");
  const tabs = overlay.querySelectorAll("[data-editor-tab]");
  const panels = overlay.querySelectorAll("[data-editor-panel]");
  const prepareRecurringBtn = overlay.querySelector("[data-editor-prepare-recurring]");
  wireAdminEditorRecurringPanel(form);
  const syncPrepareRecurringBtn = () => {
    if (!prepareRecurringBtn || !form) return;
    let draft = eventData;
    try {
      draft = { ...eventData, ...eventEditPayloadFromForm(form), id: eventData.id };
    } catch {
      draft = eventData;
    }
    const show = isRecurringSocialMaster(adminCoerceRecurrenceFields(draft));
    prepareRecurringBtn.toggleAttribute("hidden", !show);
  };
  form?.querySelector("[data-editor-is-recurring]")?.addEventListener("change", syncPrepareRecurringBtn);
  form?.querySelector("[name='recurrence_type']")?.addEventListener("change", syncPrepareRecurringBtn);

  const editorAbort = new AbortController();
  const { signal } = editorAbort;

  document.body.appendChild(overlay);

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
    editorAbort.abort();
    state.adminEditorClose = null;
    disposeEditorLocationAutocomplete();
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
  };
  state.adminEditorClose = close;

  const onKeyDown = (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("is-busy")) close();
  };
  const setBusy = (busy, message = "") => {
    if (busy && typeof editorPlacesHideSuggestionsFn === "function") editorPlacesHideSuggestionsFn();
    overlay.classList.toggle("is-busy", busy);
    form?.querySelectorAll("input, textarea, button").forEach((control) => {
      if (control.hasAttribute("data-editor-close")) return;
      if (control.getAttribute("data-admin-action") === "editor-close") return;
      if (control.getAttribute("data-admin-action") === "editor-regenerate-translations") return;
      control.disabled = busy;
    });
    if (status) {
      status.hidden = !message;
      status.textContent = message;
    }
  };

  overlay.addEventListener(
    "click",
    async (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;

      const btn = t.closest("button[data-admin-action]");
      if (btn) {
        const action = btn.getAttribute("data-admin-action");
        console.log("admin action clicked", { action, context: "editor-drawer", eventId: eventData?.id });
        if (action === "editor-geocode") {
          e.preventDefault();
          if (overlay.classList.contains("is-busy")) return;
          try {
            await adminEditorGeocodeFromForm(form, eventData, [btn]);
          } catch (_err) {
            /* feedback + log inside geocode */
          }
          return;
        }
        if (action === "editor-close" || action === "editor-cancel") {
          e.preventDefault();
          if (!overlay.classList.contains("is-busy")) close();
          return;
        }
        if (action === "editor-regenerate-social") {
          e.preventDefault();
          let mergedForSocial = eventData;
          try {
            const rawPayload = eventEditPayloadFromForm(form);
            adminStripEmptyFormOverrides(rawPayload, eventData);
            mergedForSocial = adminCoerceEventForValidation({ ...eventData, ...rawPayload, id: eventData.id });
          } catch (_formErr) {
            mergedForSocial = adminCoerceEventForValidation(eventData);
          }
          if (blockAdminEventApprovalIfIncomplete(mergedForSocial, "editor-regenerate-social", null)) return;
          setBusy(true, "Social Drafts…");
          try {
            const n = await regenerateSocialDraftsForEvent(mergedForSocial);
            console.log("admin action editor-regenerate-social success", { n, eventId: eventData?.id });
            setGlobalFeedback(`Social Drafts neu (${n}).`, "success");
            close();
            await refreshAdminData({ reloadEvents: true });
          } catch (error) {
            console.error("admin action editor-regenerate-social error", error);
            setBusy(false, error.message || "Fehler");
            setGlobalFeedback(`Social: ${error.message}`, "error");
          }
          return;
        }
        if (action === "editor-regenerate-translations") {
          e.preventDefault();
          setBusy(true, "Übersetzungen…");
          try {
            let result = await regenerateAdminEventTranslations(eventData, form, { forceOverwrite: false });
            let mergedUpdates = { ...result.updates };
            if (result.needsConfirm.length) {
              const labels = result.needsConfirm.map((x) => x.label).join(", ");
              const ok = await showAdminConfirmModal(
                `Manuell bearbeitete Übersetzungen überschreiben? (${labels})`,
                { confirmLabel: "Überschreiben", danger: false }
              );
              if (ok) {
                const forced = await regenerateAdminEventTranslations(eventData, form, { forceOverwrite: true });
                mergedUpdates = { ...mergedUpdates, ...forced.updates };
                result = {
                  ...forced,
                  failedFields: [...new Set([...result.failedFields, ...forced.failedFields])],
                  skippedManual: []
                };
              }
            }
            setBusy(false, "");
            syncAdminTranslationUpdatesToEditor(form, overlay, mergedUpdates, eventData);
            const updatedCount = Object.keys(mergedUpdates).length;
            if (result.failedFields.length) {
              if (result.failedFields.length === 1 && result.failedFields[0] === "Beschreibung ES") {
                setGlobalFeedback("Spanische Übersetzung konnte nicht erzeugt werden.", "error");
              } else {
                setGlobalFeedback(
                  `Übersetzung teilweise fehlgeschlagen (${result.failedFields.join(", ")}). Betroffene Felder wurden geleert.`,
                  "error"
                );
              }
            } else if (updatedCount) {
              const skippedNote =
                result.skippedManual.length > 0
                  ? ` (${result.skippedManual.join(", ")} unverändert gelassen.)`
                  : "";
              setGlobalFeedback(`${updatedCount} Beschreibungsfeld(er) aktualisiert.${skippedNote}`, "success");
            } else {
              setGlobalFeedback(
                result.skippedManual.length
                  ? "Alle Beschreibungsfelder wirken manuell bearbeitet — nichts geändert."
                  : "Keine leeren oder falsch erkannten Felder zum Aktualisieren.",
                "info"
              );
            }
          } catch (error) {
            console.error("admin action editor-regenerate-translations error", error);
            setBusy(false, error.message || "Fehler");
            setGlobalFeedback(error.message || "Übersetzungen fehlgeschlagen.", "error");
          }
          return;
        }
        if (action === "editor-prepare-recurring") {
          e.preventDefault();
          let merged = eventData;
          try {
            const rawPayload = eventEditPayloadFromForm(form);
            merged = { ...eventData, ...rawPayload, id: eventData.id };
          } catch (formErr) {
            setBusy(false, formErr.message || "Formular ungültig");
            setGlobalFeedback(formErr.message || "Formular ungültig", "error");
            return;
          }
          if (!isRecurringSocialMaster(adminCoerceRecurrenceFields(merged))) {
            setGlobalFeedback("Bitte „Wiederkehrendes Event“ und Rhythmus aktivieren.", "error");
            return;
          }
          setBusy(true, "Termine vorbereiten…");
          try {
            const res = await prepareNextRecurringOccurrences(merged);
            setGlobalFeedback(
              `Vorbereitet: ${res.occurrences} Termine · ${res.draftsInserted} neue Posts · ${res.childrenCreated} neue Events.`,
              "success"
            );
            close();
            await refreshAdminData({ reloadEvents: true, reloadSocial: true });
          } catch (error) {
            console.error("admin action editor-prepare-recurring error", error);
            setBusy(false, error.message || "Fehler");
            setGlobalFeedback(error.message || "Vorbereitung fehlgeschlagen", "error");
          }
          return;
        }
        if (action === "editor-delete") {
          e.preventDefault();
          const eventId = eventData?.id;
          if (!eventId) return;
          if (!window.confirm("Dieses Event wirklich dauerhaft löschen?")) return;
          setBusy(true, "Lösche Event...");
          setGlobalFeedback("");
          try {
            await adminPerformEventDelete(eventId, eventData, { closeEditor: close });
          } catch (error) {
            console.error("admin delete failed", { eventId, context: "editor-delete", message: error?.message }, error);
            setBusy(false, error.message || "Löschen fehlgeschlagen.");
            setGlobalFeedback(`Löschen fehlgeschlagen: ${error.message || ""}`.trim(), "error");
          }
          return;
        }
      }

      if (e.target === overlay && !overlay.classList.contains("is-busy")) close();
    },
    { signal }
  );

  form?.addEventListener(
    "submit",
    async (submitEvent) => {
      submitEvent.preventDefault();
      const regenerateSocial = Boolean(submitEvent.submitter?.hasAttribute("data-editor-save-social"));
      try {
        setBusy(true, "Speichern…");
        const saveResult = await adminEditorSaveEventPayload(form, eventData, { regenerateSocial });
        if (saveResult.socialOk === false) {
          const se = saveResult.socialError && typeof saveResult.socialError === "object" ? saveResult.socialError : {};
          console.error("admin save error", { phase: "social", eventId: eventData?.id, message: se.message }, saveResult.socialError);
          setGlobalFeedback(
            `Event gespeichert. Social-Update fehlgeschlagen: ${saveResult.socialError?.message || ""}`.trim(),
            "error"
          );
        } else if (regenerateSocial) {
          setGlobalFeedback("Event gespeichert · Social Queue aktualisiert.", "success");
        } else {
          setGlobalFeedback("Event gespeichert", "success");
        }
        close();
        await refreshAdminData({ reloadEvents: true });
      } catch (error) {
        const raw = error && typeof error === "object" ? error : {};
        console.error(
          "admin save error",
          {
            eventId: eventData?.id,
            code: raw.code,
            message: raw.message,
            details: raw.details,
            hint: raw.hint
          },
          error
        );
        setBusy(false, error.message || "Speichern fehlgeschlagen.");
        setGlobalFeedback(`Speichern fehlgeschlagen: ${error.message || ""}`.trim(), "error");
      }
    },
    { signal }
  );

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

/**
 * Manual smoke checklist (Admin UI):
 * - Save: open editor, change time only, Speichern → "Event gespeichert"
 * - Save Ort: valid coords + address tweak → no geocode error; use "Adresse neu berechnen" for forced geocode
 * - Save + Social: Speichern + Social neu → combined success; if social fails after save → warning toast, event persisted
 * - Reuse Archiv: Erneut verwenden → pending copy, editor opens
 * - Delete: test event, confirm → removed
 * - Feature: ⭐ Feature on card → persists
 * - Status: Pending / Freigeben / Ablehnen + optional Notizen
 */
async function handleCardAction(clickEvent) {
  const button = clickEvent.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  const action = button.dataset.action || "";

  if (action === "replace-image") {
    console.log("admin action clicked", { action, context: "event-grid" });
    const card = button.closest(".event-card");
    const input = card?.querySelector("input[data-admin-replace-input]");
    if (input && !button.disabled) input.click();
    return;
  }
  const card = button.closest(".event-card");
  if (!card) return;
  const eventData = findEventByCard(card);
  if (!eventData) return;
  if (!acquireAdminEventLock(eventData.id)) return;

  console.log("admin action clicked", { action, context: "event-grid", eventId: eventData?.id });

  try {
    if (action === "regeocode") {
      await handleRegeocodeEvent(eventData, card, button);
      return;
    }

    if (action === "edit-location") {
      openAdminLocationModal(eventData);
      return;
    }

    if (action === "edit-event") {
      openEventEditorModal(eventData);
      return;
    }

    if (action === "regenerate-drafts") {
      if (blockAdminEventApprovalIfIncomplete(adminCoerceEventForValidation(eventData), "regenerate-drafts")) return;
      setGlobalFeedback("");
      await withAdminButtonBusy(button, "Social…", async () => {
        console.log("admin action regenerate-drafts start", { eventId: eventData?.id });
        const n = await regenerateSocialDraftsForEvent(eventData);
        console.log("admin action regenerate-drafts success", { eventId: eventData?.id, n });
        setGlobalFeedback(`Social Drafts neu erstellt (${n}).`, "success");
        await refreshAdminData({ reloadSocial: true });
      });
      return;
    }

    if (action === "toggle-featured") {
      const nextFeatured = !eventData.featured;
      const prev = patchAdminEventInState(eventData.id, { featured: nextFeatured });
      render();
      setGlobalFeedback("");
      await withAdminButtonBusy(button, "…", async () => {
        try {
          await updateEventWithFallback(eventData.id, { featured: nextFeatured });
          setGlobalFeedback("Featured aktualisiert.", "success");
          render();
        } catch (error) {
          if (prev) patchAdminEventInState(eventData.id, prev);
          render();
          const raw = error && typeof error === "object" ? error : {};
          console.error("admin action toggle-featured error", { eventId: eventData?.id, ...raw }, error);
          setGlobalFeedback(error.message || "Update fehlgeschlagen", "error");
        }
      });
      return;
    }

    if (action === "delete-event" || action === "delete-defective-event") {
      const eventId = eventData?.id;
      if (!eventId || !isSessionAdmin(state.adminSession)) return;
      const confirmMsg =
        action === "delete-defective-event"
          ? "Defektes Event dauerhaft löschen?"
          : "Dieses Event wirklich dauerhaft löschen?";
      if (!window.confirm(confirmMsg)) return;
      setGlobalFeedback("");
      try {
        await adminPerformEventDelete(eventId, eventData, { busyButton: button });
      } catch (error) {
        console.error("admin delete failed", { eventId, action, message: error?.message }, error);
        setGlobalFeedback(`Löschen fehlgeschlagen: ${error.message || ""}`.trim(), "error");
      }
      return;
    }

    if (action === "move-to-archive") {
      setGlobalFeedback("");
      await withAdminButtonBusy(button, "Archiv…", async () => {
        try {
          await adminMoveEventToArchive(eventData);
        } catch (error) {
          console.error("admin action move-to-archive error", { eventId: eventData?.id }, error);
          setGlobalFeedback(`Archivieren fehlgeschlagen: ${error.message || ""}`.trim(), "error");
        }
      });
      return;
    }

    if (action === "repair-recurrence") {
      setGlobalFeedback("");
      await withAdminButtonBusy(button, "Repariere…", async () => {
        try {
          await adminRepairRecurrenceAndSave(eventData);
        } catch (error) {
          console.error("admin action repair-recurrence error", { eventId: eventData?.id }, error);
          setGlobalFeedback(`Reparatur fehlgeschlagen: ${error.message || ""}`.trim(), "error");
        }
      });
      return;
    }

    if (action === "repair-weekly") {
      if (!canShowAdminWeeklyRepairButton(eventData)) {
        setGlobalFeedback("Wöchentliche Reparatur für dieses Event nicht möglich.", "error");
        return;
      }
      setGlobalFeedback("");
      await withAdminButtonBusy(button, "Repariere…", async () => {
        try {
          await adminRepairWeeklyAndSave(eventData);
        } catch (error) {
          console.error("admin action repair-weekly error", { eventId: eventData?.id }, error);
          setGlobalFeedback(`Reparatur fehlgeschlagen: ${error.message || ""}`.trim(), "error");
        }
      });
      return;
    }

    if (action === "reuse-event") {
      if (!isSessionAdmin(state.adminSession)) return;
      const sourceId = eventData?.id;
      if (!sourceId) {
        setGlobalFeedback("Duplikat: Event-ID fehlt.", "error");
        return;
      }
      setGlobalFeedback("");
      await withAdminButtonBusy(button, "Kopiere…", async () => {
        console.log("admin reuse start", { sourceId });
        try {
          const newId = await duplicateEventForReuse(eventData);
          console.log("admin reuse success", { sourceId, newId });
          setGlobalFeedback("Event als Entwurf kopiert", "success");
          await refreshAdminData({ reloadEvents: true });
          const fresh = state.allEvents.find((e) => String(e.id) === String(newId));
          if (fresh) openEventEditorModal(fresh);
        } catch (error) {
          const raw = error && typeof error === "object" ? error : {};
          console.error("admin reuse error", {
            code: raw.code,
            message: raw.message,
            details: raw.details,
            hint: raw.hint
          }, error);
          setGlobalFeedback(`Duplikat fehlgeschlagen: ${raw.message || error?.message || ""}`.trim(), "error");
        }
      });
      return;
    }

    if (!ADMIN_CARD_STATUS_ACTIONS.has(action)) return;

    const notes = card.querySelector("textarea[data-notes]")?.value.trim() || "";
    const featuredInput = card.querySelector("input[data-featured]");
    const promotedInput = card.querySelector("input[data-promoted]");
    const featuredVal = state.featureColumns.featured && featuredInput ? Boolean(featuredInput.checked) : eventData.featured;
    const promotedVal = state.featureColumns.promoted && promotedInput ? Boolean(promotedInput.checked) : eventData.promoted;

    if (action === "approved") {
      const mergedForApproval = adminCoerceEventForValidation({
        ...eventData,
        verification_notes: notes,
        featured: featuredVal,
        promoted: promotedVal
      });
      if (blockAdminEventApprovalIfIncomplete(mergedForApproval, "freigeben")) return;
    }

    const optimisticPatch =
      action === "save-notes"
        ? { verification_notes: notes, featured: featuredVal, promoted: promotedVal }
        : { status: action, verification_notes: notes, featured: featuredVal, promoted: promotedVal };
    const prevSnapshot = patchAdminEventInState(eventData.id, optimisticPatch);
    render();
    setGlobalFeedback("");

    await withAdminButtonBusy(button, "Speichern…", async () => {
      try {
        if (action === "save-notes") {
          await updateEventWithFallback(eventData.id, {
            verification_notes: notes,
            ...(state.featureColumns.featured ? { featured: featuredVal } : {}),
            ...(state.featureColumns.promoted ? { promoted: promotedVal } : {})
          });
          patchAdminEventInState(eventData.id, { verification_notes: notes, featured: featuredVal, promoted: promotedVal });
          setGlobalFeedback("Notizen gespeichert.", "success");
        } else {
          if (action === "approved") {
            const mergedForApproval = adminCoerceEventForValidation({
              ...eventData,
              verification_notes: notes,
              featured: featuredVal,
              promoted: promotedVal
            });
            if (isAdminEventIncompleteForApproval(mergedForApproval)) {
              throw new Error(reportAdminEventValidationFailure(mergedForApproval, "freigeben-persist"));
            }
          }
          const updatedRow = await updateEventWithFallback(eventData.id, {
            status: action,
            verification_notes: notes,
            ...(state.featureColumns.featured ? { featured: featuredVal } : {}),
            ...(state.featureColumns.promoted ? { promoted: promotedVal } : {})
          });
          const persistedStatus = String(updatedRow?.status || action);
          patchAdminEventInState(eventData.id, {
            status: persistedStatus,
            verification_notes: notes,
            featured: featuredVal,
            promoted: promotedVal
          });
          let socialCreated = 0;
          if (persistedStatus === "approved") {
            socialCreated = await ensureSocialReviewQueueForEvent({
              ...eventData,
              status: persistedStatus,
              verification_notes: notes,
              featured: featuredVal,
              promoted: promotedVal
            });
          }
          const socialSuffix = socialCreated ? ` · ${socialCreated} Social-Drafts geplant` : "";
          setGlobalFeedback(`${adminStatusSuccessMessage(persistedStatus)}${socialSuffix}`, "success");
          if (socialCreated) await loadSocialQueueRows();
        }
        render();
      } catch (error) {
        if (prevSnapshot) patchAdminEventInState(eventData.id, prevSnapshot);
        render();
        const raw = error && typeof error === "object" ? error : {};
        console.error("admin action card-batch error", { action, eventId: eventData?.id, ...raw }, error);
        setGlobalFeedback(`Aktion fehlgeschlagen: ${error.message || ""}`.trim(), "error");
      }
    });
  } finally {
    releaseAdminEventLock(eventData.id);
  }
}

function bindEvents() {
  dom.statusTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeTab = tab.dataset.statusFilter || "all";
      render();
    });
  });

  dom.archiveTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.archiveTimeline = tab.dataset.archiveFilter || "all";
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
    const rangeBtn = ev.target.closest("[data-analytics-range]");
    if (rangeBtn && dom.viewAnalytics?.contains(rangeBtn)) {
      const next = rangeBtn.dataset.analyticsRange || "7d";
      if (next !== state.analyticsTimeRange) {
        state.analyticsTimeRange = next;
        renderAdminAnalyticsPanelFromCache();
      }
      return;
    }
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

  dom.socialDeleteInvalidButton?.addEventListener("click", async () => {
    const btn = dom.socialDeleteInvalidButton;
    if (!btn || btn.disabled) return;
    if (!window.confirm("Alle ungültigen Social-Drafts (pending/failed ohne Titel/Bild) löschen?")) return;
    btn.disabled = true;
    setGlobalFeedback("");
    try {
      const n = await deleteInvalidSocialDrafts();
      setGlobalFeedback(n ? `${n} ungültige Draft(s) gelöscht.` : "Keine ungültigen Drafts gefunden.", "success");
      await refreshAdminData({ reloadSocial: true });
    } catch (error) {
      console.error("admin delete invalid social drafts error", error);
      setGlobalFeedback(`Löschen fehlgeschlagen: ${error.message || ""}`.trim(), "error");
    } finally {
      btn.disabled = false;
    }
  });

  const openAdminEventFromSocialQueue = (eventId, eventData) => {
    if (!eventId || !eventData) return;
    state.navSection = "events";
    state.search = eventData.name || "";
    if (dom.searchInput) dom.searchInput.value = state.search;
    render();
    window.requestAnimationFrame(() => {
      const escapedEventId = window.CSS?.escape ? window.CSS.escape(String(eventId)) : String(eventId).replace(/"/g, '\\"');
      document.querySelector(`.event-card[data-event-id="${escapedEventId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    setGlobalFeedback("Event in der Liste.", "success");
  };

  const applySocialQueueAdvancedFiltersFromDom = () => {
    state.socialQueueFilterPlatform = dom.socialQueueFilterPlatform?.value || "";
    state.socialQueueFilterEventId = dom.socialQueueFilterEvent?.value || "";
    state.socialQueueFilterRecurringOnly = Boolean(dom.socialQueueFilterRecurring?.checked);
    state.socialQueueFilterDateFrom = dom.socialQueueFilterDateFrom?.value || "";
    state.socialQueueFilterDateTo = dom.socialQueueFilterDateTo?.value || "";
    renderSocialQueuePanel();
  };

  dom.socialQueueFilterPlatform?.addEventListener("change", applySocialQueueAdvancedFiltersFromDom);
  dom.socialQueueFilterEvent?.addEventListener("change", applySocialQueueAdvancedFiltersFromDom);
  dom.socialQueueFilterRecurring?.addEventListener("change", applySocialQueueAdvancedFiltersFromDom);
  dom.socialQueueFilterDateFrom?.addEventListener("change", applySocialQueueAdvancedFiltersFromDom);
  dom.socialQueueFilterDateTo?.addEventListener("change", applySocialQueueAdvancedFiltersFromDom);

  dom.socialQueuePanel?.addEventListener("input", (event) => {
    const editor = event.target.closest("[data-sq-editor]");
    if (!editor) return;
    if (event.target.matches('[name="scheduled_at"]')) {
      warnIfInvalidSocialQueueDatetimeInput(event.target, "input");
      const queueId = editor.dataset.queueId || editor.closest("[data-queue-id]")?.dataset?.queueId;
      const row = findSocialQueueRow(queueId);
      const raw = String(event.target.value ?? "").trim();
      if (!isDatetimeLocalInputValue(raw)) {
        setSocialQueueScheduledAtInputValue(event.target, row?.scheduled_at);
      }
    }
    if (event.target.matches("[data-autosize-caption]")) autosizeSocialCaptionTextarea(event.target);
    updateSocialCaptionEditorUi(editor);
  });

  dom.socialQueuePanel?.addEventListener("change", (event) => {
    const editor = event.target.closest("[data-sq-editor]");
    if (!editor) return;
    if (event.target.matches('[name="scheduled_at"]')) {
      warnIfInvalidSocialQueueDatetimeInput(event.target, "change");
    }
    if (event.target.matches('[name="style_mode"], [name="platform"]')) {
      console.log("style mode", { style_mode: editor.querySelector('[name="style_mode"]')?.value });
      updateSocialCaptionEditorUi(editor, { dirty: true });
    }
  });

  dom.socialQueuePanel?.addEventListener("click", async (event) => {
    const captionBtn = event.target.closest("[data-caption-action]");
    if (captionBtn) {
      const { editorEl, queueId, row } = resolveSocialQueueActionContext(captionBtn);
      if (!editorEl || !queueId || !row) return;
      const action = captionBtn.dataset.captionAction || "";
      captionBtn.disabled = true;
      try {
        if (action === "save") {
          setGlobalFeedback("Speichere Draft…", "info");
          await handleSocialQueueSaveDraftClick(captionBtn);
          renderSocialQueuePanel();
          requestAnimationFrame(() => {
            const card = dom.socialQueuePanel?.querySelector(
              `.admin-sq-card[data-queue-id="${CSS.escape(String(queueId))}"]`
            );
            const editor = card?.querySelector("[data-sq-editor]");
            const savedRow = findSocialQueueRow(queueId);
            if (editor && savedRow) {
              initSocialCaptionEditor(editor, savedRow);
              showSocialQueueSaveSuccess(editor);
            }
          });
        } else {
          applyCaptionStudioTransform(editorEl, action, row);
        }
      } catch (error) {
        const msg = showSocialQueueSaveError(editorEl, error);
        setGlobalFeedback(msg, "error");
      } finally {
        captionBtn.disabled = false;
      }
      return;
    }

    const saveDraftBtn = event.target.closest('button[data-queue-action="save-draft"]');
    if (saveDraftBtn) {
      if (saveDraftBtn.disabled) return;
      const saveCtx = resolveSocialQueueActionContext(saveDraftBtn);
      const queueIdEarly = saveCtx.queueId;
      console.log("admin action clicked", {
        action: "save-draft",
        context: "social-queue",
        queueId: queueIdEarly,
        eventId: saveCtx.eventId ?? null
      });
      saveDraftBtn.disabled = true;
      const editorForSave = saveCtx.editorEl || resolveSocialQueueEditorEl(saveDraftBtn, queueIdEarly);
      try {
        setGlobalFeedback("Speichere Draft…", "info");
        await handleSocialQueueSaveDraftClick(saveDraftBtn);
        renderSocialQueuePanel();
        requestAnimationFrame(() => {
          if (!queueIdEarly) return;
          const card = dom.socialQueuePanel?.querySelector(
            `.admin-sq-card[data-queue-id="${CSS.escape(String(queueIdEarly))}"]`
          );
          const editor = card?.querySelector("[data-sq-editor]") || editorForSave;
          const savedRow = findSocialQueueRow(queueIdEarly);
          if (editor && savedRow) {
            initSocialCaptionEditor(editor, savedRow);
            showSocialQueueSaveSuccess(editor);
          }
        });
      } catch (error) {
        console.error("admin action social-queue save-draft error", { queueId: queueIdEarly }, error);
        const msg = showSocialQueueSaveError(editorForSave, error);
        setGlobalFeedback(msg, "error");
      } finally {
        saveDraftBtn.disabled = false;
      }
      return;
    }

    const sendToPostizBtn = event.target.closest('button[data-queue-action="send-to-postiz"]');
    if (sendToPostizBtn) {
      if (sendToPostizBtn.disabled) return;
      const postizCtx = resolveSocialQueueActionContext(sendToPostizBtn);
      const queueIdPostiz = postizCtx.queueId;
      console.log("admin action clicked", {
        action: "send-to-postiz",
        context: "social-queue",
        queueId: queueIdPostiz,
        eventId: postizCtx.eventId ?? null,
        scheduled_at: postizCtx.row?.scheduled_at ?? null,
        platform: postizCtx.row?.platform ?? null,
        status: postizCtx.row?.status ?? null
      });
      const editorForPostiz = postizCtx.editorEl || resolveSocialQueueEditorEl(sendToPostizBtn, queueIdPostiz);
      try {
        state.socialQueuePostizSendingId = queueIdPostiz;
        renderSocialQueuePanel();
        setGlobalFeedback("Sende an Postiz…", "info");
        const savedRow = await confirmSocialQueueDraftForPostiz(queueIdPostiz, editorForPostiz, sendToPostizBtn);
        renderSocialQueuePanel();
        requestAnimationFrame(() => {
          if (!queueIdPostiz) return;
          const card = dom.socialQueuePanel?.querySelector(
            `.admin-sq-card[data-queue-id="${CSS.escape(String(queueIdPostiz))}"]`
          );
          const editor = card?.querySelector("[data-sq-editor]") || editorForPostiz;
          const row = findSocialQueueRow(queueIdPostiz) || savedRow;
          if (editor && row) {
            initSocialCaptionEditor(editor, row);
            showSocialQueuePostizHandoffSuccess(editor, row);
          } else {
            showSocialQueuePostizHandoffSuccess(null, row);
          }
        });
      } catch (error) {
        console.error("admin action social-queue send-to-postiz error", { queueId: queueIdPostiz }, error);
        const msg = showSocialQueueSaveError(editorForPostiz, error);
        setGlobalFeedback(msg, "error");
        renderSocialQueuePanel();
      } finally {
        state.socialQueuePostizSendingId = null;
      }
      return;
    }

    const statusChip = event.target.closest("[data-sq-status]");
    if (statusChip) {
      const queueId = resolveSocialQueueActionContext(statusChip).queueId;
      const status = statusChip.getAttribute("data-sq-status");
      if (!queueId || !status) return;
      setGlobalFeedback("Status wird aktualisiert…", "info");
      try {
        await updateSocialQueueDraftStatus(queueId, status);
        setGlobalFeedback(`Status: ${status}`, "success");
        renderSocialQueuePanel();
      } catch (error) {
        setGlobalFeedback(`Status: ${error.message || ""}`.trim(), "error");
      }
      return;
    }

    const button = event.target.closest("button[data-queue-action]");
    if (!button || button.disabled) return;
    const { editorEl, queueId, row, eventId, eventData } = resolveSocialQueueActionContext(button);
    const queueAction = readSocialQueueActionName(button);

    if (queueAction === "toggle-expand") {
      const willExpand = String(state.socialQueueExpandedId) !== String(queueId);
      state.socialQueueExpandedId = willExpand ? queueId : null;
      renderSocialQueuePanel();
      if (willExpand && queueId) {
        requestAnimationFrame(() => {
          const card = dom.socialQueuePanel?.querySelector(`[data-queue-id="${CSS.escape(String(queueId))}"]`);
          const editor = card?.querySelector("[data-sq-editor]");
          const expandedRow = findSocialQueueRow(queueId);
          if (editor && expandedRow) initSocialCaptionEditor(editor, expandedRow);
        });
      }
      return;
    }

    console.log("admin action clicked", {
      action: queueAction,
      context: "social-queue",
      queueId,
      eventId: eventId ?? null,
      scheduled_at: row?.scheduled_at ?? null,
      platform: row?.platform ?? null,
      status: row?.status ?? null
    });

    button.disabled = true;
    try {
      if (queueAction === "repair-title" && queueId) {
        setGlobalFeedback("Titel wird repariert…", "info");
        const title = await repairSocialQueueTitle(queueId);
        setGlobalFeedback(`Titel gespeichert: ${title}`, "success");
        renderSocialQueuePanel();
      } else if (queueAction === "open-event") {
        if (!eventData) {
          setGlobalFeedback("Kein verknüpftes Event für diesen Draft.", "error");
        } else {
          openAdminEventFromSocialQueue(eventId, eventData);
        }
      } else if (queueAction === "duplicate-draft" && row) {
        setGlobalFeedback("Dupliziere…", "info");
        const n = await duplicateSocialQueueDraft(row, editorEl);
        setGlobalFeedback(`Draft dupliziert (${n}).`, "success");
        await refreshAdminData({ reloadSocial: true });
      } else if (queueAction === "preview-image" || queueAction === "open-image") {
        const imageUrl = row?.image_url || row?.resolved_image_url || eventData?.image_url;
        if (imageUrl) {
          showAdminImageLightbox(imageUrl, resolveSocialQueueDisplayTitle(row || {}));
        } else {
          setGlobalFeedback("Kein Bild verfügbar.", "error");
        }
      } else if (queueAction === "copy-caption") {
        const extras = readSocialQueueExtras(row || {});
        const text = socialQueueFullCaption(row || {}, extras);
        if (!text) {
          setGlobalFeedback("Keine Caption vorhanden.", "error");
        } else if (!navigator.clipboard?.writeText) {
          setGlobalFeedback("Zwischenablage nicht verfügbar.", "error");
        } else {
          await navigator.clipboard.writeText(text);
          setGlobalFeedback("Caption kopiert.", "success");
        }
      } else if (queueAction === "retry") {
        await retrySocialQueueRow(queueId);
        setGlobalFeedback("Retry geplant.", "success");
        await refreshAdminData({ reloadSocial: true });
      } else if (queueAction === "delete") {
        const ok = await showAdminConfirmModal("Diesen Social-Draft wirklich löschen?");
        if (!ok) return;
        await deleteSocialQueueRow(queueId);
        if (String(state.socialQueueExpandedId) === String(queueId)) state.socialQueueExpandedId = null;
        setGlobalFeedback("Eintrag gelöscht.", "success");
        await refreshAdminData({ reloadSocial: true });
      } else if (queueAction === "regenerate" && eventData) {
        const ok = await showAdminConfirmModal("Alle pending/failed Drafts dieses Events ersetzen?");
        if (!ok) return;
        const count = await regenerateSocialDraftsForEvent(eventData);
        setGlobalFeedback(`Drafts neu (${count}).`, "success");
        await refreshAdminData({ reloadSocial: true });
      }
    } catch (error) {
      console.error("admin action social-queue error", { queueAction, queueId, eventId: eventId ?? null }, error);
      const msg = showSocialQueueSaveError(editorEl, error);
      setGlobalFeedback(msg, "error");
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
    const featuredInput = changeEvent.target.closest("input[data-featured]");
    const promotedInput = changeEvent.target.closest("input[data-promoted]");
    if (featuredInput || promotedInput) {
      const card = changeEvent.target.closest(".event-card");
      const eventData = findEventByCard(card);
      if (!eventData || !acquireAdminEventLock(eventData.id)) {
        if (featuredInput) featuredInput.checked = Boolean(eventData?.featured);
        if (promotedInput) promotedInput.checked = Boolean(eventData?.promoted);
        return;
      }
      const payload = {};
      if (featuredInput && state.featureColumns.featured) payload.featured = Boolean(featuredInput.checked);
      if (promotedInput && state.featureColumns.promoted) payload.promoted = Boolean(promotedInput.checked);
      if (!Object.keys(payload).length) {
        releaseAdminEventLock(eventData.id);
        return;
      }
      console.log("admin action clicked", {
        action: featuredInput ? "featured-toggle" : "promoted-toggle",
        context: "event-grid-checkbox",
        eventId: eventData.id,
        payload
      });
      const prev = patchAdminEventInState(eventData.id, payload);
      render();
      setGlobalFeedback("");
      try {
        await updateEventWithFallback(eventData.id, payload);
        setGlobalFeedback(
          payload.featured !== undefined ? "Featured gespeichert." : "Promoted gespeichert.",
          "success"
        );
        render();
      } catch (error) {
        if (prev) patchAdminEventInState(eventData.id, prev);
        render();
        console.error("admin action checkbox error", { eventId: eventData.id, payload }, error);
        setGlobalFeedback(`Speichern fehlgeschlagen: ${error.message || ""}`.trim(), "error");
      } finally {
        releaseAdminEventLock(eventData.id);
      }
      return;
    }

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
      await refreshAdminData({ reloadEvents: true });
    } catch (error) {
      console.error("admin action replace-image error", error);
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
  if (typeof window !== "undefined") {
    window.__ADMIN_EVENTS__ = () => state.allEvents;
    window.__ADMIN_STATE__ = state;
    window.adminState = state;
    window.applyFilters = applyFilters;
  }
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
