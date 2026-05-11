import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2.49.1";

type SocialPlatform = "instagram" | "facebook";

type QueueRow = {
  id: string;
  event_id: string;
  platform: SocialPlatform;
  scheduled_at: string;
  status: string;
  postiz_integration_id: string | null;
  retry_count: number;
  last_attempt_at: string | null;
  resolved_image_url?: string | null;
};

/** Postiz posts API requires `image[].path` on uploads.postiz.com (and matching `id` from upload). */
type PostizMedia = { id: string; path: string };

const MAX_IMAGE_DOWNLOAD_BYTES = 10 * 1024 * 1024;

type EventRow = {
  id: string;
  name: string | null;
  city: string | null;
  location_name: string | null;
  event_date: string | null;
  event_time: string | null;
  genre: string | null;
  status: string | null;
  featured: boolean | null;
  image_url: string | null;
  image_urls: unknown;
  recurrence_type?: string | null;
  recurrence_start_date?: string | null;
};

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-marcha-social-secret"
};

/** Spanish FOMO / local hooks — paired stable ids for non-repetition tracking. */
const CAPTION_HOOKS: { id: string; line: string }[] = [
  { id: "hook-01", line: "¿Ya tienes plan para esta noche?" },
  { id: "hook-02", line: "La mejor música está más cerca de lo que piensas." },
  { id: "hook-03", line: "Hoy se vive algo especial." },
  { id: "hook-04", line: "Última llamada para esta noche." },
  { id: "hook-05", line: "Este finde todavía no termina." },
  { id: "hook-06", line: "El ambiente está sonando fuerte." },
  { id: "hook-07", line: "Tu noche empieza con un buen directo." },
  { id: "hook-08", line: "Música en vivo, buena gente, buen rollo." },
  { id: "hook-09", line: "No te quedes en casa: la ciudad se enciende." },
  { id: "hook-10", line: "Una noche para salir y bailar." },
  { id: "hook-11", line: "El escenario ya está listo." },
  { id: "hook-12", line: "Planazo a la vuelta de la esquina." },
  { id: "hook-13", line: "Si buscas vibe, aquí la encuentras." },
  { id: "hook-14", line: "La noche pide música en directo." },
  { id: "hook-15", line: "Siente la ciudad con otro ritmo." },
  { id: "hook-16", line: "Hoy toca salir y disfrutar." },
  { id: "hook-17", line: "Ritmo, luces y buena compañía." },
  { id: "hook-18", line: "El afterwork perfecto existe." },
  { id: "hook-19", line: "Descubre qué suena cerca de ti." },
  { id: "hook-20", line: "La escena local no duerme." },
  { id: "hook-21", line: "Un concierto que no querrás perderte." },
  { id: "hook-22", line: "La sala ya huele a noche grande." },
  { id: "hook-23", line: "Menos scroll, más música en vivo." },
  { id: "hook-24", line: "Tu próximo recuerdo empieza aquí." },
  { id: "hook-25", line: "Salir sí, quedarse con las ganas no." }
];

function slog(msg: string, extra?: Record<string, unknown>) {
  const suffix = extra ? ` ${JSON.stringify(extra)}` : "";
  console.log(`[social-queue-runner] ${msg}${suffix}`);
}

function isHttpsImageUrl(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== "string") return false;
  const t = raw.trim();
  if (!/^https:\/\//i.test(t)) return false;
  try {
    const u = new URL(t);
    return Boolean(u.hostname);
  } catch {
    return false;
  }
}

/** Ordered HTTPS candidates from DB (featured image_urls first), excluding obvious Marcha promo/QR/logo URLs. */
function orderedEventImageCandidates(event: EventRow, configuredFallback: string): { url: string; source: string }[] {
  const out: { url: string; source: string }[] = [];
  const urls = event.image_urls;
  if (Array.isArray(urls) && urls.length) {
    const objects = urls.filter((x) => x && (typeof x === "object" || typeof x === "string")) as (string | Record<
      string,
      unknown
    >)[];
    const featured = objects.find((e) => typeof e === "object" && (e as { featured?: boolean }).featured === true);
    const ordered = featured ? [featured, ...objects.filter((x) => x !== featured)] : objects;
    for (const entry of ordered) {
      const u = typeof entry === "string" ? entry : String((entry as { url?: string }).url || "").trim();
      if (!isHttpsImageUrl(u)) continue;
      if (isGenericMarchaPromoUrl(u, configuredFallback)) continue;
      out.push({ url: u.trim(), source: "events.image_urls" });
    }
  }
  const main = String(event.image_url || "").trim();
  if (isHttpsImageUrl(main) && !isGenericMarchaPromoUrl(main, configuredFallback)) {
    out.push({ url: main.trim(), source: "events.image_url" });
  }
  return out;
}

