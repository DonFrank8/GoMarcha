import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2.49.1";
import {
  DEFAULT_SOCIAL_FALLBACK_IMAGE,
  isPostizUploadsHost,
  logSocialImageResolution,
  resolveSocialPostImageReachable
} from "./social-post-image-resolution.ts";

type SocialPlatform = "instagram" | "facebook";

type QueueRow = {
  id: string;
  event_id: string;
  platform: SocialPlatform;
  platforms?: SocialPlatform[] | null;
  scheduled_at: string;
  status: string;
  postiz_integration_id: string | null;
  retry_count: number;
  last_attempt_at: string | null;
  image_url?: string | null;
  resolved_image_url?: string | null;
  caption?: string | null;
  hashtags?: string | null;
  cta_text?: string | null;
  postiz_response?: Record<string, unknown> | null;
  post_stage?: string | null;
  admin_confirmed_at?: string | null;
  postiz_post_id?: string | null;
  postiz_synced_at?: string | null;
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
  recurrence_end_date?: string | null;
  recurrence_weekday?: number | null;
  recurrence_day_of_month?: number | null;
};

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-marcha-social-secret"
};

type CaptionStage = "week" | "three_days" | "one_day" | "final_call";

type CaptionTemplate = {
  id: string;
  stage: CaptionStage;
  build: (ctx: { event: EventRow; where: string; dateLine: string }) => string[];
};

/** Stage-specific Spanish copy. Stable ids let `social_caption_usage` avoid repeated text per event. */
const CAPTION_TEMPLATES: CaptionTemplate[] = [
  {
    id: "week-01",
    stage: "week",
    build: ({ where, dateLine }) => [`Apúntalo con calma: ${where}.`, dateLine]
  },
  {
    id: "week-02",
    stage: "week",
    build: ({ where, dateLine }) => [`Plan a la vista en la Costa: ${where}.`, dateLine]
  },
  {
    id: "week-03",
    stage: "week",
    build: ({ where, dateLine }) => [`Queda una semana para este directo: ${where}.`, dateLine]
  },
  {
    id: "three-01",
    stage: "three_days",
    build: ({ where, dateLine }) => [`Quedan tres días. ${where} ya está cerca.`, dateLine]
  },
  {
    id: "three-02",
    stage: "three_days",
    build: ({ where, dateLine }) => [`Si buscas plan esta semana: ${where}.`, dateLine]
  },
  {
    id: "three-03",
    stage: "three_days",
    build: ({ where, dateLine }) => [`Tres días y suena el plan: ${where}.`, dateLine]
  },
  {
    id: "one-01",
    stage: "one_day",
    build: ({ where, dateLine }) => [`Mañana hay música en vivo: ${where}.`, dateLine]
  },
  {
    id: "one-02",
    stage: "one_day",
    build: ({ where, dateLine }) => [`Última noche para organizarte: ${where}.`, dateLine]
  },
  {
    id: "one-03",
    stage: "one_day",
    build: ({ where, dateLine }) => [`Mañana toca salir un rato: ${where}.`, dateLine]
  },
  {
    id: "final-01",
    stage: "final_call",
    build: ({ where, dateLine }) => [`Final call para hoy: ${where}.`, dateLine]
  },
  {
    id: "final-02",
    stage: "final_call",
    build: ({ where, dateLine }) => [`Hoy es el día. ${where}.`, dateLine]
  },
  {
    id: "final-03",
    stage: "final_call",
    build: ({ where, dateLine }) => [`Si te apetece directo hoy, mira esto: ${where}.`, dateLine]
  }
];

function calendarDayKeyInTimeZone(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(ms));
}

/** Calendar-day distance a→b in `timeZone` (integer, may be negative). */
function calendarDaysBetween(aMs: number, bMs: number, timeZone: string): number {
  const ka = calendarDayKeyInTimeZone(aMs, timeZone);
  const kb = calendarDayKeyInTimeZone(bMs, timeZone);
  const parse = (k: string) => {
    const [y, m, d] = k.split("-").map((x) => Number(x));
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(ka) - parse(kb)) / 86400000);
}

/** Natural Spanish teaser — no ISO dates, no weekday English. */
function spanishNaturalTimeTeaser(eventStartMs: number, nowMs: number, timeZone: string): string {
  const diffDays = calendarDaysBetween(eventStartMs, nowMs, timeZone);
  if (diffDays < 0) return "Planazo en marcha.";
  if (diffDays === 0) return "Hoy hay plan.";
  if (diffDays === 1) return "Mañana suena bien.";
  if (diffDays <= 3) return "Esta semana viene fuerte.";
  if (diffDays < 7) return "Este finde hay ambiente.";
  if (diffDays < 14) return "Buen plan en la Costa.";
  return "Música en vivo por la zona.";
}

function shortEventWhereLine(event: EventRow): string {
  const name = String(event.name || "Evento").trim();
  const city = String(event.city || "").trim();
  if (city) return `${name} · ${city}`;
  const venue = String(event.location_name || "").trim();
  if (venue) return `${name} · ${venue}`;
  return name;
}

function captionVarietyHash(eventId: string, templateId: string): number {
  const s = `${eventId}:${templateId}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)!;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildSpanishHashtagLine(event: EventRow): string {
  const base = ["músicaenvivo", "CostaDelSol", "directo"];
  const cityRaw = String(event.city || "").trim();
  const city = cityRaw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const extras: string[] = [];
  if (city.includes("malaga")) extras.push("Malaga");
  if (city.includes("marbella")) extras.push("Marbella");
  if (city.includes("torremolinos")) extras.push("Torremolinos");
  if (city.includes("fuengirola")) extras.push("Fuengirola");
  if (city.includes("benalmadena")) extras.push("Benalmadena");
  if (city.includes("estepona")) extras.push("Estepona");
  if (city.includes("nerja")) extras.push("Nerja");
  if (extras.length === 0) extras.push("Andalucía");
  const merged = [...base, ...extras, "gomarcha"];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of merged) {
    const t = String(raw || "")
      .replace(/^#/u, "")
      .replace(/\s+/gu, "");
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    tags.push(`#${t}`);
    if (tags.length >= 5) break;
  }
  while (tags.length < 4) {
    const pad = ["eventos", "conciertos", "fiesta"].filter((x) => !seen.has(x));
    const x = pad[0];
    if (!x) break;
    seen.add(x);
    tags.push(`#${x}`);
  }
  return tags.slice(0, 5).join(" ");
}

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

function parseWallTimeParts(raw: string): { h: number; m: number; s: number } {
  const t = String(raw || "23:59").trim();
  const p = t.split(":");
  const h = Math.min(23, Math.max(0, Number(p[0]) || 0));
  const m = Math.min(59, Math.max(0, Number(p[1]) || 0));
  const s = p[2] !== undefined ? Math.min(59, Math.max(0, Number(p[2]) || 0)) : 0;
  return { h, m, s };
}

