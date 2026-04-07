const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
const SUPABASE_ANON_KEY = "[hier deinen anon key einsetzen]";

const DEFAULT_CENTER = [51.1657, 10.4515];
const DEFAULT_ZOOM = 6;

const demoEvents = [
  {
    id: "demo-1",
    name: "Neon Bass Night",
    location_name: "Club Orbit",
    city: "Berlin",
    event_date: "2026-04-18",
    event_time: "22:00",
    genre: "Electronic",
    price_text: "18 EUR",
    description: "DJs aus der lokalen Szene mit House, Techno und Basslines.",
    lat: 52.5208,
    lng: 13.4095
  },
  {
    id: "demo-2",
    name: "Rooftop Indie Session",
    location_name: "Skyline Terrace",
    city: "Hamburg",
    event_date: "2026-04-20",
    event_time: "19:30",
    genre: "Indie",
    price_text: "25 EUR",
    description: "Live-Bands unter freiem Himmel mit Blick auf den Hafen.",
    lat: 53.5503,
    lng: 9.992
  },
  {
    id: "demo-3",
    name: "Afrobeat & Friends",
    location_name: "Werkhalle 9",
    city: "Cologne",
    event_date: "2026-04-22",
    event_time: "21:00",
    genre: "Afrobeat",
    price_text: "20 EUR",
    description: "Dancefloor-Event mit Live-Percussion und internationalen Acts.",
    lat: 50.9377,
    lng: 6.9603
  },
  {
    id: "demo-4",
    name: "Jazz After Work",
    location_name: "Blue Note Lounge",
    city: "Munich",
    event_date: "2026-04-25",
    event_time: "18:30",
    genre: "Jazz",
    price_text: "Eintritt frei",
    description: "Entspannter Jazz-Abend mit regionalen Ensembles.",
    lat: 48.1373,
    lng: 11.5756
  }
];

const state = {
  allEvents: [],
  filteredEvents: [],
  selectedEventId: null,
  sourceLabel: "Unbekannt"
};

const dom = {
  status: document.getElementById("status"),
  eventList: document.getElementById("eventList"),
  eventDetails: document.getElementById("eventDetails"),
  resultCount: document.getElementById("resultCount"),
  searchInput: document.getElementById("searchInput"),
  cityFilter: document.getElementById("cityFilter"),
  genreFilter: document.getElementById("genreFilter"),
  dateFilter: document.getElementById("dateFilter"),
  resetFilters: document.getElementById("resetFilters")
};

let map;
let markersLayer;
const markersByEventId = new Map();

function setStatus(message, tone = "loading") {
  dom.status.className = `status status--${tone}`;
  dom.status.textContent = message;
}

function normalizeEvent(event, index) {
  const lat = Number(event.lat ?? event.latitude ?? null);
  const lng = Number(event.lng ?? event.longitude ?? null);
  const dateValue = event.event_date || event.date || "";
  const cityValue = event.city || event.location_city || "";
  const genreValue = event.genre || event.music_genre || "";

  return {
    id: String(event.id ?? `event-${index}`),
    name: event.name || event.title || "Unbenanntes Event",
    location_name: event.location_name || event.location || "Unbekannte Location",
    city: cityValue,
    event_date: dateValue,
    event_time: event.event_time || event.time || "",
    genre: genreValue,
    price_text: event.price_text || event.price || "Eintritt frei",
    description: event.description || "Keine Beschreibung vorhanden.",
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null
  };
}

function formatDate(dateString) {
  if (!dateString) return "Datum folgt";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatPrice(priceText) {
  if (!priceText) return "Eintritt frei";
  const normalized = String(priceText).trim().toLowerCase();
  if (normalized === "free" || normalized === "0" || normalized === "0 eur") {
    return "Eintritt frei";
  }
  return String(priceText);
}

function eventSearchText(event) {
  return [
    event.name,
    event.location_name,
    event.city,
    event.genre,
    event.description
  ]
    .join(" ")
    .toLowerCase();
}

function updateFilterOptions() {
  const cities = [...new Set(state.allEvents.map((event) => event.city).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "de")
  );
  const genres = [...new Set(state.allEvents.map((event) => event.genre).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "de")
  );

  dom.cityFilter.innerHTML = '<option value="">Alle Städte</option>';
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    dom.cityFilter.append(option);
  });

  dom.genreFilter.innerHTML = '<option value="">Alle Genres</option>';
  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    dom.genreFilter.append(option);
  });
}

function getActiveFilters() {
  return {
    search: dom.searchInput.value.trim().toLowerCase(),
    city: dom.cityFilter.value,
    genre: dom.genreFilter.value,
    date: dom.dateFilter.value
  };
}

function applyFilters() {
  const filters = getActiveFilters();

  state.filteredEvents = state.allEvents.filter((event) => {
    if (filters.city && event.city !== filters.city) return false;
    if (filters.genre && event.genre !== filters.genre) return false;
    if (filters.date && event.event_date !== filters.date) return false;
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
    `${state.filteredEvents.length} von ${state.allEvents.length} Events (${state.sourceLabel}).`,
    "ok"
  );
}

function createEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card";
  card.dataset.eventId = event.id;

  const header = document.createElement("div");
  header.className = "event-card__header";
  header.innerHTML = `
    <h4>${event.name}</h4>
    <span>${event.genre || "Genre offen"}</span>
  `;

  const meta = document.createElement("div");
  meta.className = "event-card__meta";
  meta.innerHTML = `
    <span>${event.location_name}${event.city ? `, ${event.city}` : ""}</span>
    <span>${formatDate(event.event_date)}${event.event_time ? `, ${event.event_time} Uhr` : ""}</span>
    <span>${formatPrice(event.price_text)}</span>
  `;

  card.append(header, meta);

  card.addEventListener("click", () => {
    selectEvent(event.id, { flyTo: true, openPopup: true });
  });

  return card;
}

