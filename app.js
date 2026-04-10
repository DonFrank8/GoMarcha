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
const FAVORITES_STORAGE_KEY = "vibeon_event_favorites";
const SUBMITTER_PROFILE_STORAGE_KEY = "vibeon.submitterProfile.v1";

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
    hero_title: "Entdecke, wo dein Vibe passiert.",
    hero_subtitle: "Live Musik, Beach Vibes und echte Events in deiner Nähe.",
    hero_chip_fallback: "Live-Momente entdecken",
    hero_chip_vibe: "Live Music • Beach • Lifestyle",
    hero_search_label: "Suche",
    hero_search_placeholder: "Suche Events, Bands oder Locations",
    discover_title: "Events entdecken",
    discover_subtitle: "Suche nach Events, Bands, DJs und Locations in deiner Nähe.",
    filter_search: "Suche",
    filter_search_placeholder: "Suche Events, Bands oder Locations...",
    filter_city: "Stadt",
    filter_city_all: "Alle Städte",
    filter_date: "Datum",
    filter_date_all: "Alle Daten",
    filter_genre: "Genres",
    filter_genre_all: "Alle Genres",
    filter_reset: "Alle Filter zurücksetzen",
    list_title: "Für dich entdeckt",
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
    no_events_found: "Keine passenden Events gefunden.",
    details_empty: "Wähle ein Event aus, um Details, Bild und Route zu sehen.",
    details_location: "Location",
    details_date: "Datum",
    details_genre: "Genre",
    details_price: "Preis",
    details_navigate: "Route starten",
    details_free: "Eintritt frei",
    details_no_description: "Keine Beschreibung vorhanden.",
    details_time_fallback: "Uhrzeit folgt",
    navigation_unavailable: "Für dieses Event sind keine Navigationsdaten vorhanden.",
    debug_no_error: "Nein",
    debug_note_pending: "Noch keine Entscheidung",
    debug_note_supabase: "Kein Fallback - Daten aus Supabase aktiv",
    debug_note_no_data: "Keine Daten aus Supabase",
    debug_note_error: "Supabase Fehler - Demo-Fallback aktiv",
    button_all: "Alle",
    submit_cta: "Event einreichen",
    admin_quick_access: "Admin",
    form_title: "Event einreichen",
    form_hint: "Dein Event wird eingereicht und vor Veröffentlichung kuratiert.",
    form_submit: "Event einreichen",
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
    admin_subtitle: "Prüfe Einreichungen und entscheide, was im VIBEON Feed sichtbar wird.",
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
    form_label_genre: "Genre",
    form_label_price_text: "Preis (EUR)",
    form_label_description: "Beschreibung",
    form_label_main_image: "Hauptbild (optional)",
    form_label_submitted_by: "Dein Name (Einreicher)",
    form_label_contact_email: "Kontakt E-Mail",
    form_hint_main_image: "1 Bild (JPG/PNG/WebP), max. 5 MB",
    form_hint_price_eur: "Bitte Betrag in Euro angeben, z. B. 25 oder 25 EUR.",
    form_placeholder_name: "z. B. Summer Beats Night",
    form_placeholder_location_name: "z. B. Beach Club",
    form_placeholder_address: "z. B. Paseo Marítimo 1",
    form_placeholder_postal_code: "z. B. 29660",
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
    hero_title: "Find where your vibe lives.",
    hero_subtitle: "Live music, beach vibes and real events near you.",
    hero_chip_fallback: "Discover live moments",
    hero_chip_vibe: "Live Music • Beach • Lifestyle",
    hero_search_label: "Search",
    hero_search_placeholder: "Search events, bands or locations",
    discover_title: "Discover events",
    discover_subtitle: "Discover events, bands, DJs and venues near you.",
    filter_search: "Search",
    filter_search_placeholder: "Search events, bands or locations...",
    filter_city: "City",
    filter_city_all: "All cities",
    filter_date: "Date",
    filter_date_all: "All dates",
    filter_genre: "Genres",
    filter_genre_all: "All genres",
    filter_reset: "Reset all filters",
    list_title: "Curated for you",
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
    no_events_found: "No matching events found.",
    details_empty: "Select an event to view details, image and directions.",
    details_location: "Location",
    details_date: "Date",
    details_genre: "Genre",
    details_price: "Price",
    details_navigate: "Start route",
    details_free: "Free entry",
    details_no_description: "No description available.",
    details_time_fallback: "Time TBD",
    navigation_unavailable: "No navigation data is available for this event.",
    debug_no_error: "No",
    debug_note_pending: "No decision yet",
    debug_note_supabase: "No fallback - Supabase data active",
    debug_note_no_data: "No data from Supabase",
    debug_note_error: "Supabase error - demo fallback active",
    button_all: "All",
    submit_cta: "Submit event",
    admin_quick_access: "Admin",
    form_title: "Submit event",
    form_hint: "Your event will be reviewed and curated before publication.",
    form_submit: "Submit event",
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
    admin_subtitle: "Review submissions and decide what appears in the VIBEON feed.",
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
    form_label_genre: "Genre",
    form_label_price_text: "Price (EUR)",
    form_label_description: "Description",
    form_label_main_image: "Main image (optional)",
    form_label_submitted_by: "Your Name (Submitter)",
    form_label_contact_email: "Contact email",
    form_hint_main_image: "1 image (JPG/PNG/WebP), max. 5 MB",
    form_hint_price_eur: "Please enter amount in euros, e.g. 25 or 25 EUR.",
    form_placeholder_name: "e.g. Summer Beats Night",
    form_placeholder_location_name: "e.g. Beach Club",
    form_placeholder_address: "e.g. Paseo Maritimo 1",
    form_placeholder_postal_code: "e.g. 29660",
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
    hero_title: "Descubre dónde está tu vibe.",
    hero_subtitle: "Música en vivo, beach vibes y eventos reales cerca de ti.",
    hero_chip_fallback: "Descubre momentos en vivo",
    hero_chip_vibe: "Live Music • Beach • Lifestyle",
    hero_search_label: "Buscar",
    hero_search_placeholder: "Busca eventos, bandas o locations",
    discover_title: "Descubre eventos",
    discover_subtitle: "Descubre eventos, bandas, DJs y venues cerca de ti.",
    filter_search: "Buscar",
    filter_search_placeholder: "Busca eventos, bandas o locations...",
    filter_city: "Ciudad",
    filter_city_all: "Todas las ciudades",
    filter_date: "Fecha",
    filter_date_all: "Todas las fechas",
    filter_genre: "Géneros",
    filter_genre_all: "Todos los géneros",
    filter_reset: "Restablecer filtros",
    list_title: "Seleccionado para ti",
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
    no_events_found: "No se encontraron eventos para tu búsqueda.",
    details_empty: "Selecciona un evento para ver detalles, imagen y ruta.",
    details_location: "Ubicación",
    details_date: "Fecha",
    details_genre: "Género",
    details_price: "Precio",
    details_navigate: "Iniciar ruta",
    details_free: "Entrada gratuita",
    details_no_description: "No hay descripción disponible.",
    details_time_fallback: "Hora por confirmar",
    navigation_unavailable: "No hay datos de navegación disponibles para este evento.",
    debug_no_error: "No",
    debug_note_pending: "Sin decisión todavía",
    debug_note_supabase: "Sin fallback - datos de Supabase activos",
    debug_note_no_data: "Sin datos de Supabase",
    debug_note_error: "Error de Supabase - fallback demo activo",
    button_all: "Todos",
    submit_cta: "Enviar evento",
    admin_quick_access: "Admin",
    form_title: "Enviar evento",
    form_hint: "Tu evento será revisado y curado antes de publicarse.",
    form_submit: "Enviar evento",
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
    admin_subtitle: "Revisa envíos y decide qué aparece en el feed de VIBEON.",
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
    form_label_genre: "Género",
    form_label_price_text: "Precio (EUR)",
    form_label_description: "Descripción",
    form_label_main_image: "Imagen principal (opcional)",
    form_label_submitted_by: "Tu nombre (remitente)",
    form_label_contact_email: "Correo de contacto",
    form_hint_main_image: "1 imagen (JPG/PNG/WebP), máx. 5 MB",
    form_hint_price_eur: "Introduce el importe en euros, p. ej. 25 o 25 EUR.",
    form_placeholder_name: "p. ej. Summer Beats Night",
    form_placeholder_location_name: "p. ej. Beach Club",
    form_placeholder_address: "p. ej. Paseo Marítimo 1",
    form_placeholder_postal_code: "p. ej. 29660",
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

