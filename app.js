const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";

const DEFAULT_CENTER = [51.1657, 10.4515];
const DEFAULT_ZOOM = 6;

const demoEvents = [
  {
    id: "demo-1",
    name: "Latin Night Marbella",
    location_name: "Max Beach",
    city: "Mijas Costa",
    event_date: "2026-07-12",
    event_time: "20:30",
    genre: "Latin",
    price_text: "25 EUR",
    description: "Open-Air Latin Night mit lokalen Dance-Artists.",
    lat: 36.4959,
    lng: -4.7345
  },
  {
    id: "demo-2",
    name: "Salsa Party",
    location_name: "Ocean Club",
    city: "Marbella",
    event_date: "2026-07-13",
    event_time: "19:00",
    genre: "Salsa",
    price_text: "30 EUR",
    description: "Salsa Floor mit DJ Set und Show-Acts.",
    lat: 36.4879,
    lng: -4.953
  },
  {
    id: "demo-3",
    name: "Rock Night",
    location_name: "Fuengirola Port Stage",
    city: "Fuengirola",
    event_date: "2026-07-14",
    event_time: "21:30",
    genre: "Rock",
    price_text: "18 EUR",
    description: "Live Band Show mit regionalen Rock-Bands.",
    lat: 36.5336,
    lng: -4.6207
  },
  {
    id: "demo-4",
    name: "Bachata Sunset Session",
    location_name: "Plaza del Mar",
    city: "Estepona",
    event_date: "2026-07-15",
    event_time: "20:00",
    genre: "Bachata, DJ Set",
    price_text: "22 EUR",
    description: "Bachata Social mit Workshop und DJ Set.",
    lat: 36.4292,
    lng: -5.1474
  }
];

const GENRE_ORDER = [
  "Latin",
  "Salsa",
  "Bachata",
  "Reggaeton",
  "Flamenco",
  "Rock",
  "Pop",
  "Electro",
  "House",
  "Techno",
  "R&B",
  "Hip-Hop",
  "Jazz",
  "Live Band",
  "DJ Set"
];

const GENRE_ICON_MAP = {
  Latin: "💃",
  Salsa: "🕺",
  Bachata: "💞",
  Reggaeton: "🔥",
  Flamenco: "🌹",
  Rock: "🎸",
  Pop: "🎤",
  Electro: "⚡",
  House: "🏠",
  Techno: "🔊",
  "R&B": "🎶",
  "Hip-Hop": "🧢",
  Jazz: "🎷",
  "Live Band": "🥁",
  "DJ Set": "🎛️"
};

