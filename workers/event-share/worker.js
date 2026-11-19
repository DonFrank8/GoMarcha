/**
 * Cloudflare Worker for public GoMarcha event pages.
 *
 * Route:
 *   https://www.gomarcha.com/e/*
 *
 * Required Worker environment variables:
 * - SUPABASE_URL: https://dwyhpirtbjfmohcnhdak.supabase.co
 * - SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional Worker environment variables:
 * - PUBLIC_SITE_URL: https://www.gomarcha.com
 * - DEFAULT_OG_IMAGE_URL: https://www.gomarcha.com/social-preview.png
 *
 * /e/<id>          echte Event-Seite (SEO-Etappe S3, 17.11.2026): Inhalt sichtbar, keine automatische
 *                  Weiterleitung mehr, Knopf „Ver en Marcha“, JSON-LD `Event`, canonical ohne ?v/?source.
 *                  OG-/Twitter-Tags für WhatsApp/Facebook unverändert.
 *                  Vergangene oder archivierte Events → 410 + noindex.
 * /e/sitemap.xml   Sitemap mit allen kommenden, freigegebenen Events (S4).
 *
 * It never exposes a service role key to frontend JS.
 */

const DEFAULT_SITE_URL = "https://gomarcha.com";
const DEFAULT_OG_IMAGE_URL = `${DEFAULT_SITE_URL}/assets/social-preview-es.jpg`;
const EVENT_TIMEZONE = "Europe/Madrid";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncate(value, maxLength) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function getBestLocalizedField(event, keys) {
  for (const key of keys) {
    const value = String(event?.[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function absoluteHttpsUrl(raw, siteUrl) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  try {
    const parsed = new URL(value, siteUrl);
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function collectImageCandidates(event) {
  const out = [];
  const push = (value) => {
    const normalized = String(value ?? "").trim();
    if (normalized) out.push(normalized);
  };
  const collectEntry = (entry) => {
    if (!entry) return;
    if (typeof entry === "string" || typeof entry === "number") {
      push(entry);
      return;
    }
    if (typeof entry === "object") {
      push(entry.url ?? entry.image_url ?? entry.src ?? entry.path);
    }
  };

  collectEntry(event?.image_url);
  collectEntry(event?.image);

  for (const key of ["image_urls", "images", "imageUrls", "gallery", "gallery_images", "photos"]) {
    const value = event?.[key];
    if (Array.isArray(value)) {
      const featured = value.find((entry) => entry && typeof entry === "object" && entry.featured === true);
      if (featured) collectEntry(featured);
      value.filter((entry) => entry !== featured).forEach(collectEntry);
    } else if (typeof value === "string") {
      value.split(",").forEach((entry) => collectEntry(entry.trim()));
    }
  }

  return [...new Set(out)];
}

function resolveImageUrl(event, siteUrl, fallbackImageUrl) {
  for (const candidate of collectImageCandidates(event)) {
    const absolute = absoluteHttpsUrl(candidate, siteUrl);
    if (absolute) return absolute;
  }
  return fallbackImageUrl;
}

function isShareableEvent(event) {
  const status = String(event?.status ?? "").trim().toLowerCase();
  return status === "approved" || event?.published === true;
}

function buildEventAppUrl(eventId, siteUrl, requestUrl) {
  const url = new URL("/index.html", siteUrl);
  url.searchParams.set("event_id", eventId);
  // Herkunft aus Social-Posts (?source=ig_post …) an die App weitergeben, sonst zählt die Messung nichts
  // (SOCIAL_MEDIA_KONZEPT.md Abschnitt 8). Nur einfache Kennungen.
  const source = String(requestUrl?.searchParams.get("source") || "").trim();
  if (/^[A-Za-z0-9._-]{1,64}$/.test(source)) url.searchParams.set("source", source);
  return url.toString();
}

function buildEventShareUrl(eventId, requestUrl, siteUrl) {
  const url = new URL(`/e/${encodeURIComponent(eventId)}`, siteUrl);
  const cacheVersion = requestUrl.searchParams.get("v");
  if (cacheVersion) url.searchParams.set("v", cacheVersion);
  return url.toString();
}

/** Kanonische Adresse für Google: immer ohne ?v= und ?source=. */
function buildCanonicalUrl(eventId, siteUrl) {
  return new URL(`/e/${encodeURIComponent(eventId)}`, siteUrl).toString();
}

// ---------------------------------------------------------------------------
// Datum, Serien, Zeitzone
// ---------------------------------------------------------------------------

const WEEKDAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function parseIsoDay(value) {
  const match = String(value ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

/** Heutiges Datum in Spanien (YYYY-MM-DD). */
function todayInMadrid(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function recurrenceTypeOf(event) {
  const type = String(event?.recurrence_type ?? "").trim().toLowerCase();
  if (type === "weekly" || type === "monthly") return type;
  return event?.is_recurring ? "weekly" : "none";
}

function intOrNull(value) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(n) ? n : null;
}

/**
 * Nächster Termin ab `todayIso` (inklusive). Einzel-Events: ihr Datum, falls nicht vorbei.
 * Serien: gleiche Regeln wie die Website (wöchentlich am Wochentag, ggf. alle n Wochen; monatlich am Tag X,
 * Monate ohne diesen Tag werden übersprungen). null = kein kommender Termin mehr.
 */
function nextOccurrence(event, todayIso) {
  const today = parseIsoDay(todayIso);
  const type = recurrenceTypeOf(event);
  if (type === "none") {
    const day = parseIsoDay(event?.event_date);
    return day && day >= today ? isoDay(day) : null;
  }

  const start = parseIsoDay(event?.recurrence_start_date) || parseIsoDay(event?.event_date) || today;
  const end = parseIsoDay(event?.recurrence_end_date) || parseIsoDay(event?.recurrence_until);
  const from = start > today ? start : today;

  if (type === "weekly") {
    const weekday = intOrNull(event?.recurrence_weekday) ?? start.getUTCDay();
    if (weekday < 0 || weekday > 6) return null;
    const interval = Math.max(1, intOrNull(event?.recurrence_interval) || 1);
    // Erster Termin der Serie = erster passender Wochentag ab Start; danach alle `interval` Wochen.
    const first = addDays(start, (weekday - start.getUTCDay() + 7) % 7);
    let candidate = addDays(from, (weekday - from.getUTCDay() + 7) % 7);
    if (interval > 1) {
      const weeks = Math.round((candidate - first) / (7 * 86400000));
      const rest = ((weeks % interval) + interval) % interval;
      if (rest) candidate = addDays(candidate, (interval - rest) * 7);
    }
    if (end && candidate > end) return null;
    return isoDay(candidate);
  }

  // monatlich
  const dayOfMonth = intOrNull(event?.recurrence_day_of_month) ?? start.getUTCDate();
  if (dayOfMonth < 1 || dayOfMonth > 31) return null;
  for (let i = 0; i < 24; i += 1) {
    const year = from.getUTCFullYear();
    const month = from.getUTCMonth() + i;
    const candidate = new Date(Date.UTC(year, month, dayOfMonth));
    if (candidate.getUTCDate() !== dayOfMonth) continue; // Monat hat diesen Tag nicht
    if (candidate < from) continue;
    if (end && candidate > end) return null;
    return isoDay(candidate);
  }
  return null;
}

function normalizeTime(value) {
  const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/** UTC-Abstand von Spanien an einem Tag, z. B. "+01:00" (Winter) oder "+02:00" (Sommer). */
function madridOffset(dayIso) {
  try {
    const probe = new Date(`${dayIso}T12:00:00Z`);
    const part = new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TIMEZONE, timeZoneName: "longOffset" })
      .formatToParts(probe)
      .find((p) => p.type === "timeZoneName");
    const match = String(part?.value || "").match(/GMT([+-]\d{2}:\d{2})/);
    if (match) return match[1];
  } catch {
    // ignorieren, Rückfall unten
  }
  return "+01:00";
}

function formatDayEs(dayIso, withYear = false) {
  const date = parseIsoDay(dayIso);
  if (!date) return "";
  const options = { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" };
  if (withYear) options.year = "numeric";
  const text = new Intl.DateTimeFormat("es-ES", options).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function recurrenceTextEs(event) {
  const type = recurrenceTypeOf(event);
  if (type === "weekly") {
    const weekday = intOrNull(event?.recurrence_weekday);
    const interval = Math.max(1, intOrNull(event?.recurrence_interval) || 1);
    const name = weekday !== null && weekday >= 0 && weekday <= 6 ? WEEKDAYS_ES[weekday] : "";
    if (interval > 1) return name ? `Cada ${interval} semanas, los ${name === "sábado" || name === "domingo" ? `${name}s` : name}` : `Cada ${interval} semanas`;
    return name ? `Cada ${name}` : "Cada semana";
  }
  if (type === "monthly") {
    const day = intOrNull(event?.recurrence_day_of_month);
    return day ? `Cada mes, el día ${day}` : "Cada mes";
  }
  return "";
}

// ---------------------------------------------------------------------------
// Inhalte
// ---------------------------------------------------------------------------

const FREE_PRICES = ["free", "0", "0 eur", "0 €", "0€", "gratis", "eintritt frei", "free entry", "entrada gratuita", "entrada libre"];

function isFreePrice(priceText) {
  return FREE_PRICES.includes(String(priceText ?? "").trim().toLowerCase());
}

function formatPriceEs(priceText) {
  const value = String(priceText ?? "").trim();
  if (!value) return "Precio a consultar";
  if (isFreePrice(value)) return "Entrada gratuita";
  return value;
}

/** Preis als Zahl für JSON-LD (nur bei eindeutigen Angaben wie "10 €"). */
function numericPrice(priceText) {
  const value = String(priceText ?? "").trim();
  if (isFreePrice(value)) return 0;
  const match = value.match(/^(?:€\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|euros?)?$/i);
  return match ? Number(match[1].replace(",", ".")) : null;
}

const COUNTRY_SUFFIX = /,?\s*(spanien|españa|espana|spain)\s*$/i;

function cleanAddress(event) {
  const address = String(event?.address ?? "").trim().replace(COUNTRY_SUFFIX, "").trim();
  const city = String(event?.city ?? "").trim();
  const postal = String(event?.postal_code ?? "").trim();
  const parts = [address];
  if (postal && !address.includes(postal)) parts.push(postal);
  if (city && !address.toLowerCase().includes(city.toLowerCase())) parts.push(city);
  return parts.filter(Boolean).join(", ");
}

function eventTitle(event) {
  return getBestLocalizedField(event, ["title_es", "title", "name", "title_en", "title_de", "event_title"]) || "Evento en Marcha";
}

function eventDescriptionText(event) {
  return getBestLocalizedField(event, [
    "description_es",
    "description",
    "descrption_es",
    "description_en",
    "descrption_en",
    "description_de",
    "descrption_de",
    "details",
    "event_description",
  ]);
}

function formatEventDateTime(event) {
  const date = String(event?.event_date ?? event?.date ?? "").trim();
  const time = String(event?.event_time ?? event?.time ?? "").trim();
  return [date, time].filter(Boolean).join(" ");
}

/** Kurzbeschreibung für Vorschau (WhatsApp/Facebook) und Google – wie bisher. */
function buildDescription(event, nextDayIso) {
  const venue = getBestLocalizedField(event, ["venue_es", "location_name", "venue", "location"]);
  const city = getBestLocalizedField(event, ["city", "location_city"]);
  const recurrence = recurrenceTextEs(event);
  const time = normalizeTime(event?.event_time);
  const dateTime = nextDayIso
    ? [recurrence || formatDayEs(nextDayIso), time].filter(Boolean).join(" ")
    : formatEventDateTime(event);
  const category = getBestLocalizedField(event, ["category", "event_category", "genre", "music_genre"]);
  const price = String(event?.price_text ?? "").trim() ? formatPriceEs(event.price_text) : "";
  const context = [venue, city, dateTime, category, price].filter(Boolean).join(" · ");
  return truncate([context, eventDescriptionText(event)].filter(Boolean).join(". "), 160);
}

/** Text mit Absätzen → sicheres HTML. */
function paragraphsHtml(text) {
  return String(text ?? "")
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function directionsUrl(event) {
  const lat = Number(event?.lat);
  const lng = Number(event?.lng);
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)) {
    url.searchParams.set("destination", `${lat},${lng}`);
  } else {
    const query = [event?.location_name, cleanAddress(event)].filter(Boolean).join(", ");
    if (!query) return "";
    url.searchParams.set("destination", query);
  }
  return url.toString();
}

function buildJsonLd(event, nextDayIso, canonicalUrl) {
  const time = normalizeTime(event?.event_time);
  const offset = madridOffset(nextDayIso);
  const startDate = time ? `${nextDayIso}T${time}:00${offset}` : nextDayIso;
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventTitle(event),
    startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: canonicalUrl,
  };

  const endTime = normalizeTime(event?.end_time);
  if (time && endTime) {
    // Ende vor Beginn (z. B. 00:00) = nächster Tag
    const endDay = endTime <= time ? isoDay(addDays(parseIsoDay(nextDayIso), 1)) : nextDayIso;
    data.endDate = `${endDay}T${endTime}:00${madridOffset(endDay)}`;
  }

  const description = eventDescriptionText(event);
  if (description) data.description = truncate(description, 500);

  const venue = String(event?.location_name ?? "").trim();
  const address = {
    "@type": "PostalAddress",
    addressCountry: "ES",
  };
  const street = String(event?.address ?? "").trim().replace(COUNTRY_SUFFIX, "").trim();
  if (street) address.streetAddress = street;
  if (String(event?.postal_code ?? "").trim()) address.postalCode = String(event.postal_code).trim();
  if (String(event?.city ?? "").trim()) address.addressLocality = String(event.city).trim();
  address.addressRegion = "Málaga";
  const location = { "@type": "Place", name: venue || String(event?.city ?? "").trim() || "Costa del Sol", address };
  const lat = Number(event?.lat);
  const lng = Number(event?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)) {
    location.geo = { "@type": "GeoCoordinates", latitude: lat, longitude: lng };
  }
  data.location = location;

  if (venue) data.organizer = { "@type": "Organization", name: venue };

  const artist = String(event?.artist_name ?? "").trim();
  if (artist) data.performer = { "@type": "PerformingGroup", name: artist };

  const price = numericPrice(event?.price_text);
  if (price !== null) {
    data.isAccessibleForFree = price === 0;
    data.offers = {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    };
  }

  // Keine Bilder im JSON-LD: Flyer gehören meist den Veranstaltern (ROADMAP_KI_AUTOMATIK.md, S3).
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

const EVENT_PUBLIC_COLUMNS =
  "id,name,location_name,city,country,event_date,event_time,genre,price_text,description,image_url,lat,lng,is_published,created_at,status,address,postal_code,geocoding_query,featured,promoted,is_recurring,recurrence_type,recurrence_interval,recurrence_days,recurrence_end_date,recurrence_until,recurrence_rule,recurrence_start_date,recurrence_weekday,recurrence_day_of_month,artist_name,title_de,title_en,title_es,description_de,description_en,description_es,artist_bio_de,artist_bio_en,artist_bio_es,image_urls,archived_at,original_event_id,is_featured,recurring_social_enabled,recurring_social_opt_out,end_time";

const SITEMAP_COLUMNS =
  "id,status,event_date,is_recurring,recurrence_type,recurrence_interval,recurrence_start_date,recurrence_end_date,recurrence_until,recurrence_weekday,recurrence_day_of_month,archived_at,original_event_id";

function supabaseConfig(env) {
  const supabaseUrl = String(env.SUPABASE_URL || "").replace(/\/+$/, "");
  const supabaseKey = String(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || "").trim();
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase Worker environment is not configured.");
  return { supabaseUrl, supabaseKey };
}

async function supabaseGet(endpoint, supabaseKey) {
  const response = await fetch(endpoint.toString(), {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`Supabase REST ${response.status}`);
  return response.json();
}

async function fetchEvent(eventId, env) {
  const { supabaseUrl, supabaseKey } = supabaseConfig(env);
  const endpoint = new URL(`${supabaseUrl}/rest/v1/events`);
  endpoint.searchParams.set("id", `eq.${eventId}`);
  // Feste Spaltenliste: Einreicher-Daten sind für den Anon-Key gesperrt.
  endpoint.searchParams.set("select", EVENT_PUBLIC_COLUMNS);
  endpoint.searchParams.set("limit", "1");
  const rows = await supabaseGet(endpoint, supabaseKey);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function fetchSitemapEvents(env) {
  const { supabaseUrl, supabaseKey } = supabaseConfig(env);
  const endpoint = new URL(`${supabaseUrl}/rest/v1/events`);
  endpoint.searchParams.set("select", SITEMAP_COLUMNS);
  endpoint.searchParams.set("status", "eq.approved");
  endpoint.searchParams.set("archived_at", "is.null");
  endpoint.searchParams.set("original_event_id", "is.null");
  endpoint.searchParams.set("order", "id.asc");
  endpoint.searchParams.set("limit", "2000");
  const rows = await supabaseGet(endpoint, supabaseKey);
  return Array.isArray(rows) ? rows : [];
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

const PAGE_STYLES = `
  :root { --bg: #0b0712; --surface: #17111f; --surface-2: #211a2b; --line: rgba(255,244,236,.1); --text: #fff4ec; --muted: #b3a6b8; --accent: #ff6b35; --accent-ink: #1e0b02; }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: "DM Sans", system-ui, sans-serif; line-height: 1.55; }
  a { color: var(--accent); }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; max-width: 760px; margin: 0 auto; padding: 14px 16px; }
  .top img { height: 34px; width: auto; display: block; }
  .top a.more { font-size: .92rem; font-weight: 700; text-decoration: none; white-space: nowrap; }
  main { max-width: 760px; margin: 0 auto; padding: 0 16px 120px; }
  .flyer { display: block; width: 100%; max-height: 70vh; object-fit: contain; background: var(--surface); border-radius: 16px; }
  .genre { display: inline-block; margin: 18px 0 6px; padding: 3px 10px; border-radius: 999px; background: rgba(255,107,53,.16); color: #ffb08f; font-size: .82rem; font-weight: 700; text-transform: capitalize; }
  h1 { font-family: Outfit, system-ui, sans-serif; font-size: clamp(1.6rem, 6vw, 2.3rem); line-height: 1.15; margin: 8px 0 4px; }
  .artist { color: var(--muted); margin: 0 0 16px; font-weight: 500; }
  .facts { display: grid; gap: 10px; margin: 18px 0; padding: 0; list-style: none; }
  .facts li { display: grid; grid-template-columns: 28px 1fr; gap: 10px; align-items: start; padding: 12px 14px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; }
  .facts .ico { font-size: 1.2rem; line-height: 1.3; }
  .facts strong { display: block; font-weight: 700; }
  .facts span.sub { color: var(--muted); font-size: .92rem; }
  .text h2 { font-family: Outfit, system-ui, sans-serif; font-size: 1.15rem; margin: 26px 0 6px; }
  .text p { margin: 0 0 12px; color: #e9dfe6; }
  .actions { position: fixed; left: 0; right: 0; bottom: 0; display: flex; gap: 10px; justify-content: center; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(11,7,18,0) 0%, var(--bg) 35%); }
  .btn { flex: 1 1 0; max-width: 340px; display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 18px; border-radius: 999px; font-weight: 700; text-decoration: none; }
  .btn--main { background: var(--accent); color: var(--accent-ink); }
  .btn--alt { background: var(--surface-2); color: var(--text); border: 1px solid var(--line); }
  .notice { margin: 48px 0 0; padding: 24px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; text-align: center; }
  .notice h1 { font-size: 1.5rem; }
  footer { max-width: 760px; margin: 0 auto; padding: 0 16px 110px; color: var(--muted); font-size: .85rem; }
  footer a { color: var(--muted); }
  .flyer { max-height: 46vh; }
  @media (min-width: 900px) {
    .top, main, footer { max-width: 1080px; }
    article { display: grid; grid-template-columns: minmax(0, 440px) minmax(0, 1fr); gap: 36px; align-items: start; }
    .flyer { position: sticky; top: 16px; max-height: calc(100vh - 32px); }
    .info .genre { margin-top: 4px; }
    .actions { position: static; justify-content: flex-start; padding: 8px 0 0; background: none; }
    main { padding-bottom: 40px; }
    footer { padding-bottom: 40px; }
  }
`;

function pageHead({ title, description, imageUrl, ogUrl, canonicalUrl, ogTitle, robots, jsonLd }) {
  const safeImageUrl = escapeHtml(imageUrl);
  const safeOgTitle = escapeHtml(ogTitle || title);
  const safeDescription = escapeHtml(description);
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  ${canonicalUrl ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">` : ""}
  ${robots ? `<meta name="robots" content="${escapeHtml(robots)}">` : ""}
  <meta name="description" content="${safeDescription}">
  <meta name="theme-color" content="#0b0712">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon-v5.svg">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon-v5.png">
  <meta property="og:site_name" content="Marcha">
  <meta property="og:locale" content="es_ES">
  <meta property="og:title" content="${safeOgTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:secure_url" content="${safeImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${escapeHtml(ogUrl)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeOgTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImageUrl}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
  ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ""}
  <style>${PAGE_STYLES}</style>
</head>`;
}

function pageTop(siteUrl) {
  const home = escapeHtml(`${siteUrl}/`);
  return `<header class="top">
    <a href="${home}" aria-label="Marcha – inicio"><img src="/assets/logo-v5.svg" alt="Marcha" width="132" height="34"></a>
    <a class="more" href="${home}">Más eventos →</a>
  </header>`;
}

function pageFooter(siteUrl) {
  const home = escapeHtml(siteUrl);
  return `<footer>
    <p>Marcha – música en directo y fiestas en la Costa del Sol. <a href="${home}/">Ver todos los eventos</a> · <a href="${home}/veranstalter.html">Para organizadores</a> · <a href="${home}/legal.html">Aviso legal</a> · <a href="${home}/privacy.html">Privacidad</a></p>
  </footer>`;
}

function renderEventPage({ event, nextDayIso, siteUrl, imageUrl, ogUrl, canonicalUrl, appUrl }) {
  const title = eventTitle(event);
  const venue = String(event?.location_name ?? "").trim();
  const city = String(event?.city ?? "").trim();
  const artist = String(event?.artist_name ?? "").trim();
  const genre = String(event?.genre ?? "").trim();
  const time = normalizeTime(event?.event_time);
  const endTime = normalizeTime(event?.end_time);
  const recurrence = recurrenceTextEs(event);
  const address = cleanAddress(event);
  const route = directionsUrl(event);
  const description = buildDescription(event, nextDayIso) || "Descubre este evento en Marcha.";
  const nextDayText = formatDayEs(nextDayIso);
  const timeText = time ? (endTime && endTime !== time ? `${time} – ${endTime}` : `${time} h`) : "";

  const whenMain = recurrence || nextDayText;
  const whenSub = recurrence
    ? `Próxima fecha: ${nextDayText.charAt(0).toLowerCase()}${nextDayText.slice(1)}${timeText ? ` · ${timeText}` : ""}`
    : timeText;

  const pageTitleParts = [title, recurrence || formatDayEs(nextDayIso), [venue, city].filter(Boolean).join(", ")].filter(Boolean);
  const pageTitle = `${pageTitleParts.join(" · ")} | Marcha`;

  const descriptionText = eventDescriptionText(event);
  const bio = getBestLocalizedField(event, ["artist_bio_es", "artist_bio_en", "artist_bio_de"]);
  const showArtistLine = artist && !title.toLowerCase().includes(artist.toLowerCase());

  return `<!doctype html>
<html lang="es">
${pageHead({
  title: pageTitle,
  ogTitle: title,
  description,
  imageUrl,
  ogUrl,
  canonicalUrl,
  jsonLd: buildJsonLd(event, nextDayIso, canonicalUrl),
})}
<body>
  ${pageTop(siteUrl)}
  <main>
    <article>
      <img class="flyer" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}">
      <div class="info">
      ${genre ? `<span class="genre">${escapeHtml(genre)}</span>` : ""}
      <h1>${escapeHtml(title)}</h1>
      ${showArtistLine ? `<p class="artist">${escapeHtml(artist)}</p>` : ""}
      <ul class="facts">
        <li><span class="ico" aria-hidden="true">📅</span><div><strong>${escapeHtml(whenMain)}</strong>${whenSub ? `<span class="sub">${escapeHtml(whenSub)}</span>` : ""}</div></li>
        ${venue || address ? `<li><span class="ico" aria-hidden="true">📍</span><div><strong>${escapeHtml(venue || city)}</strong>${address ? `<span class="sub">${escapeHtml(address)}</span>` : ""}</div></li>` : ""}
        <li><span class="ico" aria-hidden="true">🎟️</span><div><strong>${escapeHtml(formatPriceEs(event?.price_text))}</strong></div></li>
      </ul>
      ${descriptionText || bio ? `<section class="text">
        ${descriptionText ? `<h2>Sobre el evento</h2>\n${paragraphsHtml(descriptionText)}` : ""}
        ${bio ? `<h2>Sobre ${escapeHtml(artist || "el artista")}</h2>\n${paragraphsHtml(bio)}` : ""}
      </section>` : ""}
      <nav class="actions" aria-label="Acciones">
        <a class="btn btn--main" href="${escapeHtml(appUrl)}">Ver en Marcha</a>
        ${route ? `<a class="btn btn--alt" href="${escapeHtml(route)}" target="_blank" rel="noopener">Cómo llegar</a>` : ""}
      </nav>
      </div>
    </article>
  </main>
  ${pageFooter(siteUrl)}
</body>
</html>`;
}

function renderNoticePage({ siteUrl, heading, text, imageUrl, ogUrl, ogTitle, description }) {
  return `<!doctype html>
<html lang="es">
${pageHead({
  title: `${heading} | Marcha`,
  ogTitle: ogTitle || heading,
  description: description || text,
  imageUrl,
  ogUrl,
  canonicalUrl: "",
  robots: "noindex",
})}
<body>
  ${pageTop(siteUrl)}
  <main>
    <div class="notice">
      <h1>${escapeHtml(heading)}</h1>
      <p>${escapeHtml(text)}</p>
      <p><a class="btn btn--main" href="${escapeHtml(`${siteUrl}/`)}">Ver eventos de hoy y próximos</a></p>
    </div>
  </main>
  ${pageFooter(siteUrl)}
</body>
</html>`;
}

function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      ...extraHeaders,
    },
  });
}

function renderSitemap(events, siteUrl, todayIso) {
  const urls = events
    .filter((event) => isShareableEvent(event) && !event.archived_at && nextOccurrence(event, todayIso))
    .map((event) => `  <url><loc>${escapeHtml(buildCanonicalUrl(String(event.id), siteUrl))}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

function renderRootHtml(siteUrl) {
  const safeSiteUrl = escapeHtml(siteUrl);
  const sampleUrl = `${safeSiteUrl}/e/53`;
  const safeTitle = "Marcha | Música en vivo y eventos";
  const safeDescription = "Descubre conciertos, música en vivo, DJs, bares y eventos cerca de ti.";
  const safeImageUrl = `${safeSiteUrl}/assets/social-preview-es.jpg`;
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="robots" content="noindex">
  <meta name="description" content="${safeDescription}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:secure_url" content="${safeImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${safeSiteUrl}/">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImageUrl}">
</head>
<body>
  <main>
    <h1>${safeTitle}</h1>
    <p>Use <code>/e/:eventId</code> for crawler-safe event previews.</p>
    <p><a href="${sampleUrl}">${sampleUrl}</a></p>
  </main>
</body>
</html>`;
}

function eventIdFromRequest(url) {
  const match = url.pathname.match(/^\/e\/([^/?#]+)/);
  let idFromPath = "";
  try {
    idFromPath = match ? decodeURIComponent(match[1]) : "";
  } catch {
    idFromPath = match ? match[1] : "";
  }
  const rawId = String(idFromPath || url.searchParams.get("id") || url.searchParams.get("event_id") || "").trim();
  // Serientermine kommen aus der App als "<master_id>::<YYYY-MM-DD>" → Master-Event zeigen (nächster Termin).
  return rawId.split("::")[0].trim();
}

function isValidEventId(eventId) {
  return /^\d{1,12}$/.test(eventId);
}

function isRootRequest(url) {
  return url.pathname === "/" || url.pathname === "";
}

function isSitemapRequest(url) {
  return url.pathname === "/e/sitemap.xml";
}

export default {
  async fetch(request, env, ctx) {
    void ctx;
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const requestUrl = new URL(request.url);
    const siteUrl = String(env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
    if (isRootRequest(requestUrl)) {
      return htmlResponse(renderRootHtml(siteUrl));
    }

    const todayIso = todayInMadrid();

    if (isSitemapRequest(requestUrl)) {
      try {
        const events = await fetchSitemapEvents(env);
        return new Response(renderSitemap(events, siteUrl, todayIso), {
          status: 200,
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      } catch (error) {
        return new Response(`Sitemap unavailable: ${error.message || String(error)}`, { status: 500 });
      }
    }

    const eventId = eventIdFromRequest(requestUrl);
    if (!eventId) return new Response("Missing event id", { status: 400 });

    const fallbackImageUrl = absoluteHttpsUrl(env.DEFAULT_OG_IMAGE_URL, siteUrl) || DEFAULT_OG_IMAGE_URL;
    if (!isValidEventId(eventId)) {
      return htmlResponse(
        renderNoticePage({
          siteUrl,
          heading: "Evento no encontrado",
          text: "Este evento no existe o ya no está publicado. Mira lo que hay hoy y los próximos días en la Costa del Sol.",
          imageUrl: fallbackImageUrl,
          ogUrl: `${siteUrl}/`,
        }),
        404
      );
    }
    const appUrl = buildEventAppUrl(eventId, siteUrl, requestUrl);
    const shareUrl = buildEventShareUrl(eventId, requestUrl, siteUrl);
    const canonicalUrl = buildCanonicalUrl(eventId, siteUrl);

    try {
      const event = await fetchEvent(eventId, env);
      if (!event || !isShareableEvent(event)) {
        return htmlResponse(
          renderNoticePage({
            siteUrl,
            heading: "Evento no encontrado",
            text: "Este evento no existe o ya no está publicado. Mira lo que hay hoy y los próximos días en la Costa del Sol.",
            imageUrl: fallbackImageUrl,
            ogUrl: shareUrl,
          }),
          404
        );
      }

      const title = eventTitle(event);
      const imageUrl = resolveImageUrl(event, siteUrl, fallbackImageUrl);
      const nextDayIso = event.archived_at ? null : nextOccurrence(event, todayIso);

      if (!nextDayIso) {
        // Vergangen oder archiviert: Google soll die Seite vergessen (410), Menschen bekommen einen Weg zurück.
        return htmlResponse(
          renderNoticePage({
            siteUrl,
            heading: "Este evento ya ha pasado",
            text: `„${title}“ ya no está en la agenda. Mira lo que hay hoy y los próximos días en la Costa del Sol.`,
            imageUrl,
            ogUrl: shareUrl,
            ogTitle: title,
            description: buildDescription(event, null) || "Evento pasado en Marcha.",
          }),
          410,
          { "X-Robots-Tag": "noindex" }
        );
      }

      return htmlResponse(
        renderEventPage({ event, nextDayIso, siteUrl, imageUrl, ogUrl: shareUrl, canonicalUrl, appUrl })
      );
    } catch (error) {
      return new Response(`Share preview unavailable: ${error.message || String(error)}`, { status: 500 });
    }
  },
};