/** Generic Marcha site assets / QR / promo — never treat as the real event photo when other candidates exist. */
function isGenericMarchaPromoUrl(url: string, configuredFallback: string): boolean {
  const t = url.trim().toLowerCase();
  const fb = configuredFallback.trim().toLowerCase();
  if (fb && t === fb) return true;
  try {
    const u = new URL(t);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const p = u.pathname.toLowerCase();
    const hints = [
      "/assets/logo",
      "logo.png",
      "logo.webp",
      "logo-schrift",
      "favicon",
      "app-icon",
      "app_icon",
      "promo",
      "/qr",
      "qrcode",
      "brand-marcha",
      "marcha-qr"
    ];
    const marchaHosts = ["gomarcha.com", "www.gomarcha.com"];
    if (marchaHosts.includes(host) && hints.some((h) => p.includes(h))) return true;
  } catch {
    return false;
  }
  return false;
}

async function validateImageReachable(url: string): Promise<{ ok: boolean; status?: number; contentType?: string; via?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    let res = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    let via = "HEAD";
    let ct = res.headers.get("content-type") || "";
    if (!res.ok || !/image\//i.test(ct)) {
      res = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-16384" },
        signal: ctrl.signal,
        redirect: "follow"
      });
      via = "GET";
      ct = res.headers.get("content-type") || "";
    }
    const ok = res.ok && /image\//i.test(ct);
    return { ok, status: res.status, contentType: ct, via };
  } catch (e) {
    slog("image_reachable_failed", { url: url.slice(0, 120), error: String(e) });
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

async function selectBestReachableEventImage(
  event: EventRow,
  configuredFallback: string
): Promise<{ url: string; source: string }> {
  const candidates = orderedEventImageCandidates(event, configuredFallback);
  const seen = new Set<string>();
  for (const c of candidates) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    const v = await validateImageReachable(c.url);
    if (v.ok) return { url: c.url, source: c.source };
  }
  return { url: configuredFallback, source: "fallback_generic" };
}

