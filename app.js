const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
const APP_BUILD_VERSION = "2026.04.08-7";
const ADMIN_REQUIRED_ROLE = "admin";
const USE_MODERATION_EDGE_FUNCTION = false;
const MODERATION_EDGE_FUNCTION_NAME = "moderate-event";
const ENABLE_AUTO_GEOCODING = true;

window.PARTYRADAR_CACHE_BUSTER = APP_BUILD_VERSION;

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
    hero_title: "Finde, wo Musik wirklich passiert.",
    hero_subtitle: "Lokale Acts, Events und besondere Orte – alles auf einer Karte.",
    hero_chip_fallback: "Live Daten + Fallback",
    hero_chip_vibe: "Beach, City & Lifestyle",
    hero_search_label: "Suche",
    hero_search_placeholder: "Ort, Event oder Genre suchen",
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
    button_all: "Alle",
    submit_cta: "Event einreichen",
    form_title: "Event einreichen",
    form_hint: "Dein Event wird eingereicht und vor Veröffentlichung geprüft.",
    form_submit: "Event einreichen",
    form_loading: "Speichere...",
    form_success: "Dein Event wurde eingereicht und wird vor der Veröffentlichung geprüft.",
    form_error_generic: "Event konnte nicht gespeichert werden.",
    form_notice_geocoding_failed: "Adresse gespeichert, automatische Geocodierung war nicht möglich.",
    admin_title: "Moderation",
    admin_subtitle: "Prüfe eingereichte Events und entscheide über Veröffentlichung.",
    admin_pending_count: "{count} ausstehend",
    admin_no_pending: "Keine ausstehenden Einreichungen.",
    admin_submitted_by: "Eingereicht von",
    admin_contact: "Kontakt",
    admin_notes: "Prüfnotiz",
    admin_notes_placeholder: "Optional: Grund / Hinweis",
    admin_action_approve: "Freigeben",
    admin_action_reject: "Ablehnen",
    admin_update_success_approved: "Event wurde freigegeben.",
    admin_update_success_rejected: "Event wurde abgelehnt.",
    admin_update_error: "Moderation konnte nicht gespeichert werden.",
    admin_mode_active: "Admin-Modus aktiv: pending Events können moderiert werden.",
    admin_login_title: "Admin Login",
    admin_login_hint: "Mit deiner Admin-E-Mail anmelden, um Events zu moderieren.",
    admin_login_email_label: "Admin E-Mail",
    admin_login_email_placeholder: "z. B. admin@deinedomain.com",
    admin_login_submit: "Login-Link senden",
    admin_logout: "Abmelden",
    admin_auth_required: "Admin-Authentifizierung erforderlich.",
    admin_role_required: "Admin-Rolle erforderlich.",
    admin_logged_in_as: "Angemeldet als {email}",
    admin_login_sent: "Login-Link wurde versendet. Bitte E-Mail prüfen.",
    admin_login_error: "Login konnte nicht gestartet werden.",
    admin_session_error: "Admin-Session konnte nicht geprüft werden.",
    form_error_required: "Bitte Pflichtfelder ausfüllen.",
    form_error_email: "Bitte eine gültige E-Mail-Adresse angeben.",
    form_error_geocode_pending: "Adresse gespeichert. Koordinaten werden bei der Freigabe ergänzt.",
    form_label_name: "Name",
    form_label_location_name: "Location",
    form_label_address: "Adresse",
    form_label_city: "Stadt",
    form_label_country: "Land",
    form_label_event_date: "Datum",
    form_label_event_time: "Uhrzeit",
    form_label_genre: "Genre",
    form_label_price_text: "Preis",
    form_label_description: "Beschreibung",
    form_label_submitted_by: "Eingereicht von",
    form_label_contact_email: "Kontakt E-Mail",
    form_placeholder_name: "z. B. Summer Beats Night",
    form_placeholder_location_name: "z. B. Beach Club",
    form_placeholder_address: "z. B. Paseo Marítimo 1",
    form_placeholder_city: "z. B. Marbella",
    form_placeholder_country: "z. B. Spanien",
    form_placeholder_event_time: "z. B. 20:30",
    form_placeholder_genre: "z. B. Latin, DJ Set",
    form_placeholder_price_text: "z. B. 25 EUR",
    form_placeholder_description: "Kurzbeschreibung des Events",
    create_title: "Neues Event",
    create_toggle: "Event hinzufügen",
    create_name: "Name",
    create_location: "Location",
    create_city: "Stadt",
    create_country: "Land",
    create_date: "Datum",
    create_time: "Uhrzeit",
    create_genre: "Genre",
    create_price: "Preistext",
    create_lat: "Latitude",
    create_lng: "Longitude",
    create_description: "Beschreibung",
    create_submit: "Speichern"
  },
  en: {
    hero_title: "Find where music truly happens.",
    hero_subtitle: "Local artists, events and unique places – all on one map.",
    hero_chip_fallback: "Live data + fallback",
    hero_chip_vibe: "Beach, City & Lifestyle",
    hero_search_label: "Search",
    hero_search_placeholder: "Search city, event or genre",
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
    button_all: "All",
    submit_cta: "Submit event",
    form_title: "Submit event",
    form_hint: "Your event will be reviewed before publication.",
    form_submit: "Submit event",
    form_loading: "Saving...",
    form_success: "Your event was submitted and will be reviewed before it is published.",
    form_error_generic: "Event could not be saved.",
    form_notice_geocoding_failed: "Address saved, but automatic geocoding was not possible.",
    admin_title: "Moderation",
    admin_subtitle: "Review submitted events and decide publication.",
    admin_pending_count: "{count} pending",
    admin_no_pending: "No pending submissions.",
    admin_submitted_by: "Submitted by",
    admin_contact: "Contact",
    admin_notes: "Review note",
    admin_notes_placeholder: "Optional: reason / note",
    admin_action_approve: "Approve",
    admin_action_reject: "Reject",
    admin_update_success_approved: "Event approved.",
    admin_update_success_rejected: "Event rejected.",
    admin_update_error: "Moderation update failed.",
    admin_mode_active: "Admin mode active: pending events can be moderated.",
    admin_login_title: "Admin login",
    admin_login_hint: "Sign in with your admin email to moderate events.",
    admin_login_email_label: "Admin email",
    admin_login_email_placeholder: "e.g. admin@yourdomain.com",
    admin_login_submit: "Send login link",
    admin_logout: "Logout",
    admin_auth_required: "Admin authentication required.",
    admin_role_required: "Admin role required.",
    admin_logged_in_as: "Logged in as {email}",
    admin_login_sent: "Login link sent. Please check your inbox.",
    admin_login_error: "Could not start login.",
    admin_session_error: "Could not validate admin session.",
    form_error_required: "Please fill in required fields.",
    form_error_email: "Please enter a valid email address.",
    form_error_geocode_pending: "Address saved. Coordinates can be added during moderation.",
    form_label_name: "Name",
    form_label_location_name: "Location",
    form_label_address: "Address",
    form_label_city: "City",
    form_label_country: "Country",
    form_label_event_date: "Date",
    form_label_event_time: "Time",
    form_label_genre: "Genre",
    form_label_price_text: "Price",
    form_label_description: "Description",
    form_label_submitted_by: "Submitted by",
    form_label_contact_email: "Contact email",
    form_placeholder_name: "e.g. Summer Beats Night",
    form_placeholder_location_name: "e.g. Beach Club",
    form_placeholder_address: "e.g. Paseo Maritimo 1",
    form_placeholder_city: "e.g. Marbella",
    form_placeholder_country: "e.g. Spain",
    form_placeholder_event_time: "e.g. 20:30",
    form_placeholder_genre: "e.g. Latin, DJ Set",
    form_placeholder_price_text: "e.g. 25 EUR",
    form_placeholder_description: "Short event description",
    create_title: "New event",
    create_toggle: "Add event",
    create_name: "Name",
    create_location: "Location",
    create_city: "City",
    create_country: "Country",
    create_date: "Date",
    create_time: "Time",
    create_genre: "Genre",
    create_price: "Price text",
    create_lat: "Latitude",
    create_lng: "Longitude",
    create_description: "Description",
    create_submit: "Save"
  },
  es: {
    hero_title: "Descubre dónde realmente suena la música.",
    hero_subtitle: "Artistas locales, eventos y lugares únicos – todo en un solo mapa.",
    hero_chip_fallback: "Datos en vivo + fallback",
    hero_chip_vibe: "Beach, City & Lifestyle",
    hero_search_label: "Buscar",
    hero_search_placeholder: "Buscar ciudad, evento o género",
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
    button_all: "Todos",
    submit_cta: "Enviar evento",
    form_title: "Enviar evento",
    form_hint: "Tu evento será revisado antes de publicarse.",
    form_submit: "Enviar evento",
    form_loading: "Guardando...",
    form_success: "Tu evento fue enviado y será revisado antes de publicarse.",
    form_error_generic: "No se pudo guardar el evento.",
    form_notice_geocoding_failed: "Dirección guardada, pero la geocodificación automática no fue posible.",
    admin_title: "Moderación",
    admin_subtitle: "Revisa eventos enviados y decide su publicación.",
    admin_pending_count: "{count} pendientes",
    admin_no_pending: "No hay envíos pendientes.",
    admin_submitted_by: "Enviado por",
    admin_contact: "Contacto",
    admin_notes: "Nota de revisión",
    admin_notes_placeholder: "Opcional: motivo / nota",
    admin_action_approve: "Aprobar",
    admin_action_reject: "Rechazar",
    admin_update_success_approved: "Evento aprobado.",
    admin_update_success_rejected: "Evento rechazado.",
    admin_update_error: "No se pudo guardar la moderación.",
    admin_mode_active: "Modo admin activo: se pueden moderar eventos pendientes.",
    admin_login_title: "Acceso admin",
    admin_login_hint: "Inicia sesión con tu correo admin para moderar eventos.",
    admin_login_email_label: "Correo admin",
    admin_login_email_placeholder: "p. ej. admin@tudominio.com",
    admin_login_submit: "Enviar enlace de acceso",
    admin_logout: "Cerrar sesión",
    admin_auth_required: "Se requiere autenticación de admin.",
    admin_role_required: "Se requiere rol de admin.",
    admin_logged_in_as: "Conectado como {email}",
    admin_login_sent: "Enlace enviado. Revisa tu correo.",
    admin_login_error: "No se pudo iniciar el acceso.",
    admin_session_error: "No se pudo validar la sesión de admin.",
    form_error_required: "Completa los campos obligatorios.",
    form_error_email: "Ingresa un correo electrónico válido.",
    form_error_geocode_pending: "Dirección guardada. Las coordenadas se pueden completar durante la moderación.",
    form_label_name: "Nombre",
    form_label_location_name: "Ubicación",
    form_label_address: "Dirección",
    form_label_city: "Ciudad",
    form_label_country: "País",
    form_label_event_date: "Fecha",
    form_label_event_time: "Hora",
    form_label_genre: "Género",
    form_label_price_text: "Precio",
    form_label_description: "Descripción",
    form_label_submitted_by: "Enviado por",
    form_label_contact_email: "Correo de contacto",
    form_placeholder_name: "p. ej. Summer Beats Night",
    form_placeholder_location_name: "p. ej. Beach Club",
    form_placeholder_address: "p. ej. Paseo Marítimo 1",
    form_placeholder_city: "p. ej. Marbella",
    form_placeholder_country: "p. ej. España",
    form_placeholder_event_time: "p. ej. 20:30",
    form_placeholder_genre: "p. ej. Latin, DJ Set",
    form_placeholder_price_text: "p. ej. 25 EUR",
    form_placeholder_description: "Descripción breve del evento",
    create_title: "Nuevo evento",
    create_toggle: "Añadir evento",
    create_name: "Nombre",
    create_location: "Ubicación",
    create_city: "Ciudad",
    create_country: "País",
    create_date: "Fecha",
    create_time: "Hora",
    create_genre: "Género",
    create_price: "Precio",
    create_lat: "Latitud",
    create_lng: "Longitud",
    create_description: "Descripción",
    create_submit: "Guardar"
  }
};