const I18N = {
  de: {
    hero_title: "Sommerliche Musik-Events in deiner Nähe",
    hero_subtitle: "Entdecke Bands, DJ-Sets und Locations mit smarter Filterung und Live-Karte.",
    hero_chip_fallback: "Fallback inklusive",
    discover_title: "Events entdecken",
    discover_subtitle: "Filtere nach Suche, Stadt, Datum und Genres.",
    filter_search: "Suche",
    filter_search_placeholder: "Event, Stadt, Location, Genre...",
    filter_city: "Stadt",
    filter_city_all: "Alle Städte",
    filter_date: "Datum",
    filter_date_all: "Alle Daten",
    filter_genre: "Genres",
    filter_genre_all: "Alle Genres",
    filter_reset: "Alle Filter zurücksetzen",
    list_title: "Event-Liste",
    debug_title: "Debug-Modus",
    debug_table: "Tabelle:",
    debug_loaded: "Supabase Events:",
    debug_error: "Fehler:",
    debug_note: "Hinweis:",
    result_count: "{count} Treffer",
    status_loading: "Lade Events aus Supabase...",
    status_connected: "Supabase verbunden. {count} Events geladen.",
    status_no_data: "Keine Daten aus Supabase. Demo-Events geladen.",
    status_error: "Supabase nicht verfügbar: {message}. Demo-Events aktiv.",
    status_filtered: "{shown} von {total} Events ({source}).",
    source_supabase: "Supabase",
    source_demo_no_data: "Demo-Fallback (Keine Daten aus Supabase)",
    source_demo_error: "Demo-Fallback (Supabase Fehler)",
    no_events_found: "Keine Events gefunden.",
    details_empty: "Wähle ein Event in der Liste oder auf der Karte aus.",
    details_location: "Location",
    details_date: "Datum",
    details_genre: "Genre",
    details_price: "Preis",
    details_free: "Eintritt frei",
    details_no_description: "Keine Beschreibung vorhanden.",
    details_time_fallback: "Uhrzeit folgt",
    debug_no_error: "Nein",
    debug_note_pending: "Noch keine Entscheidung",
    debug_note_supabase: "Kein Fallback - Daten aus Supabase aktiv",
    debug_note_no_data: "Keine Daten aus Supabase",
    debug_note_error: "Supabase Fehler - Demo-Fallback aktiv",
    button_all: "Alle"
  },
  en: {
    hero_title: "Summer music events near you",
    hero_subtitle: "Discover bands, DJ sets and venues with smart filters and live map.",
    hero_chip_fallback: "Fallback included",
    discover_title: "Discover events",
    discover_subtitle: "Filter by search, city, date and genres.",
    filter_search: "Search",
    filter_search_placeholder: "Event, city, venue, genre...",
    filter_city: "City",
    filter_city_all: "All cities",
    filter_date: "Date",
    filter_date_all: "All dates",
    filter_genre: "Genres",
    filter_genre_all: "All genres",
    filter_reset: "Reset all filters",
    list_title: "Event list",
    debug_title: "Debug mode",
    debug_table: "Table:",
    debug_loaded: "Supabase events:",
    debug_error: "Error:",
    debug_note: "Note:",
    result_count: "{count} results",
    status_loading: "Loading events from Supabase...",
    status_connected: "Supabase connected. {count} events loaded.",
    status_no_data: "No data from Supabase. Demo events loaded.",
    status_error: "Supabase unavailable: {message}. Demo events active.",
    status_filtered: "{shown} of {total} events ({source}).",
    source_supabase: "Supabase",
    source_demo_no_data: "Demo fallback (No data from Supabase)",
    source_demo_error: "Demo fallback (Supabase error)",
    no_events_found: "No events found.",
    details_empty: "Select an event in the list or on the map.",
    details_location: "Location",
    details_date: "Date",
    details_genre: "Genre",
    details_price: "Price",
    details_free: "Free entry",
    details_no_description: "No description available.",
    details_time_fallback: "Time TBD",
    debug_no_error: "No",
    debug_note_pending: "No decision yet",
    debug_note_supabase: "No fallback - Supabase data active",
    debug_note_no_data: "No data from Supabase",
    debug_note_error: "Supabase error - demo fallback active",
    button_all: "All"
  },
  es: {
    hero_title: "Eventos musicales de verano cerca de ti",
    hero_subtitle: "Descubre bandas, DJ sets y locales con filtros inteligentes y mapa en vivo.",
    hero_chip_fallback: "Fallback incluido",
    discover_title: "Descubrir eventos",
    discover_subtitle: "Filtra por búsqueda, ciudad, fecha y géneros.",
    filter_search: "Buscar",
    filter_search_placeholder: "Evento, ciudad, local, género...",
    filter_city: "Ciudad",
    filter_city_all: "Todas las ciudades",
    filter_date: "Fecha",
    filter_date_all: "Todas las fechas",
    filter_genre: "Géneros",
    filter_genre_all: "Todos los géneros",
    filter_reset: "Restablecer filtros",
    list_title: "Lista de eventos",
    debug_title: "Modo debug",
    debug_table: "Tabla:",
    debug_loaded: "Eventos Supabase:",
    debug_error: "Error:",
    debug_note: "Nota:",
    result_count: "{count} resultados",
    status_loading: "Cargando eventos de Supabase...",
    status_connected: "Supabase conectado. {count} eventos cargados.",
    status_no_data: "Sin datos de Supabase. Eventos demo cargados.",
    status_error: "Supabase no disponible: {message}. Demo activa.",
    status_filtered: "{shown} de {total} eventos ({source}).",
    source_supabase: "Supabase",
    source_demo_no_data: "Fallback demo (Sin datos de Supabase)",
    source_demo_error: "Fallback demo (Error de Supabase)",
    no_events_found: "No se encontraron eventos.",
    details_empty: "Selecciona un evento en la lista o en el mapa.",
    details_location: "Ubicación",
    details_date: "Fecha",
    details_genre: "Género",
    details_price: "Precio",
    details_free: "Entrada gratuita",
    details_no_description: "No hay descripción disponible.",
    details_time_fallback: "Hora por confirmar",
    debug_no_error: "No",
    debug_note_pending: "Sin decisión todavía",
    debug_note_supabase: "Sin fallback - datos de Supabase activos",
    debug_note_no_data: "Sin datos de Supabase",
    debug_note_error: "Error de Supabase - fallback demo activo",
    button_all: "Todos"
  }
};

