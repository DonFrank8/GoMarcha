const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
const APP_BUILD_VERSION = "2026.04.08-14";
const ADMIN_REQUIRED_ROLE = "admin";
const USE_MODERATION_EDGE_FUNCTION = false;
const MODERATION_EDGE_FUNCTION_NAME = "moderate-event";
const ENABLE_AUTO_GEOCODING = true;
const GEOCODING_PROVIDER = "nominatim";
const GEOCODING_MIN_INTERVAL_MS = 850;
const GEOCODING_MAX_RETRIES = 2;
const MAPBOX_ACCESS_TOKEN = (window.PARTYRADAR_MAPBOX_TOKEN || "").toString().trim();
const EVENT_IMAGES_BUCKET = "event-images";
const MAX_EVENT_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EVENT_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DEFAULT_NAVIGATION_PROVIDER = "google";
const GOOGLE_PLACES_API_KEY = (window.PARTYRADAR_GOOGLE_PLACES_KEY || "").toString().trim();
const GOOGLE_PLACES_AUTOCOMPLETE_DEBOUNCE_MS = 380;
const GOOGLE_PLACES_AUTOCOMPLETE_MIN_CHARS = 3;
const BETA_FEEDBACK_EMAIL = "beta@marcha.app";
const FAVORITES_STORAGE_KEY = "vibeon_event_favorites";
const SUBMITTER_PROFILE_STORAGE_KEY = "vibeon.submitterProfile.v1";
const INSTALL_BANNER_DISMISS_STORAGE_KEY = "vibeon.installBanner.dismissedUntil";
const INSTALL_BANNER_INSTALLED_STORAGE_KEY = "vibeon.installBanner.installedUntil";
const MOBILE_INSTALL_CTA_DISMISS_STORAGE_KEY = "vibeon.installCta.dismissedUntil";
const USER_LOCATION_STORAGE_KEY = "vibeon.userLocation.v1";
const INSTALL_BANNER_DISMISS_DAYS = 5;
const INSTALL_BANNER_INSTALLED_DAYS = 180;
const MOBILE_INSTALL_CTA_DISMISS_DAYS = 21;
const USER_LOCATION_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const INSTALL_BANNER_SHOW_DELAY_MS = 2800;
const ENABLE_LEGACY_INSTALL_BANNER = false;
const INSTALL_UI_DEBUG = true;

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
  "Rock",
  "Electro",
  "House",
  "Techno",
  "R&B",
  "Flamenco",
  "DJ",
  "Live Music",
  "Jazz",
  "Pop",
  "Bachata",
  "Reggaeton",
  "Hip-Hop",
  "Live Band",
  "DJ Set"
];

const GENRE_ICON_MAP = {
  Latin: "💃",
  Salsa: "🕺",
  Rock: "🎸",
  Electro: "⚡",
  House: "🏠",
  Techno: "🔊",
  "R&B": "🎶",
  Flamenco: "🌹",
  DJ: "🎛️",
  "Live Music": "🥁",
  Jazz: "🎷",
  Pop: "🎤",
  Bachata: "💞",
  Reggaeton: "🔥",
  "Hip-Hop": "🧢",
  "Live Band": "🥁",
  "DJ Set": "🎛️"
};

const QUICK_CATEGORY_DEFINITIONS = [
  {
    id: "all",
    labelKey: "quick_all",
    keywords: []
  },
  {
    id: "house",
    labelKey: "quick_house",
    keywords: ["house", "tech house", "deep house", "electro", "dj"]
  },
  {
    id: "latino",
    labelKey: "quick_latino",
    keywords: ["latin", "salsa", "bachata", "reggaeton", "latino"]
  },
  {
    id: "live-band",
    labelKey: "quick_live_band",
    keywords: ["live band", "live music", "band", "rock", "jazz", "flamenco", "acoustic"]
  },
  {
    id: "beach",
    labelKey: "quick_beach",
    keywords: ["beach", "sunset", "coast", "seaside", "ocean", "pool"]
  },
  {
    id: "dj",
    labelKey: "quick_dj",
    keywords: ["dj", "dj set", "techno", "electro", "afterhours"]
  }
];

const MAP_SHEET_STATE_ORDER = ["full", "half", "peek"];
const MAP_SHEET_DEFAULT_STATE = "half";
const MAP_SHEET_DRAG_THRESHOLD = 56;
const MAP_SHEET_VELOCITY_THRESHOLD = 0.55;
const MAP_SEARCH_AREA_MOVE_THRESHOLD_RATIO = 0.18;
const RECURRENCE_OCCURRENCE_HORIZON_DAYS = 60;
const RECURRENCE_MAX_OCCURRENCES_PER_EVENT = 64;
const RECURRENCE_TYPE_NONE = "none";
const RECURRENCE_TYPE_WEEKLY = "weekly";
const RECURRENCE_TYPE_MONTHLY = "monthly";
const WEEKDAYS = Object.freeze({
  de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
});
const RECURRING_LABELS = Object.freeze({
  de: { weekly: "Jeden", monthly: "Jeden" },
  en: { weekly: "Every", monthly: "Every" },
  es: { weekly: "Cada", monthly: "Cada" }
});
const RECURRING_FALLBACK_LABELS = Object.freeze({
  de: { weekly: "Jede Woche", monthly: "Jeden Monat", until: "bis", generic: "Wiederkehrendes Event" },
  en: { weekly: "Every week", monthly: "Every month", until: "until", generic: "Recurring event" },
  es: { weekly: "Cada semana", monthly: "Cada mes", until: "hasta", generic: "Evento recurrente" }
});
const WEEKDAY_NAME_TO_INDEX = Object.freeze({
  sunday: 0,
  sonntag: 0,
  domingo: 0,
  monday: 1,
  montag: 1,
  lunes: 1,
  tuesday: 2,
  dienstag: 2,
  martes: 2,
  wednesday: 3,
  mittwoch: 3,
  miercoles: 3,
  thursday: 4,
  donnerstag: 4,
  jueves: 4,
  friday: 5,
  freitag: 5,
  viernes: 5,
  saturday: 6,
  samstag: 6,
  sabado: 6
});
const SHEET_SNAP_VISUAL_MS = 220;
const VIEW_TRANSITION_MS = 360;
const TAP_FEEDBACK_MS = 180;
const PRESS_FEEDBACK_SELECTOR = [
  ".button-secondary",
  ".button-link",
  ".quick-category-chip",
  ".view-toggle__button",
  ".map-sheet-chip",
  ".bottom-nav__item",
  ".location-chip",
  ".language-switch__button",
  ".event-card",
  ".featured-card",
  ".modal__close"
].join(", ");
const TAP_FEEDBACK_SELECTOR = `${PRESS_FEEDBACK_SELECTOR}, .event-card__favorite, .marker-pin`;
const TRANSITION_STATE_CLASSES = ["is-transitioning", "is-transitioning-to-map", "is-transitioning-to-list"];
const DATE_PRESET_IDS = Object.freeze({
  TODAY: "today",
  TOMORROW: "tomorrow",
  THIS_WEEKEND: "this-weekend",
  NEXT_WEEKEND: "next-weekend",
  CUSTOM: "custom"
});
const NEARBY_RADIUS_OPTIONS = Object.freeze([5, 10, 25, 50]);
const DEFAULT_NEARBY_RADIUS_KM = 10;

const NAVIGATION_URL_BUILDERS = {
  google: {
    byCoordinates: ({ lat, lng }) =>
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}&travelmode=driving`,
    byAddress: (query) =>
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`
  },
  apple: {
    byCoordinates: ({ lat, lng }) =>
      `https://maps.apple.com/?daddr=${encodeURIComponent(`${lat},${lng}`)}&dirflg=d`,
    byAddress: (query) => `https://maps.apple.com/?daddr=${encodeURIComponent(query)}&dirflg=d`
  },
  waze: {
    byCoordinates: ({ lat, lng }) => `https://waze.com/ul?ll=${encodeURIComponent(`${lat},${lng}`)}&navigate=yes`,
    byAddress: (query) => `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`
  }
};