const LOCALE_MAP = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES"
};

const SUPPORTED_LANGUAGES = [
  { code: "de", label: "Deutsch", short: "DE" },
  { code: "en", label: "English", short: "EN" },
  { code: "es", label: "Español", short: "ES" }
];

const state = {
  allEvents: [],
  moderationEvents: [],
  filteredEvents: [],
  selectedEventId: null,
  adminSession: null,
  sourceType: "unknown",
  isAdminMode: false,
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
  languageSwitch: document.getElementById("languageSwitch"),
  heroSearchForm: document.getElementById("heroSearchForm"),
  heroSearchInput: document.getElementById("heroSearchInput"),
  heroCityFilter: document.getElementById("heroCityFilter"),
  heroDateFilter: document.getElementById("heroDateFilter"),
  submitModal: document.getElementById("submitModal"),
  openSubmitModal: document.getElementById("openSubmitModal"),
  closeSubmitModal: document.getElementById("closeSubmitModal"),
  status: document.getElementById("status"),
  eventList: document.getElementById("eventList"),
  eventDetails: document.getElementById("eventDetails"),
  moderationPanel: document.getElementById("moderationPanel"),
  adminAuthGate: document.getElementById("adminAuthGate"),
  adminAuthFeedback: document.getElementById("adminAuthFeedback"),
  adminAuthEmail: document.getElementById("adminAuthEmail"),
  adminAuthForm: document.getElementById("adminAuthForm"),
  adminSignOut: document.getElementById("adminSignOut"),
  moderationWorkspace: document.getElementById("moderationWorkspace"),
  adminSessionInfo: document.getElementById("adminSessionInfo"),
  moderationCount: document.getElementById("moderationCount"),
  moderationFeedback: document.getElementById("moderationFeedback"),
  moderationList: document.getElementById("moderationList"),
  resultCount: document.getElementById("resultCount"),
  filtersForm: document.getElementById("filtersForm"),
  searchInput: document.getElementById("searchInput"),
  cityFilter: document.getElementById("cityFilter"),
  dateFilter: document.getElementById("dateFilter"),
  genreFilterGroup: document.getElementById("genreFilterGroup"),
  clearGenresButton: document.getElementById("clearGenresButton"),
  resetFilters: document.getElementById("resetFilters"),
  eventForm: document.getElementById("eventForm"),
  formFeedback: document.getElementById("formFeedback"),
  formSubmitButton: document.getElementById("formSubmitButton"),
  formName: document.getElementById("formName"),
  formLocationName: document.getElementById("formLocationName"),
  formAddress: document.getElementById("formAddress"),
  formCity: document.getElementById("formCity"),
  formCountry: document.getElementById("formCountry"),
  formDate: document.getElementById("formDate"),
  formTime: document.getElementById("formTime"),
  formGenre: document.getElementById("formGenre"),
  formPrice: document.getElementById("formPrice"),
  formSubmittedBy: document.getElementById("formSubmittedBy"),
  formContactEmail: document.getElementById("formContactEmail"),
  formDescription: document.getElementById("formDescription"),
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

function availableLanguageCodes() {
  return SUPPORTED_LANGUAGES.map((language) => language.code);
}

function resolveLanguageFromBrowser(defaultLang = "de") {
  const candidates = [
    navigator.language,
    ...(Array.isArray(navigator.languages) ? navigator.languages : [])
  ]
    .filter(Boolean)
    .map((lang) => String(lang).toLowerCase());

  for (const candidate of candidates) {
    const shortCode = candidate.split("-")[0];
    if (availableLanguageCodes().includes(shortCode)) {
      return shortCode;
    }
  }

  return defaultLang;
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
  const buildBadge = document.getElementById("buildBadge");
  if (buildBadge) {
    buildBadge.textContent = `Build ${APP_BUILD_VERSION}`;
  }
  renderLanguageControls();
}

function renderLanguageControls() {
  if (dom.languageSwitch) {
    dom.languageSwitch.innerHTML = "";
    SUPPORTED_LANGUAGES.forEach((language) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "language-switch__button";
      button.dataset.langSwitch = language.code;
      button.textContent = language.short;
      const isActive = language.code === state.lang;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
      dom.languageSwitch.append(button);
    });
  }
}