function normalizeRecurrenceTypeEdge(raw: string | null | undefined): "none" | "weekly" | "monthly" {
  const t = String(raw || "none").trim().toLowerCase();
  if (t === "weekly") return "weekly";
  if (t === "monthly") return "monthly";
  return "none";
}

function normalizeWeekdayEdge(raw: unknown): number | null {
  const p = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isInteger(p) || p < 0 || p > 6) return null;
  return p;
}

function normalizeDayOfMonthEdge(raw: unknown): number | null {
  const p = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isInteger(p) || p < 1 || p > 31) return null;
  return p;
}

/** JS getDay(): Sunday=0..Saturday=6 → ISO weekday in Temporal.PlainDate (Mon=1..Sun=7). */
function jsWeekdayToIsoDayOfWeek(js: number): number {
  return js === 0 ? 7 : js;
}

function parseYmdParts(ymd: string): { y: number; mo: number; d: number } | null {
  const t = ymd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return { y: Number(t.slice(0, 4)), mo: Number(t.slice(5, 7)), d: Number(t.slice(8, 10)) };
}

// deno-lint-ignore no-explicit-any
function getTemporalApi(): any {
  return (globalThis as { Temporal?: unknown }).Temporal;
}

function epochMsFromYmdAndEventTime(ymd: string, eventTime: string, timeZone: string): number | null {
  const parts = parseYmdParts(ymd);
  if (!parts) return null;
  const { h, m, s } = parseWallTimeParts(String(eventTime || "23:59"));
  return wallClockToEpochMs(parts.y, parts.mo, parts.d, h, m, s, timeZone);
}

function plainDateFromYmdString(ymd: string, TemporalApi: { PlainDate: { from: (x: Record<string, number>) => unknown } }): {
  year: number;
  month: number;
  day: number;
  add: (x: { days: number } | { months: number }) => unknown;
  with: (x: { day: number }) => unknown;
  dayOfWeek: number;
  toString: () => string;
} | null {
  const p = parseYmdParts(ymd);
  if (!p || !TemporalApi?.PlainDate) return null;
  try {
    return TemporalApi.PlainDate.from({ year: p.y, month: p.mo, day: p.d }) as {
      year: number;
      month: number;
      day: number;
      add: (x: { days: number } | { months: number }) => unknown;
      with: (x: { day: number }) => unknown;
      dayOfWeek: number;
      toString: () => string;
    };
  } catch {
    return null;
  }
}

function plainDateInMonthOrNull(
  year: number,
  month: number,
  dayOfMonth: number,
  TemporalApi: { PlainDate: { from: (x: Record<string, number>) => unknown } }
): {
  year: number;
  month: number;
  day: number;
  add: (x: { days: number } | { months: number }) => unknown;
  with: (x: { day: number }) => unknown;
  dayOfWeek: number;
  toString: () => string;
} | null {
  try {
    return TemporalApi.PlainDate.from({ year, month, day: dayOfMonth }) as {
      year: number;
      month: number;
      day: number;
      add: (x: { days: number } | { months: number }) => unknown;
      with: (x: { day: number }) => unknown;
      dayOfWeek: number;
      toString: () => string;
    };
  } catch {
    return null;
  }
}

function nextWeeklyOccurrenceStartMs(
  event: EventRow,
  timeZone: string,
  nowMs: number
): { ok: true; epochMs: number; occurrenceYmd: string } | { ok: false; reason: string } {
  const T = getTemporalApi();
  if (!T?.PlainDate || !T.PlainDate.compare) {
    return { ok: false, reason: "recurrence_temporal_required" };
  }
  const seriesStartStr = String(event.recurrence_start_date || "").trim();
  const seriesStartPlain = plainDateFromYmdString(seriesStartStr, T);
  if (!seriesStartPlain) return { ok: false, reason: "recurrence_invalid_start_date" };

  const endPlain = event.recurrence_end_date
    ? plainDateFromYmdString(String(event.recurrence_end_date).trim(), T)
    : null;

  const targetJs = normalizeWeekdayEdge(event.recurrence_weekday);
  if (targetJs === null) return { ok: false, reason: "recurrence_weekday_missing" };
  const isoTarget = jsWeekdayToIsoDayOfWeek(targetJs);

  const nowPlain = T.Instant.fromEpochMilliseconds(nowMs).toZonedDateTimeISO(timeZone).toPlainDate();

  let fromPlain =
    T.PlainDate.compare(nowPlain, seriesStartPlain) >= 0 ? nowPlain : seriesStartPlain;

  let delta = (isoTarget - fromPlain.dayOfWeek + 7) % 7;
  let candidatePlain = fromPlain.add({ days: delta }) as typeof fromPlain;
  if (T.PlainDate.compare(candidatePlain, seriesStartPlain) < 0) {
    delta = (isoTarget - seriesStartPlain.dayOfWeek + 7) % 7;
    candidatePlain = seriesStartPlain.add({ days: delta }) as typeof fromPlain;
  }

  for (let i = 0; i < 104; i++) {
    if (endPlain && T.PlainDate.compare(candidatePlain, endPlain) > 0) {
      return { ok: false, reason: "recurrence_series_ended" };
    }
    const ymd = candidatePlain.toString();
    const startMs = epochMsFromYmdAndEventTime(ymd, String(event.event_time || "23:59"), timeZone);
    if (startMs === null) return { ok: false, reason: "recurrence_wall_time_invalid" };
    if (startMs > nowMs) {
      return { ok: true, epochMs: startMs, occurrenceYmd: ymd };
    }
    candidatePlain = candidatePlain.add({ days: 7 }) as typeof candidatePlain;
  }
  return { ok: false, reason: "recurrence_no_upcoming_occurrence" };
}

function nextMonthlyOccurrenceStartMs(
  event: EventRow,
  timeZone: string,
  nowMs: number
): { ok: true; epochMs: number; occurrenceYmd: string } | { ok: false; reason: string } {
  const T = getTemporalApi();
  if (!T?.PlainDate || !T.PlainDate.compare) {
    return { ok: false, reason: "recurrence_temporal_required" };
  }
  const seriesStartStr = String(event.recurrence_start_date || "").trim();
  const seriesStartPlain = plainDateFromYmdString(seriesStartStr, T);
  if (!seriesStartPlain) return { ok: false, reason: "recurrence_invalid_start_date" };

  const endPlain = event.recurrence_end_date
    ? plainDateFromYmdString(String(event.recurrence_end_date).trim(), T)
    : null;

  const dom = normalizeDayOfMonthEdge(event.recurrence_day_of_month);
  if (dom === null) return { ok: false, reason: "recurrence_day_of_month_missing" };

  const nowPlain = T.Instant.fromEpochMilliseconds(nowMs).toZonedDateTimeISO(timeZone).toPlainDate();
  let cursorPlain =
    T.PlainDate.compare(nowPlain, seriesStartPlain) >= 0 ? nowPlain : seriesStartPlain;
  cursorPlain = cursorPlain.with({ day: 1 }) as typeof cursorPlain;

  for (let m = 0; m < 36; m++) {
    const candidatePlain = plainDateInMonthOrNull(cursorPlain.year, cursorPlain.month, dom, T);
    if (!candidatePlain) {
      cursorPlain = cursorPlain.add({ months: 1 }).with({ day: 1 }) as typeof cursorPlain;
      continue;
    }
    if (T.PlainDate.compare(candidatePlain, seriesStartPlain) < 0) {
      cursorPlain = cursorPlain.add({ months: 1 }).with({ day: 1 }) as typeof cursorPlain;
      continue;
    }
    if (endPlain && T.PlainDate.compare(candidatePlain, endPlain) > 0) {
      return { ok: false, reason: "recurrence_series_ended" };
    }
    const ymd = candidatePlain.toString();
    const startMs = epochMsFromYmdAndEventTime(ymd, String(event.event_time || "23:59"), timeZone);
    if (startMs === null) return { ok: false, reason: "recurrence_wall_time_invalid" };
    if (startMs > nowMs) {
      return { ok: true, epochMs: startMs, occurrenceYmd: ymd };
    }
    cursorPlain = cursorPlain.add({ months: 1 }).with({ day: 1 }) as typeof cursorPlain;
  }
  return { ok: false, reason: "recurrence_no_upcoming_occurrence" };
}