const I18N = {
  de: {
    hero_title: "Erlebe die besten Events in deiner Nähe",
    hero_subtitle: "Live Musik, DJs und besondere Locations – alles an einem Ort.",
    hero_beta_label: "Early Access",
    hero_value_proposition: "Finde heute Live-Musik, DJs und besondere Spots in deiner Nähe.",
    hero_first_open_text: "Marcha zeigt dir kuratierte Events auf Karte und in Liste. Als App bist du mit einem Tap wieder drin.",
    hero_discover_cta: "Jetzt entdecken",
    hero_feedback_cta: "Beta-Feedback senden",
    hero_location_label: "In deiner Nähe",
    hero_chip_fallback: "Live-Momente entdecken",
    hero_chip_vibe: "Live Music • Beach • Lifestyle",
    featured_title: "Featured heute",
    view_list: "Liste",
    featured_open: "Mehr Infos",
    view_map: "Karte",
    nav_discover: "Entdecken",
    nav_map: "Karte",
    nav_submit: "Einreichen",
    sheet_title: "Events in deiner Nahe",
    sheet_sort_nearby: "Nahe",
    sheet_sort_soonest: "Bald",
    sheet_filter: "Filter",
    sheet_search_placeholder: "Im Bereich suchen...",
    map_search_area: "In diesem Bereich suchen",
    map_search_loading: "Suche...",
    quick_all: "Alle",
    quick_house: "House",
    quick_latino: "Latino",
    quick_live_band: "Live Band",
    quick_beach: "Beach",
    quick_dj: "DJ",
    hero_search_label: "Suche",
    hero_search_placeholder: "Events, Künstler, Locations suchen...",
    discover_title: "Musik in deiner Nähe entdecken",
    discover_subtitle: "Suche nach Events, Bands, DJs und Locations in deiner Nähe.",
    filter_search: "Suche",
    filter_search_placeholder: "Events, Künstler, Locations suchen...",
    filter_city: "Stadt",
    filter_city_all: "Alle Städte",
    filter_date: "Datum",
    filter_date_all: "Alle Daten",
    filter_time: "Zeitraum",
    filter_time_today: "Heute",
    filter_time_tomorrow: "Morgen",
    filter_time_this_weekend: "Dieses Wochenende",
    filter_time_next_weekend: "Nächstes Wochenende",
    filter_time_custom: "Datum wählen",
    filter_time_custom_start: "Von",
    filter_time_custom_end: "Bis",
    filter_nearby_toggle: "In meiner Nähe",
    filter_nearby_radius: "Radius",
    filter_nearby_hint: "Standortzugriff aktivieren, um Nähe-Filter zu nutzen.",
    filter_genre: "Genres",
    filter_genre_all: "Alle Genres",
    filter_reset: "Alle Filter zurücksetzen",
    list_title: "Für dich entdeckt",
    debug_title: "Debug-Modus",
    debug_table: "Tabelle:",
    debug_loaded: "Geladene Events:",
    debug_error: "Fehler:",
    debug_note: "Hinweis:",
    result_count: "{count} Treffer",
    status_loading: "Events werden geladen...",
    status_connected: "{count} Events verfügbar.",
    status_no_data: "Aktuell sind keine Events verfügbar.",
    status_error: "Events konnten aktuell nicht geladen werden.",
    status_filtered: "{shown} von {total} Events",
    source_supabase: "Live",
    source_demo_no_data: "Keine Live-Daten",
    source_demo_error: "Temporäre Daten",
    no_events_found: "Keine passenden Vibes gefunden.",
    details_empty: "Wähle ein Event aus, um Details, Bild und Route zu sehen.",
    details_location: "Location",
    details_date: "Datum",
    details_genre: "Genre",
    details_price: "Preis",
    details_navigate: "Route starten",
    details_free: "Eintritt frei",
    details_no_description: "Keine Beschreibung vorhanden.",
    details_time_fallback: "Uhrzeit folgt",
    distance_under_1km: "unter 1 km",
    distance_km_away: "{distance} km entfernt",
    navigation_unavailable: "Für dieses Event sind keine Navigationsdaten vorhanden.",
    debug_no_error: "Nein",
    debug_note_pending: "Noch keine Entscheidung",
    debug_note_supabase: "Live-Daten aktiv",
    debug_note_no_data: "Keine Live-Daten gefunden",
    debug_note_error: "Live-Daten derzeit nicht erreichbar",
    button_all: "Alle",
    submit_cta: "Event hinzufügen",
    feedback_cta: "Feedback senden",
    feedback_email_subject: "Marcha Beta Feedback",
    feedback_email_body: "Hi Marcha Team,%0A%0Amein Feedback zur Beta:%0A",
    admin_quick_access: "Admin",
    form_title: "Event hinzufügen",
    form_hint: "Dein Event wird eingereicht und vor Veröffentlichung kuratiert.",
    form_submit: "Event hinzufügen",
    form_loading: "Speichere...",
    form_success: "Dein Event wurde eingereicht und wird vor der Veröffentlichung geprüft.",
    form_error_generic: "Event konnte nicht gespeichert werden.",
    form_error_rls_submit:
      "Zugriff durch Datenbank-Sicherheitsregel (RLS) blockiert. Bitte supabase-rls.sql ausführen/aktualisieren, damit pending Einreichungen erlaubt sind.",
    form_error_geocoding_failed: "Adresse konnte nicht geokodiert werden. Bitte Eingabe prüfen.",
    form_error_image_required: "Bitte ein Hauptbild auswählen.",
    form_error_image_type: "Bitte ein gültiges Bild (JPG, PNG oder WebP) auswählen.",
    form_error_image_size: "Das Bild ist zu groß. Maximal 5 MB erlaubt.",
    form_error_image_upload: "Bild-Upload fehlgeschlagen. Bitte erneut versuchen.",
    form_error_image_cleanup: "Hinweis: Das hochgeladene Bild konnte nicht automatisch bereinigt werden.",
    admin_title: "Moderation",
    admin_subtitle: "Prüfe Einreichungen und entscheide, was im Marcha Feed sichtbar wird.",
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
    admin_geo_label: "Koordinaten",
    admin_geo_ok: "vorhanden",
    admin_geo_missing: "fehlt",
    admin_geo_unknown: "unbekannt",
    admin_mode_active: "Admin-Modus aktiv: Pending Events können moderiert werden.",
    admin_login_title: "Admin Login",
    admin_login_hint: "Melde dich mit Admin-E-Mail und Passwort an, um Einreichungen zu moderieren.",
    admin_login_email_label: "Admin E-Mail",
    admin_login_email_placeholder: "z. B. admin@deinedomain.com",
    admin_login_password_label: "Passwort",
    admin_login_password_placeholder: "Dein Passwort",
    admin_login_submit: "Mit Passwort anmelden",
    admin_logout: "Abmelden",
    admin_auth_required: "Admin-Authentifizierung erforderlich.",
    admin_role_required: "Admin-Rolle erforderlich.",
    admin_logged_in_as: "Angemeldet als {email}",
    admin_login_sent: "Login-Link wurde versendet. Bitte E-Mail prüfen.",
    admin_login_success: "Login erfolgreich.",
    admin_login_error: "Login fehlgeschlagen.",
    admin_session_error: "Admin-Session konnte nicht geprüft werden.",
    form_error_required: "Bitte Pflichtfelder ausfüllen.",
    form_error_email: "Bitte eine gültige E-Mail-Adresse angeben.",
    form_error_recurrence_start_required: "Bitte Startdatum für wiederkehrende Events angeben.",
    form_error_recurrence_time_required: "Bitte Uhrzeit für wiederkehrende Events angeben.",
    form_error_recurrence_weekday_required: "Bitte Wochentag für wöchentliche Wiederholung wählen.",
    form_error_recurrence_day_of_month_required: "Bitte Tag im Monat für monatliche Wiederholung angeben.",
    form_error_recurrence_end_before_start: "Enddatum darf nicht vor Startdatum liegen.",
    form_error_recurrence_day_of_month_invalid: "Tag im Monat muss zwischen 1 und 31 liegen.",
    form_error_recurrence_schema_missing:
      "Wiederkehrende Events sind noch nicht freigeschaltet. Bitte zuerst supabase-rls.sql mit Recurrence-Spalten in Supabase ausführen.",
    form_error_geocode_pending: "Adresse gespeichert. Koordinaten werden bei der Freigabe ergänzt.",
    form_section_event_details: "Event Details",
    form_section_submitter_details: "Deine Angaben",
    form_label_name: "Event Name",
    form_label_location_name: "Location",
    form_label_address: "Adresse",
    form_label_postal_code: "PLZ",
    form_label_city: "Stadt",
    form_label_country: "Land",
    form_label_event_date: "Datum",
    form_label_event_time: "Uhrzeit",
    form_label_recurrence_type: "Event-Typ",
    form_recurrence_none: "Einmaliges Event",
    form_recurrence_weekly: "Wöchentlich wiederkehrend",
    form_recurrence_monthly: "Monatlich wiederkehrend",
    form_label_recurrence_start_date: "Startdatum Wiederholung",
    form_label_recurrence_end_date: "Enddatum Wiederholung (optional)",
    form_label_recurrence_weekday: "Wochentag",
    form_label_recurrence_day_of_month: "Tag im Monat",
    form_recurrence_weekday_choose: "Wochentag wählen",
    weekday_monday: "Montag",
    weekday_tuesday: "Dienstag",
    weekday_wednesday: "Mittwoch",
    weekday_thursday: "Donnerstag",
    weekday_friday: "Freitag",
    weekday_saturday: "Samstag",
    weekday_sunday: "Sonntag",
    form_label_genre: "Genre",
    form_label_main_artist: "Künstler",
    form_label_additional_artists: "Weitere Künstler (optional)",
    form_label_price_text: "Preis (EUR)",
    form_label_description: "Beschreibung",
    form_label_main_image: "Hauptbild (optional)",
    form_label_submitted_by: "Dein Name (Einreicher)",
    form_label_contact_email: "Kontakt E-Mail",
    form_hint_main_image: "1 Bild (JPG/PNG/WebP), max. 5 MB",
    form_hint_gallery_premium: "Weitere Bilder und erweiterte Galerie kommen in der bezahlten Version.",
    form_hint_price_eur: "Bitte Betrag in Euro angeben, z. B. 25 oder 25 EUR.",
    form_placeholder_name: "z. B. Summer Beats Night",
    form_placeholder_location_name: "z. B. Beach Club",
    form_placeholder_address: "z. B. Paseo Marítimo 1",
    form_placeholder_postal_code: "z. B. 29660",
    form_placeholder_city: "z. B. Marbella",
    form_placeholder_country: "z. B. Spanien",
    form_placeholder_event_time: "z. B. 20:30",
    form_placeholder_genre: "z. B. Latin, DJ Set",
    form_placeholder_additional_artists: "z. B. DJ X, Live Band Y",
    form_placeholder_price_text: "z. B. 25 EUR",
    form_placeholder_description: "Kurzbeschreibung des Events",
    install_banner_title: "Marcha installieren",
    install_banner_text_ios: "In Safari öffnen, auf Teilen tippen und „Zum Home-Bildschirm“ wählen.",
    install_banner_text_android_prompt: "Installiere Marcha für schnelleren Zugriff direkt vom Homescreen.",
    install_banner_text_android_manual: "Über das Browser-Menü „Zum Startbildschirm hinzufügen“ auswählen.",
    install_banner_cta: "Installieren",
    install_banner_dismiss: "Später",
    install_mobile_title: "Marcha als App",
    install_mobile_hint_android: "Direkt vom Homescreen öffnen – schnell und ohne Browserleiste.",
    install_mobile_hint_ios: "Tippe auf Teilen und dann „Zum Home-Bildschirm“.",
    install_mobile_android_helper: "Im Browser-Menü „Zum Startbildschirm hinzufügen“ auswählen.",
    install_mobile_ios_helper: "Safari: Teilen → „Zum Home-Bildschirm“.",
    install_mobile_cta: "Installieren",
    install_mobile_dismiss: "Später",
    create_title: "Neues Event",
    create_toggle: "Event hinzufügen",
    create_name: "Name",
    create_location: "Location",
    create_postal_code: "PLZ",
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
    hero_title: "Discover the best events near you",
    hero_subtitle: "Live music, DJs and unique venues – all in one place.",
    hero_beta_label: "Early Access",
    hero_value_proposition: "Find live music, DJs and unique spots happening near you today.",
    hero_first_open_text: "Marcha helps you discover curated events on map and list. Install it for instant one-tap access.",
    hero_discover_cta: "Start discovering",
    hero_feedback_cta: "Send beta feedback",
    hero_location_label: "Near you",
    hero_chip_fallback: "Discover live moments",
    hero_chip_vibe: "Live Music • Beach • Lifestyle",
    featured_title: "Featured events",
    view_list: "List",
    featured_open: "Details",
    view_map: "Map",
    nav_discover: "Discover",
    nav_map: "Map",
    nav_submit: "Submit",
    sheet_title: "Events near you",
    sheet_sort_nearby: "Nearby",
    sheet_sort_soonest: "Soonest",
    sheet_filter: "Filter",
    sheet_search_placeholder: "Search in this area...",
    map_search_area: "Search this area",
    map_search_loading: "Searching...",
    quick_all: "All",
    quick_house: "House",
    quick_latino: "Latino",
    quick_live_band: "Live Band",
    quick_beach: "Beach",
    quick_dj: "DJ",
    hero_search_label: "Search",
    hero_search_placeholder: "Search events, artists, locations...",
    discover_title: "Discover music near you",
    discover_subtitle: "Discover events, bands, DJs and venues near you.",
    filter_search: "Search",
    filter_search_placeholder: "Search events, artists, locations...",
    filter_city: "City",
    filter_city_all: "All cities",
    filter_date: "Date",
    filter_date_all: "All dates",
    filter_time: "Time",
    filter_time_today: "Today",
    filter_time_tomorrow: "Tomorrow",
    filter_time_this_weekend: "This weekend",
    filter_time_next_weekend: "Next weekend",
    filter_time_custom: "Pick date",
    filter_time_custom_start: "Start",
    filter_time_custom_end: "End",
    filter_nearby_toggle: "Near me",
    filter_nearby_radius: "Radius",
    filter_nearby_hint: "Enable location access to use nearby filtering.",
    filter_genre: "Genres",
    filter_genre_all: "All genres",
    filter_reset: "Reset all filters",
    list_title: "Curated for you",
    debug_title: "Debug mode",
    debug_table: "Table:",
    debug_loaded: "Loaded events:",
    debug_error: "Error:",
    debug_note: "Note:",
    result_count: "{count} results",
    status_loading: "Loading events...",
    status_connected: "{count} events available.",
    status_no_data: "No events are currently available.",
    status_error: "Events could not be loaded right now.",
    status_filtered: "{shown} of {total} events",
    source_supabase: "Live",
    source_demo_no_data: "No live data",
    source_demo_error: "Temporary data",
    no_events_found: "No matching vibes found.",
    details_empty: "Select an event to view details, image and directions.",
    details_location: "Location",
    details_date: "Date",
    details_genre: "Genre",
    details_price: "Price",
    details_navigate: "Start route",
    details_free: "Free entry",
    details_no_description: "No description available.",
    details_time_fallback: "Time TBD",
    distance_under_1km: "under 1 km",
    distance_km_away: "{distance} km away",
    navigation_unavailable: "No navigation data is available for this event.",
    debug_no_error: "No",
    debug_note_pending: "No decision yet",
    debug_note_supabase: "Live data active",
    debug_note_no_data: "No live data found",
    debug_note_error: "Live data currently unavailable",
    button_all: "All",
    submit_cta: "Add your event",
    feedback_cta: "Send feedback",
    feedback_email_subject: "Marcha Beta Feedback",
    feedback_email_body: "Hi Marcha Team,%0A%0Amy beta feedback:%0A",
    admin_quick_access: "Admin",
    form_title: "Add your event",
    form_hint: "Your event will be reviewed and curated before publication.",
    form_submit: "Add your event",
    form_loading: "Saving...",
    form_success: "Your event was submitted and will be reviewed before it is published.",
    form_error_generic: "Event could not be saved.",
    form_error_rls_submit:
      "Permission denied by database security (RLS). Please run/update supabase-rls.sql to allow pending event submissions.",
    form_error_geocoding_failed: "Address could not be geocoded. Please check your input.",
    form_error_image_required: "Please select a main image.",
    form_error_image_type: "Please upload a valid image (JPG, PNG, or WebP).",
    form_error_image_size: "The image is too large. Maximum is 5 MB.",
    form_error_image_upload: "Image upload failed. Please try again.",
    form_error_image_cleanup: "Note: Uploaded image could not be cleaned up automatically.",
    admin_title: "Moderation",
    admin_subtitle: "Review submissions and decide what appears in the Marcha feed.",
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
    admin_geo_label: "Coordinates",
    admin_geo_ok: "present",
    admin_geo_missing: "missing",
    admin_geo_unknown: "unknown",
    admin_mode_active: "Admin mode active: pending events can be moderated.",
    admin_login_title: "Admin login",
    admin_login_hint: "Sign in with admin email and password to moderate submissions.",
    admin_login_email_label: "Admin email",
    admin_login_email_placeholder: "e.g. admin@yourdomain.com",
    admin_login_password_label: "Password",
    admin_login_password_placeholder: "Your password",
    admin_login_submit: "Sign in with password",
    admin_logout: "Logout",
    admin_auth_required: "Admin authentication required.",
    admin_role_required: "Admin role required.",
    admin_logged_in_as: "Logged in as {email}",
    admin_login_sent: "Login link sent. Please check your inbox.",
    admin_login_success: "Login successful.",
    admin_login_error: "Login failed.",
    admin_session_error: "Could not validate admin session.",
    form_error_required: "Please fill in required fields.",
    form_error_email: "Please enter a valid email address.",
    form_error_recurrence_start_required: "Please provide a recurrence start date.",
    form_error_recurrence_time_required: "Please provide a start time for recurring events.",
    form_error_recurrence_weekday_required: "Please choose a weekday for weekly recurrence.",
    form_error_recurrence_day_of_month_required: "Please provide a day of month for monthly recurrence.",
    form_error_recurrence_end_before_start: "Recurrence end date cannot be before start date.",
    form_error_recurrence_day_of_month_invalid: "Day of month must be between 1 and 31.",
    form_error_recurrence_schema_missing:
      "Recurring events are not enabled yet. Please run supabase-rls.sql in Supabase to add recurrence columns first.",
    form_error_geocode_pending: "Address saved. Coordinates can be added during moderation.",
    form_section_event_details: "Event Details",
    form_section_submitter_details: "Your Details",
    form_label_name: "Event Name",
    form_label_location_name: "Location",
    form_label_address: "Address",
    form_label_postal_code: "Postal code",
    form_label_city: "City",
    form_label_country: "Country",
    form_label_event_date: "Date",
    form_label_event_time: "Time",
    form_label_recurrence_type: "Event type",
    form_recurrence_none: "One-time event",
    form_recurrence_weekly: "Recurring weekly",
    form_recurrence_monthly: "Recurring monthly",
    form_label_recurrence_start_date: "Recurrence start date",
    form_label_recurrence_end_date: "Recurrence end date (optional)",
    form_label_recurrence_weekday: "Weekday",
    form_label_recurrence_day_of_month: "Day of month",
    form_recurrence_weekday_choose: "Choose weekday",
    weekday_monday: "Monday",
    weekday_tuesday: "Tuesday",
    weekday_wednesday: "Wednesday",
    weekday_thursday: "Thursday",
    weekday_friday: "Friday",
    weekday_saturday: "Saturday",
    weekday_sunday: "Sunday",
    form_label_genre: "Genre",
    form_label_main_artist: "Artist",
    form_label_additional_artists: "Additional artists (optional)",
    form_label_price_text: "Price (EUR)",
    form_label_description: "Description",
    form_label_main_image: "Main image (optional)",
    form_label_submitted_by: "Your Name (Submitter)",
    form_label_contact_email: "Contact email",
    form_hint_main_image: "1 image (JPG/PNG/WebP), max. 5 MB",
    form_hint_gallery_premium: "More images and an advanced gallery are coming in the paid version.",
    form_hint_price_eur: "Please enter amount in euros, e.g. 25 or 25 EUR.",
    form_placeholder_name: "e.g. Summer Beats Night",
    form_placeholder_location_name: "e.g. Beach Club",
    form_placeholder_address: "e.g. Paseo Maritimo 1",
    form_placeholder_postal_code: "e.g. 29660",
    form_placeholder_city: "e.g. Marbella",
    form_placeholder_country: "e.g. Spain",
    form_placeholder_event_time: "e.g. 20:30",
    form_placeholder_genre: "e.g. Latin, DJ Set",
    form_placeholder_additional_artists: "e.g. DJ X, Live Band Y",
    form_placeholder_price_text: "e.g. 25 EUR",
    form_placeholder_description: "Short event description",
    install_banner_title: "Install Marcha",
    install_banner_text_ios: "Open in Safari, tap Share, then choose Add to Home Screen.",
    install_banner_text_android_prompt: "Install Marcha for faster access from your home screen.",
    install_banner_text_android_manual: "Use your browser menu and choose Add to Home screen.",
    install_banner_cta: "Install",
    install_banner_dismiss: "Not now",
    install_mobile_title: "Install Marcha app",
    install_mobile_hint_android: "Open Marcha faster from your home screen in app mode.",
    install_mobile_hint_ios: "Tap Share and then Add to Home Screen.",
    install_mobile_android_helper: "Use your browser menu and choose Add to Home screen.",
    install_mobile_ios_helper: "In Safari: tap Share, then Add to Home Screen.",
    install_mobile_cta: "Install app",
    install_mobile_dismiss: "Not now",
    create_title: "New event",
    create_toggle: "Add event",
    create_name: "Name",
    create_location: "Location",
    create_postal_code: "Postal code",
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
    hero_title: "Encuentra la mejor marcha cerca de ti",
    hero_subtitle: "Música en vivo, DJs y lugares únicos – todo en un solo lugar.",
    hero_beta_label: "Acceso anticipado",
    hero_value_proposition: "Encuentra hoy música en vivo, DJs y lugares únicos cerca de ti.",
    hero_first_open_text: "Marcha te muestra eventos seleccionados en mapa y lista. Instálala para volver con un solo toque.",
    hero_discover_cta: "Descubrir ahora",
    hero_feedback_cta: "Enviar feedback beta",
    hero_location_label: "Cerca de ti",
    hero_chip_fallback: "Descubre momentos en vivo",
    hero_chip_vibe: "Live Music • Beach • Lifestyle",
    featured_title: "Destacados de hoy",
    view_list: "Lista",
    featured_open: "Más info",
    view_map: "Mapa",
    nav_discover: "Descubrir",
    nav_map: "Mapa",
    nav_submit: "Enviar",
    sheet_title: "Eventos cerca de ti",
    sheet_sort_nearby: "Cerca",
    sheet_sort_soonest: "Pronto",
    sheet_filter: "Filtros",
    sheet_search_placeholder: "Buscar en esta zona...",
    map_search_area: "Buscar en esta zona",
    map_search_loading: "Buscando...",
    quick_all: "Todo",
    quick_house: "House",
    quick_latino: "Latino",
    quick_live_band: "Live Band",
    quick_beach: "Beach",
    quick_dj: "DJ",
    hero_search_label: "Buscar",
    hero_search_placeholder: "Busca eventos, artistas, ubicaciones...",
    discover_title: "Descubre música cerca de ti",
    discover_subtitle: "Descubre eventos, bandas, DJs y venues cerca de ti.",
    filter_search: "Buscar",
    filter_search_placeholder: "Busca eventos, artistas, ubicaciones...",
    filter_city: "Ciudad",
    filter_city_all: "Todas las ciudades",
    filter_date: "Fecha",
    filter_date_all: "Todas las fechas",
    filter_time: "Periodo",
    filter_time_today: "Hoy",
    filter_time_tomorrow: "Mañana",
    filter_time_this_weekend: "Este fin de semana",
    filter_time_next_weekend: "Próximo fin de semana",
    filter_time_custom: "Elegir fecha",
    filter_time_custom_start: "Desde",
    filter_time_custom_end: "Hasta",
    filter_nearby_toggle: "Cerca de mí",
    filter_nearby_radius: "Radio",
    filter_nearby_hint: "Activa la ubicación para usar el filtro cercano.",
    filter_genre: "Géneros",
    filter_genre_all: "Todos los géneros",
    filter_reset: "Restablecer filtros",
    list_title: "Seleccionado para ti",
    debug_title: "Modo debug",
    debug_table: "Tabla:",
    debug_loaded: "Eventos cargados:",
    debug_error: "Error:",
    debug_note: "Nota:",
    result_count: "{count} resultados",
    status_loading: "Cargando eventos...",
    status_connected: "{count} eventos disponibles.",
    status_no_data: "Actualmente no hay eventos disponibles.",
    status_error: "No se pudieron cargar eventos en este momento.",
    status_filtered: "{shown} de {total} eventos",
    source_supabase: "Live",
    source_demo_no_data: "Sin datos en vivo",
    source_demo_error: "Datos temporales",
    no_events_found: "No se encontraron vibes para tu búsqueda.",
    details_empty: "Selecciona un evento para ver detalles, imagen y ruta.",
    details_location: "Ubicación",
    details_date: "Fecha",
    details_genre: "Género",
    details_price: "Precio",
    details_navigate: "Iniciar ruta",
    details_free: "Entrada gratuita",
    details_no_description: "No hay descripción disponible.",
    details_time_fallback: "Hora por confirmar",
    distance_under_1km: "menos de 1 km",
    distance_km_away: "a {distance} km",
    navigation_unavailable: "No hay datos de navegación disponibles para este evento.",
    debug_no_error: "No",
    debug_note_pending: "Sin decisión todavía",
    debug_note_supabase: "Datos en vivo activos",
    debug_note_no_data: "No se encontraron datos en vivo",
    debug_note_error: "Datos en vivo no disponibles temporalmente",
    button_all: "Todos",
    submit_cta: "Añade tu evento",
    feedback_cta: "Enviar feedback",
    feedback_email_subject: "Feedback Beta Marcha",
    feedback_email_body: "Hola equipo Marcha,%0A%0Ami feedback de la beta:%0A",
    admin_quick_access: "Admin",
    form_title: "Añade tu evento",
    form_hint: "Tu evento será revisado y curado antes de publicarse.",
    form_submit: "Añade tu evento",
    form_loading: "Guardando...",
    form_success: "Tu evento fue enviado y será revisado antes de publicarse.",
    form_error_generic: "No se pudo guardar el evento.",
    form_error_rls_submit:
      "Permiso denegado por la seguridad de base de datos (RLS). Ejecuta/actualiza supabase-rls.sql para permitir envíos en estado pending.",
    form_error_geocoding_failed: "No se pudo geocodificar la dirección. Revisa los datos.",
    form_error_image_required: "Selecciona una imagen principal.",
    form_error_image_type: "Sube una imagen válida (JPG, PNG o WebP).",
    form_error_image_size: "La imagen es demasiado grande. Máximo 5 MB.",
    form_error_image_upload: "La carga de imagen falló. Inténtalo de nuevo.",
    form_error_image_cleanup: "Nota: la imagen subida no se pudo limpiar automáticamente.",
    admin_title: "Moderación",
    admin_subtitle: "Revisa envíos y decide qué aparece en el feed de Marcha.",
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
    admin_geo_label: "Coordenadas",
    admin_geo_ok: "disponibles",
    admin_geo_missing: "faltan",
    admin_geo_unknown: "desconocido",
    admin_mode_active: "Modo admin activo: se pueden moderar eventos pendientes.",
    admin_login_title: "Acceso admin",
    admin_login_hint: "Inicia sesión con correo admin y contraseña para moderar envíos.",
    admin_login_email_label: "Correo admin",
    admin_login_email_placeholder: "p. ej. admin@tudominio.com",
    admin_login_password_label: "Contraseña",
    admin_login_password_placeholder: "Tu contraseña",
    admin_login_submit: "Iniciar sesión con contraseña",
    admin_logout: "Cerrar sesión",
    admin_auth_required: "Se requiere autenticación de admin.",
    admin_role_required: "Se requiere rol de admin.",
    admin_logged_in_as: "Conectado como {email}",
    admin_login_sent: "Enlace enviado. Revisa tu correo.",
    admin_login_success: "Inicio de sesión correcto.",
    admin_login_error: "No se pudo iniciar sesión.",
    admin_session_error: "No se pudo validar la sesión de admin.",
    form_error_required: "Completa los campos obligatorios.",
    form_error_email: "Ingresa un correo electrónico válido.",
    form_error_recurrence_start_required: "Indica la fecha de inicio para eventos recurrentes.",
    form_error_recurrence_time_required: "Indica la hora para eventos recurrentes.",
    form_error_recurrence_weekday_required: "Elige un día de la semana para recurrencia semanal.",
    form_error_recurrence_day_of_month_required: "Indica el día del mes para recurrencia mensual.",
    form_error_recurrence_end_before_start: "La fecha de fin no puede ser anterior a la fecha de inicio.",
    form_error_recurrence_day_of_month_invalid: "El día del mes debe estar entre 1 y 31.",
    form_error_recurrence_schema_missing:
      "Los eventos recurrentes aún no están habilitados. Ejecuta supabase-rls.sql en Supabase para agregar primero las columnas de recurrencia.",
    form_error_geocode_pending: "Dirección guardada. Las coordenadas se pueden completar durante la moderación.",
    form_section_event_details: "Detalles del evento",
    form_section_submitter_details: "Tus datos",
    form_label_name: "Nombre del evento",
    form_label_location_name: "Ubicación",
    form_label_address: "Dirección",
    form_label_postal_code: "Código postal",
    form_label_city: "Ciudad",
    form_label_country: "País",
    form_label_event_date: "Fecha",
    form_label_event_time: "Hora",
    form_label_recurrence_type: "Tipo de evento",
    form_recurrence_none: "Evento único",
    form_recurrence_weekly: "Recurrente semanal",
    form_recurrence_monthly: "Recurrente mensual",
    form_label_recurrence_start_date: "Fecha de inicio de recurrencia",
    form_label_recurrence_end_date: "Fecha de fin de recurrencia (opcional)",
    form_label_recurrence_weekday: "Día de la semana",
    form_label_recurrence_day_of_month: "Día del mes",
    form_recurrence_weekday_choose: "Elige día de la semana",
    weekday_monday: "Lunes",
    weekday_tuesday: "Martes",
    weekday_wednesday: "Miércoles",
    weekday_thursday: "Jueves",
    weekday_friday: "Viernes",
    weekday_saturday: "Sábado",
    weekday_sunday: "Domingo",
    form_label_genre: "Género",
    form_label_main_artist: "Artista",
    form_label_additional_artists: "Artistas adicionales (opcional)",
    form_label_price_text: "Precio (EUR)",
    form_label_description: "Descripción",
    form_label_main_image: "Imagen principal (opcional)",
    form_label_submitted_by: "Tu nombre (remitente)",
    form_label_contact_email: "Correo de contacto",
    form_hint_main_image: "1 imagen (JPG/PNG/WebP), máx. 5 MB",
    form_hint_gallery_premium: "Más imágenes y una galería avanzada llegarán en la versión de pago.",
    form_hint_price_eur: "Introduce el importe en euros, p. ej. 25 o 25 EUR.",
    form_placeholder_name: "p. ej. Summer Beats Night",
    form_placeholder_location_name: "p. ej. Beach Club",
    form_placeholder_address: "p. ej. Paseo Marítimo 1",
    form_placeholder_postal_code: "p. ej. 29660",
    form_placeholder_city: "p. ej. Marbella",
    form_placeholder_country: "p. ej. España",
    form_placeholder_event_time: "p. ej. 20:30",
    form_placeholder_genre: "p. ej. Latin, DJ Set",
    form_placeholder_additional_artists: "p. ej. DJ X, Live Band Y",
    form_placeholder_price_text: "p. ej. 25 EUR",
    form_placeholder_description: "Descripción breve del evento",
    install_banner_title: "Instala Marcha",
    install_banner_text_ios: "Ábrelo en Safari, toca Compartir y elige Añadir a pantalla de inicio.",
    install_banner_text_android_prompt: "Instala Marcha para acceder más rápido desde tu pantalla de inicio.",
    install_banner_text_android_manual: "Usa el menú del navegador y selecciona Añadir a pantalla de inicio.",
    install_banner_cta: "Instalar",
    install_banner_dismiss: "Ahora no",
    install_mobile_title: "Marcha como app",
    install_mobile_hint_android: "Abre Marcha más rápido desde tu pantalla de inicio.",
    install_mobile_hint_ios: "Pulsa Compartir y luego Añadir a pantalla de inicio.",
    install_mobile_android_helper: "En el menú del navegador, elige Añadir a pantalla de inicio.",
    install_mobile_ios_helper: "En Safari: pulsa Compartir y luego Añadir a pantalla de inicio.",
    install_mobile_cta: "Instalar app",
    install_mobile_dismiss: "Ahora no",
    create_title: "Nuevo evento",
    create_toggle: "Añadir evento",
    create_name: "Nombre",
    create_location: "Ubicación",
    create_postal_code: "Código postal",
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
  en: "en-GB",
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
  eventsLoaded: false,
  userLocation: null,
  selectedEventId: null,
  activeEventId: null,
  activeEvent: null,
  adminSession: null,
  sourceType: "unknown",
  isAdminMode: false,
  availableGenres: [],
  availableDates: [],
  activeGenres: new Set(),
  dateRange: {
    start: null,
    end: null
  },
  activeDatePreset: "",
  nearbyOnly: false,
  radiusKm: DEFAULT_NEARBY_RADIUS_KM,
  nearbyHintVisible: false,
  locationPermissionState: "unknown",
  discoverySort: "soonest",
  activeQuickCategoryId: "all",
  viewMode: "list",
  mapSheet: {
    enabled: false,
    state: "half",
    snapPx: {
      peek: 0,
      half: 0,
      full: 0
    },
    currentTop: 0,
    snapVisualTimer: null
  },
  mapSearchArea: {
    visible: false,
    loading: false,
    pendingViewportChange: false,
    lastCenter: null,
    lastZoom: null,
    hideTimer: null
  },
  favoriteEventIds: new Set(),
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

const EARTH_RADIUS_KM = 6371;

const dom = {
  htmlRoot: document.documentElement,
  sidebar: document.querySelector(".sidebar"),
  discoverSection: document.getElementById("discoverSection"),
  listSection: document.getElementById("listSection"),
  mapSection: document.getElementById("mapSection"),
  mapSearchAreaCta: document.getElementById("mapSearchAreaCta"),
  mapBottomSheet: document.getElementById("mapBottomSheet"),
  mapBottomSheetHandle: document.getElementById("mapBottomSheetHandle"),
  mapBottomSheetCount: document.getElementById("mapBottomSheetCount"),
  mapSheetSortNearby: document.getElementById("mapSheetSortNearby"),
  mapSheetSortSoonest: document.getElementById("mapSheetSortSoonest"),
  mapSheetFilter: document.getElementById("mapSheetFilter"),
  mapSheetSearchInput: document.getElementById("mapSheetSearchInput"),
  mapSheetCityFilter: document.getElementById("mapSheetCityFilter"),
  mapSheetDateFilter: document.getElementById("mapSheetDateFilter"),
  locationChip: document.getElementById("locationChip"),
  locationChipLabel: document.getElementById("locationChipLabel"),
  openSubmitModalHero: document.getElementById("openSubmitModalHero"),
  bottomNavDiscover: document.getElementById("bottomNavDiscover"),
  bottomNavMap: document.getElementById("bottomNavMap"),
  bottomNavSubmit: document.getElementById("bottomNavSubmit"),
  featuredCarousel: document.getElementById("featuredCarousel"),
  featuredCount: document.getElementById("featuredCount"),
  quickCategoryRail: document.getElementById("quickCategoryRail"),
  viewToggleList: document.getElementById("viewToggleList"),
  viewToggleMap: document.getElementById("viewToggleMap"),
  languageSwitch: document.getElementById("languageSwitch"),
  heroSearchForm: document.getElementById("heroSearchForm"),
  heroSearchInput: document.getElementById("heroSearchInput"),
  heroCityFilter: document.getElementById("heroCityFilter"),
  heroDateFilter: document.getElementById("heroDateFilter"),
  heroDiscoverCta: document.getElementById("heroDiscoverCta"),
  heroFeedbackCta: document.getElementById("heroFeedbackCta"),
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
  adminAuthPassword: document.getElementById("adminAuthPassword"),
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
  timePresetGroup: document.getElementById("timePresetGroup"),
  customDateRange: document.getElementById("customDateRange"),
  dateRangeStart: document.getElementById("dateRangeStart"),
  dateRangeEnd: document.getElementById("dateRangeEnd"),
  nearbyToggle: document.getElementById("nearbyToggle"),
  nearbyRadiusWrap: document.getElementById("nearbyRadiusWrap"),
  nearbyRadiusGroup: document.getElementById("nearbyRadiusGroup"),
  nearbyHint: document.getElementById("nearbyHint"),
  genreFilterGroup: document.getElementById("genreFilterGroup"),
  clearGenresButton: document.getElementById("clearGenresButton"),
  resetFilters: document.getElementById("resetFilters"),
  eventForm: document.getElementById("eventForm"),
  formFeedback: document.getElementById("formFeedback"),
  formSubmitButton: document.getElementById("formSubmitButton"),
  formName: document.getElementById("formName"),
  formLocationName: document.getElementById("formLocationName"),
  formLocationSuggestionList: document.getElementById("formLocationSuggestions"),
  formAddress: document.getElementById("formAddress"),
  formPostalCode: document.getElementById("formPostalCode"),
  formCity: document.getElementById("formCity"),
  formCountry: document.getElementById("formCountry"),
  formDate: document.getElementById("formDate"),
  formEventDateField: document.getElementById("formEventDateField"),
  formTime: document.getElementById("formTime"),
  formEventTimeField: document.getElementById("formEventTimeField"),
  formRecurrenceType: document.getElementById("formRecurrenceType"),
  formRecurrenceStartDateField: document.getElementById("formRecurrenceStartDateField"),
  formRecurrenceStartDate: document.getElementById("formRecurrenceStartDate"),
  formRecurrenceEndDateField: document.getElementById("formRecurrenceEndDateField"),
  formRecurrenceEndDate: document.getElementById("formRecurrenceEndDate"),
  formRecurrenceWeekdayField: document.getElementById("formRecurrenceWeekdayField"),
  formRecurrenceWeekday: document.getElementById("formRecurrenceWeekday"),
  formRecurrenceDayOfMonthField: document.getElementById("formRecurrenceDayOfMonthField"),
  formRecurrenceDayOfMonth: document.getElementById("formRecurrenceDayOfMonth"),
  formGenre: document.getElementById("formGenre"),
  formArtistName: document.getElementById("formArtistName"),
  formAdditionalArtists: document.getElementById("formAdditionalArtists"),
  formPrice: document.getElementById("formPrice"),
  formMainImage: document.getElementById("formMainImage"),
  formSubmittedBy: document.getElementById("formSubmittedBy"),
  formContactEmail: document.getElementById("formContactEmail"),
  formDescription: document.getElementById("formDescription"),
  mobileInstallEntry: document.getElementById("mobileInstallEntry"),
  mobileInstallEntryHint: document.getElementById("mobileInstallEntryHint"),
  mobileInstallEntryCta: document.getElementById("mobileInstallEntryCta"),
  mobileInstallEntryDismiss: document.getElementById("mobileInstallEntryDismiss"),
  mobileInstallEntryHelper: document.getElementById("mobileInstallEntryHelper"),
  installBanner: document.getElementById("installBanner"),
  installBannerText: document.getElementById("installBannerText"),
  installBannerPrimary: document.getElementById("installBannerPrimary"),
  installBannerDismiss: document.getElementById("installBannerDismiss")
};

let map;
let markersLayer;
const markersByEventId = new Map();
const markerEventsById = new Map();
let activeMarkerId = null;
let deferredInstallPromptEvent = null;
let installBannerShowTimer = null;
let serviceWorkerRegistrationPromise = null;
let serviceWorkerHasRefreshed = false;
let locationRequestInFlightPromise = null;
const locationAutocompleteState = {
  enabled: false,
  sessionToken: "",
  selectedPlace: null,
  selectedPredictionId: "",
  searchCounter: 0,
  activeRequestCounter: 0
};
const throttledSelectEventMapFocus = throttle((event, zoom) => {
  flyToEventWithMapSheetOffset(event, zoom);
}, 180);
const debouncedApplyFilters = debounce(() => {
  applyFilters();
}, 90);
const debouncedHandleMapViewportChanged = debounce(() => {
  handleMapViewportChanged();
}, 120);
const throttledFitMapToBounds = throttle((bounds) => {
  if (!map) return;
  if (bounds.length) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  } else {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }
}, 140);

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
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
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

function quickCategoryById(categoryId) {
  return QUICK_CATEGORY_DEFINITIONS.find((category) => category.id === categoryId) || QUICK_CATEGORY_DEFINITIONS[0];
}

function renderQuickCategories() {
  if (!dom.quickCategoryRail) return;
  dom.quickCategoryRail.innerHTML = "";
  QUICK_CATEGORY_DEFINITIONS.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `quick-category-chip ${state.activeQuickCategoryId === category.id ? "is-active" : ""}`;
    button.dataset.quickCategory = category.id;
    button.textContent = t(category.labelKey);
    dom.quickCategoryRail.append(button);
  });
}