function renderEventList() {
  dom.eventList.innerHTML = "";
  dom.resultCount.textContent = `${state.filteredEvents.length} Treffer`;

  if (!state.filteredEvents.length) {
    dom.eventList.innerHTML = '<p class="event-list__empty">Keine Events passend zu den Filtern.</p>';
    dom.eventDetails.className = "event-details event-details--empty";
    dom.eventDetails.textContent = "Keine Eventdetails verfügbar.";
    return;
  }

  state.filteredEvents.forEach((event) => {
    const card = createEventCard(event);
    if (event.id === state.selectedEventId) {
      card.classList.add("event-card--active");
    }
    dom.eventList.append(card);
  });
}

function initMap() {
  map = L.map("map", { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  window.setTimeout(() => {
    map.invalidateSize();
  }, 250);
}

function markerPopupHtml(event) {
  return `
    <div class="popup">
      <strong>${event.name}</strong><br>
      <span>${event.location_name}${event.city ? `, ${event.city}` : ""}</span><br>
      <span>${formatDate(event.event_date)}${event.event_time ? `, ${event.event_time} Uhr` : ""}</span><br>
      <span>${event.genre || "Genre offen"} - ${formatPrice(event.price_text)}</span>
    </div>
  `;
}

function renderMapMarkers() {
  markersLayer.clearLayers();
  markersByEventId.clear();
  const bounds = [];

  state.filteredEvents.forEach((event) => {
    if (event.lat === null || event.lng === null) return;

    const marker = L.marker([event.lat, event.lng], { title: event.name })
      .bindPopup(markerPopupHtml(event))
      .on("click", () => {
        selectEvent(event.id, { flyTo: false, openPopup: false });
      });

    markersLayer.addLayer(marker);
    markersByEventId.set(event.id, marker);
    bounds.push([event.lat, event.lng]);
  });

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  } else {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }
}

function renderEventDetails(event) {
  if (!event) {
    dom.eventDetails.className = "event-details event-details--empty";
    dom.eventDetails.textContent = "Wähle ein Event in der Liste oder auf der Karte aus.";
    return;
  }

  dom.eventDetails.className = "event-details";
  dom.eventDetails.innerHTML = `
    <h4>${event.name}</h4>
    <ul>
      <li><strong>Location:</strong> ${event.location_name}${event.city ? `, ${event.city}` : ""}</li>
      <li><strong>Datum:</strong> ${formatDate(event.event_date)}${event.event_time ? `, ${event.event_time} Uhr` : ""}</li>
      <li><strong>Genre:</strong> ${event.genre || "Genre offen"}</li>
      <li><strong>Preis:</strong> ${formatPrice(event.price_text)}</li>
    </ul>
    <p>${event.description || "Keine Beschreibung vorhanden."}</p>
  `;
}

function selectEvent(eventId, options = { flyTo: false, openPopup: false }) {
  state.selectedEventId = eventId;
  const event = state.filteredEvents.find((item) => item.id === eventId);

  document.querySelectorAll(".event-card").forEach((card) => {
    card.classList.toggle("event-card--active", card.dataset.eventId === eventId);
  });

  renderEventDetails(event || null);

  if (!event) return;

  const marker = markersByEventId.get(event.id);
  if (marker && event.lat !== null && event.lng !== null) {
    if (options.flyTo) {
      map.flyTo([event.lat, event.lng], 13, { duration: 0.6 });
    }
    if (options.openPopup) {
      marker.openPopup();
    }
  }
}

function resetFilters() {
  dom.searchInput.value = "";
  dom.cityFilter.value = "";
  dom.genreFilter.value = "";
  dom.dateFilter.value = "";
  state.selectedEventId = null;
  applyFilters();
  renderEventDetails(null);
}

function bindEvents() {
  const inputs = [dom.searchInput, dom.cityFilter, dom.genreFilter, dom.dateFilter];
  inputs.forEach((input) => input.addEventListener("input", applyFilters));
  dom.cityFilter.addEventListener("change", applyFilters);
  dom.genreFilter.addEventListener("change", applyFilters);
  dom.resetFilters.addEventListener("click", resetFilters);
}

async function fetchEventsFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_URL.includes("supabase.co")) {
    throw new Error("Supabase-URL ist ungültig.");
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("[hier deinen anon key einsetzen]")) {
    throw new Error("Supabase-Anon-Key fehlt. Bitte in app.js eintragen.");
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeEvent);
}

async function loadEvents() {
  setStatus("Lade Events aus Supabase...", "loading");

  try {
    const data = await fetchEventsFromSupabase();

    if (!data.length) {
      state.allEvents = demoEvents.map(normalizeEvent);
      state.sourceLabel = "Demo-Fallback (keine Datensätze in Supabase)";
      setStatus("Keine Supabase-Events gefunden. Demo-Events geladen.", "warning");
      return;
    }

    state.allEvents = data;
    state.sourceLabel = "Supabase";
    setStatus(`Supabase verbunden. ${data.length} Events geladen.`, "ok");
  } catch (error) {
    console.error("Supabase Fehler:", error);
    state.allEvents = demoEvents.map(normalizeEvent);
    state.sourceLabel = "Demo-Fallback (Supabase Fehler)";
    setStatus(`Supabase nicht verfügbar: ${error.message}. Demo-Events aktiv.`, "warning");
  }
}

async function startApp() {
  initMap();
  bindEvents();
  await loadEvents();
  updateFilterOptions();
  applyFilters();
  renderEventDetails(null);
}

startApp();
