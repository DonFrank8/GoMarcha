const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
const ADMIN_REQUIRED_ROLE = "admin";
const ADMIN_ALLOWED_EMAILS = [];
const ADMIN_DASHBOARD_BUILD = "2026.04.08-admin-1";

const STATUS_ORDER = ["pending", "approved", "rejected"];

const state = {
  allEvents: [],
  filteredEvents: [],
  activeStatus: "pending",
  search: "",
  city: "",
  genre: "",
  adminSession: null,
  featureColumns: {
    featured: true,
    promoted: true
  },
  columnsMissingCache: new Set()
};

const dom = {
  buildBadge: document.getElementById("buildBadge"),
  statusMessage: document.getElementById("statusMessage"),
  loginCard: document.getElementById("loginCard"),
  dashboardContent: document.getElementById("dashboardContent"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginFeedback: document.getElementById("loginFeedback"),
  userEmail: document.getElementById("userEmail"),
  signOutButton: document.getElementById("signOutButton"),
  tabButtons: [...document.querySelectorAll(".status-tab")],
  statPending: document.getElementById("statPending"),
  statApproved: document.getElementById("statApproved"),
  statRejected: document.getElementById("statRejected"),
  searchInput: document.getElementById("searchInput"),
  cityFilter: document.getElementById("cityFilter"),
  genreFilter: document.getElementById("genreFilter"),
  refreshButton: document.getElementById("refreshButton"),
  resetFilterButton: document.getElementById("resetFilterButton"),
  eventGrid: document.getElementById("eventGrid"),
  emptyState: document.getElementById("emptyState"),
  actionFeedback: document.getElementById("actionFeedback")
};

if (dom.buildBadge) {
  dom.buildBadge.textContent = `Build ${ADMIN_DASHBOARD_BUILD}`;
}

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
  const roleOk = sessionRole(session) === ADMIN_REQUIRED_ROLE;
  const emailOk = isEmailAllowed(session?.user?.email || "");
  return roleOk && emailOk;
}

function setStatus(message, tone = "info") {
  if (!dom.statusMessage) return;
  dom.statusMessage.textContent = message || "";
  dom.statusMessage.className = `status-message status-message--${tone}`;
}

function setLoginFeedback(message, tone = "info") {
  if (!dom.loginFeedback) return;
  dom.loginFeedback.hidden = !message;
  dom.loginFeedback.textContent = message || "";
  dom.loginFeedback.className = "feedback";
  if (tone === "error") dom.loginFeedback.classList.add("is-error");
  if (tone === "success") dom.loginFeedback.classList.add("is-success");
}

function setActionFeedback(message, tone = "info") {
  if (!dom.actionFeedback) return;
  dom.actionFeedback.hidden = !message;
  dom.actionFeedback.textContent = message || "";
  dom.actionFeedback.className = "feedback";
  if (tone === "error") dom.actionFeedback.classList.add("is-error");
  if (tone === "success") dom.actionFeedback.classList.add("is-success");
}

function formatDate(date) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "short"
  }).format(parsed);
}

function formatDateTime(event) {
  return `${formatDate(event.event_date)} ${event.event_time || "TBD"}`.trim();
}

function eventPlace(event) {
  return [event.location_name, event.address, event.city, event.country].filter(Boolean).join(", ") || "-";
}

function statusBadgeClass(status) {
  if (status === "approved") return "status-badge status-badge--approved";
  if (status === "rejected") return "status-badge status-badge--rejected";
  return "status-badge status-badge--pending";
}

function normalizeEvent(event) {
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
    status: STATUS_ORDER.includes(event.status) ? event.status : "pending",
    verification_notes: event.verification_notes || "",
    image_url: event.image_url || "",
    lat: Number.isFinite(event.lat) ? event.lat : null,
    lng: Number.isFinite(event.lng) ? event.lng : null,
    featured: Boolean(event.featured),
    promoted: Boolean(event.promoted)
  };
}

function updateStats() {
  const pending = state.allEvents.filter((event) => event.status === "pending").length;
  const approved = state.allEvents.filter((event) => event.status === "approved").length;
  const rejected = state.allEvents.filter((event) => event.status === "rejected").length;
  if (dom.statPending) dom.statPending.textContent = String(pending);
  if (dom.statApproved) dom.statApproved.textContent = String(approved);
  if (dom.statRejected) dom.statRejected.textContent = String(rejected);
}