const LOCALE_MAP = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES"
};

const state = {
  allEvents: [],
  filteredEvents: [],
  selectedEventId: null,
  sourceType: "unknown",
  availableGenres: [],
  availableDates: [],
  activeGenres: new Set(),
  lang: "de",
  debug: {
    enabled: true,
    tableName: "events",
    supabaseLoadedCount: 0,
    hasError: false,
    errorMessage: "",
    fallbackReason: ""
  }
};

const dom = {
  htmlRoot: document.documentElement,
  status: document.getElementById("status"),
  eventList: document.getElementById("eventList"),
  eventDetails: document.getElementById("eventDetails"),
  resultCount: document.getElementById("resultCount"),
  filtersForm: document.getElementById("filtersForm"),
  searchInput: document.getElementById("searchInput"),
  cityFilter: document.getElementById("cityFilter"),
  dateFilter: document.getElementById("dateFilter"),
  genreFilterGroup: document.getElementById("genreFilterGroup"),
  clearGenresButton: document.getElementById("clearGenresButton"),
  resetFilters: document.getElementById("resetFilters"),
  debugPanel: document.getElementById("debugPanel"),
  debugLoadedCount: document.getElementById("debugLoadedCount"),
  debugErrorState: document.getElementById("debugErrorState"),
  debugTableName: document.getElementById("debugTableName"),
  debugFallbackReason: document.getElementById("debugFallbackReason")
};

let map;
let markersLayer;
const markersByEventId = new Map();
const markerEventsById = new Map();

function resolveLanguage(langValue) {
  return I18N[langValue] ? langValue : "de";
}

function t(key, params = {}) {
  const table = I18N[state.lang] || I18N.de;
  const fallback = I18N.de[key] || key;
  const template = table[key] || fallback;
  return Object.entries(params).reduce(
    (text, [paramKey, paramValue]) => text.replaceAll(`{${paramKey}}`, String(paramValue)),
    template
  );
}

function applyStaticTranslations() {
  dom.htmlRoot.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
}

function getLocale() {
  return LOCALE_MAP[state.lang] || LOCALE_MAP.de;
}

function setStatus(message, tone = "loading") {
  dom.status.className = `status status--${tone}`;
  dom.status.textContent = message;
}

function setResultCount(count) {
  dom.resultCount.textContent = t("result_count", { count });
}

function updateDebugPanel() {
  if (!dom.debugPanel) return;
  dom.debugPanel.classList.remove("debug-panel--error");
  if (dom.debugTableName) dom.debugTableName.textContent = state.debug.tableName;
  if (dom.debugLoadedCount) dom.debugLoadedCount.textContent = String(state.debug.supabaseLoadedCount);
  if (dom.debugErrorState) {
    dom.debugErrorState.textContent = state.debug.hasError
      ? `Ja - ${state.debug.errorMessage}`
      : t("debug_no_error");
  }
  if (dom.debugFallbackReason) dom.debugFallbackReason.textContent = state.debug.fallbackReason;
  if (state.debug.hasError) dom.debugPanel.classList.add("debug-panel--error");
}

