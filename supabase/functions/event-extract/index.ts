import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

/**
 * event-extract — KI-Schnelleintrag (13.11.2026)
 *
 * Liest einen Flyer (Bild) und/oder einen Text (z. B. Instagram-Post) und gibt die Event-Felder
 * als Vorschlag zurück. Schreibt KEIN Event – gespeichert wird erst nach Prüfung durch den Menschen.
 * Zugriff und Tageslimits (Tabelle ai_usage, SQL #26):
 *   - Admin (app_metadata.role = 'admin'): unbegrenzt
 *   - Veranstalter-Konto (Eintrag in organizers, nicht gesperrt): 20 pro Tag
 *   - ohne Konto: nur von gomarcha.com / Testumgebung aus, 5 pro Tag pro Anschluss (IP nur als Hash), 100 pro Tag gesamt
 * Secrets: ANTHROPIC_API_KEY. Standard: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 */

const MODEL = "claude-sonnet-5-5";
const TZ = "Europe/Madrid";
const MAX_TEXT = 8000;
const MAX_IMAGE_B64 = 7_000_000; // ~5 MB Bild
const LIMIT_ORGANIZER = 20;
const LIMIT_ANON_PER_IP = 5;
const LIMIT_ANON_TOTAL = 100;
const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.)?gomarcha\.com$/i,
  /^https:\/\/[a-z0-9-]+\.gomarcha-test\.pages\.dev$/i,
  /^https:\/\/gomarcha-test\.pages\.dev$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

const S = (desc: string) => ({ type: "string", description: `${desc} (cadena vacía "" si no aparece)` });
const SCHEMA = {
  type: "object",
  properties: {
    name: S("Nombre del evento tal como aparece (sin inventar)"),
    event_date: S("Fecha YYYY-MM-DD de la próxima edición; null si no aparece"),
    event_time: S("Hora de inicio HH:MM (24 h); null si no aparece"),
    end_time: S("Hora de fin HH:MM; null si no aparece"),
    location_name: S("Nombre del local"),
    address: S("Dirección si aparece"),
    postal_code: S("Código postal si aparece"),
    city: S("Localidad"),
    price_text: S("Precio tal cual, p. ej. '10 €'; null si gratis o no aparece"),
    is_free: { type: ["boolean", "null"], description: "true si dice gratis / entrada libre / free; null si no se sabe" },
    genre: S("Estilos de música separados por comas"),
    artist_name: S("Artistas/bandas/DJs exactamente como aparecen, separados por comas"),
    is_weekly: { type: "boolean", description: "true si es semanal (p. ej. 'cada viernes', 'todos los sábados')" },
    weekday: { type: ["integer", "null"], description: "Día de la semana para eventos semanales: 0=domingo … 6=sábado" },
    description_es: S("2–4 frases en español de España, naturales, solo con datos de la fuente"),
    description_en: S("Same in British English"),
    description_de: S("Dasselbe auf Deutsch (du-Form)"),
    uncertain: { type: "array", items: { type: "string" }, description: "Campos dudosos o ilegibles (nombres de campo)" },
    notes: S("Observaciones breves para el administrador (p. ej. 'año no visible')"),
  },
  required: ["name", "event_date", "event_time", "end_time", "location_name", "address", "postal_code", "city", "price_text", "is_free",
    "genre", "artist_name", "is_weekly", "weekday", "description_es", "description_en", "description_de", "uncertain", "notes"],
  additionalProperties: false,
};

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function todayInfo(): { iso: string; weekday: string } {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return { iso, weekday: WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()] };
}