function syncFilters() {
  const cities = [...new Set(state.allEvents.map((event) => event.city).filter(Boolean))].sort();
  const genres = [...new Set(state.allEvents.map((event) => event.genre).filter(Boolean))].sort();

  const previousCity = dom.cityFilter.value;
  const previousGenre = dom.genreFilter.value;
  dom.cityFilter.innerHTML = `<option value="">Alle Städte</option>${cities
    .map((city) => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`)
    .join("")}`;
  dom.genreFilter.innerHTML = `<option value="">Alle Genres</option>${genres
    .map((genre) => `<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`)
    .join("")}`;
  dom.cityFilter.value = cities.includes(previousCity) ? previousCity : "";
  dom.genreFilter.value = genres.includes(previousGenre) ? previousGenre : "";
}

function applyFilters() {
  const search = state.search.trim().toLowerCase();
  const city = state.city;
  const genre = state.genre;
  const status = state.activeStatus;

  state.filteredEvents = state.allEvents.filter((event) => {
    if (status && event.status !== status) return false;
    if (city && event.city !== city) return false;
    if (genre && event.genre !== genre) return false;
    if (!search) return true;
    const searchText = [
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
    return searchText.includes(search);
  });
}

function renderTabs() {
  dom.tabButtons.forEach((button) => {
    const isActive = button.dataset.statusTab === state.activeStatus;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card-admin";
  card.dataset.eventId = event.id;

  card.innerHTML = `
    <header class="event-card-admin__head">
      <div>
        <h3>${escapeHtml(event.name)}</h3>
        <p class="event-card-admin__place">${escapeHtml(eventPlace(event))}</p>
      </div>
      <span class="${statusBadgeClass(event.status)}">${escapeHtml(event.status)}</span>
    </header>

    <div class="event-card-admin__meta">
      <span><strong>Datum:</strong> ${escapeHtml(formatDateTime(event))}</span>
      <span><strong>Genre:</strong> ${escapeHtml(event.genre || "-")}</span>
      <span><strong>Preis:</strong> ${escapeHtml(event.price_text || "-")}</span>
      <span><strong>Eingereicht von:</strong> ${escapeHtml(event.submitted_by || "-")}</span>
      <span><strong>Kontakt:</strong> ${escapeHtml(event.contact_email || "-")}</span>
      <span><strong>Koordinaten:</strong> ${
        event.lat !== null && event.lng !== null
          ? `${escapeHtml(String(event.lat))}, ${escapeHtml(String(event.lng))}`
          : "-"
      }</span>
    </div>

    ${
      event.image_url
        ? `<img class="event-card-admin__image" src="${escapeHtml(event.image_url)}" alt="${escapeHtml(event.name)}" loading="lazy">`
        : ""
    }

    <p class="event-card-admin__description">${escapeHtml(event.description || "Keine Beschreibung")}</p>

    <label class="field">
      <span>Verification Notes</span>
      <textarea data-notes rows="2" placeholder="z. B. Instagram geprüft">${escapeHtml(
        event.verification_notes || ""
      )}</textarea>
    </label>

    <div class="event-card-admin__toggles">
      <label class="toggle">
        <input type="checkbox" data-featured ${event.featured ? "checked" : ""} ${
    !state.featureColumns.featured ? "disabled" : ""
  }>
        <span>Featured</span>
      </label>
      <label class="toggle">
        <input type="checkbox" data-promoted ${event.promoted ? "checked" : ""} ${
    !state.featureColumns.promoted ? "disabled" : ""
  }>
        <span>Promoted</span>
      </label>
    </div>

    <div class="event-card-admin__actions">
      <button type="button" class="action-button action-button--approve" data-action="approved">Approve</button>
      <button type="button" class="action-button action-button--pending" data-action="pending">Back to Pending</button>
      <button type="button" class="action-button action-button--reject" data-action="rejected">Reject</button>
      <button type="button" class="action-button action-button--save" data-action="save-notes">Save notes</button>
    </div>
  `;

  return card;
}

function renderEvents() {
  dom.eventGrid.innerHTML = "";
  if (!state.filteredEvents.length) {
    dom.emptyState.hidden = false;
    return;
  }

  dom.emptyState.hidden = true;
  state.filteredEvents.forEach((event) => dom.eventGrid.append(renderEventCard(event)));
}

function render() {
  updateStats();
  renderTabs();
  applyFilters();
  renderEvents();
}

function removeMissingColumnFromPayload(payload, error) {
  const text = [error?.message, error?.details, error?.hint].filter(Boolean).join(" | ");
  const missing = text.match(/could not find the ['"]([^'"]+)['"] column/i)?.[1]
    || text.match(/column ["']([^"']+)["'] does not exist/i)?.[1];
  if (!missing) return false;
  const normalized = String(missing).split(".").pop().replace(/["']/g, "").trim();
  if (!normalized || !Object.prototype.hasOwnProperty.call(payload, normalized)) return false;
  delete payload[normalized];
  state.columnsMissingCache.add(normalized);
  if (normalized === "featured") state.featureColumns.featured = false;
  if (normalized === "promoted") state.featureColumns.promoted = false;
  return true;
}

async function updateEventWithFallback(eventId, updates) {
  const client = supabaseClient();
  const table = "events";
  const payload = { ...updates };
  const maxAttempts = Object.keys(payload).length + 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { error } = await client.from(table).update(payload).eq("id", eventId);
    if (!error) return;
    lastError = error;
    const changed = removeMissingColumnFromPayload(payload, error);
    if (!changed) break;
  }

  throw new Error(lastError?.message || "Update failed");
}

async function loadEvents() {
  const client = supabaseClient();
  const { data, error } = await client.from("events").select("*").order("event_date", { ascending: true });
  if (error) throw error;
  state.allEvents = (data || []).map(normalizeEvent);
  syncFilters();
  render();
}

async function checkSession() {
  const client = supabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  state.adminSession = data?.session || null;
  return state.adminSession;
}

function renderAuthState() {
  const isAdmin = isSessionAdmin(state.adminSession);
  dom.loginCard.hidden = isAdmin;
  dom.dashboardContent.hidden = !isAdmin;
  dom.userEmail.textContent = state.adminSession?.user?.email || "-";
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

function findEventByCard(cardElement) {
  const eventId = cardElement?.dataset?.eventId;
  return state.allEvents.find((event) => String(event.id) === String(eventId));
}

async function handleCardAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest(".event-card-admin");
  if (!card) return;
  const eventData = findEventByCard(card);
  if (!eventData) return;

  const notes = card.querySelector("textarea[data-notes]")?.value.trim() || "";
  const featuredInput = card.querySelector("input[data-featured]");
  const promotedInput = card.querySelector("input[data-promoted]");

  button.disabled = true;
  setActionFeedback("");
  try {
    if (button.dataset.action === "save-notes") {
      await updateEventWithFallback(eventData.id, {
        verification_notes: notes
      });
      setActionFeedback("Notiz gespeichert.", "success");
    } else {
      await updateEventWithFallback(eventData.id, {
        status: button.dataset.action,
        verification_notes: notes
      });
      setActionFeedback(`Status auf ${button.dataset.action} gesetzt.`, "success");
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
    setActionFeedback(`Aktion fehlgeschlagen: ${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
}

