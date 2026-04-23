const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
const ADMIN_REQUIRED_ROLE = "admin";
const ADMIN_ALLOWED_EMAILS = [];
const ADMIN_DASHBOARD_BUILD = "2026.04.08-admin-2";

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
    image_url: event.image_url || "",
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
  card.innerHTML = `
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

    ${
      event.image_url
        ? `<img class="event-card__image" src="${escapeHtml(event.image_url)}" alt="${escapeHtml(event.name)}" loading="lazy">`
        : ""
    }
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