function normalizeEvent(event, index) {
  const lat = Number(event.lat ?? event.latitude ?? null);
  const lng = Number(event.lng ?? event.longitude ?? null);
  return {
    id: String(event.id ?? `event-${index}`),
    name: event.name || event.title || "Untitled Event",
    location_name: event.location_name || event.location || "Unknown venue",
    city: event.city || event.location_city || "",
    event_date: event.event_date || event.date || "",
    event_time: event.event_time || event.time || "",
    genre: event.genre || event.music_genre || "",
    price_text: event.price_text || event.price || t("details_free"),
    description: event.description || t("details_no_description"),
    image_url: event.image_url || event.image || "",
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null
  };
}

function splitGenres(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/[,/|;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function sortGenres(genres) {
  return [...genres].sort((a, b) => {
    const ai = GENRE_ORDER.indexOf(a);
    const bi = GENRE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, getLocale());
  });
}

function collectUniqueGenres(events) {
  const set = new Set();
  events.forEach((event) => splitGenres(event.genre).forEach((genre) => set.add(genre)));
  return sortGenres(set);
}

function collectUniqueDates(events) {
  return [...new Set(events.map((event) => event.event_date).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function iconForGenre(genre) {
  return GENRE_ICON_MAP[genre] || "🎵";
}

function formatDate(dateString, includeWeekday = true) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  };
  if (includeWeekday) options.weekday = "short";
  return new Intl.DateTimeFormat(getLocale(), options).format(date);
}

function formatDateTime(event) {
  const base = formatDate(event.event_date, true);
  const timePart = event.event_time ? event.event_time : t("details_time_fallback");
  return `${base} ${timePart}`;
}

function formatPrice(priceText) {
  if (!priceText) return t("details_free");
  const normalized = String(priceText).trim().toLowerCase();
  if (normalized === "free" || normalized === "0" || normalized === "0 eur") return t("details_free");
  return String(priceText);
}

function eventSearchText(event) {
  return [event.name, event.location_name, event.city, event.genre, event.description].join(" ").toLowerCase();
}

function sourceLabel() {
  if (state.sourceType === "supabase") return t("source_supabase");
  if (state.sourceType === "demo-no-data") return t("source_demo_no_data");
  if (state.sourceType === "demo-error") return t("source_demo_error");
  return "-";
}

function sourceTone() {
  return state.sourceType === "supabase" ? "ok" : "warning";
}

function getGenreByLowerMap() {
  const mapByLower = new Map();
  state.availableGenres.forEach((genre) => mapByLower.set(genre.toLowerCase(), genre));
  return mapByLower;
}

function normalizeRequestedGenres(rawGenres) {
  const mapByLower = getGenreByLowerMap();
  const selected = [];
  rawGenres.forEach((genre) => {
    const mapped = mapByLower.get(genre.toLowerCase().trim());
    if (mapped) selected.push(mapped);
  });
  return [...new Set(selected)];
}

function readQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    lang: params.get("lang") || "",
    q: params.get("q") || "",
    city: params.get("city") || "",
    date: params.get("date") || "",
    genres: (params.get("genres") || "")
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean)
  };
}

function updateUrlFromFilters() {
  const params = new URLSearchParams();
  const search = dom.searchInput.value.trim();
  const city = dom.cityFilter.value;
  const date = dom.dateFilter.value;

  if (state.lang !== "de") params.set("lang", state.lang);
  if (search) params.set("q", search);
  if (city) params.set("city", city);
  if (date) params.set("date", date);
  if (state.activeGenres.size) params.set("genres", [...state.activeGenres].join(","));

  const queryString = params.toString();
  const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
  window.history.replaceState({}, "", nextUrl);
}