function switchLanguage(nextLangCode) {
  const nextLang = resolveLanguage(nextLangCode);
  if (nextLang === state.lang) return;
  state.lang = nextLang;
  applyStaticTranslations();
  updateFilterOptions();
  syncHeroFilterOptions();
  applyFiltersFromQuery();
  applyFilters();
  if (state.selectedEventId) {
    const selected = state.filteredEvents.find((event) => event.id === state.selectedEventId) || null;
    renderEventDetails(selected);
  } else {
    renderEventDetails(null);
  }
  updateDebugPanel();
  renderModerationPanel();
  updateUrlFromFilters();
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

function setFormFeedback(message, tone = "info") {
  if (!dom.formFeedback) return;
  dom.formFeedback.hidden = !message;
  dom.formFeedback.textContent = message || "";
  dom.formFeedback.className = "add-event-message";
  if (message && tone === "error") dom.formFeedback.classList.add("is-error");
  if (message && tone === "success") dom.formFeedback.classList.add("is-success");
}

function setFormSubmitting(isSubmitting) {
  if (!dom.formSubmitButton) return;
  dom.formSubmitButton.disabled = isSubmitting;
  dom.formSubmitButton.textContent = isSubmitting ? t("form_loading") : t("form_submit");
}

function setModerationFeedback(message, tone = "info") {
  if (!dom.moderationFeedback) return;
  dom.moderationFeedback.hidden = !message;
  dom.moderationFeedback.textContent = message || "";
  dom.moderationFeedback.className = "add-event-message";
  if (message && tone === "error") dom.moderationFeedback.classList.add("is-error");
  if (message && tone === "success") dom.moderationFeedback.classList.add("is-success");
}

function setAdminAuthFeedback(message, tone = "info") {
  if (!dom.adminAuthFeedback) return;
  dom.adminAuthFeedback.hidden = !message;
  dom.adminAuthFeedback.textContent = message || "";
  dom.adminAuthFeedback.className = "add-event-message";
  if (message && tone === "error") dom.adminAuthFeedback.classList.add("is-error");
  if (message && tone === "success") dom.adminAuthFeedback.classList.add("is-success");
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

function normalizeStatus(statusValue) {
  const normalized = String(statusValue || "").trim().toLowerCase();
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  if (normalized === "pending") return "pending";
  return "approved";
}

function isApprovedEvent(event) {
  return normalizeStatus(event.status) === "approved";
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
    status: normalizeStatus(event.status),
    contact_email: event.contact_email || "",
    submitted_by: event.submitted_by || "",
    verification_notes: event.verification_notes || "",
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null
  };
}

function readFormPayload() {
  return {
    name: dom.formName.value.trim(),
    location_name: dom.formLocationName.value.trim(),
    address: dom.formAddress?.value.trim() || "",
    city: dom.formCity.value.trim(),
    country: dom.formCountry.value.trim(),
    event_date: dom.formDate.value,
    event_time: dom.formTime.value,
    genre: dom.formGenre.value.trim(),
    price_text: dom.formPrice.value.trim(),
    submitted_by: dom.formSubmittedBy.value.trim(),
    contact_email: dom.formContactEmail.value.trim(),
    description: dom.formDescription.value.trim(),
    lat: null,
    lng: null
  };
}

function validateFormPayload(payload) {
  const requiredFilled =
    payload.name &&
    payload.location_name &&
    payload.address &&
    payload.city &&
    payload.event_date &&
    payload.genre &&
    payload.submitted_by &&
    payload.contact_email;
  if (!requiredFilled) {
    return { valid: false, message: t("form_error_required") };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.contact_email)) {
    return { valid: false, message: t("form_error_email") };
  }
  return { valid: true, message: "" };
}