const dom = {
  htmlRoot: document.documentElement,
  languageSwitch: document.getElementById("languageSwitch"),
  heroSearchForm: document.getElementById("heroSearchForm"),
  heroSearchInput: document.getElementById("heroSearchInput"),
  appShell: document.querySelector(".app-shell"),
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
  formPostalCode: document.getElementById("formPostalCode"),
  formCity: document.getElementById("formCity"),
  formCountry: document.getElementById("formCountry"),
  formDate: document.getElementById("formDate"),
  formTime: document.getElementById("formTime"),
  formGenre: document.getElementById("formGenre"),
  formPrice: document.getElementById("formPrice"),
  formMainImage: document.getElementById("formMainImage"),
  formSubmittedBy: document.getElementById("formSubmittedBy"),
  formContactEmail: document.getElementById("formContactEmail"),
  formDescription: document.getElementById("formDescription")
};

let map;
let markersLayer;
const markersByEventId = new Map();
const markerEventsById = new Map();

function enforceSinglePublicSearchInput() {
  const legacyHeroMeta = document.querySelector(".hero-search__meta");
  if (legacyHeroMeta) legacyHeroMeta.remove();

  const legacyHeroFilters = document.querySelectorAll("#heroCityFilter, #heroDateFilter");
  legacyHeroFilters.forEach((element) => {
    const parentLabel = element.closest("label");
    if (parentLabel) {
      parentLabel.remove();
      return;
    }
    element.remove();
  });

  const searchInputs = document.querySelectorAll('main input[type="search"]:not(#heroSearchInput)');
  searchInputs.forEach((input) => {
    const fieldLabel = input.closest("label.field");
    if (fieldLabel) {
      fieldLabel.remove();
      return;
    }
    input.remove();
  });
}

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

