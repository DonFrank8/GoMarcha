/**
 * Cloudflare Worker for public GoMarcha share URLs.
 *
 * Route recommendation:
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
 * The Worker returns crawler-visible HTML with OG/Twitter tags before any
 * meta-refresh/JS redirect. It never exposes a service role key to frontend JS.
 */

const DEFAULT_SITE_URL = "https://www.gomarcha.com";
const DEFAULT_OG_IMAGE_URL = `${DEFAULT_SITE_URL}/social-preview.png`;

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

function buildEventAppUrl(eventId, siteUrl) {
  const url = new URL("/index.html", siteUrl);
  url.searchParams.set("event_id", eventId);
  return url.toString();
}

function buildEventShareUrl(eventId, requestUrl, siteUrl) {
  const url = new URL(`/e/${encodeURIComponent(eventId)}`, siteUrl);
  const cacheVersion = requestUrl.searchParams.get("v");
  if (cacheVersion) url.searchParams.set("v", cacheVersion);
  return url.toString();
}

function formatEventDateTime(event) {
  const startsAt = String(event?.starts_at ?? event?.start_at ?? "").trim();
  if (startsAt) {
    const parsed = new Date(startsAt);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Madrid",
      }).format(parsed);
    }
  }

  const date = String(event?.event_date ?? event?.date ?? "").trim();
  const time = String(event?.event_time ?? event?.time ?? "").trim();
  return [date, time].filter(Boolean).join(" ");
}

function buildDescription(event) {
  const venue = getBestLocalizedField(event, ["venue_es", "location_name", "venue", "location"]);
  const city = getBestLocalizedField(event, ["city", "location_city"]);
  const dateTime = formatEventDateTime(event);
  const category = getBestLocalizedField(event, ["category", "event_category", "genre", "music_genre"]);
  const price = getBestLocalizedField(event, ["entry_price", "price_text", "price"]);
  const description = getBestLocalizedField(event, [
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
  const context = [venue, city, dateTime, category, price].filter(Boolean).join(" · ");
  return truncate([context, description].filter(Boolean).join(". "), 160);
}

function eventIdFromRequest(url) {
  const match = url.pathname.match(/^\/e\/([^/?#]+)/);
  const idFromPath = match ? decodeURIComponent(match[1]) : "";
  return String(idFromPath || url.searchParams.get("id") || url.searchParams.get("event_id") || "").trim();
}

async function fetchEvent(eventId, env) {
  const supabaseUrl = String(env.SUPABASE_URL || "").replace(/\/+$/, "");
  const supabaseKey = String(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || "").trim();
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase Worker environment is not configured.");

  const endpoint = new URL(`${supabaseUrl}/rest/v1/events`);
  endpoint.searchParams.set("id", `eq.${eventId}`);
  endpoint.searchParams.set("select", "*");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint.toString(), {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`Supabase REST ${response.status}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

function renderHtml({ title, description, imageUrl, shareUrl, appUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImageUrl = escapeHtml(imageUrl);
  const safeShareUrl = escapeHtml(shareUrl);
  const safeAppUrl = escapeHtml(appUrl);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <link rel="canonical" href="${safeShareUrl}">
  <meta name="description" content="${safeDescription}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:secure_url" content="${safeImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${safeShareUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImageUrl}">
  <meta http-equiv="refresh" content="1;url=${safeAppUrl}">
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #020617; color: #f8fafc; font-family: Inter, system-ui, sans-serif; }
    main { width: min(92vw, 560px); padding: 28px; border: 1px solid rgba(124,58,237,.34); border-radius: 24px; background: rgba(15,23,42,.92); box-shadow: 0 24px 60px rgba(0,0,0,.45); }
    img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 16px; margin-bottom: 18px; }
    h1 { margin: 0 0 10px; font-size: clamp(1.35rem, 5vw, 2rem); }
    p { color: #cbd5e1; line-height: 1.5; }
    a { color: #f9a8d4; font-weight: 700; }
  </style>
  <script>window.setTimeout(function(){ window.location.replace(${JSON.stringify(appUrl)}); }, 400);</script>
</head>
<body>
  <main>
    <img src="${safeImageUrl}" alt="${safeTitle}">
    <h1>${safeTitle}</h1>
    <p>${safeDescription}</p>
    <p><a href="${safeAppUrl}">Abrir evento en GoMarcha</a></p>
  </main>
</body>
</html>`;
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

export default {
  async fetch(request, env) {
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const requestUrl = new URL(request.url);
    const eventId = eventIdFromRequest(requestUrl);
    if (!eventId) return new Response("Missing event id", { status: 400 });

    const siteUrl = String(env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
    const fallbackImageUrl = absoluteHttpsUrl(env.DEFAULT_OG_IMAGE_URL, siteUrl) || DEFAULT_OG_IMAGE_URL;
    const appUrl = buildEventAppUrl(eventId, siteUrl);
    const shareUrl = buildEventShareUrl(eventId, requestUrl, siteUrl);

    try {
      const event = await fetchEvent(eventId, env);
      if (!event || !isShareableEvent(event)) {
        return new Response("Event not found", { status: 404 });
      }

      const title =
        getBestLocalizedField(event, ["title_es", "title", "name", "title_en", "title_de", "event_title"]) ||
        "GoMarcha Event";
      const html = renderHtml({
        title,
        description: buildDescription(event) || "Descubre este evento en GoMarcha.",
        imageUrl: resolveImageUrl(event, siteUrl, fallbackImageUrl),
        shareUrl,
        appUrl,
      });
      return htmlResponse(html);
    } catch (error) {
      return new Response(`Share preview unavailable: ${error.message || String(error)}`, { status: 500 });
    }
  },
};