function getPrimaryEventDateYmd(event: EventRow): string | null {
  const rt = String(event.recurrence_type || "none").toLowerCase();
  if (rt !== "none") {
    const s = String(event.recurrence_start_date || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  }
  const d = String(event.event_date || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return null;
}

function parseWallTimeParts(raw: string): { h: number; m: number; s: number } {
  const t = String(raw || "23:59").trim();
  const p = t.split(":");
  const h = Math.min(23, Math.max(0, Number(p[0]) || 0));
  const m = Math.min(59, Math.max(0, Number(p[1]) || 0));
  const s = p[2] !== undefined ? Math.min(59, Math.max(0, Number(p[2]) || 0)) : 0;
  return { h, m, s };
}

/** Wall clock from `events.event_date` / `recurrence_start_date` + `events.event_time` in `timeZone` (default Europe/Berlin). */
function eventStartEpochMs(event: EventRow, timeZone: string): number | null {
  const ymd = getPrimaryEventDateYmd(event);
  if (!ymd) return null;
  const { h, m, s } = parseWallTimeParts(String(event.event_time || "23:59"));
  // deno-lint-ignore no-explicit-any
  const TemporalApi = (globalThis as any).Temporal as
    | undefined
    | {
        ZonedDateTime: {
          from(
            x: Record<string, string | number>
          ): { toInstant: () => { epochMilliseconds: number } };
        };
      };
  if (!TemporalApi?.ZonedDateTime) {
    slog("temporal_missing_using_utc", { event_id: event.id });
    return Date.parse(`${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}Z`);
  }
  try {
    return TemporalApi.ZonedDateTime.from({
      timeZone,
      year: Number(ymd.slice(0, 4)),
      month: Number(ymd.slice(5, 7)),
      day: Number(ymd.slice(8, 10)),
      hour: h,
      minute: m,
      second: s,
      millisecond: 0
    }).toInstant().epochMilliseconds;
  } catch (e) {
    slog("event_start_parse_failed", { event_id: event.id, ymd, error: String(e) });
    return null;
  }
}

function zonedCalendarParts(ms: number, timeZone: string): { y: number; mo: number; d: number; hour: number; minute: number } {
  // deno-lint-ignore no-explicit-any
  const TemporalApi = (globalThis as any).Temporal as
    | undefined
    | {
        Instant: {
          fromEpochMilliseconds(ms: number): {
            toZonedDateTimeISO(tz: string): { year: number; month: number; day: number; hour: number; minute: number };
          };
        };
      };
  if (!TemporalApi?.Instant) {
    const d = new Date(ms);
    return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  }
  const z = TemporalApi.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(timeZone);
  return { y: z.year, mo: z.month, d: z.day, hour: z.hour, minute: z.minute };
}

function wallClockToEpochMs(
  y: number,
  mo: number,
  d: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): number | null {
  // deno-lint-ignore no-explicit-any
  const TemporalApi = (globalThis as any).Temporal as
    | undefined
    | {
        ZonedDateTime: {
          from(x: Record<string, string | number>): { toInstant: () => { epochMilliseconds: number } };
        };
      };
  if (!TemporalApi?.ZonedDateTime) {
    return Date.parse(`${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}Z`);
  }
  try {
    return TemporalApi.ZonedDateTime.from({
      timeZone,
      year: y,
      month: mo,
      day: d,
      hour,
      minute,
      second,
      millisecond: 0
    }).toInstant().epochMilliseconds;
  } catch {
    return null;
  }
}

/**
 * Never publish after event start. Default last compliant slot = 2h before start.
 * Same calendar day (event TZ): afternoon queue times clamp toward a morning slot.
 */
function resolveEffectivePostTimeMs(args: {
  queueScheduledIso: string;
  eventStartMs: number;
  nowMs: number;
  timeZone: string;
}): { ok: true; effectiveMs: number; trace: string[] } | { ok: false; reason: string; trace: string[] } {
  const { queueScheduledIso, eventStartMs, nowMs, timeZone: tz } = args;
  const trace: string[] = [];
  const qMs = Date.parse(queueScheduledIso);
  if (Number.isNaN(qMs)) return { ok: false, reason: "invalid_queue_scheduled_at", trace };

  if (nowMs >= eventStartMs) return { ok: false, reason: "event_already_started_or_past", trace };
  if (qMs >= eventStartMs) return { ok: false, reason: "queue_scheduled_after_event_start", trace };

  const TWO_MS = 2 * 60 * 60 * 1000;
  const lastCompliantMs = eventStartMs - TWO_MS;

  let eff = qMs;
  trace.push(`queue_ms=${qMs}`);

  if (eff > lastCompliantMs) {
    if (nowMs >= lastCompliantMs) {
      trace.push("branch=last_call_immediate_inside_two_hours");
      eff = nowMs + 45_000;
      if (eff >= eventStartMs) eff = eventStartMs - 15_000;
      if (eff <= nowMs) return { ok: false, reason: "too_late_cannot_post_before_event", trace };
    } else {
      trace.push("branch=clamp_to_two_hours_before_start");
      eff = lastCompliantMs;
    }
  }

  const afternoonCutoffHour = 15;
  const morningHour = 10;
  const morningMinute = 30;
  const effParts = zonedCalendarParts(eff, tz);
  const startParts = zonedCalendarParts(eventStartMs, tz);
  const sameCalendarDay =
    effParts.y === startParts.y && effParts.mo === startParts.mo && effParts.d === startParts.d;

  if (sameCalendarDay && effParts.hour >= afternoonCutoffHour && eff < eventStartMs) {
    trace.push("branch=same_day_afternoon_clamp_morning_slot");
    const morningMs = wallClockToEpochMs(effParts.y, effParts.mo, effParts.d, morningHour, morningMinute, 0, tz);
    if (morningMs !== null) {
      let slot = morningMs;
      if (slot > lastCompliantMs && nowMs < lastCompliantMs) slot = lastCompliantMs;
      if (slot < nowMs && nowMs < lastCompliantMs) slot = Math.min(lastCompliantMs, nowMs + 60_000);
      if (slot >= nowMs && slot < eventStartMs) eff = slot;
      else if (nowMs >= lastCompliantMs) {
        eff = Math.min(nowMs + 45_000, eventStartMs - 15_000);
      } else {
        eff = lastCompliantMs;
      }
    }
  }

  if (eff >= eventStartMs) return { ok: false, reason: "effective_post_after_event_start", trace };
  if (eff < nowMs) {
    eff = Math.min(nowMs + 60_000, eventStartMs - 15_000);
  }
  if (eff >= eventStartMs) return { ok: false, reason: "effective_post_after_event_start", trace };
  if (eff < nowMs) return { ok: false, reason: "no_future_publish_slot", trace };

  trace.push(`effective_ms=${eff}`);
  return { ok: true, effectiveMs: eff, trace };
}

function buildCaption(hook: { id: string; line: string }, event: EventRow): { caption: string; template_id: string } {
  const name = String(event.name || "Evento").trim();
  const city = String(event.city || "").trim();
  const venue = String(event.location_name || "").trim();
  const whenParts = [event.event_date, event.event_time].filter(Boolean);
  const when = whenParts.length ? whenParts.join(" · ") : "pronto";
  const localBit = city
    ? venue
      ? `${name} en ${venue} (${city}). ${when}.`
      : `${name} en ${city}. ${when}.`
    : venue
      ? `${name} en ${venue}. ${when}.`
      : `${name}. ${when}.`;
  const cta = "Más detalles en gomarcha.com";
  const caption = `${hook.line}\n\n${localBit}\n\n${cta}`;
  return { caption, template_id: hook.id };
}

async function pickHook(
  supabase: SupabaseClient,
  eventId: string
): Promise<{ id: string; line: string }> {
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: used, error } = await supabase
    .from("social_caption_usage")
    .select("template_id")
    .eq("event_id", eventId)
    .gte("created_at", since);
  if (error) slog("caption_usage_select_warning", { message: error.message });
  const usedSet = new Set((used ?? []).map((r: { template_id: string }) => r.template_id));
  const fresh = CAPTION_HOOKS.filter((h) => !usedSet.has(h.id));
  const pool = fresh.length ? fresh : CAPTION_HOOKS;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function utcDayRangeIso(scheduledAt: string): { start: string; end: string } {
  const d = new Date(scheduledAt);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Blocks duplicate posts for the same event+platform+UTC day:
 * - any other row already `posted`, or
 * - another row in `processing` with a lower `id` (stable tie-break so two workers cannot both publish).
 */
async function hasQueueConflict(
  supabase: SupabaseClient,
  eventId: string,
  platform: SocialPlatform,
  excludeQueueId: string,
  scheduledAt: string
): Promise<boolean> {
  const { start, end } = utcDayRangeIso(scheduledAt);
  const { data, error } = await supabase
    .from("social_queue")
    .select("id,status")
    .eq("event_id", eventId)
    .eq("platform", platform)
    .neq("id", excludeQueueId)
    .gte("scheduled_at", start)
    .lte("scheduled_at", end)
    .in("status", ["posted", "processing"]);
  if (error) {
    slog("dedupe_check_error", { message: error.message });
    return false;
  }
  for (const row of data ?? []) {
    if (row.status === "posted") return true;
    if (row.status === "processing" && typeof row.id === "string" && row.id < excludeQueueId) return true;
  }
  return false;
}

function mediaPayloadFromUrl(url: string): PostizMedia {
  const enc = new TextEncoder().encode(url);
  return { id: stableIdFromBytes(enc), path: url };
}

function stableIdFromBytes(bytes: Uint8Array): string {
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i]!;
    h = Math.imul(h, 16777619);
  }
  return `m-${(h >>> 0).toString(16)}`;
}

function isPostizUploadsHost(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase() === "uploads.postiz.com";
  } catch {
    return false;
  }
}