function switchLanguage(nextLangCode) {
  const nextLang = resolveLanguage(nextLangCode);
  if (nextLang === state.lang) return;
  state.lang = nextLang;
  applyStaticTranslations();
  updateInstallUiVisibility();
  if (dom.mapBottomSheet) {
    const titleElement = dom.mapBottomSheet.querySelector("[data-i18n='sheet_title']");
    if (titleElement) titleElement.textContent = t("sheet_title");
  }
  renderQuickCategories();
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
  syncMapSheetFilterOptions();
  syncMapSheetControlsFromSidebar();
  updateMapSheetSortControls();
  if (dom.mapSearchAreaCta) {
    dom.mapSearchAreaCta.textContent = state.mapSearchArea.loading
      ? t("map_search_loading")
      : t("map_search_area");
  }
  updateUrlFromFilters();
}

function openBetaFeedback() {
  const subject = encodeURIComponent(t("feedback_email_subject"));
  const body = encodeURIComponent(t("feedback_email_body"));
  window.location.href = `mailto:${BETA_FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}

function getLocale() {
  return LOCALE_MAP[state.lang] || LOCALE_MAP.de;
}

function sanitizeStatusMessage(message) {
  return String(message || "")
    .replace(/\s*\([^)]*supabase[^)]*\)\.?/gi, "")
    .replace(/supabase/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

function applyLegacyUiCleanupOverrides() {
  if (dom.searchInput) {
    dom.searchInput.hidden = true;
    dom.searchInput.setAttribute("aria-hidden", "true");
    dom.searchInput.setAttribute("tabindex", "-1");
    const legacySearchField = dom.searchInput.closest("label.field");
    if (legacySearchField && dom.filtersForm?.contains(legacySearchField)) {
      legacySearchField.hidden = true;
    }
  }

  if (dom.openSubmitModal && dom.sidebar?.contains(dom.openSubmitModal)) {
    dom.openSubmitModal.hidden = true;
  }
}

function setStatus(message, tone = "loading") {
  dom.status.className = `status status--${tone}`;
  dom.status.textContent = sanitizeStatusMessage(message);
  if (dom.sidebar) {
    dom.sidebar.classList.toggle("is-loading-cards", tone === "loading");
  }
}

function setResultCount(count) {
  if (!dom.resultCount) return;
  dom.resultCount.classList.remove("is-updated");
  window.requestAnimationFrame(() => {
    dom.resultCount.classList.add("is-updated");
  });
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

function isRlsInsertError(error) {
  const text = String(error?.message || "").toLowerCase();
  return text.includes("row-level security policy");
}

function setFormSubmitting(isSubmitting) {
  if (!dom.formSubmitButton) return;
  dom.formSubmitButton.disabled = isSubmitting;
  dom.formSubmitButton.textContent = isSubmitting ? t("form_loading") : t("form_submit");
}

function resetRecurrenceSpecificFields() {
  if (dom.formRecurrenceStartDate) dom.formRecurrenceStartDate.value = "";
  if (dom.formRecurrenceEndDate) dom.formRecurrenceEndDate.value = "";
  if (dom.formRecurrenceWeekday) dom.formRecurrenceWeekday.value = "";
  if (dom.formRecurrenceDayOfMonth) dom.formRecurrenceDayOfMonth.value = "";
}

function attachRecurrenceFieldListeners() {
  if (!dom.formRecurrenceType) return;
  dom.formRecurrenceType.addEventListener("change", updateRecurrenceFormState);
  updateRecurrenceFormState();
}

function updateRecurrenceFormState() {
  const recurrenceType = normalizeRecurrenceType(dom.formRecurrenceType?.value || RECURRENCE_TYPE_NONE);
  const isRecurring = recurrenceType !== RECURRENCE_TYPE_NONE;
  const isWeekly = recurrenceType === RECURRENCE_TYPE_WEEKLY;
  const isMonthly = recurrenceType === RECURRENCE_TYPE_MONTHLY;

  if (dom.formEventDateField) dom.formEventDateField.hidden = isRecurring;
  if (dom.formDate) dom.formDate.required = !isRecurring;
  if (dom.formTime) dom.formTime.required = isRecurring;

  if (dom.formRecurrenceStartDateField) dom.formRecurrenceStartDateField.hidden = !isRecurring;
  if (dom.formRecurrenceEndDateField) dom.formRecurrenceEndDateField.hidden = !isRecurring;
  if (dom.formRecurrenceWeekdayField) dom.formRecurrenceWeekdayField.hidden = !isWeekly;
  if (dom.formRecurrenceDayOfMonthField) dom.formRecurrenceDayOfMonthField.hidden = !isMonthly;

  if (dom.formRecurrenceStartDate) dom.formRecurrenceStartDate.required = isRecurring;
  if (dom.formRecurrenceWeekday) {
    dom.formRecurrenceWeekday.required = isWeekly;
    if (!isWeekly) dom.formRecurrenceWeekday.value = "";
  }
  if (dom.formRecurrenceDayOfMonth) {
    dom.formRecurrenceDayOfMonth.required = isMonthly;
    if (!isMonthly) dom.formRecurrenceDayOfMonth.value = "";
  }

  if (!isRecurring) {
    resetRecurrenceSpecificFields();
    return;
  }

  if (dom.formRecurrenceStartDate && !dom.formRecurrenceStartDate.value) {
    dom.formRecurrenceStartDate.value = dom.formDate?.value || "";
  }
}

function normalizeRecurrenceType(rawValue) {
  const normalized = String(rawValue || RECURRENCE_TYPE_NONE).trim().toLowerCase();
  if (normalized === RECURRENCE_TYPE_WEEKLY) return RECURRENCE_TYPE_WEEKLY;
  if (normalized === RECURRENCE_TYPE_MONTHLY) return RECURRENCE_TYPE_MONTHLY;
  return RECURRENCE_TYPE_NONE;
}

function normalizeWeekday(rawValue) {
  const parsed = Number.parseInt(String(rawValue ?? "").trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) return null;
  return parsed;
}

function normalizeDayOfMonth(rawValue) {
  const parsed = Number.parseInt(String(rawValue ?? "").trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) return null;
  return parsed;
}

function parseIsoDateLocal(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatIsoDateLocal(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeWeekdayValue(rawValue) {
  return normalizeWeekday(rawValue);
}

function normalizeDayOfMonthValue(rawValue) {
  return normalizeDayOfMonth(rawValue);
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

function updateDebugPanel() {}

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

function parseCoordinateValue(rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === "") return null;
  const normalized = String(rawValue).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDateWithFallbackYear(rawDate, fallbackYear = null) {
  const value = String(rawDate || "").trim();
  const match = value.match(/^(\d{1,4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const rawYear = Number(match[1]);
  if (!Number.isFinite(rawYear)) return value;
  const month = match[2];
  const day = match[3];
  if (rawYear >= 1000) return `${String(rawYear).padStart(4, "0")}-${month}-${day}`;
  const safeYear = Number.isFinite(fallbackYear) ? fallbackYear : new Date().getFullYear();
  return `${String(safeYear).padStart(4, "0")}-${month}-${day}`;
}

function normalizeEvent(event, index) {
  const lat = parseCoordinateValue(event.lat ?? event.latitude ?? event.latitude_decimal ?? null);
  const lng = parseCoordinateValue(event.lng ?? event.longitude ?? event.longitude_decimal ?? null);
  const address = String(event.address || event.street || "").trim();
  const postal_code = String(event.postal_code || event.zip || "").trim();
  const geocodingQuery = String(event.geocoding_query || "").trim();
  const recurrenceType = normalizeRecurrenceType(event.recurrence_type || RECURRENCE_TYPE_NONE);
  const recurrenceWeekday = normalizeWeekday(event.recurrence_weekday);
  const recurrenceDayOfMonth = normalizeDayOfMonth(event.recurrence_day_of_month);
  const composedAddress = [address, postal_code, event.city, event.country]
    .filter(Boolean)
    .join(", ");
  const normalizedGeocodingQuery = geocodingQuery || composedAddress;
  const createdAtYear = Number.isFinite(new Date(event.created_at || "").getFullYear())
    ? new Date(event.created_at || "").getFullYear()
    : null;
  const normalizedEventDate = normalizeDateWithFallbackYear(event.event_date || event.date || "", createdAtYear);
  const normalizedRecurrenceStartDate = normalizeDateWithFallbackYear(
    event.recurrence_start_date || event.event_date || event.date || "",
    createdAtYear
  );
  const normalizedRecurrenceEndDate = normalizeDateWithFallbackYear(event.recurrence_end_date || "", createdAtYear);

  return {
    id: String(event.id ?? `event-${index}`),
    name: event.name || event.title || "Untitled Event",
    location_name: event.location_name || event.location || "Unknown venue",
    address: event.address || event.street || "",
    postal_code,
    city: event.city || event.location_city || "",
    country: event.country || event.country_name || "",
    event_date: normalizedEventDate,
    event_time: event.event_time || event.time || "",
    genre: event.genre || event.music_genre || "",
    price_text: event.price_text || event.price || t("details_free"),
    description: event.description || t("details_no_description"),
    image_url: event.image_url || event.image || "",
    artist_name: event.artist_name || "",
    address,
    status: normalizeStatus(event.status),
    contact_email: event.contact_email || "",
    submitted_by: event.submitted_by || "",
    verification_notes: event.verification_notes || "",
    geocoding_query: normalizedGeocodingQuery || "",
    recurrence_type: recurrenceType,
    recurrence_start_date: normalizedRecurrenceStartDate,
    recurrence_end_date: normalizedRecurrenceEndDate,
    recurrence_weekday: recurrenceType === RECURRENCE_TYPE_WEEKLY ? recurrenceWeekday : null,
    recurrence_day_of_month: recurrenceType === RECURRENCE_TYPE_MONTHLY ? recurrenceDayOfMonth : null,
    parent_event_id: String(event.parent_event_id || (event.id ?? `event-${index}`)),
    occurrence_date: String(event.occurrence_date || event.event_date || event.date || "").trim() || "",
    occurrence_index: Number(event.occurrence_index || 0),
    is_recurring_occurrence: Boolean(event.is_recurring_occurrence),
    lat,
    lng
  };
}

function readFormPayload() {
  const normalizePriceText = (rawValue) => {
    const raw = String(rawValue || "").trim();
    if (!raw) return "";
    if (/(€|\beur\b)/i.test(raw)) return raw;
    if (/[a-zA-Z]/.test(raw)) return raw;
    return `${raw} EUR`;
  };

  return {
    name: dom.formName.value.trim(),
    location_name: dom.formLocationName.value.trim(),
    address: dom.formAddress?.value.trim() || "",
    postal_code: dom.formPostalCode?.value.trim() || "",
    city: dom.formCity.value.trim(),
    country: dom.formCountry.value.trim(),
    recurrence_type: normalizeRecurrenceType(dom.formRecurrenceType?.value || RECURRENCE_TYPE_NONE),
    recurrence_start_date: dom.formRecurrenceStartDate?.value || "",
    recurrence_end_date: dom.formRecurrenceEndDate?.value || "",
    recurrence_weekday: dom.formRecurrenceWeekday?.value || "",
    recurrence_day_of_month: dom.formRecurrenceDayOfMonth?.value || "",
    event_date: dom.formDate.value,
    event_time: dom.formTime.value,
    genre: dom.formGenre.value.trim(),
    artist_name: dom.formArtistName?.value.trim() || "",
    additional_artists: dom.formAdditionalArtists?.value.trim() || "",
    price_text: normalizePriceText(dom.formPrice.value),
    main_image: dom.formMainImage?.files?.[0] || null,
    submitted_by: dom.formSubmittedBy.value.trim(),
    contact_email: dom.formContactEmail.value.trim(),
    description: dom.formDescription.value.trim(),
    image_url: null,
    place_id: locationAutocompleteState.selectedPlace?.place_id || null,
    formatted_address: locationAutocompleteState.selectedPlace?.formatted_address || null,
    lat: locationAutocompleteState.selectedPlace?.lat || null,
    lng: locationAutocompleteState.selectedPlace?.lng || null
  };
}

function ensureLocationSearchToken() {
  if (locationAutocompleteState.sessionToken) return locationAutocompleteState.sessionToken;
  locationAutocompleteState.sessionToken =
    (window.crypto && typeof window.crypto.randomUUID === "function")
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return locationAutocompleteState.sessionToken;
}

function resetLocationSearchToken() {
  locationAutocompleteState.sessionToken = "";
  locationAutocompleteState.selectedPredictionId = "";
}

function clearLocationSuggestionList() {
  if (!dom.formLocationSuggestionList) return;
  dom.formLocationSuggestionList.innerHTML = "";
  dom.formLocationSuggestionList.hidden = true;
  if (dom.formLocationName) {
    dom.formLocationName.setAttribute("aria-expanded", "false");
  }
}

function hideLocationSuggestionList() {
  clearLocationSuggestionList();
}

function resetLocationSelection() {
  locationAutocompleteState.selectedPlace = null;
  locationAutocompleteState.selectedPredictionId = "";
}

function buildLocationInputSearchText() {
  const locationName = String(dom.formLocationName?.value || "").trim();
  const address = String(dom.formAddress?.value || "").trim();
  const city = String(dom.formCity?.value || "").trim();
  const country = String(dom.formCountry?.value || "").trim();
  return [locationName, address, city, country].filter(Boolean).join(" ").trim();
}

function getTextFromSuggestionText(textValue) {
  if (!textValue) return "";
  if (typeof textValue === "string") return textValue.trim();
  if (typeof textValue?.text === "string") return textValue.text.trim();
  return "";
}

function buildLocationSuggestions(predictions) {
  return (Array.isArray(predictions) ? predictions : [])
    .map((prediction) => {
      const suggestionText = getTextFromSuggestionText(prediction.text || prediction.structuredFormat?.mainText) ||
        String(prediction.description || "").trim();
      const secondaryText = getTextFromSuggestionText(prediction.structuredFormat?.secondaryText);
      const placeId = String(prediction.placeId || "").trim();
      if (!suggestionText || !placeId) return null;
      return {
        placeId,
        suggestionText,
        secondaryText
      };
    })
    .filter(Boolean);
}

function renderLocationSuggestions(items) {
  if (!dom.formLocationSuggestionList) return;
  dom.formLocationSuggestionList.innerHTML = "";
  if (!items.length) {
    dom.formLocationSuggestionList.hidden = true;
    if (dom.formLocationName) {
      dom.formLocationName.setAttribute("aria-expanded", "false");
    }
    return;
  }
  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "location-autocomplete__item";
    button.dataset.placeId = item.placeId;
    button.setAttribute("role", "option");
    const name = document.createElement("span");
    name.className = "location-autocomplete__name";
    name.textContent = item.suggestionText;
    button.append(name);
    if (item.secondaryText) {
      const address = document.createElement("span");
      address.className = "location-autocomplete__address";
      address.textContent = item.secondaryText;
      button.append(address);
    }
    fragment.append(button);
  });
  dom.formLocationSuggestionList.append(fragment);
  dom.formLocationSuggestionList.hidden = false;
  if (dom.formLocationName) {
    dom.formLocationName.setAttribute("aria-expanded", "true");
  }
}

async function fetchGooglePlacesAutocompletePredictions(searchInput) {
  if (!GOOGLE_PLACES_API_KEY) return [];
  const endpoint = "https://places.googleapis.com/v1/places:autocomplete";
  const sessionToken = ensureLocationSearchToken();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY
    },
    body: JSON.stringify({
      input: searchInput,
      languageCode: "de",
      regionCode: "ES",
      sessionToken
    })
  });
  if (!response.ok) {
    throw new Error(`Places autocomplete HTTP ${response.status}`);
  }
  const data = await response.json();
  return buildLocationSuggestions(data?.suggestions?.map((entry) => entry.placePrediction || entry) || []);
}

function extractAddressPart(addressComponents, type) {
  const match = (Array.isArray(addressComponents) ? addressComponents : []).find((part) =>
    Array.isArray(part?.types) && part.types.includes(type)
  );
  return String(match?.longText || match?.shortText || "").trim();
}

function resolveCityFromAddressComponents(addressComponents) {
  return (
    extractAddressPart(addressComponents, "locality")
    || extractAddressPart(addressComponents, "postal_town")
    || extractAddressPart(addressComponents, "administrative_area_level_2")
    || extractAddressPart(addressComponents, "administrative_area_level_1")
  );
}

async function fetchGooglePlaceDetails(placeId) {
  if (!GOOGLE_PLACES_API_KEY) throw new Error("Google Places API key missing");
  const endpoint = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const sessionToken = ensureLocationSearchToken();
  const response = await fetch(endpoint, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,addressComponents,location",
      "X-Goog-Session-Token": sessionToken
    }
  });
  if (!response.ok) {
    throw new Error(`Place details HTTP ${response.status}`);
  }
  const place = await response.json();
  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Place details missing coordinates");
  }
  const addressComponents = place?.addressComponents || [];
  return {
    place_id: String(place?.id || placeId).trim(),
    location_name: String(place?.displayName?.text || "").trim(),
    formatted_address: String(place?.formattedAddress || "").trim(),
    city: resolveCityFromAddressComponents(addressComponents),
    postal_code: extractAddressPart(addressComponents, "postal_code"),
    country: extractAddressPart(addressComponents, "country"),
    lat,
    lng
  };
}

function applySelectedPlaceToForm(placeData) {
  if (dom.formLocationName && placeData.location_name) {
    dom.formLocationName.value = placeData.location_name;
  }
  if (dom.formAddress && placeData.formatted_address) {
    dom.formAddress.value = placeData.formatted_address;
  }
  if (dom.formCity && placeData.city) {
    dom.formCity.value = placeData.city;
  }
  if (dom.formPostalCode && placeData.postal_code) {
    dom.formPostalCode.value = placeData.postal_code;
  }
  if (dom.formCountry && placeData.country) {
    dom.formCountry.value = placeData.country;
  }
  locationAutocompleteState.selectedPlace = placeData;
}

async function handleLocationSuggestionSelection(placeId) {
  if (!placeId) return;
  try {
    const placeData = await fetchGooglePlaceDetails(placeId);
    applySelectedPlaceToForm(placeData);
    hideLocationSuggestionList();
    resetLocationSearchToken();
  } catch (error) {
    console.warn("[Marcha Debug] Place details fetch failed:", error);
    setFormFeedback(t("form_error_geocoding_failed"), "error");
  }
}

const runLocationAutocompleteSearch = debounce(async () => {
  if (!locationAutocompleteState.enabled) return;
  const searchText = buildLocationInputSearchText();
  if (searchText.length < GOOGLE_PLACES_AUTOCOMPLETE_MIN_CHARS) {
    hideLocationSuggestionList();
    return;
  }

  const requestId = ++locationAutocompleteState.searchCounter;
  locationAutocompleteState.activeRequestCounter = requestId;
  try {
    const suggestions = await fetchGooglePlacesAutocompletePredictions(searchText);
    if (requestId !== locationAutocompleteState.activeRequestCounter) return;
    renderLocationSuggestions(suggestions);
  } catch (error) {
    if (requestId !== locationAutocompleteState.activeRequestCounter) return;
    console.warn("[Marcha Debug] Place autocomplete failed:", error);
    hideLocationSuggestionList();
  }
}, GOOGLE_PLACES_AUTOCOMPLETE_DEBOUNCE_MS);

function setupEventLocationAutocomplete() {
  if (
    !dom.formLocationName
    || !dom.formLocationSuggestionList
    || !GOOGLE_PLACES_API_KEY
  ) {
    locationAutocompleteState.enabled = false;
    hideLocationSuggestionList();
    return;
  }
  locationAutocompleteState.enabled = true;
  dom.formLocationName.setAttribute("aria-expanded", "false");
  const locationInputs = [dom.formLocationName, dom.formAddress, dom.formCity, dom.formCountry].filter(Boolean);
  locationInputs.forEach((input) => {
    input.addEventListener("input", () => {
      resetLocationSelection();
      runLocationAutocompleteSearch();
    });
    input.addEventListener("focus", () => {
      if (!dom.formLocationSuggestionList.hidden) return;
      runLocationAutocompleteSearch();
    });
  });
  [dom.formAddress, dom.formCity, dom.formPostalCode, dom.formCountry]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener("input", () => {
        resetLocationSelection();
      });
    });
  dom.formLocationName.addEventListener("blur", () => {
    window.setTimeout(() => {
      const activeElement = document.activeElement;
      if (!(activeElement instanceof Element) || !activeElement.closest(".location-suggestions")) {
        hideLocationSuggestionList();
      }
    }, 100);
  });

  dom.formLocationSuggestionList.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const option = target?.closest(".location-autocomplete__item");
    if (!option) return;
    const placeId = String(option.dataset.placeId || "").trim();
    if (!placeId) return;
    handleLocationSuggestionSelection(placeId);
  });

  document.addEventListener("click", (event) => {
    if (!dom.formLocationSuggestionList || dom.formLocationSuggestionList.hidden) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const insideAutocomplete = target.closest(".location-autocomplete-field");
    if (insideAutocomplete) return;
    hideLocationSuggestionList();
  });
}

function validateFormPayload(payload) {
  const recurrenceType = normalizeRecurrenceType(payload.recurrence_type);
  const isRecurring = recurrenceType !== RECURRENCE_TYPE_NONE;
  const requiredFilled =
    payload.name &&
    payload.location_name &&
    payload.address &&
    payload.postal_code &&
    payload.city &&
    payload.country &&
    (isRecurring ? payload.recurrence_start_date : payload.event_date) &&
    payload.genre &&
    payload.artist_name &&
    payload.submitted_by &&
    payload.contact_email;
  if (!requiredFilled) {
    return { valid: false, message: t("form_error_required") };
  }
  if (isRecurring) {
    if (!payload.recurrence_start_date) {
      return { valid: false, message: t("form_error_recurrence_start_required") };
    }
    if (!payload.event_time) {
      return { valid: false, message: t("form_error_recurrence_time_required") };
    }
    const startDate = parseIsoDateLocal(payload.recurrence_start_date);
    const endDate = parseIsoDateLocal(payload.recurrence_end_date);
    if (payload.recurrence_end_date && !endDate) {
      return { valid: false, message: t("form_error_recurrence_end_before_start") };
    }
    if (startDate && endDate && endDate < startDate) {
      return { valid: false, message: t("form_error_recurrence_end_before_start") };
    }
    if (recurrenceType === RECURRENCE_TYPE_WEEKLY && normalizeWeekday(payload.recurrence_weekday) === null) {
      return { valid: false, message: t("form_error_recurrence_weekday_required") };
    }
    if (recurrenceType === RECURRENCE_TYPE_MONTHLY) {
      const dayOfMonth = normalizeDayOfMonth(payload.recurrence_day_of_month);
      if (payload.recurrence_day_of_month === "" || payload.recurrence_day_of_month === null) {
        return { valid: false, message: t("form_error_recurrence_day_of_month_required") };
      }
      if (dayOfMonth === null) {
        return { valid: false, message: t("form_error_recurrence_day_of_month_invalid") };
      }
    }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.contact_email)) {
    return { valid: false, message: t("form_error_email") };
  }
  if (payload.main_image) {
    if (!ALLOWED_EVENT_IMAGE_MIME_TYPES.has(payload.main_image.type)) {
      return { valid: false, message: t("form_error_image_type") };
    }
    if (payload.main_image.size > MAX_EVENT_IMAGE_BYTES) {
      return { valid: false, message: t("form_error_image_size") };
    }
  }
  return { valid: true, message: "" };
}

async function hasRecurrenceColumns(client) {
  const probeColumns = "recurrence_type,recurrence_start_date,recurrence_end_date,recurrence_weekday,recurrence_day_of_month";
  const { error } = await client
    .from(state.debug.tableName || "events")
    .select(probeColumns)
    .limit(1);
  if (!error) return true;
  const message = String(error?.message || "").toLowerCase();
  return !(message.includes("does not exist") && message.includes("recurrence_"));
}

function clearEventForm() {
  if (!dom.eventForm) return;
  dom.eventForm.reset();
  resetLocationSelection();
  resetLocationSearchToken();
  hideLocationSuggestionList();
  if (dom.formMainImage) dom.formMainImage.value = "";
  if (dom.formRecurrenceType) {
    dom.formRecurrenceType.value = RECURRENCE_TYPE_NONE;
    updateRecurrenceFormState();
  }
  // Keep fields empty by default unless user explicitly opted in to remember details.
  applySavedSubmitterProfile();
}

function readSavedSubmitterProfile() {
  try {
    const raw = window.localStorage.getItem(SUBMITTER_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const remember = Boolean(parsed.remember);
    const contact_email = String(parsed.contact_email || "").trim();
    const submitted_by = String(parsed.submitted_by || "").trim();
    if (!remember) return null;
    return {
      remember,
      contact_email,
      submitted_by
    };
  } catch (error) {
    return null;
  }
}

function applySavedSubmitterProfile() {
  const profile = readSavedSubmitterProfile();
  if (!profile) return;
  if (dom.formContactEmail && profile.contact_email) dom.formContactEmail.value = profile.contact_email;
  if (dom.formSubmittedBy && profile.submitted_by) dom.formSubmittedBy.value = profile.submitted_by;
}

function persistSubmitterProfile(payload) {
  try {
    const remember =
      window.confirm("Kontakt-E-Mail und Name auf diesem Gerät für künftige Einreichungen speichern?");
    if (!remember) {
      window.localStorage.removeItem(SUBMITTER_PROFILE_STORAGE_KEY);
      return;
    }
    const profile = {
      remember: true,
      contact_email: payload.contact_email || "",
      submitted_by: payload.submitted_by || ""
    };
    window.localStorage.setItem(SUBMITTER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    // Ignore storage errors to keep submission flow unaffected.
  }
}

function buildInsertPayload(payload) {
  // Address is collected now; geocoding can later resolve this into coordinates.
  const geocoding_query = payload.formatted_address || buildGeocodingQuery(payload);
  const recurrenceType = normalizeRecurrenceType(payload.recurrence_type);
  const isRecurring = recurrenceType !== RECURRENCE_TYPE_NONE;
  const currentYear = new Date().getFullYear();
  const recurrenceStartDate = isRecurring
    ? normalizeDateWithFallbackYear(String(payload.recurrence_start_date || "").trim(), currentYear) || null
    : null;
  const recurrenceEndDate = isRecurring
    ? normalizeDateWithFallbackYear(String(payload.recurrence_end_date || "").trim(), currentYear) || null
    : null;
  const recurrenceWeekday = recurrenceType === RECURRENCE_TYPE_WEEKLY ? normalizeWeekday(payload.recurrence_weekday) : null;
  const recurrenceDayOfMonth =
    recurrenceType === RECURRENCE_TYPE_MONTHLY ? normalizeDayOfMonth(payload.recurrence_day_of_month) : null;
  const eventDate = isRecurring
    ? recurrenceStartDate
    : normalizeDateWithFallbackYear(String(payload.event_date || "").trim(), currentYear);

  return {
    name: payload.name,
    location_name: payload.location_name,
    address: payload.address || null,
    postal_code: payload.postal_code || null,
    city: payload.city,
    country: payload.country || null,
    event_date: eventDate,
    event_time: payload.event_time || null,
    recurrence_type: recurrenceType,
    recurrence_start_date: recurrenceStartDate,
    recurrence_end_date: recurrenceEndDate,
    recurrence_weekday: recurrenceWeekday,
    recurrence_day_of_month: recurrenceDayOfMonth,
    genre: payload.genre,
    artist_name: payload.artist_name,
    additional_artists: payload.additional_artists || null,
    price_text: payload.price_text || null,
    description: payload.description || null,
    image_url: payload.image_url || null,
    contact_email: payload.contact_email,
    submitted_by: payload.submitted_by,
    status: "pending",
    verification_notes: null,
    geocoding_query: geocoding_query || null,
    lat: payload.lat || null,
    lng: payload.lng || null,
    place_id: payload.place_id || null,
    formatted_address: payload.formatted_address || null
  };
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

function buildEventImagePath(file) {
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const safeBase = sanitizeFileName((file?.name || "event-image").replace(/\.[^.]+$/, ""));
  const ext = fileExtension(file?.name);
  const random = Math.random().toString(36).slice(2, 10);
  return `pending/${yyyy}/${mm}/${dd}/${Date.now()}-${random}-${safeBase}.${ext}`;
}

async function uploadEventImage(client, file) {
  const path = buildEventImagePath(file);
  const { error: uploadError } = await client.storage
    .from(EVENT_IMAGES_BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl }
  } = client.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(path);

  if (!publicUrl) {
    throw new Error("Could not resolve public image URL");
  }

  return { path, publicUrl };
}

async function deleteUploadedEventImage(client, storagePath) {
  if (!storagePath) return;
  const { error } = await client.storage.from(EVENT_IMAGES_BUCKET).remove([storagePath]);
  if (error) throw error;
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
      "User-Agent": "Marcha/1.0 (event-submission geocoding)"
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

async function geocodeAddressWithMapbox(query) {
  if (!MAPBOX_ACCESS_TOKEN) {
    return null;
  }

  const endpoint = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  endpoint.searchParams.set("access_token", MAPBOX_ACCESS_TOKEN);
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("types", "address,place,poi");
  endpoint.searchParams.set("language", "de,en,es");

  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: "application/json"
    }
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
  return { lat, lng };
}

function buildGeocodingQuery(payload) {
  return [
    payload.address,
    payload.postal_code,
    payload.city,
    payload.country
  ]
    .filter(Boolean)
    .join(", ");
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

function buildGeocodingQueries(payload) {
  const address = String(payload.address || "").trim();
  const postalCode = String(payload.postal_code || "").trim();
  const city = String(payload.city || "").trim();
  const country = normalizeCountryForGeocoding(payload.country);

  const queries = [
    [address, postalCode, city, country],
    [address, city, country],
    [postalCode, city, country],
    [city, postalCode, country],
    [city, country]
  ]
    .map((parts) => parts.filter(Boolean).join(", "))
    .filter(Boolean);

  return [...new Set(queries)];
}

const GEOCODING_PROVIDERS = {
  nominatim: geocodeAddressWithNominatim,
  mapbox: geocodeAddressWithMapbox
};

let lastGeocodingRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function debounce(func, waitMs) {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      func(...args);
    }, waitMs);
  };
}

function canUseHaptics() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function pulseHaptic(durationMs = 12) {
  if (!canUseHaptics()) return;
  navigator.vibrate(durationMs);
}

function flashPressFeedback(target, durationMs = TAP_FEEDBACK_MS) {
  if (!(target instanceof Element)) return;
  target.classList.remove("is-pressing");
  window.requestAnimationFrame(() => {
    target.classList.add("is-pressing");
    window.setTimeout(() => target.classList.remove("is-pressing"), durationMs);
  });
}

function attachTapFeedback() {
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target instanceof Element ? event.target.closest(TAP_FEEDBACK_SELECTOR) : null;
      if (!target) return;
      flashPressFeedback(target);
      pulseHaptic(10);
    },
    { passive: true }
  );
}

function triggerViewModeFeedback() {
  pulseHaptic(9);
}

function setDocumentTransitionState(nextMode) {
  const root = document.body;
  if (!root) return;
  if (setDocumentTransitionState.timerId) {
    window.clearTimeout(setDocumentTransitionState.timerId);
    setDocumentTransitionState.timerId = 0;
  }
  TRANSITION_STATE_CLASSES.forEach((className) => root.classList.remove(className));
  window.requestAnimationFrame(() => {
    root.classList.add("is-transitioning", nextMode === "map" ? "is-transitioning-to-map" : "is-transitioning-to-list");
    setDocumentTransitionState.timerId = window.setTimeout(() => {
      TRANSITION_STATE_CLASSES.forEach((className) => root.classList.remove(className));
      setDocumentTransitionState.timerId = 0;
    }, VIEW_TRANSITION_MS);
  });
}
setDocumentTransitionState.timerId = 0;

function throttle(func, waitMs) {
  let lastRunAt = 0;
  let trailingTimeoutId = null;
  let trailingArgs = null;
  return (...args) => {
    const now = Date.now();
    const remaining = waitMs - (now - lastRunAt);
    trailingArgs = args;
    if (remaining <= 0) {
      if (trailingTimeoutId) {
        window.clearTimeout(trailingTimeoutId);
        trailingTimeoutId = null;
      }
      lastRunAt = now;
      func(...trailingArgs);
      trailingArgs = null;
      return;
    }
    if (trailingTimeoutId) return;
    trailingTimeoutId = window.setTimeout(() => {
      trailingTimeoutId = null;
      lastRunAt = Date.now();
      if (trailingArgs) {
        func(...trailingArgs);
        trailingArgs = null;
      }
    }, remaining);
  };
}

async function geocodingRateLimitWait() {
  if (!GEOCODING_MIN_INTERVAL_MS) return;
  const elapsed = Date.now() - lastGeocodingRequestAt;
  if (elapsed >= GEOCODING_MIN_INTERVAL_MS) return;
  await sleep(GEOCODING_MIN_INTERVAL_MS - elapsed);
}

async function geocodeWithRetry(provider, query) {
  const maxAttempts = Math.max(1, GEOCODING_MAX_RETRIES + 1);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await geocodingRateLimitWait();
      const result = await provider(query);
      lastGeocodingRequestAt = Date.now();
      return result;
    } catch (error) {
      lastGeocodingRequestAt = Date.now();
      if (attempt >= maxAttempts) throw error;
      await sleep(250 * attempt);
    }
  }
  return null;
}

async function resolveCoordinatesForPayload(payload) {
  if (!ENABLE_AUTO_GEOCODING) return payload;
  const knownLat = Number(payload?.lat);
  const knownLng = Number(payload?.lng);
  if (Number.isFinite(knownLat) && Number.isFinite(knownLng)) {
    return {
      ...payload,
      lat: knownLat,
      lng: knownLng
    };
  }
  const queries = buildGeocodingQueries(payload);
  if (!queries.length) {
    throw new Error("Missing geocoding address fields");
  }

  const provider = GEOCODING_PROVIDERS[GEOCODING_PROVIDER];
  if (!provider) {
    throw new Error("Geocoding provider unavailable");
  }

  try {
    for (const query of queries) {
      const coordinates = await geocodeWithRetry(provider, query);
      if (!coordinates) continue;
      return {
        ...payload,
        geocoding_query: query,
        lat: coordinates.lat,
        lng: coordinates.lng
      };
    }
    throw new Error("No geocoding result");
  } catch (error) {
    console.warn("[Marcha Debug] Geocoding failed:", error);
    throw new Error(error?.message || "Geocoding failed");
  }
}

function supabaseErrorText(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" | ");
}

function normalizeColumnName(rawColumn) {
  if (!rawColumn) return "";
  const cleaned = String(rawColumn).replace(/["']/g, "").trim();
  if (!cleaned) return "";
  const pathParts = cleaned.split(".");
  return pathParts[pathParts.length - 1].trim();
}

function extractMissingColumnFromSupabaseError(error) {
  const errorText = supabaseErrorText(error);
  if (!errorText) return null;

  const matchers = [
    /could not find the ['"]([^'"]+)['"] column/i,
    /could not find column ['"]([^'"]+)['"]/i,
    /column ["']([^"']+)["'] does not exist/i
  ];

  for (const pattern of matchers) {
    const match = errorText.match(pattern);
    const normalized = normalizeColumnName(match?.[1]);
    if (normalized) return normalized;
  }

  return null;
}

async function insertEventWithSchemaFallback(client, payload) {
  const tableName = state.debug.tableName || "events";
  // Avoid returning inserted rows here because strict SELECT RLS policies
  // (e.g. only approved events) can reject the return payload even when
  // the INSERT itself is valid.
  const tryInsert = async (row) => client.from(tableName).insert([row]);
  const fallbackPayload = { ...payload };
  const removedColumns = new Set();
  const schemaFallbackPriority = [
    "formatted_address",
    "place_id",
    "address",
    "postal_code",
    "geocoding_query",
    "recurrence_day_of_month",
    "recurrence_weekday",
    "recurrence_end_date",
    "recurrence_start_date",
    "recurrence_type",
    "verification_notes",
    "submitted_by",
    "additional_artists",
    "artist_name",
    "contact_email",
    "status",
    "country",
    "event_time",
    "price_text",
    "description"
  ];
  let lastResult = null;
  const maxAttempts = Object.keys(fallbackPayload).length + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await tryInsert(fallbackPayload);
    lastResult = result;
    if (!result.error) return result;

    const errorText = supabaseErrorText(result.error);
    let missingColumn = extractMissingColumnFromSupabaseError(result.error);
    if (!missingColumn && /schema cache/i.test(errorText)) {
      missingColumn = schemaFallbackPriority.find(
        (key) => Object.prototype.hasOwnProperty.call(fallbackPayload, key) && !removedColumns.has(key)
      );
    }
    if (!missingColumn) return result;
    if (!Object.prototype.hasOwnProperty.call(fallbackPayload, missingColumn)) return result;
    if (removedColumns.has(missingColumn)) return result;

    removedColumns.add(missingColumn);
    delete fallbackPayload[missingColumn];
    console.warn(`[Marcha Debug] Retrying insert without missing column: ${missingColumn}`);
  }

  return lastResult || { data: null, error: { message: "Insert failed" } };
}

function splitGenres(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/[,/|;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function loadFavoriteEventIds() {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((item) => String(item)));
  } catch (_error) {
    return new Set();
  }
}

function persistFavoriteEventIds() {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...state.favoriteEventIds]));
  } catch (_error) {
    // Ignore storage errors to keep the UI usable.
  }
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || "");
}

function isAndroidDevice() {
  return /android/i.test(window.navigator.userAgent || "");
}

function isAppInstalled() {
  const isDisplayModeStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches === true;
  const isIosStandalone = window.navigator.standalone === true;
  return isDisplayModeStandalone || isIosStandalone;
}

function isRunningStandalone() {
  return isAppInstalled();
}

function isStandaloneMode() {
  return isRunningStandalone();
}

function applyRuntimeEnvironmentState() {
  if (!document.body) return;
  const standalone = isRunningStandalone();
  const iosDevice = isIosDevice();
  document.body.classList.toggle("is-standalone-app", standalone);
  document.body.classList.toggle("is-ios-device", iosDevice);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  if (serviceWorkerRegistrationPromise) return serviceWorkerRegistrationPromise;

  serviceWorkerRegistrationPromise = new Promise((resolve) => {
    const setupServiceWorkerUpdateHandling = (registration) => {
      if (!registration) return;

      // Trigger update check after first registration.
      registration.update().catch(() => {});

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[Marcha PWA] New version installed, waiting for activation.");
          }
        });
      });
    };

    const handleControllerChange = () => {
      if (serviceWorkerHasRefreshed) return;
      serviceWorkerHasRefreshed = true;
      console.log("[Marcha PWA] Controller changed, reloading app for latest assets.");
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    const registerNow = () => {
      navigator.serviceWorker.register("/service-worker.js", { updateViaCache: "none" })
        .then((registration) => {
          setupServiceWorkerUpdateHandling(registration);
          console.log("[Marcha PWA] Service worker registered:", registration.scope);
          resolve(registration);
        })
        .catch((error) => {
          console.warn("[Marcha PWA] Service worker registration failed:", error);
          resolve(null);
        });
    };

    if (document.readyState === "complete") {
      registerNow();
      return;
    }
    window.addEventListener("load", registerNow, { once: true });
  });

  return serviceWorkerRegistrationPromise;
}

function persistInstallBannerTimestamp(key, days) {
  try {
    const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(key, String(expiresAt));
  } catch (_error) {
    // Ignore storage errors to keep the app usable.
  }
}

function isInstallBannerSuppressed(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return false;
    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp)) return false;
    return Date.now() < timestamp;
  } catch (_error) {
    return false;
  }
}

function isInstallSuppressed(dismissStorageKey) {
  if (isRunningStandalone()) return true;
  if (isInstallBannerSuppressed(INSTALL_BANNER_INSTALLED_STORAGE_KEY)) return true;
  if (dismissStorageKey && isInstallBannerSuppressed(dismissStorageKey)) return true;
  return false;
}

function getInstallDebugSnapshot() {
  const standalone = isRunningStandalone();
  const installedSuppressed = isInstallBannerSuppressed(INSTALL_BANNER_INSTALLED_STORAGE_KEY);
  const bannerDismissed = isInstallBannerSuppressed(INSTALL_BANNER_DISMISS_STORAGE_KEY);
  const mobileDismissed = isInstallBannerSuppressed(MOBILE_INSTALL_CTA_DISMISS_STORAGE_KEY);
  const hasDeferredPrompt = Boolean(deferredInstallPromptEvent);
  const mobileEntryVisible = Boolean(dom.mobileInstallEntry && !dom.mobileInstallEntry.hidden);
  const bannerVisible = Boolean(dom.installBanner && !dom.installBanner.hidden);
  const relevantSurface = isInstallSurfaceRelevant();
  const mobileViewport = window.matchMedia?.("(max-width: 780px)")?.matches === true;
  return {
    standalone,
    installedSuppressed,
    bannerDismissed,
    mobileDismissed,
    legacyBannerEnabled: ENABLE_LEGACY_INSTALL_BANNER,
    hasDeferredPrompt,
    relevantSurface,
    mobileViewport,
    mobileEntryVisible,
    bannerVisible
  };
}

function logInstallUiState(reason, extra = {}) {
  if (!INSTALL_UI_DEBUG) return;
  const snapshot = getInstallDebugSnapshot();
  console.log("[Marcha Install Debug]", reason, { ...snapshot, ...extra });
}

function isInstallSurfaceRelevant() {
  return isIosDevice() || isAndroidDevice();
}

function syncInstalledStateFromStandalone() {
  if (!isRunningStandalone()) return;
  // Keep persisted installed state as backup for future sessions.
  persistInstallBannerTimestamp(INSTALL_BANNER_INSTALLED_STORAGE_KEY, INSTALL_BANNER_INSTALLED_DAYS);
}

function hideInstallBanner() {
  if (!dom.installBanner) return;
  if (installBannerShowTimer) {
    window.clearTimeout(installBannerShowTimer);
    installBannerShowTimer = null;
  }
  dom.installBanner.classList.remove("is-visible");
  dom.installBanner.hidden = true;
}

function showInstallBanner() {
  if (!ENABLE_LEGACY_INSTALL_BANNER) return;
  if (isRunningStandalone()) return;
  if (!dom.installBanner) return;
  dom.installBanner.hidden = false;
  window.requestAnimationFrame(() => dom.installBanner?.classList.add("is-visible"));
}

function updateInstallBannerContent() {
  if (!dom.installBannerText || !dom.installBannerPrimary) return;
  if (isIosDevice()) {
    dom.installBannerText.textContent = t("install_banner_text_ios");
    dom.installBannerPrimary.disabled = true;
    return;
  }
  if (isAndroidDevice() && deferredInstallPromptEvent) {
    dom.installBannerText.textContent = t("install_banner_text_android_prompt");
    dom.installBannerPrimary.disabled = false;
    return;
  }
  dom.installBannerText.textContent = t("install_banner_text_android_manual");
  dom.installBannerPrimary.disabled = true;
}

function canShowInstallBanner() {
  if (!dom.installBanner) return false;
  if (!ENABLE_LEGACY_INSTALL_BANNER) return false;
  if (!isInstallSurfaceRelevant()) return false;
  if (dom.mobileInstallEntry) return false;
  if (isInstallSuppressed(INSTALL_BANNER_DISMISS_STORAGE_KEY)) return false;
  return true;
}

function setupInstallBanner() {
  updateInstallUiVisibility();
}

function hideMobileInstallEntry() {
  if (!dom.mobileInstallEntry) return;
  // Force-hide to avoid any responsive CSS overrides leaking visibility.
  dom.mobileInstallEntry.style.display = "none";
  dom.mobileInstallEntry.classList.remove("is-visible");
  dom.mobileInstallEntry.hidden = true;
  if (dom.mobileInstallEntryHelper) dom.mobileInstallEntryHelper.hidden = true;
  if (dom.mobileInstallEntryCta) dom.mobileInstallEntryCta.setAttribute("aria-expanded", "false");
}

function showMobileInstallEntry() {
  if (!dom.mobileInstallEntry) return;
  dom.mobileInstallEntry.style.removeProperty("display");
  dom.mobileInstallEntry.hidden = false;
  window.requestAnimationFrame(() => dom.mobileInstallEntry?.classList.add("is-visible"));
}

function suppressInstallUiOnAppLoad() {
  if (!isAppInstalled()) return;
  syncInstalledStateFromStandalone();
  hideInstallBanner();
  hideMobileInstallEntry();
  logInstallUiState("load:installed-hide-install-ui");
}

function updateMobileInstallEntryContent() {
  if (!dom.mobileInstallEntryHint || !dom.mobileInstallEntryCta || !dom.mobileInstallEntryHelper) return;
  const isIos = isIosDevice();
  const canPromptAndroid = isAndroidDevice() && Boolean(deferredInstallPromptEvent);
  dom.mobileInstallEntryHint.textContent = isIos ? t("install_mobile_hint_ios") : t("install_mobile_hint_android");
  dom.mobileInstallEntryCta.textContent = t("install_mobile_cta");
  dom.mobileInstallEntryCta.dataset.installMode = isIos ? "ios" : "android";
  dom.mobileInstallEntryCta.disabled = !isIos && !canPromptAndroid;
  dom.mobileInstallEntryCta.setAttribute("aria-disabled", dom.mobileInstallEntryCta.disabled ? "true" : "false");
  dom.mobileInstallEntryHelper.textContent = isIos ? t("install_mobile_ios_helper") : t("install_mobile_android_helper");
  dom.mobileInstallEntryHelper.hidden = true;
}

function canShowMobileInstallEntry() {
  if (!dom.mobileInstallEntry) return false;
  if (window.matchMedia?.("(max-width: 780px)")?.matches !== true) return false;
  if (!isInstallSurfaceRelevant()) return false;
  if (isInstallSuppressed(MOBILE_INSTALL_CTA_DISMISS_STORAGE_KEY)) return false;
  return true;
}

function setupMobileInstallEntry() {
  updateInstallUiVisibility();
}

function updateInstallUiVisibility() {
  applyRuntimeEnvironmentState();
  syncInstalledStateFromStandalone();
  logInstallUiState("recompute:start");

  if (installBannerShowTimer) {
    window.clearTimeout(installBannerShowTimer);
    installBannerShowTimer = null;
  }

  if (isRunningStandalone()) {
    hideInstallBanner();
    hideMobileInstallEntry();
    logInstallUiState("recompute:standalone-hide-all");
    return;
  }

  updateInstallBannerContent();
  updateMobileInstallEntryContent();

  if (canShowMobileInstallEntry()) {
    hideInstallBanner();
    showMobileInstallEntry();
    logInstallUiState("recompute:show-mobile-entry");
    return;
  }
  hideMobileInstallEntry();

  if (!canShowInstallBanner()) {
    hideInstallBanner();
    logInstallUiState("recompute:hide-all-no-surface");
    return;
  }

  installBannerShowTimer = window.setTimeout(() => {
    if (isRunningStandalone()) {
      hideInstallBanner();
      logInstallUiState("banner-timer:cancel-standalone");
      return;
    }
    if (canShowInstallBanner()) {
      showInstallBanner();
      logInstallUiState("banner-timer:show-banner");
    } else {
      logInstallUiState("banner-timer:skip-banner");
    }
  }, INSTALL_BANNER_SHOW_DELAY_MS);
}

async function handleMobileInstallEntryAction() {
  if (isRunningStandalone()) {
    updateInstallUiVisibility();
    return;
  }
  if (isIosDevice()) {
    if (dom.mobileInstallEntryHelper) {
      const isOpen = !dom.mobileInstallEntryHelper.hidden;
      dom.mobileInstallEntryHelper.hidden = isOpen;
      dom.mobileInstallEntryCta?.setAttribute("aria-expanded", isOpen ? "false" : "true");
    }
    return;
  }
  if (!deferredInstallPromptEvent) return;
  try {
    await deferredInstallPromptEvent.prompt();
    const choice = await deferredInstallPromptEvent.userChoice;
    if (choice?.outcome === "accepted") {
      persistInstallBannerTimestamp(INSTALL_BANNER_INSTALLED_STORAGE_KEY, INSTALL_BANNER_INSTALLED_DAYS);
      updateInstallUiVisibility();
    }
  } catch (_error) {
    // Keep CTA visible so users can retry.
  } finally {
    deferredInstallPromptEvent = null;
    updateInstallUiVisibility();
  }
}

async function handleInstallBannerPrimaryAction() {
  if (isRunningStandalone()) {
    updateInstallUiVisibility();
    return;
  }
  if (!deferredInstallPromptEvent) return;
  try {
    await deferredInstallPromptEvent.prompt();
    const choice = await deferredInstallPromptEvent.userChoice;
    if (choice?.outcome === "accepted") {
      persistInstallBannerTimestamp(INSTALL_BANNER_INSTALLED_STORAGE_KEY, INSTALL_BANNER_INSTALLED_DAYS);
      updateInstallUiVisibility();
    }
  } catch (_error) {
    // Keep banner visible so users can retry.
  } finally {
    deferredInstallPromptEvent = null;
    updateInstallUiVisibility();
  }
}

function isFavoriteEvent(eventId) {
  return state.favoriteEventIds.has(String(eventId));
}

function toggleFavoriteEvent(eventId) {
  const id = String(eventId);
  if (state.favoriteEventIds.has(id)) state.favoriteEventIds.delete(id);
  else state.favoriteEventIds.add(id);
  persistFavoriteEventIds();
  return state.favoriteEventIds.has(id);
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

function formatEventPlace(event) {
  const parts = [event.location_name, event.address, event.city].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
}

function resolveRecurringLanguage(lang) {
  const requested = String(lang || "").trim().toLowerCase();
  if (WEEKDAYS[requested] && RECURRING_LABELS[requested]) return requested;
  if (WEEKDAYS[state.lang] && RECURRING_LABELS[state.lang]) return state.lang;
  return "de";
}

function normalizeWeekdayName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function resolveWeekdayIndex(rawValue) {
  const fromNumber = normalizeWeekday(rawValue);
  if (fromNumber !== null) return fromNumber;
  const normalizedName = normalizeWeekdayName(rawValue);
  if (!normalizedName) return null;
  return Number.isInteger(WEEKDAY_NAME_TO_INDEX[normalizedName]) ? WEEKDAY_NAME_TO_INDEX[normalizedName] : null;
}

function formatEnglishOrdinal(dayOfMonth) {
  const day = Number(dayOfMonth);
  if (!Number.isInteger(day)) return "";
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  const mod10 = day % 10;
  if (mod10 === 1) return `${day}st`;
  if (mod10 === 2) return `${day}nd`;
  if (mod10 === 3) return `${day}rd`;
  return `${day}th`;
}

function getRecurringText(event, lang = state.lang) {
  const recurrenceType = normalizeRecurrenceType(event?.recurrence_type || RECURRENCE_TYPE_NONE);
  const isRecurring = Boolean(event?.is_recurring) || recurrenceType !== RECURRENCE_TYPE_NONE;
  if (!isRecurring) return "";

  const activeLang = resolveRecurringLanguage(lang);
  const recurrenceInterval = Math.max(1, Number.parseInt(String(event?.recurrence_interval || "1"), 10) || 1);
  const labels = RECURRING_LABELS[activeLang];
  const fallbacks = RECURRING_FALLBACK_LABELS[activeLang];
  const weekdays = WEEKDAYS[activeLang];
  const recurrenceDays = Array.isArray(event?.recurrence_days)
    ? event.recurrence_days
    : String(event?.recurrence_days || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
  const weekdayFromList = recurrenceDays
    .map((value) => resolveWeekdayIndex(value))
    .find((value) => value !== null);
  const weekdayIndex = weekdayFromList ?? resolveWeekdayIndex(event?.recurrence_weekday);
  const weekdayText = weekdayIndex === null ? "" : weekdays[weekdayIndex] || "";

  let recurringText = "";
  if (recurrenceType === RECURRENCE_TYPE_WEEKLY && weekdayText) {
    recurringText = recurrenceInterval > 1
      ? `${labels.weekly} ${recurrenceInterval}. ${weekdayText}`
      : `${labels.weekly} ${weekdayText}`;
  } else if (recurrenceType === RECURRENCE_TYPE_MONTHLY) {
    const dayOfMonth = normalizeDayOfMonth(event?.recurrence_day_of_month);
    if (!dayOfMonth) {
      recurringText = fallbacks.monthly;
    } else if (activeLang === "en") {
      recurringText = `${labels.monthly} ${formatEnglishOrdinal(dayOfMonth)}`;
    } else if (activeLang === "es") {
      recurringText = `${labels.monthly} día ${dayOfMonth}`;
    } else {
      recurringText = `${labels.monthly} ${dayOfMonth}.`;
    }
  } else if (recurrenceType === RECURRENCE_TYPE_WEEKLY) {
    recurringText = recurrenceInterval > 1
      ? `${labels.weekly} ${recurrenceInterval}.`
      : fallbacks.weekly;
  } else {
    recurringText = fallbacks.generic;
  }

  const recurrenceEndDate = parseIsoDate(event?.recurrence_end_date || "");
  if (recurrenceEndDate) {
    recurringText += ` • ${fallbacks.until} ${formatDate(formatIsoDate(recurrenceEndDate), false)}`;
  }
  return recurringText;
}

function buildNavigationAddressQuery(event) {
  const strictAddressQuery = [event.address, event.city, event.country]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
  if (strictAddressQuery) return strictAddressQuery;

  // Fallback for legacy records where only geocoding_query/postal data exists.
  return [event.geocoding_query, event.address, event.postal_code, event.city, event.country, event.location_name]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

function resolveNavigationDestination(event) {
  if (Number.isFinite(event?.lat) && Number.isFinite(event?.lng)) {
    return {
      type: "coordinates",
      lat: event.lat,
      lng: event.lng
    };
  }

  const addressQuery = buildNavigationAddressQuery(event);
  if (!addressQuery) return null;

  return {
    type: "address",
    query: addressQuery
  };
}

function buildNavigationUrl(event) {
  if (Number.isFinite(event?.lat) && Number.isFinite(event?.lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${event.lat},${event.lng}`)}`;
  }

  const addressQuery = [event?.address, event?.city]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");

  if (addressQuery) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;
  }

  const fallbackQuery = [event?.location_name, event?.city, event?.country]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");

  if (!fallbackQuery) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`;
}