function renderGenreFilter() {
  if (!dom.genreFilterGroup) return;
  dom.genreFilterGroup.innerHTML = "";
  state.availableGenres.forEach((genre) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "genre-chip";
    if (state.activeGenres.has(genre)) button.classList.add("is-active");
    button.dataset.genre = genre;
    button.innerHTML = `<span class="genre-chip__icon">${iconForGenre(genre)}</span><span>${genre}</span>`;
    dom.genreFilterGroup.append(button);
  });
}

function updateFilterOptions() {
  const cities = [...new Set(state.allEvents.map((event) => event.city).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, getLocale())
  );
  state.availableDates = collectUniqueDates(state.allEvents);
  state.availableGenres = collectUniqueGenres(state.allEvents);

  dom.cityFilter.innerHTML = "";
  const allCitiesOption = document.createElement("option");
  allCitiesOption.value = "";
  allCitiesOption.textContent = t("filter_city_all");
  dom.cityFilter.append(allCitiesOption);
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    dom.cityFilter.append(option);
  });

  dom.dateFilter.innerHTML = "";
  const allDatesOption = document.createElement("option");
  allDatesOption.value = "";
  allDatesOption.textContent = t("filter_date_all");
  dom.dateFilter.append(allDatesOption);
  state.availableDates.forEach((date) => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = formatDate(date, false);
    dom.dateFilter.append(option);
  });

  state.activeGenres.forEach((genre) => {
    if (!state.availableGenres.includes(genre)) state.activeGenres.delete(genre);
  });
  renderGenreFilter();
}

function applyFiltersFromQuery() {
  const query = readQueryParams();
  if (query.q) dom.searchInput.value = query.q;
  if (query.city && [...dom.cityFilter.options].some((option) => option.value === query.city)) {
    dom.cityFilter.value = query.city;
  }
  if (query.date && [...dom.dateFilter.options].some((option) => option.value === query.date)) {
    dom.dateFilter.value = query.date;
  }
  state.activeGenres = new Set(normalizeRequestedGenres(query.genres));
  renderGenreFilter();
}

function getActiveFilters() {
  return {
    search: dom.searchInput.value.trim().toLowerCase(),
    city: dom.cityFilter.value,
    date: dom.dateFilter.value,
    genres: new Set([...state.activeGenres].map((genre) => genre.toLowerCase()))
  };
}

function eventMatchesGenres(event, activeGenresLower) {
  if (!activeGenresLower.size) return true;
  const eventGenresLower = splitGenres(event.genre).map((genre) => genre.toLowerCase());
  return eventGenresLower.some((genre) => activeGenresLower.has(genre));
}

function applyFilters() {
  const filters = getActiveFilters();
  state.filteredEvents = state.allEvents.filter((event) => {
    if (filters.city && event.city !== filters.city) return false;
    if (filters.date && event.event_date !== filters.date) return false;
    if (!eventMatchesGenres(event, filters.genres)) return false;
    if (filters.search && !eventSearchText(event).includes(filters.search)) return false;
    return true;
  });

  if (state.selectedEventId && !state.filteredEvents.some((event) => event.id === state.selectedEventId)) {
    state.selectedEventId = null;
    renderEventDetails(null);
  }

  renderEventList();
  renderMapMarkers();
  setStatus(
    t("status_filtered", {
      shown: state.filteredEvents.length,
      total: state.allEvents.length,
      source: sourceLabel()
    }),
    sourceTone()
  );
  updateUrlFromFilters();
}

function createEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card";
  card.dataset.eventId = event.id;
  card.innerHTML = `
    <div class="event-card__header">
      <h4>${event.name}</h4>
      <span>${event.genre || "-"}</span>
    </div>
    <div class="event-card__meta">
      <span>${event.location_name}${event.city ? `, ${event.city}` : ""}</span>
      <span>${formatDateTime(event)}</span>
      <span>${formatPrice(event.price_text)}</span>
    </div>
  `;
  card.addEventListener("click", () => selectEvent(event.id, { flyTo: true, openPopup: true, scrollIntoView: false }));
  return card;
}