function filenameForPostizUpload(sourceUrl: string, contentType: string): string {
  let ext = ".jpg";
  if (/png/i.test(contentType)) ext = ".png";
  else if (/webp/i.test(contentType)) ext = ".webp";
  else if (/gif/i.test(contentType)) ext = ".gif";
  else if (/jpeg|jpe/i.test(contentType)) ext = ".jpg";
  try {
    const base = new URL(sourceUrl).pathname.split("/").pop() || "";
    if (/\.(jpe?g|png|gif|webp)$/i.test(base)) return base.slice(0, 180);
  } catch {
    /* ignore */
  }
  return `marcha-event${ext}`;
}

async function downloadImageBytes(
  url: string
): Promise<{ ok: true; bytes: Uint8Array; contentType: string } | { ok: false; error: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal });
    if (!res.ok) return { ok: false, error: `image_download_http_${res.status}` };
    const cl = res.headers.get("content-length");
    if (cl && Number(cl) > MAX_IMAGE_DOWNLOAD_BYTES) {
      return { ok: false, error: "image_download_too_large" };
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_DOWNLOAD_BYTES) return { ok: false, error: "image_download_too_large" };
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    if (!/image\//i.test(contentType)) {
      return { ok: false, error: `image_download_not_image:${contentType}` };
    }
    return { ok: true, bytes: buf, contentType };
  } catch (e) {
    return { ok: false, error: `image_download_${String(e)}` };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ensures media is hosted on uploads.postiz.com for posts:create.
 * External URLs are downloaded and sent to POST /upload (multipart).
 */
async function ensurePostizHostedMedia(args: {
  apiBase: string;
  apiKey: string;
  queueId: string;
  sourceUrl: string;
}): Promise<
  | { ok: true; media: PostizMedia; uploadPerformed: boolean }
  | { ok: false; error: string; httpStatus?: number; body?: unknown }
> {
  if (isPostizUploadsHost(args.sourceUrl)) {
    slog("postiz_upload_skip", {
      queue_id: args.queueId,
      reason: "already_postiz_host",
      path: args.sourceUrl.slice(0, 120)
    });
    return { ok: true, media: mediaPayloadFromUrl(args.sourceUrl), uploadPerformed: false };
  }

  slog("postiz_upload_download_start", { queue_id: args.queueId, source_host: safeHost(args.sourceUrl) });
  const dl = await downloadImageBytes(args.sourceUrl);
  if (!dl.ok) {
    slog("postiz_upload_download_failed", { queue_id: args.queueId, error: dl.error });
    return { ok: false, error: dl.error };
  }

  const filename = filenameForPostizUpload(args.sourceUrl, dl.contentType);
  const uploadUrl = `${args.apiBase.replace(/\/$/, "")}/upload`;
  const form = new FormData();
  form.append("file", new Blob([dl.bytes], { type: dl.contentType }), filename);

  slog("postiz_upload_multipart_start", {
    queue_id: args.queueId,
    endpoint: uploadUrl,
    filename,
    bytes: dl.bytes.byteLength,
    content_type: dl.contentType
  });

  let res: Response;
  try {
    res = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: args.apiKey },
      body: form
    });
  } catch (e) {
    const err = `postiz_upload_network_${String(e)}`;
    slog("postiz_upload_failed", { queue_id: args.queueId, error: err });
    return { ok: false, error: err };
  }

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = await res.text();
  }

  if (!res.ok) {
    slog("postiz_upload_failed", {
      queue_id: args.queueId,
      http_status: res.status,
      body: typeof parsed === "string" ? parsed.slice(0, 500) : parsed
    });
    return { ok: false, error: `postiz_upload_http_${res.status}`, httpStatus: res.status, body: parsed };
  }

  const body = parsed as { id?: string; path?: string };
  const id = typeof body?.id === "string" ? body.id : "";
  const path = typeof body?.path === "string" ? body.path : "";
  if (!id || !path || !isPostizUploadsHost(path)) {
    const err = "postiz_upload_invalid_response";
    slog("postiz_upload_failed", { queue_id: args.queueId, error: err, body: parsed });
    return { ok: false, error: err, httpStatus: res.status, body: parsed };
  }

  slog("postiz_upload_ok", {
    queue_id: args.queueId,
    postiz_media_id: id,
    postiz_path: path,
    bytes: dl.bytes.byteLength
  });

  return { ok: true, media: { id, path }, uploadPerformed: true };
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "(invalid-url)";
  }
}