function openRoute(event) {
  const url = buildNavigationUrl(event);
  if (!url) {
    setStatus(t("navigation_unavailable"), "warning");
    return;
  }

  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!openedWindow) {
    window.location.href = url;
  }
}

function openNavigationForEvent(event) {
  openRoute(event);
}

function normalizeFilterText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function eventSearchText(event) {
  // Unified search: name, artist, location and city are core dimensions.
  return [
    event.name,
    event.artist_name,
    event.location_name,
    event.city,
    event.address,
    event.genre,
    event.description
  ]
    .join(" ")
    .toLowerCase();
}

function sourceLabel() {
  return "";
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

function normalizeDatePresetId(value) {
  const preset = String(value || "").trim().toLowerCase();
  const knownPresets = new Set(Object.values(DATE_PRESET_IDS));
  return knownPresets.has(preset) ? preset : "";
}

function cloneDateAtStartOfDay(dateValue) {
  const cloned = new Date(dateValue);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

function cloneDateAtEndOfDay(dateValue) {
  const cloned = new Date(dateValue);
  cloned.setHours(23, 59, 59, 999);
  return cloned;
}

function normalizeDateRange(range) {
  if (!range?.start || !range?.end) {
    return { start: null, end: null };
  }
  const parsedStart = cloneDateAtStartOfDay(range.start);
  const parsedEnd = cloneDateAtEndOfDay(range.end);
  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
    return { start: null, end: null };
  }
  if (parsedStart <= parsedEnd) {
    return { start: parsedStart, end: parsedEnd };
  }
  return {
    start: cloneDateAtStartOfDay(parsedEnd),
    end: cloneDateAtEndOfDay(parsedStart)
  };
}

function cloneDateRange(range) {
  return normalizeDateRange(range);
}

function getTodayRange(referenceDate = new Date()) {
  const today = cloneDateAtStartOfDay(referenceDate);
  return {
    start: cloneDateAtStartOfDay(today),
    end: cloneDateAtEndOfDay(today)
  };
}

function getTomorrowRange(referenceDate = new Date()) {
  const tomorrow = cloneDateAtStartOfDay(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    start: cloneDateAtStartOfDay(tomorrow),
    end: cloneDateAtEndOfDay(tomorrow)
  };
}

function getWeekendRange(referenceDate = new Date()) {
  const date = cloneDateAtStartOfDay(referenceDate);
  const day = date.getDay();
  let fridayOffset = 5 - day;
  if (day === 6) fridayOffset = -1;
  if (day === 0) fridayOffset = -2;

  const friday = cloneDateAtStartOfDay(date);
  friday.setDate(friday.getDate() + fridayOffset);
  const sunday = cloneDateAtStartOfDay(friday);
  sunday.setDate(friday.getDate() + 2);

  return {
    start: cloneDateAtStartOfDay(friday),
    end: cloneDateAtEndOfDay(sunday)
  };
}

function getNextWeekendRange(referenceDate = new Date()) {
  const thisWeekend = getWeekendRange(referenceDate);
  const nextFriday = cloneDateAtStartOfDay(thisWeekend.start);
  nextFriday.setDate(nextFriday.getDate() + 7);

  const nextSunday = cloneDateAtStartOfDay(nextFriday);
  nextSunday.setDate(nextFriday.getDate() + 2);

  return {
    start: cloneDateAtStartOfDay(nextFriday),
    end: cloneDateAtEndOfDay(nextSunday)
  };
}

function resolveDateRangeForPreset(presetId) {
  if (presetId === DATE_PRESET_IDS.TODAY) return getTodayRange();
  if (presetId === DATE_PRESET_IDS.TOMORROW) return getTomorrowRange();
  if (presetId === DATE_PRESET_IDS.THIS_WEEKEND) return getWeekendRange();
  if (presetId === DATE_PRESET_IDS.NEXT_WEEKEND) return getNextWeekendRange();
  return { start: null, end: null };
}

function sameDayRange(range) {
  if (!range?.start || !range?.end) return false;
  return formatIsoDate(range.start) === formatIsoDate(range.end);
}

function rangesAreEqual(rangeA, rangeB) {
  if (!rangeA?.start || !rangeA?.end || !rangeB?.start || !rangeB?.end) return false;
  return (
    formatIsoDate(rangeA.start) === formatIsoDate(rangeB.start) &&
    formatIsoDate(rangeA.end) === formatIsoDate(rangeB.end)
  );
}

function inferPresetFromDateRange(range, referenceDate = new Date()) {
  const normalizedRange = normalizeDateRange(range);
  if (!normalizedRange.start || !normalizedRange.end) return "";

  if (rangesAreEqual(normalizedRange, getTodayRange(referenceDate))) return DATE_PRESET_IDS.TODAY;
  if (rangesAreEqual(normalizedRange, getTomorrowRange(referenceDate))) return DATE_PRESET_IDS.TOMORROW;
  if (rangesAreEqual(normalizedRange, getWeekendRange(referenceDate))) return DATE_PRESET_IDS.THIS_WEEKEND;
  if (rangesAreEqual(normalizedRange, getNextWeekendRange(referenceDate))) return DATE_PRESET_IDS.NEXT_WEEKEND;
  return "";
}

function syncLegacyDateFilterValue() {
  if (!dom.dateFilter) return;
  const currentRange = state.dateRange;
  if (sameDayRange(currentRange)) {
    dom.dateFilter.value = formatIsoDate(currentRange.start);
    return;
  }
  dom.dateFilter.value = "";
}

function renderTimePresetButtons() {
  if (!dom.timePresetGroup) return;
  const activePreset = normalizeDatePresetId(state.activeDatePreset);
  dom.timePresetGroup.querySelectorAll("button[data-date-preset]").forEach((button) => {
    const preset = normalizeDatePresetId(button.dataset.datePreset);
    const isActive = Boolean(activePreset && preset === activePreset);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateCustomDateRangeVisibility() {
  if (!dom.customDateRange) return;
  const isCustom = state.activeDatePreset === DATE_PRESET_IDS.CUSTOM;
  dom.customDateRange.hidden = !isCustom;
  dom.customDateRange.setAttribute("aria-hidden", String(!isCustom));
}

function setDateRangeState(range, presetId = "", options = { syncInputs: true }) {
  const normalizedRange = normalizeDateRange(range);
  const normalizedPreset = normalizeDatePresetId(presetId);
  state.dateRange = normalizedRange;
  state.activeDatePreset = normalizedPreset || inferPresetFromDateRange(normalizedRange);
  renderTimePresetButtons();
  updateCustomDateRangeVisibility();
  syncLegacyDateFilterValue();

  if (options.syncInputs) {
    if (state.activeDatePreset === DATE_PRESET_IDS.CUSTOM) {
      if (dom.dateRangeStart) dom.dateRangeStart.value = normalizedRange.start ? formatIsoDate(normalizedRange.start) : "";
      if (dom.dateRangeEnd) dom.dateRangeEnd.value = normalizedRange.end ? formatIsoDate(normalizedRange.end) : "";
    } else {
      if (dom.dateRangeStart) dom.dateRangeStart.value = "";
      if (dom.dateRangeEnd) dom.dateRangeEnd.value = "";
    }
  }
}

function applyDatePreset(presetId) {
  const normalizedPreset = normalizeDatePresetId(presetId);
  if (!normalizedPreset) return;

  if (normalizedPreset === DATE_PRESET_IDS.CUSTOM) {
    setDateRangeState({ start: null, end: null }, DATE_PRESET_IDS.CUSTOM);
    applyFilters();
    return;
  }

  setDateRangeState(resolveDateRangeForPreset(normalizedPreset), normalizedPreset);
  applyFilters();
}

function parseCustomDateRangeInputs() {
  const start = parseIsoDate(dom.dateRangeStart?.value || "");
  const end = parseIsoDate(dom.dateRangeEnd?.value || "");
  if (!start || !end) return { start: null, end: null };
  return { start, end };
}

function handleCustomDateRangeInputChange() {
  const parsedRange = parseCustomDateRangeInputs();
  setDateRangeState(parsedRange, DATE_PRESET_IDS.CUSTOM, { syncInputs: false });
  applyFilters();
}

function handleLegacyDateFilterChange() {
  const selectedDate = parseIsoDate(dom.dateFilter?.value || "");
  if (selectedDate) {
    setDateRangeState({ start: selectedDate, end: selectedDate }, "");
  } else {
    setDateRangeState({ start: null, end: null }, "");
  }
  syncHeroControlsFromSidebar();
  syncMapSheetControlsFromSidebar();
  debouncedApplyFilters();
}

function readQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    lang: params.get("lang") || "",
    q: params.get("q") || "",
    city: params.get("city") || "",
    date: params.get("date") || "",
    dateStart: params.get("date_start") || "",
    dateEnd: params.get("date_end") || "",
    datePreset: params.get("date_preset") || "",
    nearby: params.get("nearby") || "",
    radius: params.get("radius") || "",
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
  const dateRange = cloneDateRange(state.dateRange);
  const activeDatePreset = normalizeDatePresetId(state.activeDatePreset);

  if (state.lang !== "de") params.set("lang", state.lang);
  if (state.isAdminMode) params.set("admin", "1");
  if (search) params.set("q", search);
  if (city) params.set("city", city);
  if (activeDatePreset) params.set("date_preset", activeDatePreset);
  if (state.nearbyOnly) {
    params.set("nearby", "1");
    params.set("radius", String(state.radiusKm));
  }
  if (dateRange.start && dateRange.end) {
    params.set("date_start", formatIsoDate(dateRange.start));
    params.set("date_end", formatIsoDate(dateRange.end));
    if (sameDayRange(dateRange)) params.set("date", formatIsoDate(dateRange.start));
  }
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
    let geoStatus = t("admin_geo_unknown");
    let geoStatusClass = "";
    if (Number.isFinite(event.lat) && Number.isFinite(event.lng)) {
      geoStatus = t("admin_geo_ok");
      geoStatusClass = "admin-geo-badge--ok";
    } else if (event.geocoding_query) {
      geoStatus = t("admin_geo_missing");
      geoStatusClass = "admin-geo-badge--missing";
    }
    const artistLine = String(event.artist_name || "").trim();
    card.innerHTML = `
      <h4>${event.name}</h4>
      <div class="admin-card__meta">
        ${artistLine ? `<span>🎤 ${artistLine}</span>` : ""}
        <span>${formatEventPlace(event)}</span>
        <span>${formatDateTime(event)}</span>
        <span>${event.genre || "-"}</span>
        <span class="admin-card__geo">
          ${t("admin_geo_label")}:
          <strong class="admin-geo-badge ${geoStatusClass}">${geoStatus}</strong>
        </span>
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
    const isActive = state.activeGenres.has(genre);
    if (isActive) button.classList.add("is-active");
    button.dataset.genre = genre;
    button.setAttribute("aria-pressed", String(isActive));
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
  syncMapSheetFilterOptions();
}

function applyFiltersFromQuery() {
  const query = readQueryParams();
  if (query.q) dom.searchInput.value = query.q;
  if (query.city && [...dom.cityFilter.options].some((option) => option.value === query.city)) {
    dom.cityFilter.value = query.city;
  }
  const presetFromQuery = normalizeDatePresetId(query.datePreset);
  const rangeStart = parseIsoDate(query.dateStart || "");
  const rangeEnd = parseIsoDate(query.dateEnd || "");
  const singleDay = parseIsoDate(query.date || "");
  if (rangeStart && rangeEnd) {
    setDateRangeState(
      { start: rangeStart, end: rangeEnd },
      presetFromQuery
    );
  } else if (presetFromQuery && presetFromQuery !== DATE_PRESET_IDS.CUSTOM) {
    setDateRangeState(resolveDateRangeForPreset(presetFromQuery), presetFromQuery);
  } else if (singleDay) {
    setDateRangeState({ start: singleDay, end: singleDay }, "");
  } else if (presetFromQuery === DATE_PRESET_IDS.CUSTOM) {
    setDateRangeState({ start: null, end: null }, DATE_PRESET_IDS.CUSTOM, { syncInputs: false });
  } else {
    setDateRangeState({ start: null, end: null }, "");
  }
  const requestedNearby = String(query.nearby || "").trim().toLowerCase();
  const wantsNearby = requestedNearby === "1" || requestedNearby === "true";
  setNearbyFilterState({
    nearbyOnly: wantsNearby && hasUserLocation(),
    radiusKm: query.radius,
    showHint: wantsNearby && !hasUserLocation()
  });
  state.activeGenres = new Set(normalizeRequestedGenres(query.genres));
  renderGenreFilter();
  syncHeroControlsFromSidebar();
  syncMapSheetControlsFromSidebar();
}

function getActiveFilters() {
  const activeQuickCategory = quickCategoryById(state.activeQuickCategoryId);
  const hasUserCoordinates = hasUserLocation();
  return {
    search: normalizeFilterText(dom.searchInput.value),
    city: dom.cityFilter.value,
    dateRange: cloneDateRange(state.dateRange),
    genres: new Set([...state.activeGenres].map((genre) => genre.toLowerCase())),
    quickKeywords: activeQuickCategory.keywords.map((keyword) => keyword.toLowerCase()),
    nearbyOnly: state.nearbyOnly && hasUserCoordinates,
    radiusKm: normalizeRadiusKm(state.radiusKm)
  };
}

function syncHeroFilterOptions() {
  if (!dom.heroCityFilter || !dom.heroDateFilter || !dom.cityFilter || !dom.dateFilter) return;

  dom.heroCityFilter.innerHTML = dom.cityFilter.innerHTML;
  dom.heroDateFilter.innerHTML = dom.dateFilter.innerHTML;
  dom.heroCityFilter.value = dom.cityFilter.value;
  dom.heroDateFilter.value = dom.dateFilter.value;
}

function syncMapSheetFilterOptions() {
  if (!dom.mapSheetCityFilter || !dom.mapSheetDateFilter || !dom.cityFilter || !dom.dateFilter) return;
  dom.mapSheetCityFilter.innerHTML = dom.cityFilter.innerHTML;
  dom.mapSheetDateFilter.innerHTML = dom.dateFilter.innerHTML;
  dom.mapSheetCityFilter.value = dom.cityFilter.value;
  dom.mapSheetDateFilter.value = dom.dateFilter.value;
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

function syncMapSheetControlsFromSidebar() {
  if (dom.mapSheetSearchInput && dom.searchInput) dom.mapSheetSearchInput.value = dom.searchInput.value;
  if (dom.mapSheetCityFilter && dom.cityFilter) dom.mapSheetCityFilter.value = dom.cityFilter.value;
  if (dom.mapSheetDateFilter && dom.dateFilter) dom.mapSheetDateFilter.value = dom.dateFilter.value;
}

function syncSidebarFromMapSheetControls() {
  if (dom.mapSheetSearchInput && dom.searchInput) dom.searchInput.value = dom.mapSheetSearchInput.value;
  if (dom.mapSheetCityFilter && dom.cityFilter) dom.cityFilter.value = dom.mapSheetCityFilter.value;
  if (dom.mapSheetDateFilter && dom.dateFilter) dom.dateFilter.value = dom.mapSheetDateFilter.value;
}

function updateLocationChipLabel() {
  if (!dom.locationChipLabel) return;
  const selectedCity = String(dom.cityFilter?.value || "").trim();
  dom.locationChipLabel.textContent = selectedCity || t("hero_location_label");
}

function hasUserLocation() {
  return Number.isFinite(state.userLocation?.lat) && Number.isFinite(state.userLocation?.lng);
}

function hasValidEventCoordinates(event) {
  const lat = Number(event?.lat);
  const lng = Number(event?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return true;
}

function getMappableEvents(events) {
  return (Array.isArray(events) ? events : []).filter((event) => hasValidEventCoordinates(event));
}

function loadStoredUserLocation() {
  try {
    const raw = window.localStorage.getItem(USER_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const lat = Number(parsed?.lat);
    const lng = Number(parsed?.lng);
    const timestamp = Number(parsed?.timestamp || 0);
    if (timestamp > 0 && Date.now() - timestamp > USER_LOCATION_CACHE_TTL_MS) {
      window.localStorage.removeItem(USER_LOCATION_STORAGE_KEY);
      return null;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch (_error) {
    return null;
  }
}

function persistUserLocation(location) {
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) return;
  try {
    window.localStorage.setItem(
      USER_LOCATION_STORAGE_KEY,
      JSON.stringify({
        lat: Number(location.lat),
        lng: Number(location.lng),
        timestamp: Date.now()
      })
    );
  } catch (_error) {
    // Ignore storage errors to keep UX non-blocking.
  }
}

function setUserLocation(nextLocation) {
  if (!Number.isFinite(nextLocation?.lat) || !Number.isFinite(nextLocation?.lng)) return;
  state.userLocation = {
    lat: Number(nextLocation.lat),
    lng: Number(nextLocation.lng)
  };
  persistUserLocation(state.userLocation);
}

function readGeolocationPermissionState() {
  if (!navigator?.permissions?.query) return Promise.resolve("unsupported");
  return navigator.permissions
    .query({ name: "geolocation" })
    .then((status) => status?.state || "unsupported")
    .catch(() => "unsupported");
}

function syncLocationPermissionFromNavigator() {
  return readGeolocationPermissionState().then((permissionState) => {
    state.locationPermissionState = permissionState;
    return permissionState;
  });
}

function normalizeRadiusKm(value) {
  const radius = Number(value);
  if (!Number.isFinite(radius)) return DEFAULT_NEARBY_RADIUS_KM;
  if (!NEARBY_RADIUS_OPTIONS.includes(radius)) return DEFAULT_NEARBY_RADIUS_KM;
  return radius;
}

function renderNearbyRadiusButtons() {
  if (!dom.nearbyRadiusGroup) return;
  dom.nearbyRadiusGroup.querySelectorAll("button[data-radius-km]").forEach((button) => {
    const radiusKm = normalizeRadiusKm(button.dataset.radiusKm || "");
    const isActive = radiusKm === state.radiusKm;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderNearbyFilterControls() {
  const hasLocation = hasUserLocation();
  if (dom.nearbyToggle) {
    const isActive = state.nearbyOnly && hasLocation;
    dom.nearbyToggle.classList.toggle("is-active", isActive);
    dom.nearbyToggle.classList.toggle("is-pending-location", !hasLocation);
    dom.nearbyToggle.setAttribute("aria-pressed", String(isActive));
  }
  const showRadiusControls = state.nearbyOnly && hasLocation;
  if (dom.nearbyRadiusWrap) {
    dom.nearbyRadiusWrap.hidden = !showRadiusControls;
    dom.nearbyRadiusWrap.setAttribute("aria-hidden", String(!showRadiusControls));
  }
  if (dom.nearbyHint) {
    const showHint = !hasLocation && state.nearbyHintVisible;
    dom.nearbyHint.hidden = !showHint;
    dom.nearbyHint.setAttribute("aria-hidden", String(!showHint));
  }
  renderNearbyRadiusButtons();
}

function setNearbyFilterState({ nearbyOnly = state.nearbyOnly, radiusKm = state.radiusKm, showHint = state.nearbyHintVisible } = {}) {
  state.nearbyOnly = Boolean(nearbyOnly);
  state.radiusKm = normalizeRadiusKm(radiusKm);
  state.nearbyHintVisible = Boolean(showHint);
  renderNearbyFilterControls();
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const points = [lat1, lng1, lat2, lng2].map((value) => Number(value));
  if (points.some((value) => !Number.isFinite(value))) return null;
  const [safeLat1, safeLng1, safeLat2, safeLng2] = points;
  const dLat = toRadians(safeLat2 - safeLat1);
  const dLng = toRadians(safeLng2 - safeLng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(safeLat1)) * Math.cos(toRadians(safeLat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function formatDistanceLabel(distanceKm) {
  if (!Number.isFinite(distanceKm)) return "";
  if (distanceKm < 1) return `📍 ${t("distance_under_1km")}`;
  return `📍 ${t("distance_km_away", { distance: distanceKm.toFixed(1) })}`;
}

function formatDistanceLabelShort(distanceKm) {
  if (!Number.isFinite(distanceKm)) return "";
  if (distanceKm < 1) return t("distance_under_1km");
  return t("distance_km_away", { distance: distanceKm.toFixed(1) });
}

function withDistanceForEvent(event) {
  const hasEventCoordinates = Number.isFinite(event?.lat) && Number.isFinite(event?.lng);
  const hasUserCoordinates = Number.isFinite(state.userLocation?.lat) && Number.isFinite(state.userLocation?.lng);
  if (!hasEventCoordinates || !hasUserCoordinates) {
    return {
      ...event,
      distance_km: null
    };
  }
  return {
    ...event,
    distance_km: getDistanceKm(state.userLocation.lat, state.userLocation.lng, event.lat, event.lng)
  };
}

function applyDistanceData(events) {
  return events.map((event) => withDistanceForEvent(event));
}

async function ensureUserLocation() {
  if (hasUserLocation()) return true;
  const nextLocation = await requestUserLocation();
  if (!nextLocation) return false;
  setUserLocation(nextLocation);
  state.allEvents = applyDistanceData(state.allEvents);
  return true;
}

function requestUserLocation() {
  if (locationRequestInFlightPromise) return locationRequestInFlightPromise;
  locationRequestInFlightPromise = syncLocationPermissionFromNavigator()
    .then((permissionState) => {
      if (permissionState === "denied") return null;
      if (permissionState === "granted") {
        // Reuse persisted coordinates instead of triggering a new lookup.
        return loadStoredUserLocation();
      }
      if (permissionState !== "prompt" && permissionState !== "unsupported") {
        return null;
      }
      if (!navigator?.geolocation?.getCurrentPosition) return null;
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = Number(position?.coords?.latitude);
            const lng = Number(position?.coords?.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              resolve(null);
              return;
            }
            resolve({ lat, lng });
          },
          () => resolve(null),
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 300000
          }
        );
      });
    })
    .then((location) => {
      if (location) setUserLocation(location);
      return location;
    })
    .finally(() => {
      locationRequestInFlightPromise = null;
    });
  return locationRequestInFlightPromise;
}

async function primeUserLocationOnAppLoad() {
  const storedLocation = loadStoredUserLocation();
  if (storedLocation) {
    state.userLocation = storedLocation;
  }

  // Keep permission state in sync, but avoid requesting geolocation on startup.
  await syncLocationPermissionFromNavigator();
}

function enrichDistanceSlots() {
  if (!dom.eventDetails) return;
  const hasUserLocation = Number.isFinite(state.userLocation?.lat) && Number.isFinite(state.userLocation?.lng);
  dom.eventDetails.querySelectorAll("[data-distance-slot]").forEach((slot) => {
    const lat = Number(slot.getAttribute("data-lat"));
    const lng = Number(slot.getAttribute("data-lng"));
    if (!hasUserLocation || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      slot.textContent = "";
      return;
    }
    const distanceKm = getDistanceKm(state.userLocation.lat, state.userLocation.lng, lat, lng);
    slot.textContent = distanceKm === null ? "" : formatDistanceLabel(distanceKm);
  });
}

function eventMatchesGenres(event, activeGenresLower) {
  if (!activeGenresLower.size) return true;
  const eventGenresLower = splitGenres(event.genre).map((genre) => genre.toLowerCase());
  return eventGenresLower.some((genre) => activeGenresLower.has(genre));
}

function compareEventDateOrder(a, b) {
  const timestampA = eventTimestamp(a);
  const timestampB = eventTimestamp(b);
  const hasDateA = Number.isFinite(timestampA);
  const hasDateB = Number.isFinite(timestampB);
  if (hasDateA && !hasDateB) return -1;
  if (!hasDateA && hasDateB) return 1;
  if (!hasDateA && !hasDateB) return 0;
  if (timestampA !== timestampB) return timestampA - timestampB;
  return 0;
}

function compareDistanceOrder(a, b) {
  const hasDistanceA = Number.isFinite(a?.distance_km);
  const hasDistanceB = Number.isFinite(b?.distance_km);
  if (hasDistanceA && hasDistanceB && a.distance_km !== b.distance_km) return a.distance_km - b.distance_km;
  if (hasDistanceA && !hasDistanceB) return -1;
  if (!hasDistanceA && hasDistanceB) return 1;
  return 0;
}

function applyDiscoverySort(events) {
  const entries = [...events];
  const hasCoordinates = hasUserLocation();
  if (state.nearbyOnly && hasCoordinates) {
    return entries.sort((a, b) => {
      const distanceOrder = compareDistanceOrder(a, b);
      if (distanceOrder !== 0) return distanceOrder;
      return compareEventDateOrder(a, b);
    });
  }
  return entries.sort((a, b) => {
    const dateOrder = compareEventDateOrder(a, b);
    if (dateOrder !== 0) return dateOrder;
    if (hasCoordinates) return compareDistanceOrder(a, b);
    return 0;
  });
}

function updateMapSheetSortControls() {
  if (dom.mapSheetSortNearby) {
    dom.mapSheetSortNearby.classList.toggle("is-active", state.discoverySort === "nearby");
  }
  if (dom.mapSheetSortSoonest) {
    dom.mapSheetSortSoonest.classList.toggle("is-active", state.discoverySort === "soonest");
  }
}

function applyFilters() {
  const filters = getActiveFilters();
  const filtered = state.allEvents.filter((event) => {
    const haystack = eventSearchText(event);
    const eventDate = parseIsoDate(event.event_date || "");
    if (filters.city && event.city !== filters.city) return false;
    if (filters.dateRange.start && filters.dateRange.end) {
      if (!eventDate || eventDate < filters.dateRange.start || eventDate > filters.dateRange.end) {
        return false;
      }
    }
    if (!eventMatchesGenres(event, filters.genres)) return false;
    if (filters.quickKeywords.length) {
      const hasQuickMatch = filters.quickKeywords.some((keyword) => haystack.includes(keyword));
      if (!hasQuickMatch) return false;
    }
    if (filters.search && !haystack.includes(filters.search)) return false;
    if (filters.nearbyOnly) {
      if (!Number.isFinite(event.distance_km)) return false;
      if (event.distance_km > filters.radiusKm) return false;
    }
    return true;
  });
  state.filteredEvents = applyDiscoverySort(filtered);

  if (state.selectedEventId && !state.filteredEvents.some((event) => event.id === state.selectedEventId)) {
    state.selectedEventId = null;
    renderEventDetails(null);
  }

  renderEventList();
  renderMapMarkers();
  renderFeaturedEvents();
  if (!state.selectedEventId && state.filteredEvents.length) {
    selectEvent(state.filteredEvents[0], "auto");
  }
  updateMapSheetSortControls();
  updateMapBottomSheetMeta();
  if (!state.filteredEvents.length && state.viewMode === "map") {
    renderMapSheetEmptyState();
  }
  setStatus(t("result_count", { count: state.filteredEvents.length }), sourceTone());
  updateLocationChipLabel();
  enrichDistanceSlots();
  updateUrlFromFilters();
}

function eventTimestamp(event) {
  const date = String(event.event_date || "").trim();
  const time = String(event.event_time || "23:59").trim();
  if (!date) return Number.POSITIVE_INFINITY;
  const iso = `${date}T${time}`;
  const parsed = new Date(iso).getTime();
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function parseIsoDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatIsoDate(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPastOccurrence(event) {
  const eventDateValue = String(event?.event_date || "").trim();
  if (!eventDateValue) return false;
  const eventDate = parseIsoDate(eventDateValue);
  if (!eventDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

function appendOneTimeOccurrence(list, event) {
  if (isPastOccurrence(event)) return;
  list.push({
    ...event,
    parent_event_id: event.parent_event_id || event.id,
    occurrence_date: event.event_date,
    occurrence_index: Number(event.occurrence_index || 0),
    is_recurring_occurrence: Boolean(event.is_recurring_occurrence)
  });
}

function resolveWeeklyOccurrenceDate(cursorDate, targetWeekday) {
  const occurrence = new Date(cursorDate);
  const delta = (targetWeekday - occurrence.getDay() + 7) % 7;
  occurrence.setDate(occurrence.getDate() + delta);
  occurrence.setHours(0, 0, 0, 0);
  return occurrence;
}

function resolveMonthlyOccurrenceDate(cursorDate, dayOfMonth) {
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (dayOfMonth > daysInMonth) return null;
  const occurrence = new Date(year, month, dayOfMonth);
  occurrence.setHours(0, 0, 0, 0);
  return occurrence;
}

function buildRecurringOccurrences(event) {
  const type = normalizeRecurrenceType(event.recurrence_type);
  if (type === RECURRENCE_TYPE_NONE) {
    const list = [];
    appendOneTimeOccurrence(list, event);
    return list;
  }

  const startDate = parseIsoDate(event.recurrence_start_date || event.event_date);
  if (!startDate) return [];
  const endDate = parseIsoDate(event.recurrence_end_date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + RECURRENCE_OCCURRENCE_HORIZON_DAYS);
  const cursorStart = startDate > now ? startDate : now;
  const upperBound = endDate && endDate < horizon ? endDate : horizon;
  if (cursorStart > upperBound) return [];

  const occurrences = [];
  const maxOccurrences = RECURRENCE_MAX_OCCURRENCES_PER_EVENT;
  let occurrenceIndex = 0;
  let cursor = new Date(cursorStart);
  cursor.setHours(0, 0, 0, 0);

  if (type === RECURRENCE_TYPE_WEEKLY) {
    const targetWeekday = normalizeWeekdayValue(event.recurrence_weekday);
    if (targetWeekday === null) return [];
    let next = resolveWeeklyOccurrenceDate(cursor, targetWeekday);
    while (next <= upperBound && occurrences.length < maxOccurrences) {
      if (next >= startDate) {
        const occurrenceDate = formatIsoDate(next);
        const nextEvent = {
          ...event,
          id: `${event.id}::${occurrenceDate}`,
          parent_event_id: event.id,
          event_date: occurrenceDate,
          occurrence_date: occurrenceDate,
          occurrence_index: occurrenceIndex,
          is_recurring_occurrence: true
        };
        if (!isPastOccurrence(nextEvent)) occurrences.push(nextEvent);
        occurrenceIndex += 1;
      }
      next.setDate(next.getDate() + 7);
      next.setHours(0, 0, 0, 0);
    }
    return occurrences;
  }

  if (type === RECURRENCE_TYPE_MONTHLY) {
    const dayOfMonth = normalizeDayOfMonthValue(event.recurrence_day_of_month);
    if (dayOfMonth === null) return [];
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= upperBound && occurrences.length < maxOccurrences) {
      const occurrenceDateObj = resolveMonthlyOccurrenceDate(cursor, dayOfMonth);
      if (occurrenceDateObj && occurrenceDateObj >= startDate && occurrenceDateObj <= upperBound) {
        const occurrenceDate = formatIsoDate(occurrenceDateObj);
        const nextEvent = {
          ...event,
          id: `${event.id}::${occurrenceDate}`,
          parent_event_id: event.id,
          event_date: occurrenceDate,
          occurrence_date: occurrenceDate,
          occurrence_index: occurrenceIndex,
          is_recurring_occurrence: true
        };
        if (!isPastOccurrence(nextEvent)) occurrences.push(nextEvent);
        occurrenceIndex += 1;
      }
      cursor.setMonth(cursor.getMonth() + 1, 1);
      cursor.setHours(0, 0, 0, 0);
    }
    return occurrences;
  }

  return [];
}

function expandRecurringEvents(rawEvents) {
  const expanded = [];
  rawEvents.forEach((event) => {
    const occurrences = buildRecurringOccurrences(event);
    if (!occurrences.length) return;
    occurrences.forEach((occurrence) => expanded.push(occurrence));
  });
  return expanded;
}

function pickFeaturedEvents() {
  const source = state.filteredEvents.length ? state.filteredEvents : state.allEvents;
  return [...source]
    .sort((a, b) => {
      const imageWeightA = a.image_url ? 0 : 1;
      const imageWeightB = b.image_url ? 0 : 1;
      if (imageWeightA !== imageWeightB) return imageWeightA - imageWeightB;
      return eventTimestamp(a) - eventTimestamp(b);
    })
    .slice(0, 6);
}

function createFeaturedCard(event) {
  const card = document.createElement("article");
  card.className = "featured-card";
  const navigationUrl = buildNavigationUrl(event);
  const genre = splitGenres(event.genre)[0] || event.genre || "-";
  const artistName = String(event.artist_name || "").trim();
  const locationLine = [event.location_name, event.city]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" · ");
  const dateTimeLine = [formatDate(event.event_date, true), event.event_time || t("details_time_fallback")]
    .filter(Boolean)
    .join(" • ");
  const featuredArtistLine = artistName
    ? `<p class="featured-card__artist">🎤 ${artistName}</p>`
    : "";
  card.innerHTML = `
    <div class="featured-card__media">
      ${
        event.image_url
          ? `<img class="featured-card__image" src="${event.image_url}" alt="${event.name}" loading="lazy">`
          : `<div class="featured-card__image-fallback" aria-hidden="true"><span>${iconForGenre(genre)}</span></div>`
      }
      <div class="featured-card__shade"></div>
      <div class="featured-card__content">
        <span class="featured-card__badge">${genre}</span>
        <h3>${event.name}</h3>
        ${featuredArtistLine}
        <p class="featured-card__meta">📍 ${locationLine || "-"}</p>
        <p class="featured-card__meta">${dateTimeLine}</p>
        <div class="featured-card__actions">
          <button type="button" class="button-secondary button-secondary--primary" data-action="featured-open">${t("featured_open")}</button>
          <button type="button" class="button-secondary" data-action="featured-navigate" ${navigationUrl ? "" : "disabled"}>${t("details_navigate")}</button>
        </div>
      </div>
    </div>
  `;

  card.addEventListener("click", (clickEvent) => {
    const target = clickEvent.target instanceof Element ? clickEvent.target : null;
    const navigateButton = target?.closest("button[data-action='featured-navigate']");
    const openButton = target?.closest("button[data-action='featured-open']");
    if (navigateButton) {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      openNavigationForEvent(event);
      return;
    }

    selectEvent(event, "featured");
    if (openButton) {
      setViewMode("list", { scroll: true });
      return;
    }
    setViewMode("map", { scroll: true });
  });

  return card;
}

function renderFeaturedEvents() {
  if (!dom.featuredCarousel || !dom.featuredCount) return;
  const featuredEvents = pickFeaturedEvents();
  dom.featuredCount.textContent = String(featuredEvents.length);
  dom.featuredCarousel.innerHTML = "";
  if (!featuredEvents.length) {
    const empty = document.createElement("div");
    empty.className = "featured-empty";
    empty.textContent = t("no_events_found");
    dom.featuredCarousel.append(empty);
    return;
  }

  featuredEvents.forEach((event) => {
    dom.featuredCarousel.append(createFeaturedCard(event));
  });
}

function mapSheetIsAvailable() {
  return Boolean(dom.mapBottomSheet && dom.mapSection);
}

function mapSheetIsMobileViewport() {
  return window.matchMedia("(max-width: 780px)").matches;
}

function updateMapSheetEnabledFlag() {
  state.mapSheet.enabled = mapSheetIsAvailable() && state.viewMode === "map" && mapSheetIsMobileViewport();
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mapSheetStateIndex(sheetState) {
  return Math.max(0, MAP_SHEET_STATE_ORDER.indexOf(sheetState));
}

function mapSheetOffsetYByState(sheetState) {
  if (sheetState === "peek") return -70;
  if (sheetState === "full") return 0;
  return -120;
}

function flyToEventWithMapSheetOffset(event, zoom = 13) {
  if (!map || !event || !Number.isFinite(event.lat) || !Number.isFinite(event.lng)) return;
  if (!(state.viewMode === "map" && mapSheetIsAvailable() && mapSheetIsMobileViewport())) {
    map.flyTo([event.lat, event.lng], zoom, { duration: 0.6 });
    return;
  }

  const offsetY = mapSheetOffsetYByState(state.mapSheet.state);
  const targetPoint = map.project([event.lat, event.lng], map.getZoom()).add([0, offsetY]);
  const targetLatLng = map.unproject(targetPoint, map.getZoom());
  map.flyTo(targetLatLng, zoom, { duration: 0.6 });
}

function getNextMapSheetState(sheetState, direction) {
  const index = mapSheetStateIndex(sheetState);
  const nextIndex = clampNumber(index + direction, 0, MAP_SHEET_STATE_ORDER.length - 1);
  return MAP_SHEET_STATE_ORDER[nextIndex];
}

function getNearestMapSheetStateFromTop(currentTop) {
  const entries = Object.entries(state.mapSheet.snapPx);
  const [closestState] = entries.reduce(
    (best, [sheetState, top]) => {
      const distance = Math.abs(currentTop - top);
      if (distance < best.distance) return { state: sheetState, distance };
      return best;
    },
    { state: MAP_SHEET_DEFAULT_STATE, distance: Number.POSITIVE_INFINITY }
  );
  return closestState || MAP_SHEET_DEFAULT_STATE;
}

function computeMapBottomSheetSnapHeights() {
  if (!mapSheetIsAvailable()) return;
  const viewportHeight = window.innerHeight || 844;
  const mapHeight = dom.mapSection.clientHeight || 430;
  const safeTop = mapSheetIsMobileViewport() ? 47 : 0;
  const safeBottom = mapSheetIsMobileViewport() ? 34 : 0;
  const fullTop = safeTop + 12;
  const halfTop = Math.round(viewportHeight * 0.46);
  const peekTop = viewportHeight - (132 + 66 + safeBottom + 10);

  state.mapSheet.snapPx = {
    full: fullTop,
    half: halfTop,
    peek: peekTop
  };

  const topToSheetHeight = (topPx) =>
    clampNumber(viewportHeight - topPx, 120, Math.max(120, mapHeight - 8));
  const fullHeight = topToSheetHeight(fullTop);
  const halfHeight = topToSheetHeight(halfTop);
  const peekHeight = topToSheetHeight(peekTop);

  dom.mapBottomSheet.style.setProperty("--sheet-max-h-full", `${fullHeight}px`);
  dom.mapBottomSheet.style.setProperty("--sheet-max-h-half", `${halfHeight}px`);
  dom.mapBottomSheet.style.setProperty("--sheet-max-h-peek", `${peekHeight}px`);
}

function setMapBottomSheetState(nextState, { animate = true } = {}) {
  if (!mapSheetIsAvailable()) return;
  const normalizedState = MAP_SHEET_STATE_ORDER.includes(nextState) ? nextState : MAP_SHEET_DEFAULT_STATE;
  const previousState = state.mapSheet.state;
  state.mapSheet.state = normalizedState;
  if (!animate) dom.mapBottomSheet.classList.add("is-dragging");
  dom.mapBottomSheet.dataset.sheetState = normalizedState;
  dom.mapBottomSheet.style.transform = "translateY(0)";
  state.mapSheet.currentTop = state.mapSheet.snapPx[normalizedState] || state.mapSheet.snapPx.half || 0;
  if (previousState !== normalizedState && animate) {
    pulseHaptic(8);
    dom.mapBottomSheet.classList.add("is-snapping");
    if (state.mapSheet.snapVisualTimer) window.clearTimeout(state.mapSheet.snapVisualTimer);
    state.mapSheet.snapVisualTimer = window.setTimeout(() => {
      dom.mapBottomSheet.classList.remove("is-snapping");
      state.mapSheet.snapVisualTimer = null;
    }, SHEET_SNAP_VISUAL_MS);
  }
  if (!animate) {
    window.requestAnimationFrame(() => dom.mapBottomSheet.classList.remove("is-dragging"));
  }
}

function updateMapBottomSheetMeta() {
  if (!dom.mapBottomSheetCount) return;
  dom.mapBottomSheetCount.classList.remove("is-updated");
  window.requestAnimationFrame(() => dom.mapBottomSheetCount.classList.add("is-updated"));
  dom.mapBottomSheetCount.textContent = String(state.filteredEvents.length);
}

function setMapSearchAreaCtaLoading(isLoading) {
  if (!dom.mapSearchAreaCta) return;
  state.mapSearchArea.loading = Boolean(isLoading);
  dom.mapSearchAreaCta.disabled = state.mapSearchArea.loading;
  dom.mapSearchAreaCta.classList.toggle("is-loading", state.mapSearchArea.loading);
  dom.mapSearchAreaCta.textContent = state.mapSearchArea.loading
    ? t("map_search_loading")
    : t("map_search_area");
}

function showMapSearchAreaCta(visible) {
  if (!dom.mapSearchAreaCta) return;
  state.mapSearchArea.visible = Boolean(visible);
  const cta = dom.mapSearchAreaCta;
  if (state.mapSearchArea.hideTimer) {
    window.clearTimeout(state.mapSearchArea.hideTimer);
    state.mapSearchArea.hideTimer = null;
  }

  if (state.mapSearchArea.visible) {
    cta.hidden = false;
    window.requestAnimationFrame(() => cta.classList.add("is-visible"));
    return;
  }

  cta.classList.remove("is-visible");
  state.mapSearchArea.hideTimer = window.setTimeout(() => {
    if (!state.mapSearchArea.visible) cta.hidden = true;
    state.mapSearchArea.hideTimer = null;
  }, 180);
}

function clearMapSearchAreaPendingState() {
  state.mapSearchArea.pendingViewportChange = false;
  showMapSearchAreaCta(false);
}

function shouldShowMapSearchAreaCta(nextCenter, nextZoom) {
  if (!nextCenter || !Number.isFinite(nextCenter.lat) || !Number.isFinite(nextCenter.lng)) return false;
  const previousCenter = state.mapSearchArea.lastCenter;
  const previousZoom = state.mapSearchArea.lastZoom;
  if (!previousCenter || !Number.isFinite(previousCenter.lat) || !Number.isFinite(previousCenter.lng)) return false;
  if (!Number.isFinite(previousZoom)) return false;

  const zoomChanged = Math.abs(nextZoom - previousZoom) >= 1;
  if (zoomChanged) return true;

  const bounds = map?.getBounds?.();
  const latSpan = Math.abs((bounds?.getNorth?.() || nextCenter.lat) - (bounds?.getSouth?.() || nextCenter.lat));
  const lngSpan = Math.abs((bounds?.getEast?.() || nextCenter.lng) - (bounds?.getWest?.() || nextCenter.lng));
  const latThreshold = Math.max(0.004, latSpan * MAP_SEARCH_AREA_MOVE_THRESHOLD_RATIO);
  const lngThreshold = Math.max(0.004, lngSpan * MAP_SEARCH_AREA_MOVE_THRESHOLD_RATIO);
  const latDelta = Math.abs(nextCenter.lat - previousCenter.lat);
  const lngDelta = Math.abs(nextCenter.lng - previousCenter.lng);
  return latDelta > latThreshold || lngDelta > lngThreshold;
}

function refreshMapSearchAreaBaseline() {
  if (!map) return;
  const center = map.getCenter();
  state.mapSearchArea.lastCenter = { lat: center.lat, lng: center.lng };
  state.mapSearchArea.lastZoom = map.getZoom();
}

function rememberCurrentMapViewport() {
  refreshMapSearchAreaBaseline();
}

function refreshEventsForVisibleMapBounds() {
  if (!map) return;
  state.mapSearchArea.pendingViewportChange = false;
  setMapSearchAreaCtaLoading(true);
  window.setTimeout(() => {
    try {
      applyFilters();
      refreshMapSearchAreaBaseline();
      showMapSearchAreaCta(false);
    } finally {
      setMapSearchAreaCtaLoading(false);
    }
  }, 80);
}

function handleMapViewportChanged() {
  if (!map || state.viewMode !== "map") return;
  if (state.mapSearchArea.loading) return;
  const nextCenter = map.getCenter();
  const nextZoom = map.getZoom();
  const shouldShow = shouldShowMapSearchAreaCta(nextCenter, nextZoom);
  state.mapSearchArea.pendingViewportChange = shouldShow;
  showMapSearchAreaCta(shouldShow);
}

function updateMapBottomSheetLayout() {
  if (!mapSheetIsAvailable()) return;
  updateMapSheetEnabledFlag();
  computeMapBottomSheetSnapHeights();
  setMapBottomSheetState(state.viewMode === "map" ? state.mapSheet.state : "peek", { animate: false });
}

function bindMapBottomSheetDrag() {
  if (!dom.mapBottomSheetHandle || !dom.mapBottomSheet) return;

  let dragActive = false;
  let startY = 0;
  let startTime = 0;
  let totalDeltaY = 0;

  const onPointerMove = (event) => {
    if (!dragActive || !state.mapSheet.enabled) return;
    const deltaY = event.clientY - startY;
    totalDeltaY = deltaY;
    const damped = clampNumber(deltaY, -90, 180);
    dom.mapBottomSheet.style.transform = `translateY(${damped}px)`;
  };

  const onPointerUp = (event) => {
    if (!dragActive) return;
    dragActive = false;
    dom.mapBottomSheet.classList.remove("is-dragging");

    const elapsedMs = Math.max(1, performance.now() - startTime);
    const velocityY = totalDeltaY / elapsedMs;
    const absoluteDelta = Math.abs(totalDeltaY);
    const absoluteVelocity = Math.abs(velocityY);
    const currentState = state.mapSheet.state;
    const direction = totalDeltaY > 0 ? 1 : -1;
    let nextState = currentState;

    if (absoluteVelocity > MAP_SHEET_VELOCITY_THRESHOLD) {
      nextState = getNextMapSheetState(currentState, direction);
    } else if (absoluteDelta > MAP_SHEET_DRAG_THRESHOLD) {
      nextState = getNextMapSheetState(currentState, direction);
    } else {
      const baseTop = state.mapSheet.snapPx[currentState] || state.mapSheet.snapPx.half;
      nextState = getNearestMapSheetStateFromTop(baseTop + totalDeltaY);
    }

    setMapBottomSheetState(nextState);
    totalDeltaY = 0;
    dom.mapBottomSheet.style.transform = "translateY(0)";
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    if (event.pointerId !== undefined && dom.mapBottomSheetHandle.hasPointerCapture?.(event.pointerId)) {
      dom.mapBottomSheetHandle.releasePointerCapture(event.pointerId);
    }
  };

  dom.mapBottomSheetHandle.addEventListener("pointerdown", (event) => {
    if (!state.mapSheet.enabled) return;
    dragActive = true;
    startY = event.clientY;
    totalDeltaY = 0;
    startTime = performance.now();
    dom.mapBottomSheet.classList.add("is-dragging");
    dom.mapBottomSheetHandle.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  });
}

function setViewMode(nextMode, { scroll = false } = {}) {
  const resolvedMode = nextMode === "map" ? "map" : "list";
  const previousMode = state.viewMode;
  state.viewMode = resolvedMode;
  document.body.dataset.viewMode = resolvedMode;
  if (previousMode !== resolvedMode) {
    setDocumentTransitionState(resolvedMode);
  }
  if (previousMode !== resolvedMode) {
    triggerViewModeFeedback();
  }
  updateMapSheetEnabledFlag();
  if (resolvedMode !== "map") {
    clearMapSearchAreaPendingState();
  } else {
    showMapSearchAreaCta(Boolean(state.mapSearchArea.pendingViewportChange));
    setMapSearchAreaCtaLoading(false);
  }
  if (dom.viewToggleList) dom.viewToggleList.classList.toggle("is-active", resolvedMode === "list");
  if (dom.viewToggleMap) dom.viewToggleMap.classList.toggle("is-active", resolvedMode === "map");
  if (dom.bottomNavDiscover) dom.bottomNavDiscover.classList.toggle("is-active", resolvedMode === "list");
  if (dom.bottomNavMap) dom.bottomNavMap.classList.toggle("is-active", resolvedMode === "map");
  if (mapSheetIsAvailable()) {
    setMapBottomSheetState(resolvedMode === "map" ? "half" : "peek");
  }

  if (resolvedMode === "map") {
    window.setTimeout(() => {
      if (map) map.invalidateSize();
      computeMapBottomSheetSnapHeights();
      setMapBottomSheetState(state.mapSheet.state, { animate: false });
      renderMapMarkers();
    }, 220);
    if (scroll && dom.mapSection) dom.mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (scroll && dom.listSection) {
    dom.listSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function createEventCard(event, index = 0) {
  const card = document.createElement("article");
  card.className = "event-card";
  card.dataset.eventId = event.id;
  card.style.setProperty("--card-index", String(index));
  const primaryGenre = splitGenres(event.genre)[0] || event.genre || "-";
  const favoriteActive = isFavoriteEvent(event.id);
  const recurrenceLineText = getRecurringText(event, state.lang);
  const distanceLine = Number.isFinite(event.distance_km)
    ? `<p class="event-card__line event-card__line--distance">${formatDistanceLabel(event.distance_km)}</p>`
    : "";
  const recurrenceLine = recurrenceLineText
    ? `<p class="event-card__line event-card__line--recurrence">📅 ${recurrenceLineText}</p>`
    : "";
  card.innerHTML = `
    <div class="event-card__media">
      ${
        event.image_url
          ? `<img class="event-card__image" src="${event.image_url}" alt="${event.name}" loading="lazy">`
          : `<div class="event-card__image-fallback" aria-hidden="true"><span>${iconForGenre(primaryGenre)}</span></div>`
      }
      <span class="event-card__genre-badge">${primaryGenre}</span>
      <button
        type="button"
        class="event-card__favorite ${favoriteActive ? "is-active" : ""}"
        data-action="favorite-toggle"
        aria-label="Favorite event"
        aria-pressed="${favoriteActive ? "true" : "false"}"
      >
        ❤
      </button>
    </div>
    <div class="event-card__body">
      <div class="event-card__header">
        <h4 class="event-card__title">${event.name}</h4>
        <div class="event-card_artist">${event.artist_name ? `Mit ${event.artist_name}` : ""}</div>
      </div>
      ${recurrenceLine}
      ${distanceLine}
      <p class="event-card__line event-card__line--datetime">🗓 ${formatDateTime(event)}</p>
      <p class="event-card__line event-card__line--location">📍 ${formatEventPlace(event)}</p>
      <div class="event-card__chips">
        <span class="event-card__chip">${primaryGenre}</span>
        <span class="event-card__chip event-card__chip--price">${formatPrice(event.price_text)}</span>
      </div>
    </div>
  `;
  card.addEventListener("click", (clickEvent) => {
    const target = clickEvent.target instanceof Element ? clickEvent.target : null;
    const favoriteButton = target?.closest("button[data-action='favorite-toggle']");
    if (favoriteButton) {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      const isFavorite = toggleFavoriteEvent(event.id);
      favoriteButton.classList.toggle("is-active", isFavorite);
      favoriteButton.setAttribute("aria-pressed", String(isFavorite));
      favoriteButton.classList.remove("is-burst");
      window.requestAnimationFrame(() => favoriteButton.classList.add("is-burst"));
      return;
    }

    selectEvent(event, "list");
  });
  return card;
}

function renderEventList() {
  dom.eventList.innerHTML = "";
  setResultCount(state.filteredEvents.length);

  if (!state.filteredEvents.length) {
    dom.eventList.innerHTML = `
      <div class="event-list__empty event-list__empty-state">
        <p>${t("no_events_found")}</p>
        <div class="event-list__empty-actions">
          <button type="button" class="button-secondary" data-action="empty-reset">${t("filter_reset")}</button>
          <button type="button" class="button-secondary button-secondary--primary" data-action="empty-open-submit">${t("submit_cta")}</button>
        </div>
      </div>
    `;
    dom.eventDetails.className = "event-details event-details--empty";
    dom.eventDetails.innerHTML = `
      <p>${t("details_empty")}</p>
      <div class="event-details__actions">
        <button type="button" class="button-secondary" data-action="empty-switch-list">${t("view_list")}</button>
      </div>
    `;
    return;
  }

  state.filteredEvents.forEach((event, index) => {
    const card = createEventCard(event, index);
    card.classList.add("event-card--enter");
    card.style.setProperty("--card-index", String(index));
    if (event.id === state.selectedEventId) card.classList.add("event-card--active");
    dom.eventList.append(card);
    window.requestAnimationFrame(() => card.classList.add("is-ready"));
  });
}

function renderMapSheetEmptyState() {
  if (!dom.eventDetails || state.filteredEvents.length) return;
  dom.eventDetails.className = "event-details event-details--empty";
  dom.eventDetails.innerHTML = `
    <p>${t("no_events_found")}</p>
    <div class="event-details__actions sheet-empty-actions">
      <button type="button" class="button-secondary" data-action="sheet-clear-filters">${t("filter_reset")}</button>
      <button type="button" class="button-secondary button-secondary--primary" data-action="sheet-expand-search">${t("sheet_filter")}</button>
    </div>
  `;
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
  if (activeMarkerId === eventId) return;
  if (activeMarkerId && markersByEventId.has(activeMarkerId)) {
    const previousMarker = markersByEventId.get(activeMarkerId);
    const previousEvent = markerEventsById.get(activeMarkerId);
    if (previousMarker && previousEvent) {
      previousMarker.setIcon(createMarkerIcon(previousEvent, false));
    }
  }
  if (eventId && markersByEventId.has(eventId)) {
    const nextMarker = markersByEventId.get(eventId);
    const nextEvent = markerEventsById.get(eventId);
    if (nextMarker && nextEvent) {
      nextMarker.setIcon(createMarkerIcon(nextEvent, true));
    }
  }
  activeMarkerId = eventId || null;
}

function initMap() {
  map = L.map("map", { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  map.on("moveend", debouncedHandleMapViewportChanged);
  refreshMapSearchAreaBaseline();
  window.setTimeout(() => map.invalidateSize(), 250);
}

function markerPopupHtml(event) {
  const locationLine = [event.location_name, event.address, event.city].filter(Boolean).join(", ");
  const navigationUrl = buildNavigationUrl(event);
  const recurringText = getRecurringText(event, state.lang);
  const recurringLine = recurringText ? `<span>📅 ${recurringText}</span><br>` : "";
  const navigationLink = navigationUrl
    ? `<a class="popup__route-link" href="${navigationUrl}" target="_blank" rel="noopener noreferrer">${t("details_navigate")}</a>`
    : "";
  return `
    <div class="popup">
      <strong>${event.name}</strong><br>
      <span>${locationLine || "-"}</span><br>
      <span>${formatDateTime(event)}</span><br>
      ${recurringLine}
      <span>${event.genre || "-"} - ${formatPrice(event.price_text)}</span>
      ${navigationLink}
    </div>
  `;
}

function renderMapMarkers() {
  if (!map || !markersLayer) return;
  if (!state.eventsLoaded && !state.allEvents.length) return;

  markersLayer.clearLayers();
  markersByEventId.clear();
  markerEventsById.clear();
  activeMarkerId = null;
  const bounds = [];

  const filteredMappableEvents = getMappableEvents(state.filteredEvents);
  const allMappableEvents = getMappableEvents(state.allEvents);
  const markerSource = filteredMappableEvents.length ? filteredMappableEvents : allMappableEvents;
  console.log("[Marcha Debug] Map marker render:", {
    mapReady: Boolean(map && markersLayer),
    eventsLoaded: state.eventsLoaded,
    filteredEvents: state.filteredEvents.length,
    filteredMappableEvents: filteredMappableEvents.length,
    allEvents: state.allEvents.length,
    allMappableEvents: allMappableEvents.length,
    markerSource: filteredMappableEvents.length ? "filtered" : "all-fallback"
  });

  if (!filteredMappableEvents.length && allMappableEvents.length) {
    console.info("[Marcha Debug] Map marker fallback active (using all events).", {
      filteredEvents: state.filteredEvents.length,
      filteredMappableEvents: filteredMappableEvents.length,
      allEvents: state.allEvents.length,
      allMappableEvents: allMappableEvents.length
    });
  }

  markerSource.forEach((event) => {
    const marker = L.marker([event.lat, event.lng], {
      title: event.name,
      icon: createMarkerIcon(event, false)
    })
      .bindPopup(markerPopupHtml(event))
      .on("click", () => selectEvent(event, "marker"));

    markersLayer.addLayer(marker);
    markersByEventId.set(event.id, marker);
    markerEventsById.set(event.id, event);
    bounds.push([event.lat, event.lng]);
  });

  if (!bounds.length && state.eventsLoaded) {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }

  throttledFitMapToBounds(bounds);

  syncActiveMarker(state.selectedEventId);
  if (state.viewMode === "map" && mapSheetIsAvailable()) {
    computeMapBottomSheetSnapHeights();
  }
}

function formatRecurringDetail(event) {
  return getRecurringText(event, state.lang);
}

function renderEventDetails(event) {
  if (!event) {
    dom.eventDetails.className = "event-details event-details--empty";
    dom.eventDetails.textContent = t("details_empty");
    if (state.viewMode === "map" && mapSheetIsAvailable()) {
      setMapBottomSheetState("peek");
    }
    return;
  }

  dom.eventDetails.className = "event-details event-details--filled";
  const locationName = String(event.location_name || "").trim();
  const venueCategory = String(event.venue_category || event.location_category || "").trim();
  const addressLine = [event.address, event.postal_code, event.city, event.country]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
  const fallbackLocationLine = [locationName, event.address, event.city].filter(Boolean).join(", ");
  const navigationUrl = buildNavigationUrl(event);
  const mainArtist = String(event.artist_name || "").trim();
  const additionalArtists = String(event.additional_artists || "").trim();
  const artistLine = mainArtist ? `<p class="event-details__artist">Mit ${mainArtist}</p>` : "";
  const additionalArtistsLine = additionalArtists
    ? `<p class="event-details__subtitle">${additionalArtists}</p>`
    : "";
  const recurringText = formatRecurringDetail(event);
  const recurringLine = recurringText
    ? `<p class="event-details__recurrence">📅 ${recurringText}</p>`
    : "";
  const dateText = formatDate(event.event_date, true);
  const timeText = event.event_time || t("details_time_fallback");
  const genreText = event.genre || "-";
  const priceText = formatPrice(event.price_text);
  const locationLead = locationName || event.city || fallbackLocationLine || "-";
  const addressOnlyLine = [event.address, event.postal_code]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
  const cityCountryLine = [event.city, event.country]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
  const addressDetail = addressOnlyLine || cityCountryLine || "-";
  const cityCountryMarkup = addressOnlyLine && cityCountryLine
    ? `<p class="event-details__venue-detail">${cityCountryLine}</p>`
    : "";
  const locationExtraMarkup = venueCategory
    ? `<p class="event-details__venue-detail event-details__location-extra">${venueCategory}</p>`
    : "";
  const hasCoordinates = Number.isFinite(event.lat) && Number.isFinite(event.lng);
  const distancePlaceholder = hasCoordinates
    ? `<p class="event-details__distance-slot" data-distance-slot data-lat="${event.lat}" data-lng="${event.lng}"></p>`
    : "";
  const descriptionText = String(event.description || t("details_no_description")).trim();
  const descriptionMarkup = descriptionText
    ? `<article class="event-details__section event-details__section--description">
          <h5>${t("form_label_description")}</h5>
          <p>${descriptionText}</p>
       </article>`
    : "";
  const navigationCtaInline = navigationUrl
    ? `
      <button
        type="button"
        class="button-secondary event-details__route-inline"
        data-action="details-navigate"
        data-event-id="${event.id}"
      >
        ${t("details_navigate")}
      </button>
      `
    : `
      <button
        type="button"
        class="button-secondary event-details__route-inline"
        data-action="details-navigate"
        data-event-id="${event.id}"
        disabled
      >
        ${t("details_navigate")}
      </button>
      `;
  dom.eventDetails.innerHTML = `
    <div class="event-details__layout">
      <div class="event-details__media">
        ${
          event.image_url
            ? `<img class="event-details__image" src="${event.image_url}" alt="${event.name}" loading="lazy">`
            : `<div class="event-details__image-fallback" aria-hidden="true"><span>🎵</span></div>`
        }
      </div>
      <div class="event-details__content">
        <div class="event-details__header">
          <h4>${event.name}</h4>
          ${artistLine}
          ${additionalArtistsLine}
          <div class="event-details__location-row">
            <p class="event-details__location-lead">📍 ${locationLead}</p>
            ${navigationCtaInline}
          </div>
          <p class="event-details__venue-detail">${addressDetail}</p>
          ${cityCountryMarkup}
          ${locationExtraMarkup}
          ${distancePlaceholder}
          ${recurringLine}
        </div>
        <div class="event-details__flow">
          <article class="event-details__section">
            <h5>${t("details_date")}</h5>
            <p>${dateText} • ${timeText}</p>
          </article>
          <article class="event-details__section">
            <h5>${t("details_genre")}</h5>
            <p>${genreText}</p>
          </article>
          <article class="event-details__section">
            <h5>${t("details_price")}</h5>
            <p>${priceText}</p>
          </article>
        </div>
        ${descriptionMarkup}
      </div>
    </div>
  `;
  dom.eventDetails.classList.remove("event-details--animate-in");
  window.requestAnimationFrame(() => {
    dom.eventDetails.classList.add("event-details--animate-in");
  });
  if (state.viewMode === "map" && mapSheetIsAvailable()) {
    setMapBottomSheetState("half");
  }
}

function findEventById(eventId) {
  const normalizedId = String(eventId || "").trim();
  if (!normalizedId) return null;
  return state.filteredEvents.find((item) => item.id === normalizedId) || state.allEvents.find((item) => item.id === normalizedId) || null;
}

function resolveSelectEventData(eventData) {
  if (!eventData) return null;
  if (typeof eventData === "object") {
    const resolved = findEventById(eventData.id);
    return resolved || eventData;
  }
  return findEventById(eventData);
}

function resolveSelectEventOptions(source) {
  if (source && typeof source === "object") {
    return {
      flyTo: Boolean(source.flyTo),
      openPopup: Boolean(source.openPopup),
      scrollIntoView: Boolean(source.scrollIntoView),
      preferMapOnMobile: Boolean(source.preferMapOnMobile)
    };
  }

  const sourceKey = String(source || "list").toLowerCase();
  if (sourceKey === "featured") {
    return { flyTo: true, openPopup: true, scrollIntoView: true, preferMapOnMobile: false };
  }
  if (sourceKey === "marker") {
    return { flyTo: false, openPopup: false, scrollIntoView: true, preferMapOnMobile: false };
  }
  if (sourceKey === "list") {
    return { flyTo: true, openPopup: true, scrollIntoView: false, preferMapOnMobile: true };
  }
  return { flyTo: false, openPopup: false, scrollIntoView: false, preferMapOnMobile: false };
}

function renderActiveCard(options = { scrollIntoView: false }) {
  const activeEventId = String(state.activeEventId || state.selectedEventId || "");
  document.querySelectorAll(".event-card").forEach((card) => {
    const isActive = card.dataset.eventId === activeEventId;
    card.classList.toggle("event-card--active", isActive);
    if (isActive && options.scrollIntoView) {
      card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
  syncActiveMarker(activeEventId);
}

function focusMapOnEvent(eventData, options = { flyTo: false, openPopup: false }) {
  if (!eventData) return;
  if (!Number.isFinite(eventData.lat) || !Number.isFinite(eventData.lng)) return;
  const marker = markersByEventId.get(eventData.id);
  if (options.flyTo) throttledSelectEventMapFocus(eventData, 13);
  if (options.openPopup && marker) marker.openPopup();
}

function openMapDetails() {
  if (!mapSheetIsAvailable()) return;
  // Detail content should open from every selection entry point, even if desktop view mode is "list".
  setMapBottomSheetState(mapSheetIsMobileViewport() ? "peek" : "half");
}

function selectEvent(eventData, source = "list") {
  const resolvedEvent = resolveSelectEventData(eventData);
  if (!resolvedEvent) return;

  // Keep every click-entry path (list/featured/marker/auto) in one state flow.
  const options = resolveSelectEventOptions(source);
  if (options.preferMapOnMobile && mapSheetIsMobileViewport() && state.viewMode !== "map") {
    setViewMode("map", { scroll: true });
  }
  state.activeEventId = resolvedEvent.id;
  state.activeEvent = resolvedEvent;
  state.selectedEventId = resolvedEvent.id;

  renderActiveCard({ scrollIntoView: options.scrollIntoView });
  renderEventDetails(resolvedEvent);
  focusMapOnEvent(resolvedEvent, options);
  openMapDetails();
}

function clearGenreSelection() {
  state.activeGenres.clear();
  renderGenreFilter();
  applyFilters();
}

function resetFilters() {
  dom.searchInput.value = "";
  dom.cityFilter.value = "";
  setDateRangeState({ start: null, end: null }, "");
  setNearbyFilterState({ nearbyOnly: false, radiusKm: DEFAULT_NEARBY_RADIUS_KM, showHint: false });
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
    const recurrenceType = normalizeRecurrenceType(payload.recurrence_type);
    const requiresRecurrenceSchema = recurrenceType !== RECURRENCE_TYPE_NONE;
    if (requiresRecurrenceSchema) {
      const recurrenceColumnsReady = await hasRecurrenceColumns(client);
      if (!recurrenceColumnsReady) {
        setFormFeedback(t("form_error_recurrence_schema_missing"), "error");
        return;
      }
    }
    let payloadWithCoordinates;
    let uploadedImagePath = null;
    try {
      payloadWithCoordinates = await resolveCoordinatesForPayload(payload);
    } catch (geocodingError) {
      setFormFeedback(t("form_error_geocoding_failed"), "error");
      return;
    }
    if (payload.main_image) {
      try {
        const uploadResult = await uploadEventImage(client, payload.main_image);
        uploadedImagePath = uploadResult.path;
        payloadWithCoordinates = {
          ...payloadWithCoordinates,
          image_url: uploadResult.publicUrl
        };
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        setFormFeedback(t("form_error_image_upload"), "error");
        return;
      }
    }
    const insertPayload = buildInsertPayload(payloadWithCoordinates);
    const { data, error } = await insertEventWithSchemaFallback(client, insertPayload);

    console.log("[Marcha Debug] Event insert data:", data);
    console.log("[Marcha Debug] Event insert error:", error);

    if (error) {
      if (uploadedImagePath) {
        try {
          await deleteUploadedEventImage(client, uploadedImagePath);
        } catch (cleanupError) {
          console.warn("[Marcha Debug] Image cleanup failed:", cleanupError);
          throw new Error(`${error.message || "Insert failed"} ${t("form_error_image_cleanup")}`.trim());
        }
      }
      throw new Error(error.message);
    }

    clearEventForm();
    persistSubmitterProfile(payload);
    setFormFeedback(t("form_success"), "success");
    await reloadEventsAndRender();
    window.setTimeout(closeSubmitModal, 1800);
  } catch (error) {
    console.error("Event speichern fehlgeschlagen:", error);
    if (isRlsInsertError(error)) {
      setFormFeedback(`${t("form_error_generic")} ${t("form_error_rls_submit")}`.trim(), "error");
      return;
    }
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
    console.log("[Marcha Debug] Moderation edge data:", data);
    console.log("[Marcha Debug] Moderation edge error:", error);
    if (error) throw new Error(error.message);
    return;
  }

  const { data, error } = await client
    .from(state.debug.tableName || "events")
    .update(payload)
    .eq("id", eventId)
    .select("*")
    .single();

  console.log("[Marcha Debug] Moderation update data:", data);
  console.log("[Marcha Debug] Moderation update error:", error);
  if (error) throw new Error(error.message);
}

function bindEvents() {
  attachTapFeedback();
  attachRecurrenceFieldListeners();
  updateInstallUiVisibility();
  dom.filtersForm.addEventListener("submit", (event) => event.preventDefault());
  if (dom.heroSearchForm) {
    dom.heroSearchForm.addEventListener("submit", (event) => event.preventDefault());
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPromptEvent = event;
    logInstallUiState("event:beforeinstallprompt");
    updateInstallUiVisibility();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPromptEvent = null;
    persistInstallBannerTimestamp(INSTALL_BANNER_INSTALLED_STORAGE_KEY, INSTALL_BANNER_INSTALLED_DAYS);
    logInstallUiState("event:appinstalled");
    updateInstallUiVisibility();
  });
  const standaloneDisplayQuery = window.matchMedia?.("(display-mode: standalone)");
  standaloneDisplayQuery?.addEventListener?.("change", () => {
    logInstallUiState("event:display-mode-change");
    updateInstallUiVisibility();
  });
  window.addEventListener("pageshow", () => {
    logInstallUiState("event:pageshow");
    updateInstallUiVisibility();
  });
  dom.searchInput.addEventListener("input", () => {
    syncHeroControlsFromSidebar();
    syncMapSheetControlsFromSidebar();
    debouncedApplyFilters();
  });
  dom.cityFilter.addEventListener("change", () => {
    syncHeroControlsFromSidebar();
    syncMapSheetControlsFromSidebar();
    debouncedApplyFilters();
  });
  dom.dateFilter.addEventListener("change", handleLegacyDateFilterChange);
  if (dom.timePresetGroup) {
    dom.timePresetGroup.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest("button[data-date-preset]");
      if (!button) return;
      applyDatePreset(button.dataset.datePreset || "");
    });
  }
  if (dom.dateRangeStart) {
    dom.dateRangeStart.addEventListener("change", handleCustomDateRangeInputChange);
  }
  if (dom.dateRangeEnd) {
    dom.dateRangeEnd.addEventListener("change", handleCustomDateRangeInputChange);
  }
  if (dom.nearbyToggle) {
    dom.nearbyToggle.addEventListener("click", async () => {
      if (state.nearbyOnly) {
        setNearbyFilterState({ nearbyOnly: false, showHint: false });
        applyFilters();
        return;
      }
      const locationReady = await ensureUserLocation();
      if (!locationReady) {
        setNearbyFilterState({ nearbyOnly: false, showHint: true });
        applyFilters();
        return;
      }
      setNearbyFilterState({ nearbyOnly: true, showHint: false });
      applyFilters();
    });
  }
  if (dom.nearbyRadiusGroup) {
    dom.nearbyRadiusGroup.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest("button[data-radius-km]");
      if (!button) return;
      setNearbyFilterState({
        nearbyOnly: state.nearbyOnly,
        radiusKm: button.dataset.radiusKm || state.radiusKm,
        showHint: state.nearbyHintVisible
      });
      if (state.nearbyOnly) applyFilters();
    });
  }
  if (dom.heroSearchInput) {
    dom.heroSearchInput.addEventListener("input", () => {
      syncSidebarFromHeroControls();
      syncMapSheetControlsFromSidebar();
      debouncedApplyFilters();
    });
  }
  if (dom.heroCityFilter) {
    dom.heroCityFilter.addEventListener("change", () => {
      syncSidebarFromHeroControls();
      syncMapSheetControlsFromSidebar();
      debouncedApplyFilters();
    });
  }
  if (dom.heroDateFilter) {
    dom.heroDateFilter.addEventListener("change", () => {
      syncSidebarFromHeroControls();
      syncMapSheetControlsFromSidebar();
      handleLegacyDateFilterChange();
    });
  }
  if (dom.mapSheetSearchInput) {
    dom.mapSheetSearchInput.addEventListener("input", () => {
      syncSidebarFromMapSheetControls();
      syncHeroControlsFromSidebar();
      debouncedApplyFilters();
    });
  }
  if (dom.mapSheetCityFilter) {
    dom.mapSheetCityFilter.addEventListener("change", () => {
      syncSidebarFromMapSheetControls();
      syncHeroControlsFromSidebar();
      debouncedApplyFilters();
    });
  }
  if (dom.mapSheetDateFilter) {
    dom.mapSheetDateFilter.addEventListener("change", () => {
      syncSidebarFromMapSheetControls();
      syncHeroControlsFromSidebar();
      handleLegacyDateFilterChange();
    });
  }
  if (dom.languageSwitch) {
    dom.languageSwitch.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-lang-switch]");
      if (!button) return;
      switchLanguage(button.dataset.langSwitch);
    });
  }
  if (dom.locationChip) {
    dom.locationChip.addEventListener("click", () => {
      setViewMode("list", { scroll: true });
      dom.heroSearchInput?.focus();
    });
  }
  if (dom.openSubmitModal) {
    dom.openSubmitModal.addEventListener("click", () => {
      setFormFeedback("");
      openSubmitModal();
    });
  }
  if (dom.openSubmitModalHero) {
    dom.openSubmitModalHero.addEventListener("click", () => {
      setFormFeedback("");
      openSubmitModal();
    });
  }
  if (dom.heroFeedbackCta) {
    dom.heroFeedbackCta.addEventListener("click", () => {
      openBetaFeedback();
    });
  }
  if (dom.installBannerPrimary) {
    dom.installBannerPrimary.addEventListener("click", () => {
      handleInstallBannerPrimaryAction();
    });
  }
  if (dom.installBannerDismiss) {
    dom.installBannerDismiss.addEventListener("click", () => {
      persistInstallBannerTimestamp(INSTALL_BANNER_DISMISS_STORAGE_KEY, INSTALL_BANNER_DISMISS_DAYS);
      updateInstallUiVisibility();
    });
  }
  if (dom.mobileInstallEntryCta) {
    dom.mobileInstallEntryCta.addEventListener("click", () => {
      handleMobileInstallEntryAction();
    });
  }
  if (dom.mobileInstallEntryDismiss) {
    dom.mobileInstallEntryDismiss.addEventListener("click", () => {
      persistInstallBannerTimestamp(MOBILE_INSTALL_CTA_DISMISS_STORAGE_KEY, MOBILE_INSTALL_CTA_DISMISS_DAYS);
      updateInstallUiVisibility();
    });
  }
  if (dom.bottomNavSubmit) {
    dom.bottomNavSubmit.addEventListener("click", () => {
      setFormFeedback("");
      openSubmitModal();
    });
  }
  if (dom.bottomNavDiscover) {
    dom.bottomNavDiscover.addEventListener("click", (event) => {
      event.preventDefault();
      setViewMode("list", { scroll: true });
    });
  }
  if (dom.bottomNavMap) {
    dom.bottomNavMap.addEventListener("click", (event) => {
      event.preventDefault();
      setViewMode("map", { scroll: true });
    });
  }
  if (dom.viewToggleList) {
    dom.viewToggleList.addEventListener("click", () => setViewMode("list", { scroll: true }));
  }
  if (dom.viewToggleMap) {
    dom.viewToggleMap.addEventListener("click", () => setViewMode("map", { scroll: true }));
  }
  if (dom.quickCategoryRail) {
    dom.quickCategoryRail.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-quick-category]");
      if (!button) return;
      const categoryId = String(button.dataset.quickCategory || "all");
      state.activeQuickCategoryId = categoryId;
      renderQuickCategories();
      applyFilters();
    });
  }
  if (dom.eventList) {
    dom.eventList.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const resetButton = target.closest("button[data-action='empty-reset']");
      if (resetButton) {
        resetFilters();
        return;
      }
      const submitButton = target.closest("button[data-action='empty-open-submit']");
      if (submitButton) {
        setFormFeedback("");
        openSubmitModal();
      }
    });
  }
  if (dom.mapSearchAreaCta) {
    dom.mapSearchAreaCta.addEventListener("click", () => {
      refreshEventsForVisibleMapBounds();
    });
  }
  if (dom.mapSheetSortNearby) {
    dom.mapSheetSortNearby.addEventListener("click", () => {
      state.discoverySort = "nearby";
      applyFilters();
      if (state.selectedEventId) {
        const selectedEvent = state.filteredEvents.find((event) => event.id === state.selectedEventId);
        if (selectedEvent) {
          flyToEventWithMapSheetOffset(selectedEvent, map?.getZoom?.() || 13);
        }
      }
    });
  }
  if (dom.mapSheetSortSoonest) {
    dom.mapSheetSortSoonest.addEventListener("click", () => {
      state.discoverySort = "soonest";
      applyFilters();
    });
  }
  if (dom.mapSheetFilter) {
    dom.mapSheetFilter.addEventListener("click", () => {
      setViewMode("list", { scroll: true });
      dom.heroSearchInput?.focus();
    });
  }
  if (dom.mapBottomSheet) {
    dom.mapBottomSheet.addEventListener("focusin", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest(".map-sheet-search__input") || target.closest(".map-sheet-search__select")) {
        if (state.viewMode === "map") {
          pulseHaptic(8);
          setMapBottomSheetState("full");
          window.setTimeout(() => map?.invalidateSize(), 120);
        }
      }
    });
    dom.mapBottomSheet.addEventListener("focusout", () => {
      window.setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement instanceof Element && dom.mapBottomSheet.contains(activeElement)) return;
        if (state.viewMode === "map" && state.mapSheet.state === "full") {
          setMapBottomSheetState("half");
        }
      }, 120);
    });
  }
  if (dom.eventDetails) {
    dom.eventDetails.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const navigateButton = target.closest("button[data-action='details-navigate']");
      if (navigateButton) {
        const eventId = navigateButton.dataset.eventId || state.selectedEventId;
        const selectedEvent = findEventById(eventId) || state.activeEvent;
        if (selectedEvent) {
          openNavigationForEvent(selectedEvent);
        }
        return;
      }
      const listButton = target.closest("button[data-action='empty-switch-list']");
      if (listButton) {
        setViewMode("list", { scroll: true });
        return;
      }
      const sheetResetButton = target.closest("button[data-action='sheet-clear-filters']");
      if (sheetResetButton) {
        resetFilters();
        return;
      }
      const sheetExpandButton = target.closest("button[data-action='sheet-expand-search']");
      if (sheetExpandButton) {
        setMapBottomSheetState("full");
        dom.mapSheetSearchInput?.focus();
      }
    });
  }

  const mapSheetInlineFilterButton = document.getElementById("mapSheetInlineFilter");
  if (mapSheetInlineFilterButton) {
    mapSheetInlineFilterButton.addEventListener("click", () => {
      setViewMode("list", { scroll: true });
      dom.heroSearchInput?.focus();
    });
  }

  window.addEventListener("resize", () => {
    updateMapBottomSheetLayout();
    updateInstallUiVisibility();
    if (state.viewMode === "map") {
      window.setTimeout(() => map?.invalidateSize(), 140);
    }
  });

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
  if (dom.mapSheetSearchInput || dom.mapSheetCityFilter || dom.mapSheetDateFilter) {
    dom.resetFilters.addEventListener("click", () => {
      syncMapSheetControlsFromSidebar();
    });
  }
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

  if (dom.formRecurrenceType) {
    dom.formRecurrenceType.addEventListener("change", updateRecurrenceFormState);
  }
  if (dom.formDate) {
    dom.formDate.addEventListener("change", () => {
      if (!dom.formRecurrenceStartDate || dom.formRecurrenceStartDate.value) return;
      dom.formRecurrenceStartDate.value = dom.formDate.value || "";
    });
  }
  updateRecurrenceFormState();
  if (dom.eventForm) {
    dom.eventForm.addEventListener("submit", handleCreateEventSubmit);
  }
  if (dom.adminAuthForm) {
    dom.adminAuthForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!dom.adminAuthEmail || !dom.adminAuthPassword) return;
      const email = dom.adminAuthEmail.value.trim().toLowerCase();
      const password = dom.adminAuthPassword.value;
      if (!email || !password) return;
      setAdminAuthFeedback("");
      try {
        const client = supabaseClient();
        const { error } = await client.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setAdminAuthFeedback(t("admin_login_success"), "success");
        await checkAdminSession();
        await reloadEventsAndRender();
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

  console.log("[Marcha Debug] Supabase table:", tableName);
  console.log("[Marcha Debug] Supabase data:", data);
  console.log("[Marcha Debug] Supabase error:", error);

  if (error) throw new Error(error.message);
  return (data || []).map(normalizeEvent);
}

async function loadEvents() {
  setStatus(t("status_loading"), "loading");
  state.eventsLoaded = false;
  state.debug.hasError = false;
  state.debug.errorMessage = "";
  state.debug.fallbackReason = t("debug_note_pending");
  state.debug.supabaseLoadedCount = 0;
  updateDebugPanel();

  try {
    const data = await fetchEventsFromSupabase();
    state.debug.supabaseLoadedCount = data.length;

    if (!data.length) {
      state.allEvents = [];
      state.moderationEvents = [];
      state.eventsLoaded = true;
      state.sourceType = "supabase-empty";
      state.debug.fallbackReason = t("debug_note_no_data");
      setStatus(t("status_no_data"), "warning");
      updateDebugPanel();
      return;
    }

    state.moderationEvents = isSessionAdmin(state.adminSession) ? data : [];
    state.allEvents = applyDistanceData(expandRecurringEvents(data.filter(isApprovedEvent)));
    state.eventsLoaded = true;
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
    state.allEvents = [];
    state.moderationEvents = [];
    state.eventsLoaded = true;
    state.sourceType = "supabase-error";
    state.debug.hasError = true;
    state.debug.errorMessage = error.message;
    state.debug.fallbackReason = t("debug_note_error");
    setStatus(t("status_error"), "warning");
    updateDebugPanel();
  }
}

async function startApp() {
  state.favoriteEventIds = loadFavoriteEventIds();
  applyRuntimeEnvironmentState();
  suppressInstallUiOnAppLoad();
  registerServiceWorker();
  const query = readQueryParams();
  const requestedLang = resolveLanguage(query.lang);
  state.lang = query.lang ? requestedLang : resolveLanguageFromBrowser(requestedLang);
  state.isAdminMode = resolveAdminMode(query.admin);
  applyStaticTranslations();
  applyLegacyUiCleanupOverrides();
  renderQuickCategories();
  renderAdminAuthState(null);
  renderEventDetails(null);
  bindMapBottomSheetDrag();
  updateMapBottomSheetLayout();
  initMap();
  setViewMode("list");
  bindEvents();
  setupEventLocationAutocomplete();
  renderNearbyFilterControls();
  setupInstallBanner();
  setupMobileInstallEntry();
  await primeUserLocationOnAppLoad();
  await checkAdminSession();
  await loadEvents();
  updateFilterOptions();
  applyFiltersFromQuery();
  syncHeroControlsFromSidebar();
  applyFilters();
  updateMapBottomSheetLayout();
  renderModerationPanel();
}

startApp();