function switchLanguage(nextLangCode) {
  const nextLang = resolveLanguage(nextLangCode);
  if (nextLang === state.lang) return;
  state.lang = nextLang;
  applyStaticTranslations();
  updateFilterOptions();
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
  if (dom.appShell) {
    dom.appShell.classList.toggle("is-loading-cards", tone === "loading");
  }
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

function isRlsInsertError(error) {
  const text = String(error?.message || "").toLowerCase();
  return text.includes("row-level security policy");
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

function normalizeEvent(event, index) {
  const lat = parseCoordinateValue(event.lat ?? event.latitude ?? event.latitude_decimal ?? null);
  const lng = parseCoordinateValue(event.lng ?? event.longitude ?? event.longitude_decimal ?? null);
  const address = String(event.address || event.street || "").trim();
  const postal_code = String(event.postal_code || event.zip || "").trim();
  const geocodingQuery = String(event.geocoding_query || "").trim();
  const composedAddress = [address, postal_code, event.city, event.country]
    .filter(Boolean)
    .join(", ");
  const normalizedGeocodingQuery = geocodingQuery || composedAddress;
  return {
    id: String(event.id ?? `event-${index}`),
    name: event.name || event.title || "Untitled Event",
    location_name: event.location_name || event.location || "Unknown venue",
    address: event.address || event.street || "",
    postal_code,
    city: event.city || event.location_city || "",
    country: event.country || event.country_name || "",
    event_date: event.event_date || event.date || "",
    event_time: event.event_time || event.time || "",
    genre: event.genre || event.music_genre || "",
    price_text: event.price_text || event.price || t("details_free"),
    description: event.description || t("details_no_description"),
    image_url: event.image_url || event.image || "",
    address,
    status: normalizeStatus(event.status),
    contact_email: event.contact_email || "",
    submitted_by: event.submitted_by || "",
    verification_notes: event.verification_notes || "",
    geocoding_query: normalizedGeocodingQuery || "",
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
    event_date: dom.formDate.value,
    event_time: dom.formTime.value,
    genre: dom.formGenre.value.trim(),
    price_text: normalizePriceText(dom.formPrice.value),
    main_image: dom.formMainImage?.files?.[0] || null,
    submitted_by: dom.formSubmittedBy.value.trim(),
    contact_email: dom.formContactEmail.value.trim(),
    description: dom.formDescription.value.trim(),
    image_url: null,
    lat: null,
    lng: null
  };
}

function validateFormPayload(payload) {
  const requiredFilled =
    payload.name &&
    payload.location_name &&
    payload.address &&
    payload.postal_code &&
    payload.city &&
    payload.country &&
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

function clearEventForm() {
  if (!dom.eventForm) return;
  dom.eventForm.reset();
  if (dom.formMainImage) dom.formMainImage.value = "";
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
  const geocoding_query = buildGeocodingQuery(payload);

  return {
    name: payload.name,
    location_name: payload.location_name,
    address: payload.address || null,
    postal_code: payload.postal_code || null,
    city: payload.city,
    country: payload.country || null,
    event_date: payload.event_date,
    event_time: payload.event_time || null,
    genre: payload.genre,
    price_text: payload.price_text || null,
    description: payload.description || null,
    image_url: payload.image_url || null,
    contact_email: payload.contact_email,
    submitted_by: payload.submitted_by,
    status: "pending",
    verification_notes: null,
    geocoding_query: geocoding_query || null,
    lat: payload.lat,
    lng: payload.lng
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
    console.warn("[PartyRadar Debug] Geocoding failed:", error);
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
    "address",
    "postal_code",
    "geocoding_query",
    "verification_notes",
    "submitted_by",
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
    console.warn(`[PartyRadar Debug] Retrying insert without missing column: ${missingColumn}`);
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

function buildNavigationUrl(event, providerName = DEFAULT_NAVIGATION_PROVIDER) {
  const destination = resolveNavigationDestination(event);
  if (!destination) return "";

  const provider = NAVIGATION_URL_BUILDERS[providerName] || NAVIGATION_URL_BUILDERS.google;
  if (destination.type === "coordinates") return provider.byCoordinates(destination);
  return provider.byAddress(destination.query);
}

function openNavigationForEvent(event, providerName = DEFAULT_NAVIGATION_PROVIDER) {
  const url = buildNavigationUrl(event, providerName);
  if (!url) {
    setStatus(t("navigation_unavailable"), "warning");
    return;
  }

  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!openedWindow) {
    window.location.href = url;
  }
}

function eventSearchText(event) {
  return [event.name, event.location_name, event.address, event.city, event.genre, event.description]
    .join(" ")
    .toLowerCase();
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
  const search = dom.heroSearchInput ? dom.heroSearchInput.value.trim() : "";
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
    let geoStatus = t("admin_geo_unknown");
    let geoStatusClass = "";
    if (Number.isFinite(event.lat) && Number.isFinite(event.lng)) {
      geoStatus = t("admin_geo_ok");
      geoStatusClass = "admin-geo-badge--ok";
    } else if (event.geocoding_query) {
      geoStatus = t("admin_geo_missing");
      geoStatusClass = "admin-geo-badge--missing";
    }
    card.innerHTML = `
      <h4>${event.name}</h4>
      <div class="admin-card__meta">
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
  if (query.q && dom.heroSearchInput) dom.heroSearchInput.value = query.q;
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
    search: (dom.heroSearchInput?.value || "").trim().toLowerCase(),
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

function createEventCard(event, index = 0) {
  const card = document.createElement("article");
  card.className = "event-card";
  card.dataset.eventId = event.id;
  card.style.setProperty("--card-index", String(index));
  const navigationUrl = buildNavigationUrl(event);
  const primaryGenre = splitGenres(event.genre)[0] || event.genre || "-";
  const favoriteActive = isFavoriteEvent(event.id);
  card.innerHTML = `
    <div class="event-card__media">
      ${
        event.image_url
          ? `<img class="event-card__image" src="${event.image_url}" alt="${event.name}" loading="lazy">`
          : `<div class="event-card__image-fallback" aria-hidden="true"><span>${iconForGenre(primaryGenre)}</span></div>`
      }
      <div class="event-card__overlay"></div>
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
      <h4 class="event-card__title">${event.name}</h4>
      <p class="event-card__location">${formatEventPlace(event)}</p>
      <p class="event-card__datetime">${formatDateTime(event)}</p>
      <div class="event-card__chips">
        <span class="event-card__chip">${primaryGenre}</span>
        <span class="event-card__chip event-card__chip--price">${formatPrice(event.price_text)}</span>
      </div>
      <div class="event-card__actions">
        <button
          type="button"
          class="button-secondary button-secondary--primary event-card__navigate"
          data-action="navigate-from-list"
          ${navigationUrl ? "" : "disabled"}
        >
          ${t("details_navigate")}
        </button>
      </div>
    </div>
  `;
  card.addEventListener("click", (clickEvent) => {
    const target = clickEvent.target instanceof Element ? clickEvent.target : null;
    const navigateButton = target?.closest("button[data-action='navigate-from-list']");
    const favoriteButton = target?.closest("button[data-action='favorite-toggle']");
    if (navigateButton) {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      openNavigationForEvent(event);
      return;
    }
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

    selectEvent(event.id, { flyTo: true, openPopup: true, scrollIntoView: false });
  });
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

  state.filteredEvents.forEach((event, index) => {
    const card = createEventCard(event, index);
    if (event.id === state.selectedEventId) card.classList.add("event-card--active");
    dom.eventList.append(card);
    window.requestAnimationFrame(() => card.classList.add("is-ready"));
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
  const locationLine = [event.location_name, event.address, event.city].filter(Boolean).join(", ");
  const navigationUrl = buildNavigationUrl(event);
  const navigationLink = navigationUrl
    ? `<a class="popup__route-link" href="${navigationUrl}" target="_blank" rel="noopener noreferrer">${t("details_navigate")}</a>`
    : "";
  return `
    <div class="popup">
      <strong>${event.name}</strong><br>
      <span>${locationLine || "-"}</span><br>
      <span>${formatDateTime(event)}</span><br>
      <span>${event.genre || "-"} - ${formatPrice(event.price_text)}</span>
      ${navigationLink}
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

  dom.eventDetails.className = "event-details event-details--filled";
  const locationName = String(event.location_name || "").trim();
  const addressLine = [event.address, event.postal_code, event.city, event.country]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
  const fallbackLocationLine = [locationName, event.address, event.city].filter(Boolean).join(", ");
  const navigationUrl = buildNavigationUrl(event);
  dom.eventDetails.innerHTML = `
    <div class="event-details__media">
      ${
        event.image_url
          ? `<img class="event-details__image" src="${event.image_url}" alt="${event.name}" loading="lazy">`
          : `<div class="event-details__image-fallback" aria-hidden="true"><span>🎵</span></div>`
      }
    </div>
    <div class="event-details__header">
      <h4>${event.name}</h4>
      <div class="event-details__badges">
        <span class="event-details__badge">${event.genre || "-"}</span>
        <span class="event-details__badge">${formatDateTime(event)}</span>
      </div>
    </div>
    <div class="event-details__actions event-details__actions--top">
      ${
        navigationUrl
          ? `
      <a
        class="button-secondary button-secondary--primary button-secondary--navigate"
        href="${navigationUrl}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${t("details_navigate")}
      </a>
      `
          : `
      <button
        type="button"
        class="button-secondary button-secondary--primary button-secondary--navigate"
        disabled
      >
        ${t("details_navigate")}
      </button>
      `
      }
    </div>
    <div class="event-details__grid">
      <article class="event-details__card">
        <h5>${t("details_location")}</h5>
        <p>${locationName || fallbackLocationLine || "-"}</p>
        <p class="event-details__muted">${addressLine || "-"}</p>
      </article>
      <article class="event-details__card">
        <h5>${t("details_price")}</h5>
        <p>${formatPrice(event.price_text)}</p>
      </article>
    </div>
    <article class="event-details__card event-details__card--description">
      <h5>${t("form_label_description")}</h5>
      <p>${event.description || t("details_no_description")}</p>
    </article>
  `;
  dom.eventDetails.classList.remove("event-details--animate-in");
  window.requestAnimationFrame(() => {
    dom.eventDetails.classList.add("event-details--animate-in");
  });
}

function selectEvent(eventId, options = { flyTo: false, openPopup: false, scrollIntoView: false }) {
  state.selectedEventId = eventId;
  const event = state.filteredEvents.find((item) => item.id === eventId);
  const isNarrowMobile = window.matchMedia("(max-width: 520px)").matches;

  document.querySelectorAll(".event-card").forEach((card) => {
    const isActive = card.dataset.eventId === eventId;
    card.classList.toggle("event-card--active", isActive);
    if (isActive && options.scrollIntoView) {
      if (isNarrowMobile) {
        card.scrollIntoView({ inline: "start", block: "nearest", behavior: "smooth" });
      } else {
        card.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
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
  if (dom.heroSearchInput) dom.heroSearchInput.value = "";
  dom.cityFilter.value = "";
  dom.dateFilter.value = "";
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

    console.log("[PartyRadar Debug] Event insert data:", data);
    console.log("[PartyRadar Debug] Event insert error:", error);

    if (error) {
      if (uploadedImagePath) {
        try {
          await deleteUploadedEventImage(client, uploadedImagePath);
        } catch (cleanupError) {
          console.warn("[PartyRadar Debug] Image cleanup failed:", cleanupError);
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
  dom.cityFilter.addEventListener("change", () => {
    applyFilters();
  });
  dom.dateFilter.addEventListener("change", () => {
    applyFilters();
  });
  if (dom.heroSearchInput) {
    dom.heroSearchInput.addEventListener("input", () => {
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
  state.favoriteEventIds = loadFavoriteEventIds();
  const query = readQueryParams();
  const requestedLang = resolveLanguage(query.lang);
  state.lang = query.lang ? requestedLang : resolveLanguageFromBrowser(requestedLang);
  state.isAdminMode = resolveAdminMode(query.admin);
  enforceSinglePublicSearchInput();
  applyStaticTranslations();
  renderAdminAuthState(null);
  renderEventDetails(null);

  initMap();
  bindEvents();
  await checkAdminSession();
  await loadEvents();
  updateFilterOptions();
  applyFiltersFromQuery();
  applyFilters();
  renderModerationPanel();
}

startApp();
