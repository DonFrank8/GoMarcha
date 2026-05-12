const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
const ADMIN_REQUIRED_ROLE = "admin";
const ADMIN_ALLOWED_EMAILS = [];
const ADMIN_DASHBOARD_BUILD = "2026.04.08-admin-2";

const EVENT_IMAGES_BUCKET = "event-images";
const ADMIN_REPLACE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const ADMIN_REPLACE_ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);
const CROP_EXPORT_MAX_WIDTH = 1600;
const CROP_EXPORT_QUALITY = 0.82;
const CROP_PREVIEW_BASE_W = 360;

const VALID_STATUS = new Set(["pending", "approved", "rejected"]);

const state = {
  allEvents: [],
  filteredEvents: [],
  activeTab: "all",
  search: "",
  city: "",
  genre: "",
  statusFilter: "",
  adminSession: null,
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
  tabs: [...document.querySelectorAll(".status-tab")],
  countAll: document.getElementById("countAll"),
  countPending: document.getElementById("countPending"),
  countApproved: document.getElementById("countApproved"),
  countRejected: document.getElementById("countRejected"),
  searchInput: document.getElementById("filterSearch"),
  cityFilter: document.getElementById("filterCity"),
  genreFilter: document.getElementById("filterGenre"),
  statusFilter: document.getElementById("filterStatus"),
  resetFiltersButton: document.getElementById("resetFiltersButton"),
  eventGrid: document.getElementById("adminEventGrid"),
  emptyState: document.getElementById("adminEmptyState")
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
    location_name: event.location_name || "",
    address: event.address || "",
    city: event.city || "",
    country: event.country || "",
    event_date: event.event_date || "",
    event_time: event.event_time || "",
    genre: event.genre || "",
    price_text: event.price_text || "",
    description: event.description || "",
    submitted_by: event.submitted_by || "",
    contact_email: event.contact_email || "",
    status: VALID_STATUS.has(status) ? status : "pending",
    verification_notes: event.verification_notes || "",
    image_url: resolvePrimaryImageUrl(event),
    image_urls: event.image_urls ?? null,
    lat: Number.isFinite(event.lat) ? event.lat : null,
    lng: Number.isFinite(event.lng) ? event.lng : null,
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
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

function updateCounts() {
  if (dom.countAll) dom.countAll.textContent = String(state.allEvents.length);
  if (dom.countPending) dom.countPending.textContent = String(state.allEvents.filter((event) => event.status === "pending").length);
  if (dom.countApproved) dom.countApproved.textContent = String(state.allEvents.filter((event) => event.status === "approved").length);
  if (dom.countRejected) dom.countRejected.textContent = String(state.allEvents.filter((event) => event.status === "rejected").length);
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

function renderTabs() {
  dom.tabs.forEach((tab) => {
    const isActive = tab.dataset.statusFilter === state.activeTab;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function renderEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card";
  card.dataset.eventId = String(event.id);
  const previewGenre = escapeHtml(String(event.genre || "Event").split(",")[0].trim() || "Event");
  const previewTitle = escapeHtml(event.name || "Untitled Event");
  const previewMeta = escapeHtml([event.location_name, event.city].filter(Boolean).join(" · ") || "-");
  const thumbSrc = String(event.image_url || "").trim();
  const imgTag = thumbSrc
    ? `<img class="event-card__image" data-event-preview-img src="${escapeHtml(thumbSrc)}" alt="${previewTitle}" loading="lazy" decoding="async" />`
    : `<img class="event-card__image" data-event-preview-img hidden alt="${previewTitle}" loading="lazy" decoding="async" />`;
  const previewMarkup = `
    <figure class="event-card__preview${thumbSrc ? "" : " event-card__preview--empty"}">
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
          <button type="button" class="button-secondary event-card__replace-btn" data-action="replace-image">Bild ersetzen</button>
          <input type="file" class="event-card__replace-input" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" data-admin-replace-input tabindex="-1" aria-hidden="true" />
        </div>`
      : "";
  card.innerHTML = `
    <div class="event-card__layout">
      <div class="event-card__media-column">
        ${previewMarkup}
        ${replaceBlock}
      </div>
      <div class="event-card__content-column">
        <header class="event-card__head">
          <div>
            <h3>${escapeHtml(event.name)}</h3>
            <p class="muted">${escapeHtml(eventPlace(event))}</p>
          </div>
          <span class="${statusPillClass(event.status)}">${escapeHtml(statusLabel(event.status))}</span>
        </header>

        <ul class="event-meta">
          <li><strong>Datum:</strong> ${escapeHtml(formatDateTime(event))}</li>
          <li><strong>Wiederholung:</strong> ${escapeHtml(recurrenceLabel(event))}</li>
          <li><strong>Regel:</strong> ${escapeHtml(recurrenceDetails(event))}</li>
          <li><strong>Genre:</strong> ${escapeHtml(event.genre || "-")}</li>
          <li><strong>Preis:</strong> ${escapeHtml(event.price_text || "-")}</li>
          <li><strong>Eingereicht von:</strong> ${escapeHtml(event.submitted_by || "-")}</li>
          <li><strong>Kontakt:</strong> ${escapeHtml(event.contact_email || "-")}</li>
          <li><strong>Koordinaten:</strong> ${
    event.lat !== null && event.lng !== null
      ? `${escapeHtml(String(event.lat))}, ${escapeHtml(String(event.lng))}`
      : "-"
  }</li>
        </ul>
      </div>
    </div>
    <p class="event-description">${escapeHtml(event.description || "Keine Beschreibung")}</p>

    <label class="field">
      <span>Curation notes</span>
      <textarea data-notes rows="2" placeholder="z. B. Instagram geprüft">${escapeHtml(event.verification_notes)}</textarea>
    </label>

    <div class="toggle-row">
      <label class="mini-toggle ${event.featured ? "is-on" : ""}">
        <input type="checkbox" data-featured ${event.featured ? "checked" : ""} ${
    !state.featureColumns.featured ? "disabled" : ""
  }>
        Featured
      </label>
      <label class="mini-toggle ${event.promoted ? "is-on" : ""}">
        <input type="checkbox" data-promoted ${event.promoted ? "checked" : ""} ${
    !state.featureColumns.promoted ? "disabled" : ""
  }>
        Promoted
      </label>
    </div>

    <div class="card-actions">
      <button type="button" class="button-secondary button-secondary--approve" data-action="approved">Approve</button>
      <button type="button" class="button-secondary" data-action="pending">Set pending</button>
      <button type="button" class="button-secondary button-secondary--reject" data-action="rejected">Reject</button>
      <button type="button" class="button-secondary button-secondary--primary" data-action="save-notes">Save notes</button>
    </div>
  `;
  return card;
}

function renderEvents() {
  if (!dom.eventGrid || !dom.emptyState) return;
  dom.eventGrid.innerHTML = "";
  if (!state.filteredEvents.length) {
    dom.emptyState.hidden = false;
    return;
  }
  dom.emptyState.hidden = true;
  state.filteredEvents.forEach((event) => dom.eventGrid.append(renderEventCard(event)));
}

function render() {
  updateCounts();
  renderTabs();
  applyFilters();
  renderEvents();
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

async function loadEvents() {
  const client = supabaseClient();
  const { data, error } = await client.from("events").select("*").order("event_date", { ascending: true });
  if (error) throw error;
  state.allEvents = (data || []).map(normalizeEvent);
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
  if (dom.sessionInfo) {
    dom.sessionInfo.textContent = isAdmin
      ? `Angemeldet als ${state.adminSession?.user?.email || "-"}`
      : "Nicht angemeldet";
  }
}

function findEventByCard(cardElement) {
  const eventId = cardElement?.dataset?.eventId;
  return state.allEvents.find((event) => String(event.id) === String(eventId));
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
      setGlobalFeedback(`Status updated to ${persistedStatus}.`, "success");
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
  dom.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeTab = tab.dataset.statusFilter || "all";
      render();
    });
  });

  dom.searchInput?.addEventListener("input", () => {
    state.search = dom.searchInput.value || "";
    render();
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

  dom.resetFiltersButton?.addEventListener("click", () => {
    state.search = "";
    state.city = "";
    state.genre = "";
    state.statusFilter = "";
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