function integrationForRow(row: QueueRow, envIg: string, envFb: string): string | null {
  if (row.postiz_integration_id && row.postiz_integration_id.trim()) return row.postiz_integration_id.trim();
  if (row.platform === "instagram") return envIg || null;
  if (row.platform === "facebook") return envFb || null;
  return null;
}

function postizSettings(platform: SocialPlatform): Record<string, unknown> {
  if (platform === "instagram") {
    return { __type: "instagram", post_type: "post", is_trial_reel: false, collaborators: [] };
  }
  return { __type: "facebook", url: "https://gomarcha.com" };
}

/** Postiz API validates `tags` as an array of `{ value, label }`; empty `[]` can break create/list visibility (see postiz-app#717). */
function postizTagsPayload(): { value: string; label: string }[] {
  return [{ value: "", label: "" }];
}

function toUtcPostizDateIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString();
}

/**
 * Extract listable post ids from POST /posts response (shape varies by Postiz version).
 * Ignores releaseId === "missing" as non-listable for our "posted" gate.
 */
function extractPostIdsFromCreateResponse(body: unknown): string[] {
  const out: string[] = [];
  const take = (v: unknown) => {
    if (typeof v !== "string") return;
    const t = v.trim();
    if (!t || t === "missing") return;
    out.push(t);
  };

  const scanObject = (o: Record<string, unknown>) => {
    take(o.postId);
    take(o.post_id);
    take(o.id);
    const post = o.post;
    if (post && typeof post === "object") {
      const po = post as Record<string, unknown>;
      take(po.id);
      take(po.postId);
    }
  };

  if (Array.isArray(body)) {
    for (const item of body) {
      if (item && typeof item === "object") scanObject(item as Record<string, unknown>);
    }
    return [...new Set(out)];
  }
  if (body && typeof body === "object") {
    scanObject(body as Record<string, unknown>);
    const root = body as Record<string, unknown>;
    for (const key of ["posts", "data", "result", "items"]) {
      const arr = root[key];
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && typeof item === "object") scanObject(item as Record<string, unknown>);
        }
      }
    }
  }
  return [...new Set(out)];
}