const SYSTEM = `Extraes los datos de un evento (música en directo, fiesta, tardeo…) en la Costa del Sol a partir de un cartel/flyer y/o un texto (p. ej. un post de Instagram) para la app Marcha.

Reglas:
- Usa SOLO lo que aparece en el cartel o en el texto. Si algo no aparece o no se lee bien, deja el campo como cadena vacía "" (o null en is_free/weekday) y añade el campo a "uncertain". Nunca inventes horas, precios, artistas ni fechas.
- Fechas: si falta el año, usa la próxima fecha futura a partir de hoy. Si el cartel dice solo un día de la semana ("este viernes"), calcula la próxima fecha con ese día. Comprueba que el día de la semana coincide con la fecha; si no coincide, prioriza la fecha escrita y anótalo en "notes".
- Eventos semanales ("cada viernes", "todos los sábados"): is_weekly = true, weekday = día (0=domingo … 6=sábado) y event_date = la próxima edición.
- Horas en formato 24 h (HH:MM). "9 pm" → "21:00".
- Precio: "gratis", "entrada libre", "free" → is_free = true y price_text = null.
- Nombres de artistas, locales y eventos: escríbelos exactamente como aparecen (respeta mayúsculas y apóstrofos).
- Descripciones (es/en/de): 2–4 frases naturales, como una persona de la zona; solo hechos de la fuente; sin superlativos ni "no te lo pierdas"; en español "en directo" (nunca "en vivo"), en alemán con "du". Sin hashtags. Máx. 2 emojis.
- Si hay varios eventos en el cartel, toma el principal y menciónalo en "notes".`;

type Caller = { audience: "admin" | "organizer" | "anon"; subject: string };

