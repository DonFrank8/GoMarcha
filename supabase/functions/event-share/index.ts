import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.49.1";

/**
 * Crawler-safe GoMarcha event share preview endpoint.
 *
 * This function returns a fully rendered HTML document with event-specific
 * Open Graph/Twitter meta tags. WhatsApp, Facebook, and similar crawlers do
 * not wait for frontend JavaScript, so these tags must be present in the
 * initial server response.
 *
 * Required Edge Function environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (server-side only, never exposed to frontend)
 *
 * Optional environment variables:
 * - MARCHA_PUBLIC_SITE_URL (default: https://www.gomarcha.com)
 * - MARCHA_DEFAULT_OG_IMAGE_URL (default: https://www.gomarcha.com/social-preview.png)
 */

const DEFAULT_SITE_URL = "https://www.gomarcha.com";
const DEFAULT_OG_IMAGE_URL = `${DEFAULT_SITE_URL}/social-preview.png`;

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncate(str: unknown, maxLength: number): string {
  const normalized = String(str ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function getBestLocalizedField(
  event: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = String(event[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function absoluteHttpsUrl(raw: unknown, siteUrl: string): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  try {
    const parsed = new URL(value, siteUrl);
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function collectImageCandidates(event: Record<string, unknown>): string[] {
  const out: string[] = [];
  const push = (value: unknown) => {
    const normalized = String(value ?? "").trim();
    if (normalized) out.push(normalized);
  };
  const collectEntry = (entry: unknown) => {
    if (!entry) return;
    if (typeof entry === "string" || typeof entry === "number") {
      push(entry);
      return;
    }
    if (typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      push(obj.url ?? obj.image_url ?? obj.src ?? obj.path);
    }
  };

  collectEntry(event.image_url);
  collectEntry(event.image);

  for (
    const key of [
      "image_urls",
      "images",
      "imageUrls",
      "gallery",
      "gallery_images",
      "photos",
    ]
  ) {
    const value = event[key];
    if (Array.isArray(value)) {
      const featured = value.find((entry) =>
        entry && typeof entry === "object" &&
        (entry as { featured?: unknown }).featured === true
      );
      if (featured) collectEntry(featured);
      value.filter((entry) => entry !== featured).forEach(collectEntry);
    } else if (typeof value === "string") {
      value.split(",").forEach((entry) => collectEntry(entry.trim()));
    }
  }

  return [...new Set(out)];
}

function resolveImageUrl(
  event: Record<string, unknown>,
  siteUrl: string,
  fallbackImageUrl: string,
): string {
  for (const candidate of collectImageCandidates(event)) {
    const absolute = absoluteHttpsUrl(candidate, siteUrl);
    if (absolute) return absolute;
  }
  return fallbackImageUrl;
}

function buildEventAppUrl(eventId: string, siteUrl: string): string {
  const url = new URL("/index.html", siteUrl);
  url.searchParams.set("event_id", eventId);
  return url.toString();
}

function formatEventDateTime(event: Record<string, unknown>): string {
  const startsAt = String(event.starts_at ?? event.start_at ?? "").trim();
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

  const date = String(event.event_date ?? event.date ?? "").trim();
  const time = String(event.event_time ?? event.time ?? "").trim();
  return [date, time].filter(Boolean).join(" ");
}

function isShareableEvent(event: Record<string, unknown>): boolean {
  const status = String(event.status ?? "").trim().toLowerCase();
  return status === "approved" || event.published === true;
}

function buildDescription(event: Record<string, unknown>): string {
  const venue = getBestLocalizedField(event, [
    "venue_es",
    "location_name",
    "venue",
    "location",
  ]);
  const city = getBestLocalizedField(event, ["city", "location_city"]);
  const dateTime = formatEventDateTime(event);
  const category = getBestLocalizedField(event, [
    "category",
    "event_category",
    "genre",
    "music_genre",
  ]);
  const price = getBestLocalizedField(event, [
    "entry_price",
    "price_text",
    "price",
  ]);
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
  const context = [venue, city, dateTime, category, price].filter(Boolean).join(
    " - ",
  );
  return truncate([context, description].filter(Boolean).join(". "), 160);
}

function renderHtml(args: {
  title: string;
  description: string;
  imageUrl: string;
  shareUrl: string;
  appUrl: string;
}): string {
  const title = escapeHtml(args.title);
  const description = escapeHtml(args.description);
  const imageUrl = escapeHtml(args.imageUrl);
  const shareUrl = escapeHtml(args.shareUrl);
  const appUrl = escapeHtml(args.appUrl);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="canonical" href="${shareUrl}">
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta http-equiv="refresh" content="1;url=${appUrl}">
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #020617; color: #f8fafc; font-family: Inter, system-ui, sans-serif; }
    main { width: min(92vw, 560px); padding: 28px; border: 1px solid rgba(124,58,237,.34); border-radius: 24px; background: rgba(15,23,42,.92); box-shadow: 0 24px 60px rgba(0,0,0,.45); }
    img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 16px; margin-bottom: 18px; }
    h1 { margin: 0 0 10px; font-size: clamp(1.35rem, 5vw, 2rem); }
    p { color: #cbd5e1; line-height: 1.5; }
    a { color: #f9a8d4; font-weight: 700; }
  </style>
  <script>window.setTimeout(function(){ window.location.replace(${
    JSON.stringify(args.appUrl)
  }); }, 400);</script>
</head>
<body>
  <main>
    <img src="${imageUrl}" alt="${title}">
    <h1>${title}</h1>
    <p>${description}</p>
    <p><a href="${appUrl}">Abrir evento en GoMarcha</a></p>
  </main>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const method = req.method.toUpperCase();
  if (method === "OPTIONS") return new Response("ok", { headers: CORS });
  // Public crawler endpoint: do not require Authorization and do not filter user agents.
  // facebookexternalhit, Facebot, WhatsApp, Twitterbot, TelegramBot, and browsers all use GET.
  if (method !== "GET" && method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const requestUrl = new URL(req.url);
  const id = String(
    requestUrl.searchParams.get("id") ||
      requestUrl.searchParams.get("event_id") || "",
  ).trim();
  if (!id) {
    return new Response("Missing event id", {
      status: 400,
      headers: { ...CORS, "Content-Type": "text/plain" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!supabaseUrl || !supabaseKey) {
    return new Response("Supabase environment is not configured", {
      status: 500,
      headers: { ...CORS, "Content-Type": "text/plain" },
    });
  }

  const siteUrl = (Deno.env.get("MARCHA_PUBLIC_SITE_URL") || DEFAULT_SITE_URL)
    .replace(/\/+$/, "");
  const fallbackImageUrl =
    absoluteHttpsUrl(Deno.env.get("MARCHA_DEFAULT_OG_IMAGE_URL"), siteUrl) ||
    DEFAULT_OG_IMAGE_URL;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: event, error } = await supabase.from("events").select("*").eq(
    "id",
    id,
  ).maybeSingle();
  if (error) {
    console.error("[event-share] event_load_failed", {
      id,
      message: error.message,
    });
    return new Response("Event could not be loaded", {
      status: 500,
      headers: { ...CORS, "Content-Type": "text/plain" },
    });
  }
  if (!event || !isShareableEvent(event as Record<string, unknown>)) {
    return new Response("Event not found", {
      status: 404,
      headers: { ...CORS, "Content-Type": "text/plain" },
    });
  }

  const eventRecord = event as Record<string, unknown>;
  const title = getBestLocalizedField(eventRecord, [
    "title_es",
    "title",
    "name",
    "title_en",
    "title_de",
    "event_title",
  ]) ||
    "GoMarcha Event";
  const appUrl = buildEventAppUrl(id, siteUrl);
  const html = renderHtml({
    title,
    description: buildDescription(eventRecord) ||
      "Descubre este evento en GoMarcha.",
    imageUrl: resolveImageUrl(eventRecord, siteUrl, fallbackImageUrl),
    shareUrl: requestUrl.toString(),
    appUrl,
  });

  return new Response(html, {
    headers: {
      ...CORS,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});