function renderEventList() {
  dom.eventList.innerHTML = "";
  setResultCount(state.filteredEvents.length);

  if (!state.filteredEvents.length) {
    dom.eventList.innerHTML = `<p class="event-list__empty">${t("no_events_found")}</p>`;
    dom.eventDetails.className = "event-details event-details--empty";
    dom.eventDetails.textContent = t("no_events_found");
    return;
  }

  state.filteredEvents.forEach((event) => {
    const card = createEventCard(event);
    if (event.id === state.selectedEventId) card.classList.add("event-card--active");
    dom.eventList.append(card);
  });
}

function createMarkerIcon(event, active = false) {
  const primaryGenre = splitGenres(event.genre)[0] || "";
  return L.divIcon({
    className: "marker-pin-wrap",
    html: `<div class="marker-pin ${active ? "marker-pin--active" : ""}"><span>${iconForGenre(primaryGenre)}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -28]
  });
}

function syncActiveMarker(eventId) {
  markersByEventId.forEach((marker, id) => {
    const event = markerEventsById.get(id);
    marker.setIcon(createMarkerIcon(event, id === eventId));
  });
}

function initMap() {
  map = L.map("map", { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  window.setTimeout(() => map.invalidateSize(), 250);
}

function markerPopupHtml(event) {
  return `
    <div class="popup">
      <strong>${event.name}</strong><br>
      <span>${event.location_name}${event.city ? `, ${event.city}` : ""}</span><br>
      <span>${formatDateTime(event)}</span><br>
      <span>${event.genre || "-"} - ${formatPrice(event.price_text)}</span>
    </div>
  `;
}

function renderMapMarkers() {
  markersLayer.clearLayers();
  markersByEventId.clear();
  markerEventsById.clear();
  const bounds = [];

  state.filteredEvents.forEach((event) => {
    if (event.lat === null || event.lng === null) return;
    const marker = L.marker([event.lat, event.lng], {
      title: event.name,
      icon: createMarkerIcon(event, false)
    })
      .bindPopup(markerPopupHtml(event))
      .on("click", () => selectEvent(event.id, { flyTo: false, openPopup: false, scrollIntoView: true }));

    markersLayer.addLayer(marker);
    markersByEventId.set(event.id, marker);
    markerEventsById.set(event.id, event);
    bounds.push([event.lat, event.lng]);
  });

  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  else map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  syncActiveMarker(state.selectedEventId);
}

function renderEventDetails(event) {
  if (!event) {
    dom.eventDetails.className = "event-details event-details--empty";
    dom.eventDetails.textContent = t("details_empty");
    return;
  }

  dom.eventDetails.className = "event-details";
  dom.eventDetails.innerHTML = `
    ${event.image_url ? `<img class="event-details__image" src="${event.image_url}" alt="${event.name}" loading="lazy">` : ""}
    <h4>${event.name}</h4>
    <ul>
      <li><strong>${t("details_location")}:</strong> ${event.location_name}${event.city ? `, ${event.city}` : ""}</li>
      <li><strong>${t("details_date")}:</strong> ${formatDateTime(event)}</li>
      <li><strong>${t("details_genre")}:</strong> ${event.genre || "-"}</li>
      <li><strong>${t("details_price")}:</strong> ${formatPrice(event.price_text)}</li>
    </ul>
    <p>${event.description || t("details_no_description")}</p>
  `;
}

function selectEvent(eventId, options = { flyTo: false, openPopup: false, scrollIntoView: false }) {
  state.selectedEventId = eventId;
  const event = state.filteredEvents.find((item) => item.id === eventId);

  document.querySelectorAll(".event-card").forEach((card) => {
    const isActive = card.dataset.eventId === eventId;
    card.classList.toggle("event-card--active", isActive);
    if (isActive && options.scrollIntoView) {
      card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });

  syncActiveMarker(eventId);
  renderEventDetails(event || null);
  if (!event) return;

  const marker = markersByEventId.get(event.id);
  if (marker && event.lat !== null && event.lng !== null) {
    if (options.flyTo) map.flyTo([event.lat, event.lng], 13, { duration: 0.6 });
    if (options.openPopup) marker.openPopup();
  }
}

function clearGenreSelection() {
  state.activeGenres.clear();
  renderGenreFilter();
  applyFilters();
}

function resetFilters() {
  dom.searchInput.value = "";
  dom.cityFilter.value = "";
  dom.dateFilter.value = "";
  state.activeGenres.clear();
  renderGenreFilter();
  state.selectedEventId = null;
  applyFilters();
  renderEventDetails(null);
}

function bindEvents() {
  dom.filtersForm.addEventListener("submit", (event) => event.preventDefault());
  dom.searchInput.addEventListener("input", applyFilters);
  dom.cityFilter.addEventListener("change", applyFilters);
  dom.dateFilter.addEventListener("change", applyFilters);
  dom.resetFilters.addEventListener("click", resetFilters);
  dom.clearGenresButton.addEventListener("click", clearGenreSelection);

  dom.genreFilterGroup.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-genre]");
    if (!button) return;
    const { genre } = button.dataset;
    if (!genre) return;

    if (state.activeGenres.has(genre)) state.activeGenres.delete(genre);
    else state.activeGenres.add(genre);

    renderGenreFilter();
    applyFilters();
  });
}

async function fetchEventsFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_URL.includes("supabase.co")) {
    throw new Error("Supabase-URL ist ungültig.");
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("[hier deinen anon key einsetzen]")) {
    throw new Error("Supabase-Anon-Key fehlt. Bitte in app.js eintragen.");
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const tableName = state.debug.tableName || "events";
  const { data, error } = await client.from(tableName).select("*").order("event_date", { ascending: true });

  console.log("[PartyRadar Debug] Supabase table:", tableName);
  console.log("[PartyRadar Debug] Supabase data:", data);
  console.log("[PartyRadar Debug] Supabase error:", error);

  if (error) throw new Error(error.message);
  return (data || []).map(normalizeEvent);
}

async function loadEvents() {
  setStatus(t("status_loading"), "loading");
  state.debug.hasError = false;
  state.debug.errorMessage = "";
  state.debug.fallbackReason = t("debug_note_pending");
  state.debug.supabaseLoadedCount = 0;
  updateDebugPanel();

  try {
    const data = await fetchEventsFromSupabase();
    state.debug.supabaseLoadedCount = data.length;

    if (!data.length) {
      state.allEvents = demoEvents.map(normalizeEvent);
      state.sourceType = "demo-no-data";
      state.debug.fallbackReason = t("debug_note_no_data");
      setStatus(t("status_no_data"), "warning");
      updateDebugPanel();
      return;
    }

    state.allEvents = data;
    state.sourceType = "supabase";
    state.debug.fallbackReason = t("debug_note_supabase");
    setStatus(t("status_connected", { count: data.length }), "ok");
    updateDebugPanel();
  } catch (error) {
    console.error("Supabase Fehler:", error);
    state.allEvents = demoEvents.map(normalizeEvent);
    state.sourceType = "demo-error";
    state.debug.hasError = true;
    state.debug.errorMessage = error.message;
    state.debug.fallbackReason = t("debug_note_error");
    setStatus(t("status_error", { message: error.message }), "warning");
    updateDebugPanel();
  }
}

async function startApp() {
  const query = readQueryParams();
  state.lang = resolveLanguage(query.lang);
  applyStaticTranslations();
  renderEventDetails(null);

  initMap();
  bindEvents();
  await loadEvents();
  updateFilterOptions();
  applyFiltersFromQuery();
  applyFilters();
}

startApp();