function clearEventForm() {
  if (!dom.eventForm) return;
  dom.eventForm.reset();
}

function buildInsertPayload(payload) {
  // Address is collected now; geocoding can later resolve this into coordinates.
  const geocoding_query = [payload.location_name, payload.address, payload.city, payload.country]
    .filter(Boolean)
    .join(", ");

  return {
    name: payload.name,
    location_name: payload.location_name,
    address: payload.address || null,
    city: payload.city,
    country: payload.country || null,
    event_date: payload.event_date,
    event_time: payload.event_time || null,
    genre: payload.genre,
    price_text: payload.price_text || null,
    description: payload.description || null,
    contact_email: payload.contact_email,
    submitted_by: payload.submitted_by,
    status: "pending",
    verification_notes: null,
    geocoding_query: geocoding_query || null,
    lat: payload.lat,
    lng: payload.lng
  };
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
      "User-Agent": "PartyRadar/1.0 (event-submission geocoding)"
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
  return { lat, lng };
}

async function resolveCoordinatesForPayload(payload) {
  if (!ENABLE_AUTO_GEOCODING) return payload;
  const query = [payload.location_name, payload.address, payload.city, payload.country]
    .filter(Boolean)
    .join(", ");
  if (!query) return payload;

  try {
    const coordinates = await geocodeAddressWithNominatim(query);
    if (!coordinates) return payload;
    return {
      ...payload,
      lat: coordinates.lat,
      lng: coordinates.lng
    };
  } catch (error) {
    console.warn("[PartyRadar Debug] Geocoding failed:", error);
    return payload;
  }
}