/**
 * Next wall-clock start for social automation: one-off uses `event_date`;
 * recurring uses next future occurrence (weekly/monthly), not stale `recurrence_start_date` alone.
 */
function resolveSocialEventOccurrence(
  event: EventRow,
  timeZone: string,
  nowMs: number
): { ok: true; epochMs: number; occurrenceYmd: string } | { ok: false; reason: string } {
  const rt = normalizeRecurrenceTypeEdge(event.recurrence_type);
  if (rt === "none") {
    const d = String(event.event_date || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, reason: "event_date_missing" };
    const ms = epochMsFromYmdAndEventTime(d, String(event.event_time || "23:59"), timeZone);
    if (ms === null) return { ok: false, reason: "event_start_parse_failed" };
    return { ok: true, epochMs: ms, occurrenceYmd: d };
  }
  if (rt === "weekly") return nextWeeklyOccurrenceStartMs(event, timeZone, nowMs);
  if (rt === "monthly") return nextMonthlyOccurrenceStartMs(event, timeZone, nowMs);
  return { ok: false, reason: "recurrence_type_unsupported" };
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

function buildCaption(
  template: CaptionTemplate,
  event: EventRow,
  ctx: { eventStartMs: number; postAtMs: number; timeZone: string }
): { caption: string; template_id: string } {
  const where = shortEventWhereLine(event);
  const dateLine = spanishEventDateLine(ctx.eventStartMs, ctx.timeZone);
  const parts = template.build({ event, where, dateLine });
  parts.push(buildSpanishHashtagLine(event));
  const caption = parts.join("\n\n").trim();
  return { caption, template_id: template.id };
}

async function pickCaptionTemplate(
  supabase: SupabaseClient,
  eventId: string,
  stage: CaptionStage
): Promise<CaptionTemplate> {
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: used, error } = await supabase
    .from("social_caption_usage")
    .select("template_id")
    .eq("event_id", eventId)
    .gte("created_at", since);
  if (error) slog("caption_usage_select_warning", { message: error.message });
  const usedSet = new Set((used ?? []).map((r: { template_id: string }) => r.template_id));
  const stageTemplates = CAPTION_TEMPLATES.filter((template) => template.stage === stage);
  const fresh = stageTemplates.filter((template) => !usedSet.has(template.id));
  const pool = fresh.length ? fresh : stageTemplates;
  const offset = captionVarietyHash(eventId, stage) % Math.max(1, pool.length);
  return pool[offset]!;
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
function platformsOverlap(a: SocialPlatform[], b: SocialPlatform[]): boolean {
  return a.some((p) => b.includes(p));
}

function platformsFromDbRow(row: { platform?: string | null; platforms?: string[] | null }): SocialPlatform[] {
  if (Array.isArray(row.platforms) && row.platforms.length) {
    const out: SocialPlatform[] = [];
    for (const entry of row.platforms) {
      const key = String(entry || "").toLowerCase();
      if ((key === "instagram" || key === "facebook") && !out.includes(key as SocialPlatform)) {
        out.push(key as SocialPlatform);
      }
    }
    if (out.length) return out;
  }
  const legacy = String(row.platform || "").toLowerCase();
  if (legacy === "instagram" || legacy === "facebook") return [legacy];
  return ["instagram", "facebook"];
}

async function hasQueueConflict(
  supabase: SupabaseClient,
  eventId: string,
  platforms: SocialPlatform[],
  excludeQueueId: string,
  scheduledAt: string
): Promise<boolean> {
  const { start, end } = utcDayRangeIso(scheduledAt);
  const { data, error } = await supabase
    .from("social_queue")
    .select("id,status,platform,platforms")
    .eq("event_id", eventId)
    .neq("id", excludeQueueId)
    .gte("scheduled_at", start)
    .lte("scheduled_at", end)
    .in("status", ["posted", "processing"]);
  if (error) {
    slog("dedupe_check_error", { message: error.message });
    return false;
  }
  for (const row of data ?? []) {
    if (!platformsOverlap(platforms, platformsFromDbRow(row))) continue;
    if (row.status === "posted") return true;
    if (row.status === "processing" && typeof row.id === "string" && row.id < excludeQueueId) return true;
  }
  return false;
}

async function persistUploadedImageUrl(supabase: SupabaseClient, queueId: string, uploadedUrl: string): Promise<void> {
  const { error } = await supabase
    .from("social_queue")
    .update({
      resolved_image_url: uploadedUrl,
      updated_at: new Date().toISOString()
    })
    .eq("id", queueId);

  if (error) {
    slog("postiz_upload_resolved_image_persist_failed", { queue_id: queueId, message: error.message });
    return;
  }

  slog("postiz_upload_resolved_image_persisted", {
    queue_id: queueId,
    resolved_image_host: safeHost(uploadedUrl)
  });
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

function arrayBufferFromBytes(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
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
  form.append("file", new Blob([arrayBufferFromBytes(dl.bytes)], { type: dl.contentType }), filename);

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

function readPostizMediaIdFromRow(row: QueueRow): string | null {
  const pr = row.postiz_response;
  if (!pr || typeof pr !== "object") return null;
  const id = String((pr as Record<string, unknown>).postiz_media_id || "").trim();
  return id || null;
}

function rowPlatforms(row: QueueRow): SocialPlatform[] {
  if (Array.isArray(row.platforms) && row.platforms.length) {
    const out: SocialPlatform[] = [];
    for (const entry of row.platforms) {
      const key = String(entry || "").toLowerCase();
      if ((key === "instagram" || key === "facebook") && !out.includes(key as SocialPlatform)) {
        out.push(key as SocialPlatform);
      }
    }
    if (out.length) return out;
  }
  if (row.platform === "instagram" || row.platform === "facebook") return [row.platform];
  return ["instagram", "facebook"];
}

function integrationForPlatform(
  platform: SocialPlatform,
  row: QueueRow,
  envIg: string,
  envFb: string
): string | null {
  if (row.postiz_integration_id && row.postiz_integration_id.trim()) return row.postiz_integration_id.trim();
  if (platform === "instagram") return envIg || null;
  if (platform === "facebook") return envFb || null;
  return null;
}

function integrationTargetsForRow(
  row: QueueRow,
  envIg: string,
  envFb: string
): { platform: SocialPlatform; integrationId: string }[] {
  const targets: { platform: SocialPlatform; integrationId: string }[] = [];
  for (const platform of rowPlatforms(row)) {
    const integrationId = integrationForPlatform(platform, row, envIg, envFb);
    if (integrationId) targets.push({ platform, integrationId });
  }
  return targets;
}

function postizSettings(platform: SocialPlatform, eventId?: string | null): Record<string, unknown> {
  if (platform === "instagram") {
    return { __type: "instagram", post_type: "post", is_trial_reel: false, collaborators: [] };
  }
  // Use event-specific URL so Facebook crawls the event's OG image, not the site's generic social preview.
  const fbUrl = eventId
    ? `https://www.gomarcha.com/?event_id=${encodeURIComponent(eventId)}`
    : "https://www.gomarcha.com";
  return { __type: "facebook", url: fbUrl };
}

/** Postiz API validates `tags` as an array of `{ value, label }`; empty `[]` can break create/list visibility (see postiz-app#717). */
function postizTagsPayload(): { value: string; label: string }[] {
  return [{ value: "", label: "" }];
}

function captionStageForPost(eventStartMs: number, postAtMs: number, timeZone: string): CaptionStage {
  const diffDays = calendarDaysBetween(eventStartMs, postAtMs, timeZone);
  if (diffDays <= 0) return "final_call";
  if (diffDays === 1) return "one_day";
  if (diffDays <= 3) return "three_days";
  return "week";
}

function spanishEventDateLine(eventStartMs: number, timeZone: string): string {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(eventStartMs));
  return `Cuándo: ${formatted.replace(",", "")}.`;
}

function toUtcPostizDateIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString();
}

type PostizRootType = "draft" | "schedule";

/**
 * Default: Postiz `draft` for human review (unset or `draft`).
 * `MARCHA_POSTIZ_POST_MODE=schedule`: Postiz scheduled post only if the intended slot (`effectiveMs`)
 * is at least `MARCHA_POSTIZ_MIN_REVIEW_HOURS` after `now` and still before event−2h; otherwise draft.
 * Postiz `date` always reflects the intended publish instant (`effectiveMs`), never a delayed substitute.
 */
function resolvePostizPublishPlan(args: {
  effectiveMs: number;
  eventStartMs: number;
  nowMs: number;
  envModeRaw: string;
  minReviewHours: number;
}): {
  postType: PostizRootType;
  publishMs: number;
  usedScheduleFallbackToDraft: boolean;
  scheduleFallbackReason: null | "too_close_to_event" | "insufficient_review_lead";
} {
  const mode = String(args.envModeRaw || "draft").trim().toLowerCase();
  const wantSchedule = mode === "schedule";
  const hours = Number.isFinite(args.minReviewHours) ? args.minReviewHours : 72;
  const leadMs = Math.max(0, hours) * 3600000;
  const twoH = 2 * 60 * 60 * 1000;
  const lastScheduleMs = args.eventStartMs - twoH;

  if (!wantSchedule) {
    return {
      postType: "draft",
      publishMs: args.effectiveMs,
      usedScheduleFallbackToDraft: false,
      scheduleFallbackReason: null
    };
  }

  if (args.effectiveMs >= lastScheduleMs) {
    return {
      postType: "draft",
      publishMs: args.effectiveMs,
      usedScheduleFallbackToDraft: true,
      scheduleFallbackReason: "too_close_to_event"
    };
  }

  if (args.effectiveMs < args.nowMs + leadMs) {
    return {
      postType: "draft",
      publishMs: args.effectiveMs,
      usedScheduleFallbackToDraft: true,
      scheduleFallbackReason: "insufficient_review_lead"
    };
  }

  return {
    postType: "schedule",
    publishMs: args.effectiveMs,
    usedScheduleFallbackToDraft: false,
    scheduleFallbackReason: null
  };
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
  postType: PostizRootType;
  eventId?: string | null;
}): Promise<{ ok: boolean; status: number; body: unknown; requestPayload: Record<string, unknown> }> {
  const url = `${args.base.replace(/\/$/, "")}/posts`;
  const group = crypto.randomUUID();
  const dateIso = toUtcPostizDateIso(args.scheduledIso);
  const requestPayload: Record<string, unknown> = {
    type: args.postType,
    date: dateIso,
    shortLink: false,
    tags: postizTagsPayload(),
    posts: [
      {
        group,
        integration: { id: args.integrationId },
        value: [{ content: args.caption, image: [args.image] }],
        settings: postizSettings(args.platform, args.eventId)
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

async function createPostizPostMulti(args: {
  base: string;
  apiKey: string;
  targets: { platform: SocialPlatform; integrationId: string }[];
  scheduledIso: string;
  caption: string;
  image: PostizMedia;
  queueId: string;
  postType: PostizRootType;
  eventId?: string | null;
}): Promise<{ ok: boolean; status: number; body: unknown; requestPayload: Record<string, unknown> }> {
  const url = `${args.base.replace(/\/$/, "")}/posts`;
  const group = crypto.randomUUID();
  const dateIso = toUtcPostizDateIso(args.scheduledIso);
  const requestPayload: Record<string, unknown> = {
    type: args.postType,
    date: dateIso,
    shortLink: false,
    tags: postizTagsPayload(),
    posts: args.targets.map((target) => ({
      group,
      integration: { id: target.integrationId },
      value: [{ content: args.caption, image: [args.image] }],
      settings: postizSettings(target.platform, args.eventId)
    }))
  };

  slog("postiz_create_request_payload", {
    queue_id: args.queueId,
    endpoint: url,
    platforms: args.targets.map((t) => t.platform),
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

const CLAIMABLE_STATUSES = ["pending", "failed", "ready_for_postiz"] as const;

async function claimRow(supabase: SupabaseClient, rowId: string): Promise<QueueRow | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("social_queue")
    .update({ status: "processing", last_attempt_at: now, updated_at: now })
    .eq("id", rowId)
    .in("status", [...CLAIMABLE_STATUSES])
    .select("*")
    .maybeSingle();
  if (error) {
    slog("claim_failed", { rowId, message: error.message });
    return null;
  }
  return data as QueueRow | null;
}

function readAdminExtrasFromRow(row: QueueRow): { hashtags: string; cta_text: string } {
  const fromCols = {
    hashtags: String(row.hashtags || "").trim(),
    cta_text: String(row.cta_text || "").trim()
  };
  const pr = row.postiz_response;
  const meta =
    pr && typeof pr === "object" && pr._marcha_admin && typeof pr._marcha_admin === "object"
      ? (pr._marcha_admin as Record<string, unknown>)
      : null;
  if (meta) {
    if (!fromCols.hashtags && meta.hashtags) fromCols.hashtags = String(meta.hashtags).trim();
    if (!fromCols.cta_text && meta.cta_text) fromCols.cta_text = String(meta.cta_text).trim();
  }
  return fromCols;
}

/**
 * Convert a relative Supabase Storage path to a full public HTTPS URL.
 * Some events have image_url stored as a bare path (e.g. "2026/05/28/uuid.jpg")
 * instead of the full URL. isHttpsImageUrl() rejects relative paths, so they
 * would be silently skipped and the generic fallback used instead.
 *
 * Only rewrites non-HTTP strings; full HTTPS URLs and empty values pass through
 * unchanged. Strips a leading "event-images/" prefix if present.
 */
function normalizeSupabaseStorageImageUrl(raw: string | null | undefined): string {
  const t = String(raw || "").trim();
  if (!t || /^(https?|data):\/\//i.test(t)) return t;
  const base = (Deno.env.get("SUPABASE_URL") || "https://dwyhpirtbjfmohcnhdak.supabase.co").replace(/\/$/, "");
  const clean = t.replace(/^\/+/, "").replace(/^event-images\//, "");
  return `${base}/storage/v1/object/public/event-images/${clean}`;
}

/**
 * Extract the list of secondary event IDs stored in a collection post row.
 * Returns an empty array for non-collection rows or when the field is absent.
 */
function readCollectionEventIds(row: QueueRow): string[] {
  const pr = row.postiz_response;
  if (!pr || typeof pr !== "object") return [];
  const ids = pr._marcha_collection_event_ids;
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === "string" && Boolean(id));
}

/** Prefer admin-edited caption from Marcha when present. */
function buildCaptionForQueueRow(
  row: QueueRow,
  ev: EventRow,
  captionTemplate: CaptionTemplate,
  ctx: { eventStartMs: number; postAtMs: number; timeZone: string }
): { caption: string; template_id: string; source: "admin" | "template" } {
  const adminBody = String(row.caption || "").trim();
  if (adminBody.length >= 8) {
    const extras = readAdminExtrasFromRow(row);
    const parts = [adminBody];
    if (extras.hashtags) parts.push(extras.hashtags);
    if (extras.cta_text) parts.push(extras.cta_text);
    return { caption: parts.join("\n\n"), template_id: "admin", source: "admin" };
  }
  const built = buildCaption(captionTemplate, ev, ctx);
  return { caption: built.caption, template_id: built.template_id, source: "template" };
}

type RunnerAuthMode = "cron_secret" | "admin_jwt";

type RunnerAuthResult =
  | { ok: true; mode: RunnerAuthMode; email?: string }
  | { ok: false; status: number; error: string; reason: string };

function parseAdminEmailAllowlist(): string[] {
  const raw = Deno.env.get("MARCHA_ADMIN_ALLOWED_EMAILS") || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmailAllowed(email: string, allowlist: string[]): boolean {
  if (!allowlist.length) return true;
  const normalized = String(email || "").trim().toLowerCase();
  return Boolean(normalized) && allowlist.includes(normalized);
}

function bearerToken(req: Request): string {
  const authHeader = req.headers.get("Authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

async function resolveRunnerAuth(
  req: Request,
  body: { admin_handoff?: boolean; queue_id?: string },
  supabaseUrl: string,
  serviceKey: string
): Promise<RunnerAuthResult> {
  const queueId = body.queue_id ? String(body.queue_id) : null;
  const adminHandoff = Boolean(body.admin_handoff && queueId);
  const secret = Deno.env.get("MARCHA_SOCIAL_RUNNER_SECRET") || "";
  const hdr = req.headers.get("x-marcha-social-secret") || "";
  const secretOk = Boolean(secret && hdr === secret);

  if (secretOk) {
    slog("auth_ok", { auth_mode: "cron_secret", queue_id: queueId, user_email: null });
    return { ok: true, mode: "cron_secret" };
  }

  if (adminHandoff) {
    const token = bearerToken(req);
    if (!token) {
      slog("auth_rejected", {
        auth_mode: "admin_jwt",
        queue_id: queueId,
        user_email: null,
        reason: "missing_jwt"
      });
      return { ok: false, status: 401, error: "Admin session missing.", reason: "missing_jwt" };
    }

    const authClient = createClient(supabaseUrl, serviceKey);
    const { data, error } = await authClient.auth.getUser(token);
    const email = data.user?.email ? String(data.user.email) : "";
    if (error || !data.user) {
      slog("auth_rejected", {
        auth_mode: "admin_jwt",
        queue_id: queueId,
        user_email: email || null,
        reason: "invalid_jwt",
        message: error?.message ?? "no_user"
      });
      return { ok: false, status: 401, error: "Admin session missing.", reason: "invalid_jwt" };
    }

    const appRole = String(data.user.app_metadata?.role || "").toLowerCase();
    const userRole = String(data.user.user_metadata?.role || "").toLowerCase();
    const isAdmin = appRole === "admin" || userRole === "admin";
    if (!isAdmin) {
      slog("auth_rejected", {
        auth_mode: "admin_jwt",
        queue_id: queueId,
        user_email: email,
        reason: "not_admin_role"
      });
      return { ok: false, status: 403, error: "Admin not allowed.", reason: "not_admin_role" };
    }

    const allowlist = parseAdminEmailAllowlist();
    if (!isAdminEmailAllowed(email, allowlist)) {
      slog("auth_rejected", {
        auth_mode: "admin_jwt",
        queue_id: queueId,
        user_email: email,
        reason: "email_not_allowlisted"
      });
      return { ok: false, status: 403, error: "Admin not allowed.", reason: "email_not_allowlisted" };
    }

    slog("auth_ok", { auth_mode: "admin_jwt", queue_id: queueId, user_email: email });
    return { ok: true, mode: "admin_jwt", email };
  }

  if (!secret) {
    slog("auth_rejected", {
      auth_mode: "cron_secret",
      queue_id: queueId,
      user_email: null,
      reason: "secret_not_configured"
    });
    return {
      ok: false,
      status: 401,
      error: "Unauthorized or MARCHA_SOCIAL_RUNNER_SECRET not set",
      reason: "secret_not_configured"
    };
  }

  slog("auth_rejected", {
    auth_mode: "cron_secret",
    queue_id: queueId,
    user_email: null,
    reason: "invalid_or_missing_secret"
  });
  return { ok: false, status: 401, error: "Unauthorized", reason: "invalid_or_missing_secret" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let body: { queue_id?: string; limit?: number; admin_handoff?: boolean } = {};
  try {
    if (req.method === "POST" && req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    body = {};
  }

  const auth = await resolveRunnerAuth(req, body, supabaseUrl, serviceKey);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error, reason: auth.reason }), {
      status: auth.status,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  const adminHandoff = auth.mode === "admin_jwt";
  const postizBase = Deno.env.get("POSTIZ_API_BASE") || "https://api.postiz.com/public/v1";
  const postizKey = Deno.env.get("POSTIZ_API_KEY") || "";
  const intIg = Deno.env.get("POSTIZ_INSTAGRAM_INTEGRATION_ID") || "";
  const intFb = Deno.env.get("POSTIZ_FACEBOOK_INTEGRATION_ID") || "";
  const fallbackImage = Deno.env.get("MARCHA_DEFAULT_SOCIAL_IMAGE_URL") || DEFAULT_SOCIAL_FALLBACK_IMAGE;
  const eventTimeZone = Deno.env.get("MARCHA_EVENT_TIMEZONE") || "Europe/Berlin";
  const postizPostModeEnv = (Deno.env.get("MARCHA_POSTIZ_POST_MODE") || "draft").trim().toLowerCase();
  const postizPostMode = postizPostModeEnv === "schedule" ? "schedule" : "draft";
  const postizMinReviewHours = Number.parseFloat(Deno.env.get("MARCHA_POSTIZ_MIN_REVIEW_HOURS") || "72");
  const reviewWindowHoursParsed = Number.parseFloat(Deno.env.get("MARCHA_POSTIZ_REVIEW_WINDOW_HOURS") || "72");
  const reviewWindowHours = Number.isFinite(reviewWindowHoursParsed) && reviewWindowHoursParsed > 0 ? reviewWindowHoursParsed : 72;
  const reviewWindowMs = reviewWindowHours * 3600000;
  const eligibilityHorizonMs = Date.now() + reviewWindowMs;
  const eligibilityHorizonIso = new Date(eligibilityHorizonMs).toISOString();

  if (!postizKey) {
    slog("missing_postiz_api_key");
    return new Response(JSON.stringify({ error: "POSTIZ_API_KEY not configured" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const minReviewHoursEffective = Number.isFinite(postizMinReviewHours) ? postizMinReviewHours : 72;
  const backoffMs = 15 * 60 * 1000;
  const retryBefore = new Date(Date.now() - backoffMs).toISOString();

  slog("queue_eligibility_config", {
    review_window_hours: reviewWindowHours,
    eligibility_horizon_iso: eligibilityHorizonIso,
    postiz_mode: postizPostMode,
    postiz_mode_env: postizPostModeEnv || "draft",
    min_review_hours: minReviewHoursEffective,
    admin_handoff: adminHandoff,
    auth_mode: auth.mode,
    user_email: auth.mode === "admin_jwt" ? auth.email ?? null : null,
    queue_id: body.queue_id ?? null
  });

  const limit = Math.min(Math.max(Number(body.limit) || 8, 1), 25);
  const bypassReviewWindow = adminHandoff || Boolean(body.queue_id);

  let rows: QueueRow[] = [];
  let qErr: { message: string } | null = null;

  if (body.queue_id) {
    const { data, error } = await supabase
      .from("social_queue")
      .select("*")
      .eq("id", body.queue_id)
      .lt("retry_count", 5)
      .maybeSingle();
    if (error) qErr = error;
    else if (data) rows = [data as QueueRow];
  } else {
    const { data: readyRows, error: readyErr } = await supabase
      .from("social_queue")
      .select("*")
      .eq("status", "ready_for_postiz")
      .lt("retry_count", 5)
      .order("scheduled_at", { ascending: true })
      .limit(limit);
    if (readyErr) qErr = readyErr;
    const ready = (readyRows ?? []) as QueueRow[];
    const remaining = Math.max(0, limit - ready.length);
    let windowed: QueueRow[] = [];
    if (remaining > 0) {
      const { data: windowRows, error: windowErr } = await supabase
        .from("social_queue")
        .select("*")
        .lte("scheduled_at", eligibilityHorizonIso)
        .lt("retry_count", 5)
        .or(
          `status.eq.pending,and(status.eq.failed,or(last_attempt_at.is.null,last_attempt_at.lt.${retryBefore}))`
        )
        .order("scheduled_at", { ascending: true })
        .limit(remaining);
      if (windowErr) qErr = windowErr;
      windowed = (windowRows ?? []) as QueueRow[];
    }
    rows = [...ready, ...windowed];
  }

  slog("queue_rows_selected", {
    count: rows.length,
    bypass_review_window: bypassReviewWindow,
    queue_ids: rows.map((r) => r.id)
  });
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
    // Collection-post detection — used for logging and image fallback warning below.
    const isCollectionPost = String(claimed.post_stage || "").trim() === "collection";
    const collectionEventIds = isCollectionPost ? readCollectionEventIds(claimed) : [];

    const integrationTargets = integrationTargetsForRow(claimed, intIg, intFb);
    if (!integrationTargets.length) {
      const msg = "Missing postiz_integration_id on row and env fallback";
      slog("no_integration", { queue_id: claimed.id, platforms: rowPlatforms(claimed) });
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
        "id,name,city,location_name,event_date,event_time,genre,status,featured,image_url,image_urls,recurrence_type,recurrence_start_date,recurrence_end_date,recurrence_weekday,recurrence_day_of_month"
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

    const claimedPlatforms = rowPlatforms(claimed);
    if (await hasQueueConflict(supabase, claimed.event_id, claimedPlatforms, claimed.id, claimed.scheduled_at)) {
      const msg = "duplicate_or_parallel_queue_same_day";
      slog("skip_duplicate", {
        queue_id: claimed.id,
        event_id: claimed.event_id,
        platforms: claimedPlatforms
      });
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
    const occ = resolveSocialEventOccurrence(ev, eventTimeZone, nowMs);
    if (!occ.ok) {
      const msg = `recurrence:${occ.reason}`;
      slog("recurrence_occurrence_unresolved", {
        queue_id: claimed.id,
        event_id: ev.id,
        recurrence_type: ev.recurrence_type ?? null,
        recurrence_start_date: ev.recurrence_start_date ?? null,
        recurrence_end_date: ev.recurrence_end_date ?? null,
        recurrence_weekday: ev.recurrence_weekday ?? null,
        recurrence_day_of_month: ev.recurrence_day_of_month ?? null,
        event_time: ev.event_time ?? null,
        timezone: eventTimeZone,
        reason: occ.reason
      });
      await supabase
        .from("social_queue")
        .update({
          status: "skipped",
          last_error: msg,
          updated_at: new Date().toISOString()
        })
        .eq("id", claimed.id);
      results.push({ queue_id: claimed.id, skipped: true, reason: occ.reason });
      continue;
    }

    const eventStartMs = occ.epochMs;
    slog("recurrence_occurrence_resolved", {
      queue_id: claimed.id,
      event_id: ev.id,
      recurrence_type: ev.recurrence_type ?? null,
      recurrence_start_date: ev.recurrence_start_date ?? null,
      recurrence_end_date: ev.recurrence_end_date ?? null,
      recurrence_weekday: ev.recurrence_weekday ?? null,
      recurrence_day_of_month: ev.recurrence_day_of_month ?? null,
      calculated_next_occurrence: occ.occurrenceYmd,
      event_time: ev.event_time ?? null,
      timezone: eventTimeZone,
      event_start_ms: eventStartMs
    });

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
    const isAdminConfirmed = Boolean(claimed.admin_confirmed_at) || claimed.status === "ready_for_postiz" || adminHandoff;
    const postizPlan = adminHandoff || isAdminConfirmed
      ? {
          postType: "draft" as PostizRootType,
          publishMs: scheduleResult.effectiveMs,
          usedScheduleFallbackToDraft: false,
          scheduleFallbackReason: null
        }
      : resolvePostizPublishPlan({
          effectiveMs: scheduleResult.effectiveMs,
          eventStartMs,
          nowMs,
          envModeRaw: "draft",
          minReviewHours: minReviewHoursEffective
        });
    const postizPublishIso = new Date(postizPlan.publishMs).toISOString();
    const eligibleForReview = Date.parse(claimed.scheduled_at) <= eligibilityHorizonMs;
    if (postizPlan.usedScheduleFallbackToDraft) {
      slog("postiz_schedule_fallback_draft", {
        queue_id: claimed.id,
        event_id: ev.id,
        reason: postizPlan.scheduleFallbackReason || "schedule_mode_unmet",
        postiz_mode: postizPostMode,
        min_review_hours: minReviewHoursEffective
      });
    }

    slog("schedule_resolved", {
      queue_id: claimed.id,
      event_id: ev.id,
      event_title: ev.name ?? "",
      queue_scheduled_at: claimed.scheduled_at,
      review_window_hours: reviewWindowHours,
      eligible_for_review: eligibleForReview,
      postiz_mode: postizPostMode,
      created_as_draft_or_schedule: postizPlan.postType,
      effective_post_at: effectivePostIso,
      postiz_root_type: postizPlan.postType,
      postiz_api_date_utc: postizPublishIso,
      event_start_iso: new Date(eventStartMs).toISOString(),
      calculated_next_occurrence: occ.occurrenceYmd,
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
      recurrence_end_date: ev.recurrence_end_date ?? null,
      recurrence_weekday: ev.recurrence_weekday ?? null,
      recurrence_day_of_month: ev.recurrence_day_of_month ?? null,
      calculated_next_occurrence: occ.occurrenceYmd,
      event_time_wall: ev.event_time ?? null,
      timezone: eventTimeZone
    });

    // Normalise relative Supabase Storage paths to full public URLs before
    // resolution — some event rows store a bare path (e.g. "2026/05/28/uuid.jpg")
    // instead of the full HTTPS URL, which isHttpsImageUrl() silently rejects.
    const evNormImageUrl = normalizeSupabaseStorageImageUrl(ev.image_url);
    const claimNormImageUrl = normalizeSupabaseStorageImageUrl(claimed.image_url);
    const claimNormResolvedUrl = normalizeSupabaseStorageImageUrl(claimed.resolved_image_url);

    const imageResolution = await resolveSocialPostImageReachable(
      {
        ...(claimed as unknown as Record<string, unknown>),
        image_url: claimNormImageUrl,
        resolved_image_url: claimNormResolvedUrl
      },
      {
        event: {
          ...(ev as unknown as Record<string, unknown>),
          image_url: evNormImageUrl
        },
        fallbackUrl: fallbackImage,
        fetchImpl: fetch
      }
    );

    logSocialImageResolution(slog, {
      eventId: ev.id,
      queueId: claimed.id,
      title: ev.name ?? null,
      selectedImage: imageResolution.selectedImage,
      source: imageResolution.source,
      fallbackUsed: imageResolution.fallbackUsed,
      candidates: imageResolution.candidates,
      retryAttempts: imageResolution.retryAttempts,
      originalImageUrl: ev.image_url ?? null,
      rawImageUrls: ev.image_urls
    });

    const finalImage = imageResolution.selectedImage;
    const imageLoggedSource = imageResolution.source;

    slog("event_image_selected", {
      queue_id: claimed.id,
      event_id: ev.id,
      selected_source_image_url: finalImage,
      selection_source: imageLoggedSource,
      using_generic_fallback: imageResolution.fallbackUsed,
      reachable: imageResolution.reachable ?? null,
      retry_attempts: imageResolution.retryAttempts ?? null,
      original_event_image_url: ev.image_url ?? null
    });

    // For collection posts: warn if the dedicated collection image is missing.
    // The existing resolution chain will still fall back to the best-event's image.
    if (isCollectionPost && !String(claimed.image_url || "").trim()) {
      slog("collection_image_url_missing", {
        queue_id: claimed.id,
        event_id: ev.id,
        collection_event_ids: collectionEventIds,
        fallback_active: true
      });
    }

    if (!isPostizUploadsHost(finalImage)) {
      await supabase
        .from("social_queue")
        .update({
          image_url: finalImage,
          resolved_image_url: finalImage,
          updated_at: new Date().toISOString()
        })
        .eq("id", claimed.id);
      claimed.image_url = finalImage;
      claimed.resolved_image_url = finalImage;
    }

    const storedPostizMediaId = readPostizMediaIdFromRow(claimed);
    const canReusePostizUpload =
      imageResolution.source === "queue.resolved_image_url" &&
      isPostizUploadsHost(finalImage) &&
      !imageResolution.fallbackUsed &&
      Boolean(storedPostizMediaId);

    let uploadResult: Awaited<ReturnType<typeof ensurePostizHostedMedia>>;
    if (canReusePostizUpload) {
      slog("event_image_reusing_resolved_postiz", {
        queue_id: claimed.id,
        event_id: ev.id,
        resolved_image_url: finalImage,
        postiz_media_id: storedPostizMediaId
      });
      uploadResult = {
        ok: true,
        media: { id: storedPostizMediaId!, path: finalImage },
        uploadPerformed: false
      };
    } else {
      uploadResult = await ensurePostizHostedMedia({
        apiBase: postizBase,
        apiKey: postizKey,
        queueId: claimed.id,
        sourceUrl: finalImage
      });
    }

    if (!uploadResult.ok) {
      const errText =
        typeof uploadResult.body === "string"
          ? uploadResult.body
          : uploadResult.body !== undefined
            ? JSON.stringify(uploadResult.body)
            : uploadResult.error;
      slog("post_aborted_after_upload_failure", { queue_id: claimed.id, error: uploadResult.error });
      const uploadFailureUpdate: Record<string, unknown> = {
        status: "failed",
        last_error: `postiz_upload:${uploadResult.error}:${String(errText).slice(0, 400)}`,
        retry_count: claimed.retry_count + 1,
        updated_at: new Date().toISOString()
      };
      if (claimed.resolved_image_url && !isPostizUploadsHost(claimed.resolved_image_url)) {
        uploadFailureUpdate.resolved_image_url = null;
      }
      await supabase
        .from("social_queue")
        .update(uploadFailureUpdate)
        .eq("id", claimed.id);
      results.push({ queue_id: claimed.id, ok: false, phase: "upload", error: uploadResult.error });
      continue;
    }

    const publishMedia = uploadResult.media;
    const resolvedPostizUrl = publishMedia.path;

    await persistUploadedImageUrl(supabase, claimed.id, resolvedPostizUrl);

    slog("event_image_postiz_uploaded", {
      queue_id: claimed.id,
      event_id: ev.id,
      uploaded_postiz_image_url: resolvedPostizUrl,
      postiz_media_id: publishMedia.id
    });

    if (String(claimed.resolved_image_url || "").trim() !== resolvedPostizUrl) {
      const { error: resolvedImageErr } = await supabase
        .from("social_queue")
        .update({ resolved_image_url: resolvedPostizUrl, updated_at: new Date().toISOString() })
        .eq("id", claimed.id);
      if (resolvedImageErr) {
        slog("postiz_upload_resolved_image_update_failed", {
          queue_id: claimed.id,
          error: resolvedImageErr.message
        });
      } else {
        slog("postiz_upload_resolved_image_persisted", {
          queue_id: claimed.id,
          resolved_image_url: resolvedPostizUrl
        });
      }
    }

    const captionStage = captionStageForPost(eventStartMs, scheduleResult.effectiveMs, eventTimeZone);
    const captionTemplate = await pickCaptionTemplate(supabase, claimed.event_id, captionStage);
    const captionBuilt = buildCaptionForQueueRow(claimed, ev, captionTemplate, {
      eventStartMs,
      postAtMs: scheduleResult.effectiveMs,
      timeZone: eventTimeZone
    });
    const { caption, template_id } = captionBuilt;

    slog("post_prepare", {
      queue_id: claimed.id,
      event_id: claimed.event_id,
      event_title: ev.name ?? "",
      post_stage: claimed.post_stage ?? null,
      is_collection_post: isCollectionPost,
      collection_event_count: isCollectionPost ? collectionEventIds.length + 1 : null,
      platforms: claimedPlatforms,
      queue_scheduled_at: claimed.scheduled_at,
      review_window_hours: reviewWindowHours,
      eligible_for_review: eligibleForReview,
      postiz_mode: postizPostMode,
      created_as_draft_or_schedule: postizPlan.postType,
      effective_post_at: effectivePostIso,
      postiz_root_type: postizPlan.postType,
      postiz_api_date_utc: postizPublishIso,
      source_image_url: finalImage,
      image_source: imageLoggedSource,
      postiz_media_id: publishMedia.id,
      postiz_image_path: resolvedPostizUrl,
      postiz_upload_performed: uploadResult.uploadPerformed,
      caption_stage: captionStage,
      caption_preview: caption.slice(0, 120),
      caption_template_id: template_id,
      caption_source: captionBuilt.source,
      admin_confirmed: isAdminConfirmed,
      postiz_integration_ids: integrationTargets.map((t) => t.integrationId)
    });

    const postizRes =
      integrationTargets.length === 1
        ? await createPostizPost({
            base: postizBase,
            apiKey: postizKey,
            integrationId: integrationTargets[0].integrationId,
            platform: integrationTargets[0].platform,
            scheduledIso: postizPublishIso,
            postType: postizPlan.postType,
            caption,
            image: publishMedia,
            queueId: claimed.id,
            eventId: ev.id
          })
        : await createPostizPostMulti({
            base: postizBase,
            apiKey: postizKey,
            targets: integrationTargets,
            scheduledIso: postizPublishIso,
            postType: postizPlan.postType,
            caption,
            image: publishMedia,
            queueId: claimed.id,
            eventId: ev.id
          });

    slog("postiz_create_response_body", {
      queue_id: claimed.id,
      platforms: claimedPlatforms,
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

    const handoffMessage = "An Postiz übergeben – wartet auf Freigabe.";
    const mergedSuccessResponse =
      typeof postizRes.body === "object" && postizRes.body !== null
        ? {
            ...(postizRes.body as object),
            _marcha_postiz_post_ids: createdPostIds,
            _marcha_platforms: claimedPlatforms,
            _marcha_source_image_url: finalImage,
            postiz_media_id: publishMedia.id,
            _marcha_handoff_message: handoffMessage,
            _marcha_postiz_mode: "draft"
          }
        : {
            raw: postizRes.body,
            _marcha_postiz_post_ids: createdPostIds,
            _marcha_platforms: claimedPlatforms,
            _marcha_source_image_url: finalImage,
            postiz_media_id: publishMedia.id,
            _marcha_handoff_message: handoffMessage,
            _marcha_postiz_mode: "draft"
          };

    if (captionBuilt.source === "template") {
      for (const platform of claimedPlatforms) {
        await supabase.from("social_caption_usage").insert({
          event_id: claimed.event_id,
          template_id,
          caption,
          platform
        });
      }
    }

    const primaryPostId = createdPostIds[0] ?? null;
    const rowImageUrl = isPostizUploadsHost(finalImage)
      ? String(claimed.image_url || "").trim() || finalImage
      : finalImage;

    const successPatch: Record<string, unknown> = {
      status: "sent_to_postiz",
      image_url: rowImageUrl,
      resolved_image_url: resolvedPostizUrl,
      caption,
      caption_template_id: template_id,
      postiz_response: mergedSuccessResponse,
      postiz_post_id: primaryPostId,
      postiz_synced_at: now,
      last_error: null,
      posted_at: now,
      updated_at: now
    };

    await supabase.from("social_queue").update(successPatch).eq("id", claimed.id);

    slog("postiz_create_ok", {
      queue_id: claimed.id,
      event_id: ev.id,
      post_stage: claimed.post_stage ?? null,
      collection_event_count: isCollectionPost ? collectionEventIds.length + 1 : null,
      queue_scheduled_at: claimed.scheduled_at,
      review_window_hours: reviewWindowHours,
      eligible_for_review: eligibleForReview,
      bypass_review_window: bypassReviewWindow,
      postiz_mode: "draft",
      created_as_draft_or_schedule: postizPlan.postType,
      postiz_post_ids: createdPostIds,
      postiz_post_id: primaryPostId,
      marcha_status: "sent_to_postiz",
      handoff_message: handoffMessage
    });

    results.push({
      queue_id: claimed.id,
      ok: true,
      marcha_status: "sent_to_postiz",
      handoff_message: handoffMessage,
      postiz_post_ids: createdPostIds,
      postiz_post_id: primaryPostId,
      source_image_url: finalImage,
      postiz_image_url: resolvedPostizUrl,
      image_source: imageLoggedSource,
      caption_template_id: template_id,
      postiz_status: postizRes.status,
      postiz_mode: "draft",
      created_as_draft_or_schedule: postizPlan.postType
    });
  }

  return new Response(
    JSON.stringify({
      processed: results.length,
      review_window_hours: reviewWindowHours,
      eligibility_horizon_iso: eligibilityHorizonIso,
      postiz_mode: postizPostMode,
      min_review_hours: minReviewHoursEffective,
      results
    }),
    {
      headers: { ...CORS, "Content-Type": "application/json" }
    }
  );
});