async function createPostizPost(args: {
  base: string;
  apiKey: string;
  integrationId: string;
  platform: SocialPlatform;
  scheduledIso: string;
  caption: string;
  image: PostizMedia;
  queueId: string;
}): Promise<{ ok: boolean; status: number; body: unknown; requestPayload: Record<string, unknown> }> {
  const url = `${args.base.replace(/\/$/, "")}/posts`;
  const group = crypto.randomUUID();
  const dateIso = toUtcPostizDateIso(args.scheduledIso);
  const requestPayload: Record<string, unknown> = {
    type: "schedule",
    date: dateIso,
    shortLink: false,
    tags: postizTagsPayload(),
    posts: [
      {
        group,
        integration: { id: args.integrationId },
        value: [{ content: args.caption, image: [args.image] }],
        settings: postizSettings(args.platform)
      }
    ]
  };

  slog("postiz_create_request_payload", {
    queue_id: args.queueId,
    endpoint: url,
    payload: requestPayload
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: args.apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestPayload)
  });
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = await res.text();
  }
  const httpOk = res.status >= 200 && res.status < 300;
  return { ok: httpOk, status: res.status, body: parsed, requestPayload };
}

async function claimRow(supabase: SupabaseClient, rowId: string): Promise<QueueRow | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("social_queue")
    .update({ status: "processing", last_attempt_at: now, updated_at: now })
    .eq("id", rowId)
    .in("status", ["pending", "failed"])
    .select("*")
    .maybeSingle();
  if (error) {
    slog("claim_failed", { rowId, message: error.message });
    return null;
  }
  return data as QueueRow | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const secret = Deno.env.get("MARCHA_SOCIAL_RUNNER_SECRET") || "";
  const hdr = req.headers.get("x-marcha-social-secret") || "";
  if (!secret || hdr !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized or MARCHA_SOCIAL_RUNNER_SECRET not set" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const postizBase = Deno.env.get("POSTIZ_API_BASE") || "https://api.postiz.com/public/v1";
  const postizKey = Deno.env.get("POSTIZ_API_KEY") || "";
  const intIg = Deno.env.get("POSTIZ_INSTAGRAM_INTEGRATION_ID") || "";
  const intFb = Deno.env.get("POSTIZ_FACEBOOK_INTEGRATION_ID") || "";
  const fallbackImage =
    Deno.env.get("MARCHA_DEFAULT_SOCIAL_IMAGE_URL") || "https://gomarcha.com/assets/logo.png";
  const eventTimeZone = Deno.env.get("MARCHA_EVENT_TIMEZONE") || "Europe/Berlin";

  if (!postizKey) {
    slog("missing_postiz_api_key");
    return new Response(JSON.stringify({ error: "POSTIZ_API_KEY not configured" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const nowIso = new Date().toISOString();
  const backoffMs = 15 * 60 * 1000;
  const retryBefore = new Date(Date.now() - backoffMs).toISOString();

  let body: { queue_id?: string; limit?: number } = {};
  try {
    if (req.method === "POST" && req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    body = {};
  }

  const limit = Math.min(Math.max(Number(body.limit) || 8, 1), 25);

  let query = supabase
    .from("social_queue")
    .select("*")
    .lte("scheduled_at", nowIso)
    .lt("retry_count", 5)
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (body.queue_id) {
    query = query.eq("id", body.queue_id);
  } else {
    query = query.or(
      `status.eq.pending,and(status.eq.failed,or(last_attempt_at.is.null,last_attempt_at.lt.${retryBefore}))`
    );
  }

  const { data: rows, error: qErr } = await query;
  if (qErr) {
    slog("queue_select_error", { message: qErr.message });
    return new Response(JSON.stringify({ error: qErr.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  const results: Record<string, unknown>[] = [];

  for (const raw of rows ?? []) {
    const row = raw as QueueRow;
    const claimed = await claimRow(supabase, row.id);
    if (!claimed) {
      results.push({ queue_id: row.id, skipped: true, reason: "claim_failed_or_race" });
      continue;
    }

    const integrationId = integrationForRow(claimed, intIg, intFb);
    if (!integrationId) {
      const msg = "Missing postiz_integration_id on row and env fallback";
      slog("no_integration", { queue_id: claimed.id, platform: claimed.platform });
      await supabase
        .from("social_queue")
        .update({
          status: "failed",
          last_error: msg,
          retry_count: claimed.retry_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", claimed.id);
      results.push({ queue_id: claimed.id, error: msg });
      continue;
    }

    const { data: event, error: eErr } = await supabase
      .from("events")
      .select(
        "id,name,city,location_name,event_date,event_time,genre,status,featured,image_url,image_urls,recurrence_type,recurrence_start_date"
      )
      .eq("id", claimed.event_id)
      .maybeSingle();

    if (eErr || !event) {
      const msg = eErr?.message || "event_not_found";
      slog("event_load_failed", { queue_id: claimed.id, message: msg });
      await supabase
        .from("social_queue")
        .update({
          status: "failed",
          last_error: msg,
          retry_count: claimed.retry_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", claimed.id);
      results.push({ queue_id: claimed.id, error: msg });
      continue;
    }

    const ev = event as EventRow;
    if (String(ev.status || "").toLowerCase() !== "approved") {
      const msg = `event_not_approved:${ev.status}`;
      slog("skip_unapproved", { queue_id: claimed.id, event_id: ev.id });
      await supabase
        .from("social_queue")
        .update({
          status: "skipped",
          last_error: msg,
          updated_at: new Date().toISOString()
        })
        .eq("id", claimed.id);
      results.push({ queue_id: claimed.id, skipped: true, reason: msg });
      continue;
    }

    if (await hasQueueConflict(supabase, claimed.event_id, claimed.platform, claimed.id, claimed.scheduled_at)) {
      const msg = "duplicate_or_parallel_queue_same_day";
      slog("skip_duplicate", { queue_id: claimed.id, event_id: claimed.event_id, platform: claimed.platform });
      await supabase
        .from("social_queue")
        .update({
          status: "skipped",
          last_error: msg,
          updated_at: new Date().toISOString()
        })
        .eq("id", claimed.id);
      results.push({ queue_id: claimed.id, skipped: true, reason: msg });
      continue;
    }

    const eventStartMs = eventStartEpochMs(ev, eventTimeZone);
    if (eventStartMs === null) {
      const msg = "event_start_unknown_missing_date";
      slog("schedule_skip", { queue_id: claimed.id, event_id: ev.id, reason: msg });
      await supabase
        .from("social_queue")
        .update({
          status: "skipped",
          last_error: msg,
          updated_at: new Date().toISOString()
        })
        .eq("id", claimed.id);
      results.push({ queue_id: claimed.id, skipped: true, reason: msg });
      continue;
    }

    const nowMs = Date.now();
    const scheduleResult = resolveEffectivePostTimeMs({
      queueScheduledIso: claimed.scheduled_at,
      eventStartMs,
      nowMs,
      timeZone: eventTimeZone
    });

    if (!scheduleResult.ok) {
      slog("schedule_skip", {
        queue_id: claimed.id,
        event_id: ev.id,
        event_title: ev.name ?? "",
        reason: scheduleResult.reason,
        trace: scheduleResult.trace,
        queue_scheduled_at: claimed.scheduled_at,
        event_start_ms: eventStartMs,
        timezone: eventTimeZone
      });
      await supabase
        .from("social_queue")
        .update({
          status: "skipped",
          last_error: `schedule:${scheduleResult.reason}`,
          updated_at: new Date().toISOString()
        })
        .eq("id", claimed.id);
      results.push({ queue_id: claimed.id, skipped: true, reason: scheduleResult.reason });
      continue;
    }

    const effectivePostIso = new Date(scheduleResult.effectiveMs).toISOString();
    slog("schedule_resolved", {
      queue_id: claimed.id,
      event_id: ev.id,
      event_title: ev.name ?? "",
      queue_scheduled_at: claimed.scheduled_at,
      effective_post_at: effectivePostIso,
      event_start_iso: new Date(eventStartMs).toISOString(),
      timezone: eventTimeZone,
      schedule_trace: scheduleResult.trace.join(" | ")
    });

    slog("event_image_audit", {
      queue_id: claimed.id,
      event_id: ev.id,
      event_title: ev.name ?? "",
      raw_image_url: ev.image_url ?? null,
      raw_image_urls: ev.image_urls ?? null,
      recurrence_type: ev.recurrence_type ?? null,
      recurrence_start_date: ev.recurrence_start_date ?? null,
      primary_event_date_ymd: getPrimaryEventDateYmd(ev),
      event_time_wall: ev.event_time ?? null,
      timezone: eventTimeZone
    });

    const pickedImage = await selectBestReachableEventImage(ev, fallbackImage);
    const nonGenericCandidates = orderedEventImageCandidates(ev, fallbackImage).length;

    const finalImage = pickedImage.url;
    const imageLoggedSource = pickedImage.source;

    slog("event_image_selected", {
      queue_id: claimed.id,
      event_id: ev.id,
      selected_source_image_url: finalImage,
      selection_source: imageLoggedSource,
      non_generic_candidate_count: nonGenericCandidates,
      using_generic_fallback: pickedImage.source === "fallback_generic"
    });

    const uploadResult = await ensurePostizHostedMedia({
      apiBase: postizBase,
      apiKey: postizKey,
      queueId: claimed.id,
      sourceUrl: finalImage
    });

    if (!uploadResult.ok) {
      const errText =
        typeof uploadResult.body === "string"
          ? uploadResult.body
          : uploadResult.body !== undefined
            ? JSON.stringify(uploadResult.body)
            : uploadResult.error;
      slog("post_aborted_after_upload_failure", { queue_id: claimed.id, error: uploadResult.error });
      await supabase
        .from("social_queue")
        .update({
          status: "failed",
          resolved_image_url: finalImage,
          last_error: `postiz_upload:${uploadResult.error}:${String(errText).slice(0, 400)}`,
          retry_count: claimed.retry_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", claimed.id);
      results.push({ queue_id: claimed.id, ok: false, phase: "upload", error: uploadResult.error });
      continue;
    }

    const publishMedia = uploadResult.media;
    const resolvedPostizUrl = publishMedia.path;

    slog("event_image_postiz_uploaded", {
      queue_id: claimed.id,
      event_id: ev.id,
      uploaded_postiz_image_url: resolvedPostizUrl,
      postiz_media_id: publishMedia.id
    });

    const hook = await pickHook(supabase, claimed.event_id);
    const { caption, template_id } = buildCaption(hook, ev);

    slog("post_prepare", {
      queue_id: claimed.id,
      event_id: claimed.event_id,
      event_title: ev.name ?? "",
      platform: claimed.platform,
      queue_scheduled_at: claimed.scheduled_at,
      effective_post_at: effectivePostIso,
      source_image_url: finalImage,
      image_source: imageLoggedSource,
      postiz_media_id: publishMedia.id,
      postiz_image_path: resolvedPostizUrl,
      postiz_upload_performed: uploadResult.uploadPerformed,
      caption_preview: caption.slice(0, 120),
      caption_template_id: template_id,
      postiz_integration_id: integrationId
    });

    const postizRes = await createPostizPost({
      base: postizBase,
      apiKey: postizKey,
      integrationId,
      platform: claimed.platform,
      scheduledIso: effectivePostIso,
      caption,
      image: publishMedia,
      queueId: claimed.id
    });

    slog("postiz_create_response_body", {
      queue_id: claimed.id,
      platform: claimed.platform,
      http_status: postizRes.status,
      body: postizRes.body
    });

    const now = new Date().toISOString();
    if (!postizRes.ok) {
      const errText = typeof postizRes.body === "string" ? postizRes.body : JSON.stringify(postizRes.body);
      await supabase
        .from("social_queue")
        .update({
          status: "failed",
          resolved_image_url: resolvedPostizUrl,
          caption,
          caption_template_id: template_id,
          postiz_response: postizRes.body as object,
          last_error: `postiz_posts_http_${postizRes.status}:${errText.slice(0, 800)}`,
          retry_count: claimed.retry_count + 1,
          updated_at: now
        })
        .eq("id", claimed.id);
      results.push({
        queue_id: claimed.id,
        ok: false,
        phase: "posts_create",
        postiz_status: postizRes.status,
        postiz_body: postizRes.body
      });
      continue;
    }

    const createdPostIds = extractPostIdsFromCreateResponse(postizRes.body);
    if (createdPostIds.length === 0) {
      slog("postiz_create_no_listable_post_id", {
        queue_id: claimed.id,
        http_status: postizRes.status,
        body: postizRes.body
      });
      const mergedResponse =
        typeof postizRes.body === "object" && postizRes.body !== null
          ? { ...(postizRes.body as object), _marcha_extracted_post_ids: createdPostIds }
          : { raw: postizRes.body, _marcha_extracted_post_ids: createdPostIds };
      await supabase
        .from("social_queue")
        .update({
          status: "failed",
          resolved_image_url: resolvedPostizUrl,
          caption,
          caption_template_id: template_id,
          postiz_response: mergedResponse as object,
          last_error: "postiz:create_not_visible",
          retry_count: claimed.retry_count + 1,
          updated_at: now
        })
        .eq("id", claimed.id);
      results.push({
        queue_id: claimed.id,
        ok: false,
        phase: "posts_create",
        postiz_status: postizRes.status,
        reason: "postiz:create_not_visible"
      });
      continue;
    }

    const mergedSuccessResponse =
      typeof postizRes.body === "object" && postizRes.body !== null
        ? { ...(postizRes.body as object), _marcha_postiz_post_ids: createdPostIds }
        : { raw: postizRes.body, _marcha_postiz_post_ids: createdPostIds };

    await supabase.from("social_caption_usage").insert({
      event_id: claimed.event_id,
      template_id,
      caption,
      platform: claimed.platform
    });

    await supabase
      .from("social_queue")
      .update({
        status: "posted",
        resolved_image_url: resolvedPostizUrl,
        caption,
        caption_template_id: template_id,
        postiz_response: mergedSuccessResponse as object,
        last_error: null,
        posted_at: now,
        updated_at: now
      })
      .eq("id", claimed.id);

    results.push({
      queue_id: claimed.id,
      ok: true,
      postiz_post_ids: createdPostIds,
      source_image_url: finalImage,
      postiz_image_url: resolvedPostizUrl,
      image_source: imageLoggedSource,
      caption_template_id: template_id,
      postiz_status: postizRes.status
    });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...CORS, "Content-Type": "application/json" }
  });
});