async function insertEventWithSchemaFallback(client, payload) {
  const tableName = state.debug.tableName || "events";
  const tryInsert = async (row) =>
    client.from(tableName).insert([row]).select("*").single();

  const primary = await tryInsert(payload);
  if (!primary.error) return primary;

  const errorMessage = String(primary.error.message || "");
  const missingAddressColumn =
    /could not find the 'address' column/i.test(errorMessage) ||
    /column ["']address["'] does not exist/i.test(errorMessage);
  const missingGeocodingQueryColumn =
    /could not find the 'geocoding_query' column/i.test(errorMessage) ||
    /column ["']geocoding_query["'] does not exist/i.test(errorMessage);

  if (!missingAddressColumn && !missingGeocodingQueryColumn) return primary;

  const fallbackPayload = { ...payload };
  if (missingAddressColumn) {
    delete fallbackPayload.address;
  }
  if (missingAddressColumn || missingGeocodingQueryColumn) {
    delete fallbackPayload.geocoding_query;
  }
  const fallback = await tryInsert(fallbackPayload);

  return fallback.error
    ? primary
    : {
        data: fallback.data,
        error: null
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
  if (state.isAdminMode) return "ok";
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
    admin: params.get("admin") || "",
    genres: (params.get("genres") || "")
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean)
  };
}

function resolveAdminMode(queryValue) {
  return queryValue === "1" || queryValue === "true";
}

function updateUrlFromFilters() {
  const params = new URLSearchParams();
  const search = dom.searchInput.value.trim();
  const city = dom.cityFilter.value;
  const date = dom.dateFilter.value;

  if (state.lang !== "de") params.set("lang", state.lang);
  if (state.isAdminMode) params.set("admin", "1");
  if (search) params.set("q", search);
  if (city) params.set("city", city);
  if (date) params.set("date", date);
  if (state.activeGenres.size) params.set("genres", [...state.activeGenres].join(","));

  const queryString = params.toString();
  const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
  window.history.replaceState({}, "", nextUrl);
}

function supabaseClient() {
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function sessionAdminRole(session) {
  return String(session?.user?.app_metadata?.role || "").trim().toLowerCase();
}

function isSessionAdmin(session) {
  return sessionAdminRole(session) === ADMIN_REQUIRED_ROLE.toLowerCase();
}

function renderAdminAuthState(session) {
  const adminEnabled = state.isAdminMode;
  const isAuthedAdmin = isSessionAdmin(session);
  const hasSession = Boolean(session?.user?.id);
  if (dom.moderationPanel) {
    dom.moderationPanel.hidden = !adminEnabled;
  }
  if (dom.adminAuthGate) {
    dom.adminAuthGate.hidden = isAuthedAdmin || !adminEnabled;
  }
  if (dom.moderationWorkspace) {
    dom.moderationWorkspace.hidden = !isAuthedAdmin || !adminEnabled;
  }
  if (dom.adminSignOut) {
    dom.adminSignOut.hidden = !isAuthedAdmin;
  }
  if (dom.adminAuthForm) {
    dom.adminAuthForm.hidden = isAuthedAdmin;
  }
  if (dom.adminSessionInfo) {
    dom.adminSessionInfo.textContent = isAuthedAdmin
      ? t("admin_logged_in_as", { email: session.user.email || "-" })
      : hasSession
        ? t("admin_role_required")
        : t("admin_auth_required");
  }
}

async function checkAdminSession() {
  if (!state.isAdminMode) return null;
  try {
    const client = supabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const session = data?.session || null;
    state.adminSession = session;
    renderAdminAuthState(session);
    if (session && !isSessionAdmin(session)) {
      setAdminAuthFeedback(t("admin_role_required"), "error");
    }
    if (!isSessionAdmin(session)) {
      state.moderationEvents = [];
      renderModerationPanel();
    }
    return session;
  } catch (error) {
    console.error("Admin session check failed:", error);
    state.adminSession = null;
    renderAdminAuthState(null);
    setAdminAuthFeedback(t("admin_session_error"), "error");
    return null;
  }
}

function renderModerationPanel() {
  if (!dom.moderationPanel || !dom.moderationList || !dom.moderationCount) return;
  if (!state.isAdminMode || !isSessionAdmin(state.adminSession)) return;

  const pendingEvents = state.moderationEvents.filter((event) => event.status === "pending");
  dom.moderationCount.textContent = t("admin_pending_count", { count: pendingEvents.length });
  dom.moderationList.innerHTML = "";

  if (!pendingEvents.length) {
    dom.moderationList.innerHTML = `<p class="admin-empty">${t("admin_no_pending")}</p>`;
    return;
  }

  pendingEvents.forEach((event) => {
    const card = document.createElement("article");
    card.className = "admin-card";
    card.dataset.eventId = event.id;
    card.innerHTML = `
      <h4>${event.name}</h4>
      <div class="admin-card__meta">
        <span>${event.location_name}${event.city ? `, ${event.city}` : ""}</span>
        <span>${formatDateTime(event)}</span>
        <span>${event.genre || "-"}</span>
        <span>${t("admin_submitted_by")}: ${event.submitted_by || "-"}</span>
        <span>${t("admin_contact")}: ${event.contact_email || "-"}</span>
      </div>
      <label class="field field--full admin-card__notes">
        <span>${t("admin_notes")}</span>
        <textarea data-notes rows="2" placeholder="${t("admin_notes_placeholder")}">${event.verification_notes || ""}</textarea>
      </label>
      <div class="admin-card__actions">
        <button type="button" class="button-secondary button-secondary--approve" data-action="approve">${t("admin_action_approve")}</button>
        <button type="button" class="button-secondary button-secondary--reject" data-action="reject">${t("admin_action_reject")}</button>
      </div>
    `;
    dom.moderationList.append(card);
  });
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
  syncHeroFilterOptions();
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
  syncHeroControlsFromSidebar();
}

function getActiveFilters() {
  return {
    search: dom.searchInput.value.trim().toLowerCase(),
    city: dom.cityFilter.value,
    date: dom.dateFilter.value,
    genres: new Set([...state.activeGenres].map((genre) => genre.toLowerCase()))
  };
}

function syncHeroFilterOptions() {
  if (!dom.heroCityFilter || !dom.heroDateFilter || !dom.cityFilter || !dom.dateFilter) return;

  dom.heroCityFilter.innerHTML = dom.cityFilter.innerHTML;
  dom.heroDateFilter.innerHTML = dom.dateFilter.innerHTML;
  dom.heroCityFilter.value = dom.cityFilter.value;
  dom.heroDateFilter.value = dom.dateFilter.value;
}

function syncHeroControlsFromSidebar() {
  if (dom.heroSearchInput && dom.searchInput) dom.heroSearchInput.value = dom.searchInput.value;
  if (dom.heroCityFilter && dom.cityFilter) dom.heroCityFilter.value = dom.cityFilter.value;
  if (dom.heroDateFilter && dom.dateFilter) dom.heroDateFilter.value = dom.dateFilter.value;
}

function syncSidebarFromHeroControls() {
  if (dom.heroSearchInput && dom.searchInput) dom.searchInput.value = dom.heroSearchInput.value;
  if (dom.heroCityFilter && dom.cityFilter) dom.cityFilter.value = dom.heroCityFilter.value;
  if (dom.heroDateFilter && dom.dateFilter) dom.dateFilter.value = dom.heroDateFilter.value;
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
  syncHeroControlsFromSidebar();
  state.activeGenres.clear();
  renderGenreFilter();
  state.selectedEventId = null;
  applyFilters();
  renderEventDetails(null);
}

function openSubmitModal() {
  if (!dom.submitModal) return;
  dom.submitModal.hidden = false;
  dom.submitModal.setAttribute("aria-hidden", "false");
  dom.submitModal.classList.add("is-open");
  document.body.classList.add("body--modal-open");
  window.setTimeout(() => {
    dom.formName?.focus();
  }, 0);
}

function closeSubmitModal() {
  if (!dom.submitModal) return;
  dom.submitModal.hidden = true;
  dom.submitModal.setAttribute("aria-hidden", "true");
  dom.submitModal.classList.remove("is-open");
  document.body.classList.remove("body--modal-open");
}

async function reloadEventsAndRender() {
  await checkAdminSession();
  await loadEvents();
  updateFilterOptions();
  applyFiltersFromQuery();
  applyFilters();
  renderModerationPanel();
}

async function handleCreateEventSubmit(submitEvent) {
  submitEvent.preventDefault();
  setFormFeedback("");

  const payload = readFormPayload();
  const validation = validateFormPayload(payload);
  if (!validation.valid) {
    setFormFeedback(validation.message, "error");
    return;
  }

  setFormSubmitting(true);
  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const payloadWithCoordinates = await resolveCoordinatesForPayload(payload);
    const insertPayload = buildInsertPayload(payloadWithCoordinates);
    const { data, error } = await insertEventWithSchemaFallback(client, insertPayload);

    console.log("[PartyRadar Debug] Event insert data:", data);
    console.log("[PartyRadar Debug] Event insert error:", error);

    if (error) throw new Error(error.message);

    clearEventForm();
    const geocodingWasMissing =
      ENABLE_AUTO_GEOCODING &&
      payloadWithCoordinates.lat === null &&
      payloadWithCoordinates.lng === null;
    setFormFeedback(
      geocodingWasMissing ? t("form_notice_geocoding_failed") : t("form_success"),
      "success"
    );
    await reloadEventsAndRender();
    window.setTimeout(closeSubmitModal, 1800);
  } catch (error) {
    console.error("Event speichern fehlgeschlagen:", error);
    setFormFeedback(`${t("form_error_generic")} ${error.message || ""}`.trim(), "error");
  } finally {
    setFormSubmitting(false);
  }
}

async function updateModerationStatus(eventId, nextStatus, verificationNotes) {
  const session = await checkAdminSession();
  if (!isSessionAdmin(session)) {
    throw new Error(session ? t("admin_role_required") : t("admin_auth_required"));
  }
  const client = supabaseClient();
  const payload = {
    status: nextStatus,
    verification_notes: verificationNotes || null
  };

  if (USE_MODERATION_EDGE_FUNCTION) {
    const { data, error } = await client.functions.invoke(MODERATION_EDGE_FUNCTION_NAME, {
      body: {
        event_id: eventId,
        status: payload.status,
        verification_notes: payload.verification_notes
      }
    });
    console.log("[PartyRadar Debug] Moderation edge data:", data);
    console.log("[PartyRadar Debug] Moderation edge error:", error);
    if (error) throw new Error(error.message);
    return;
  }

  const { data, error } = await client
    .from(state.debug.tableName || "events")
    .update(payload)
    .eq("id", eventId)
    .select("*")
    .single();

  console.log("[PartyRadar Debug] Moderation update data:", data);
  console.log("[PartyRadar Debug] Moderation update error:", error);
  if (error) throw new Error(error.message);
}

function bindEvents() {
  dom.filtersForm.addEventListener("submit", (event) => event.preventDefault());
  if (dom.heroSearchForm) {
    dom.heroSearchForm.addEventListener("submit", (event) => event.preventDefault());
  }
  dom.searchInput.addEventListener("input", () => {
    syncHeroControlsFromSidebar();
    applyFilters();
  });
  dom.cityFilter.addEventListener("change", () => {
    syncHeroControlsFromSidebar();
    applyFilters();
  });
  dom.dateFilter.addEventListener("change", () => {
    syncHeroControlsFromSidebar();
    applyFilters();
  });
  if (dom.heroSearchInput) {
    dom.heroSearchInput.addEventListener("input", () => {
      syncSidebarFromHeroControls();
      applyFilters();
    });
  }
  if (dom.heroCityFilter) {
    dom.heroCityFilter.addEventListener("change", () => {
      syncSidebarFromHeroControls();
      applyFilters();
    });
  }
  if (dom.heroDateFilter) {
    dom.heroDateFilter.addEventListener("change", () => {
      syncSidebarFromHeroControls();
      applyFilters();
    });
  }
  if (dom.languageSwitch) {
    dom.languageSwitch.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-lang-switch]");
      if (!button) return;
      switchLanguage(button.dataset.langSwitch);
    });
  }
  if (dom.openSubmitModal) {
    dom.openSubmitModal.addEventListener("click", () => {
      setFormFeedback("");
      openSubmitModal();
    });
  }
  if (dom.closeSubmitModal) {
    dom.closeSubmitModal.addEventListener("click", (event) => {
      event.preventDefault();
      closeSubmitModal();
    });
  }
  if (dom.submitModal) {
    dom.submitModal.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const clickedBackdrop = target?.classList.contains("modal");
      if (clickedBackdrop || (target && target.closest("[data-modal-close]"))) {
        closeSubmitModal();
      }
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dom.submitModal && !dom.submitModal.hidden) {
      closeSubmitModal();
    }
  });
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

  if (dom.eventForm) {
    dom.eventForm.addEventListener("submit", handleCreateEventSubmit);
  }
  if (dom.adminAuthForm) {
    dom.adminAuthForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!dom.adminAuthEmail) return;
      const email = dom.adminAuthEmail.value.trim().toLowerCase();
      if (!email) return;
      setAdminAuthFeedback("");
      try {
        const client = supabaseClient();
        const { error } = await client.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.href
          }
        });
        if (error) throw error;
        setAdminAuthFeedback(t("admin_login_sent"), "success");
      } catch (error) {
        console.error("Admin login failed:", error);
        setAdminAuthFeedback(
          `${t("admin_login_error")} ${error?.message || ""}`.trim(),
          "error"
        );
      }
    });
  }
  if (dom.adminSignOut) {
    dom.adminSignOut.addEventListener("click", async () => {
      try {
        const client = supabaseClient();
        await client.auth.signOut();
        state.adminSession = null;
        setAdminAuthFeedback("");
        setModerationFeedback("");
        renderAdminAuthState(null);
        renderModerationPanel();
      } catch (error) {
        console.error("Admin logout failed:", error);
      }
    });
  }
  if (dom.moderationList) {
    dom.moderationList.addEventListener("click", async (event) => {
      const actionButton = event.target.closest("button[data-action]");
      if (!actionButton) return;
      const action = actionButton.dataset.action;
      const card = actionButton.closest(".admin-card");
      if (!card) return;
      const eventId = card.dataset.eventId;
      if (!eventId) return;

      const notesInput = card.querySelector("textarea[data-notes]");
      const verificationNotes = notesInput ? notesInput.value.trim() : "";
      const nextStatus = action === "approve" ? "approved" : "rejected";

      actionButton.disabled = true;
      setModerationFeedback("");
      try {
        await updateModerationStatus(eventId, nextStatus, verificationNotes);
        setModerationFeedback(
          nextStatus === "approved" ? t("admin_update_success_approved") : t("admin_update_success_rejected"),
          "success"
        );
        await reloadEventsAndRender();
      } catch (error) {
        console.error("Moderation fehlgeschlagen:", error);
        setModerationFeedback(`${t("admin_update_error")} ${error.message || ""}`.trim(), "error");
      } finally {
        actionButton.disabled = false;
      }
    });
  }
}