function bindEvents() {
  dom.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.activeStatus = button.dataset.statusTab || "pending";
      render();
    });
  });

  dom.searchInput.addEventListener("input", () => {
    state.search = dom.searchInput.value;
    render();
  });

  dom.cityFilter.addEventListener("change", () => {
    state.city = dom.cityFilter.value;
    render();
  });

  dom.genreFilter.addEventListener("change", () => {
    state.genre = dom.genreFilter.value;
    render();
  });

  dom.resetFilterButton.addEventListener("click", () => {
    state.search = "";
    state.city = "";
    state.genre = "";
    dom.searchInput.value = "";
    dom.cityFilter.value = "";
    dom.genreFilter.value = "";
    render();
  });

  dom.refreshButton.addEventListener("click", async () => {
    setStatus("Aktualisiere Events ...", "loading");
    try {
      await loadEvents();
      setStatus("Events aktualisiert.", "ok");
    } catch (error) {
      setStatus(`Fehler: ${error.message}`, "error");
    }
  });

  dom.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoginFeedback("");
    try {
      const email = dom.loginEmail.value.trim().toLowerCase();
      const password = dom.loginPassword.value;
      if (!email || !password) {
        setLoginFeedback("Bitte E-Mail und Passwort ausfüllen.", "error");
        return;
      }

      await signInWithPassword(email, password);
      await checkSession();
      if (!isSessionAdmin(state.adminSession)) {
        setLoginFeedback(
          "Login erfolgreich, aber keine Admin-Berechtigung (Role oder erlaubte E-Mail fehlt).",
          "error"
        );
        await signOut();
        await checkSession();
        renderAuthState();
        return;
      }

      renderAuthState();
      await loadEvents();
      setStatus("Admin Dashboard geladen.", "ok");
    } catch (error) {
      setLoginFeedback(`Login fehlgeschlagen: ${error.message}`, "error");
    }
  });

  dom.signOutButton.addEventListener("click", async () => {
    await signOut();
    state.adminSession = null;
    renderAuthState();
    setStatus("Abgemeldet.", "info");
  });

  dom.eventGrid.addEventListener("click", handleCardAction);
}

async function start() {
  bindEvents();
  setStatus("Admin Dashboard initialisiert ...", "loading");
  try {
    await checkSession();
    renderAuthState();
    if (isSessionAdmin(state.adminSession)) {
      await loadEvents();
      setStatus("Bereit.", "ok");
    } else {
      setStatus("Bitte als Admin anmelden.", "info");
    }
  } catch (error) {
    console.error("Startup failed:", error);
    setStatus(`Fehler beim Start: ${error.message}`, "error");
  }
}

start();