function serviceHeaders(): Record<string, string> {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Wer ruft auf? null = nicht erlaubt. */
async function identify(req: Request): Promise<Caller | null> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const base = Deno.env.get("SUPABASE_URL") || "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (token && token.split(".").length === 3 && base) {
    const res = await fetch(`${base}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const user = await res.json();
      if (user?.app_metadata?.role === "admin") return { audience: "admin", subject: String(user.id) };
      const org = await fetch(`${base}/rest/v1/organizers?id=eq.${encodeURIComponent(user.id)}&select=status`, { headers: serviceHeaders() });
      const rows = org.ok ? await org.json() : [];
      if (Array.isArray(rows) && rows[0] && rows[0].status !== "blocked") return { audience: "organizer", subject: String(user.id) };
    }
  }
  const origin = req.headers.get("origin") || "";
  if (!ALLOWED_ORIGINS.some((re) => re.test(origin))) return null;
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const salt = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").slice(-24);
  return { audience: "anon", subject: `ip:${(await sha256(`${salt}:${ip}`)).slice(0, 32)}` };
}

async function countSince(filter: string): Promise<number> {
  const base = Deno.env.get("SUPABASE_URL") || "";
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const res = await fetch(`${base}/rest/v1/ai_usage?select=id&feature=eq.event-extract&ok=eq.true&created_at=gte.${encodeURIComponent(since)}&${filter}`, {
    headers: { ...serviceHeaders(), Prefer: "count=exact", Range: "0-0" },
  });
  const range = res.headers.get("content-range") || "";
  return Number(range.split("/")[1] || 0);
}

/** Liefert eine Fehlermeldung, wenn das Tageslimit erreicht ist. */
async function overLimit(c: Caller): Promise<string | null> {
  if (c.audience === "admin") return null;
  if (c.audience === "organizer") {
    return (await countSince(`subject=eq.${encodeURIComponent(c.subject)}`)) >= LIMIT_ORGANIZER
      ? `Tageslimit erreicht (${LIMIT_ORGANIZER} pro Tag). Bitte morgen wieder oder Felder von Hand ausfüllen.` : null;
  }
  if ((await countSince(`subject=eq.${encodeURIComponent(c.subject)}`)) >= LIMIT_ANON_PER_IP) {
    return `Tageslimit erreicht (${LIMIT_ANON_PER_IP} pro Tag). Mit einem kostenlosen Veranstalter-Konto geht mehr.`;
  }
  if ((await countSince("audience=eq.anon")) >= LIMIT_ANON_TOTAL) {
    return "Die KI-Hilfe ist für heute ausgelastet. Bitte die Felder von Hand ausfüllen.";
  }
  return null;
}

async function recordUsage(c: Caller, ok: boolean): Promise<void> {
  const base = Deno.env.get("SUPABASE_URL") || "";
  await fetch(`${base}/rest/v1/ai_usage`, {
    method: "POST",
    headers: { ...serviceHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({ feature: "event-extract", audience: c.audience, subject: c.subject, ok }),
  }).catch(() => {});
}

function cleanTime(v: unknown): string | null {
  const m = String(v ?? "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h < 24 && min < 60 ? `${String(h).padStart(2, "0")}:${m[2]}` : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const caller = await identify(req);
  if (!caller) return json({ error: "Nicht erlaubt" }, 403);
  const limitMessage = await overLimit(caller);
  if (limitMessage) return json({ error: limitMessage, limit: true }, 429);
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || "";
  if (!apiKey) return json({ error: "ANTHROPIC_API_KEY fehlt" }, 500);

  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "").trim().slice(0, MAX_TEXT);
  const imageData = String(body?.image?.data ?? "");
  const mediaType = String(body?.image?.media_type ?? "image/jpeg");
  if (!text && !imageData) return json({ error: "Bitte Text oder Bild schicken" }, 400);
  if (imageData.length > MAX_IMAGE_B64) return json({ error: "Bild zu groß" }, 413);
  if (imageData && !/^image\/(jpeg|png|webp|gif)$/.test(mediaType)) return json({ error: "Bildformat nicht unterstützt" }, 415);

  const today = todayInfo();
  // deno-lint-ignore no-explicit-any
  const content: any[] = [];
  if (imageData) content.push({ type: "image", source: { type: "base64", media_type: mediaType, data: imageData } });
  content.push({
    type: "text",
    text: `Hoy es ${today.weekday} ${today.iso} (zona horaria ${TZ}).\n\n${text ? `Texto:\n${text}` : "Solo hay cartel (imagen)."}`,
  });

  try {
    const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 90_000 });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 6000,
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });
    if (response.stop_reason === "refusal") return json({ error: "Die KI hat die Anfrage abgelehnt." }, 422);
    const raw = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
    const data = JSON.parse(raw);
    for (const [k, v] of Object.entries(data)) if (v === "") data[k] = null;
    // Plausibilität
    if (data.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.event_date)) { data.event_date = null; data.uncertain = [...(data.uncertain || []), "event_date"]; }
    data.event_time = cleanTime(data.event_time);
    data.end_time = cleanTime(data.end_time);
    if (data.weekday !== null && !(Number.isInteger(data.weekday) && data.weekday >= 0 && data.weekday <= 6)) data.weekday = null;
    if (data.event_date && data.event_date < today.iso) data.notes = `${data.notes ? data.notes + " · " : ""}Achtung: Datum liegt in der Vergangenheit.`;
    if (data.is_weekly && data.event_date && data.weekday !== null &&
        new Date(`${data.event_date}T12:00:00Z`).getUTCDay() !== data.weekday) {
      data.notes = `${data.notes ? data.notes + " · " : ""}Wochentag passt nicht zum Datum – bitte prüfen.`;
      data.uncertain = [...(data.uncertain || []), "event_date", "weekday"];
    }
    await recordUsage(caller, true);
    console.log(JSON.stringify({ fn: "event-extract", ok: true, audience: caller.audience, image: Boolean(imageData), textChars: text.length, uncertain: data.uncertain }));
    return json({ ok: true, today: today.iso, event: data, model: MODEL });
  } catch (err) {
    await recordUsage(caller, false);
    console.log(JSON.stringify({ fn: "event-extract", ok: false, audience: caller.audience, error: err instanceof Error ? err.message : String(err) }));
    return json({ error: "Auslesen fehlgeschlagen – bitte noch einmal versuchen.", detail: String(err instanceof Error ? err.message : err).slice(0, 300) }, 502);
  }
});