async function fetchEventsFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_URL.includes("supabase.co")) {
    throw new Error("Supabase-URL ist ungültig.");
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("[hier deinen anon key einsetzen]")) {
    throw new Error("Supabase-Anon-Key fehlt. Bitte in app.js eintragen.");
  }

  const client = supabaseClient();
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
      state.moderationEvents = [];
      state.sourceType = "demo-no-data";
      state.debug.fallbackReason = t("debug_note_no_data");
      setStatus(t("status_no_data"), "warning");
      updateDebugPanel();
      return;
    }

    state.moderationEvents = isSessionAdmin(state.adminSession) ? data : [];
    state.allEvents = data.filter(isApprovedEvent);
    state.sourceType = "supabase";
    state.debug.fallbackReason = t("debug_note_supabase");
    if (state.isAdminMode && isSessionAdmin(state.adminSession)) {
      setStatus(t("admin_mode_active"), "ok");
    } else {
      setStatus(t("status_connected", { count: state.allEvents.length }), "ok");
    }
    updateDebugPanel();
  } catch (error) {
    console.error("Supabase Fehler:", error);
    state.allEvents = demoEvents.map(normalizeEvent);
    state.moderationEvents = [];
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
  const requestedLang = resolveLanguage(query.lang);
  state.lang = query.lang ? requestedLang : resolveLanguageFromBrowser(requestedLang);
  state.isAdminMode = resolveAdminMode(query.admin);
  applyStaticTranslations();
  renderAdminAuthState(null);
  renderEventDetails(null);

  initMap();
  bindEvents();
  await checkAdminSession();
  await loadEvents();
  updateFilterOptions();
  applyFiltersFromQuery();
  syncHeroControlsFromSidebar();
  applyFilters();
  renderModerationPanel();
}

startApp();
