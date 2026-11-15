import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { CaptionFacts, Stage, writeCaption, spanishShortDate } from "./caption-ai.ts";

/**
 * social-caption-ai — KI-Captions (Probebetrieb, 13.11.2026)
 *
 * mode "test": erzeugt für die nächsten N kommenden Termine je eine alte (Vorlage) und eine
 * neue (Claude) Caption zum Vergleich. Schreibt NICHTS in die Datenbank und nichts an Postiz.
 * Zugriff nur mit Header x-marcha-social-secret (= MARCHA_SOCIAL_RUNNER_SECRET, liegt im Vault).
 *
 * mode "queue" (Konzept v2, 15.11.2026): schreibt die KI-Caption direkt in offene Entwürfe der
 * social_queue (nur Einzel-Posts, keine Sammel-Posts), damit Frank im Admin genau den Text sieht,
 * der veröffentlicht wird. caption_template_id = "ai:<prompt-version>" → der Runner übernimmt ihn
 * unverändert. Zugriff: angemeldeter Admin (app_metadata.role = 'admin') ODER Runner-Secret.
 * Body: { mode: "queue", queue_ids?: string[] } – ohne queue_ids: offene Einzel-Entwürfe der
 * nächsten 14 Tage ohne KI-Text (max. 10 pro Aufruf).
 * Secrets: ANTHROPIC_API_KEY, MARCHA_SOCIAL_RUNNER_SECRET. Standard: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

const TZ = "Europe/Madrid";
const STAGES: Stage[] = ["week", "one_day", "today", "three_days"];
const OLD_TEMPLATES: Record<Stage, string[]> = {
  week: ["Apúntalo con calma: {w}.", "Plan a la vista en la Costa: {w}.", "Queda una semana para este directo: {w}."],
  three_days: ["Quedan tres días. {w} ya está cerca.", "Si buscas plan esta semana: {w}.", "Tres días y suena el plan: {w}."],
  one_day: ["Mañana hay música en vivo: {w}.", "Última noche para organizarte: {w}.", "Mañana toca salir un rato: {w}."],
  today: ["Final call para hoy: {w}.", "Hoy es el día. {w}.", "Si te apetece directo hoy, mira esto: {w}."],
};
const WEEKDAYS_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// deno-lint-ignore no-explicit-any
function nextOccurrence(ev: any, from: string): string | null {
  const type = String(ev.recurrence_type || "").toLowerCase();
  if (ev.is_recurring && type === "weekly" && ev.recurrence_weekday !== null && ev.recurrence_weekday !== undefined) {
    for (let i = 0; i < 7; i++) {
      const d = addDays(from, i);
      if (new Date(`${d}T12:00:00Z`).getUTCDay() === Number(ev.recurrence_weekday)) return d;
    }
  }
  if (ev.is_recurring && type === "monthly" && ev.recurrence_day_of_month) {
    for (let i = 0; i < 62; i++) {
      const d = addDays(from, i);
      if (Number(d.slice(8, 10)) === Number(ev.recurrence_day_of_month)) return d;
    }
  }
  const date = String(ev.event_date || "");
  return date && date >= from ? date : null;
}

function isFreePrice(price: unknown): boolean {
  return /^\s*(0([.,]0+)?\s*(eur|€|euros?)?|gratis|free|entrada libre|eintritt frei)\s*$/i.test(String(price ?? ""));
}

function cleanDescription(text: string): string {
  return text.replace(/\*\*/g, "").replace(/\s+\n/g, "\n").trim().slice(0, 700);
}

// deno-lint-ignore no-explicit-any
function oldCaption(ev: any, facts: CaptionFacts, idx: number): string {
  const w = `${facts.title}${facts.city ? ` · ${facts.city}` : ""}`;
  const tpl = OLD_TEMPLATES[facts.stage][idx % 3].replace("{w}", w);
  const d = new Date(`${facts.dateIso}T12:00:00Z`);
  const dateLine = `${WEEKDAYS_LONG[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS_LONG[d.getUTCMonth()]}${facts.time ? ` · ${facts.time}` : ""}`;
  const city = String(ev.city || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");
  return `${tpl}\n\n${dateLine}\n\n#músicaenvivo #CostaDelSol #directo #${city || "Andalucía"} #gomarcha`;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-marcha-social-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonCors(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });
}

/** true, wenn der Bearer-Token einem Admin gehört (Rechte nur über app_metadata, nie user_metadata). */
async function isAdminRequest(req: Request, base: string): Promise<boolean> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!token || token.split(".").length !== 3 || !base || !anon) return false;
  const res = await fetch(`${base}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  const user = await res.json().catch(() => null);
  return user?.app_metadata?.role === "admin";
}

/** Abstand Post → Termin in Tagen → Stufe der KI-Anweisung. */
function stageForDays(days: number): Stage {
  if (days <= 0) return "today";
  if (days === 1) return "one_day";
  if (days <= 4) return "three_days";
  return "week";
}

function madridIso(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

// deno-lint-ignore no-explicit-any
async function runQueueMode(body: any, apiKey: string, base: string, service: string): Promise<Response> {
  const headers = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
  const cols = "id,event_id,scheduled_at,event_date,post_stage,status,caption_template_id,postiz_response";
  const ids: string[] = Array.isArray(body?.queue_ids) ? body.queue_ids.map(String).filter((x: string) => /^[0-9a-f-]{36}$/i.test(x)) : [];
  let url: string;
  if (ids.length) {
    url = `${base}/rest/v1/social_queue?select=${cols}&id=in.(${ids.slice(0, 10).join(",")})`;
  } else {
    const now = new Date();
    const until = new Date(now.getTime() + 14 * 86400000);
    url = `${base}/rest/v1/social_queue?select=${cols}&status=eq.pending&caption_template_id=is.null` +
      `&scheduled_at=gte.${now.toISOString()}&scheduled_at=lt.${until.toISOString()}&order=scheduled_at.asc&limit=10`;
  }
  const qRes = await fetch(url, { headers });
  if (!qRes.ok) return jsonCors({ error: `social_queue ${qRes.status}` }, 500);
  // deno-lint-ignore no-explicit-any
  const rows = ((await qRes.json()) as any[]).filter((r) =>
    String(r.status || "") === "pending" && String(r.post_stage || "") !== "collection" &&
    String(r.caption_template_id || "") !== "manual"
  );

  const evCols = "id,name,title_es,location_name,city,event_date,event_time,genre,artist_name,price_text,description,description_es,is_recurring,recurrence_type,organizers(instagram)";
  const results = [];
  for (const row of rows) {
    try {
      const evRes = await fetch(`${base}/rest/v1/events?select=${evCols}&id=eq.${encodeURIComponent(String(row.event_id))}`, { headers });
      const ev = evRes.ok ? (await evRes.json())[0] : null;
      if (!ev) { results.push({ queue_id: row.id, ok: false, problem: "event_not_found" }); continue; }
      const dateIso = String(row.event_date || ev.event_date || "");
      const postIso = madridIso(new Date(row.scheduled_at));
      const days = Math.round((Date.parse(`${dateIso}T12:00:00Z`) - Date.parse(`${postIso}T12:00:00Z`)) / 86400000);
      const prevRes = await fetch(
        `${base}/rest/v1/social_queue?select=caption&event_id=eq.${encodeURIComponent(String(row.event_id))}&caption_template_id=like.ai:*&order=updated_at.desc&limit=6`,
        { headers },
      );
      // deno-lint-ignore no-explicit-any
      const prev = prevRes.ok ? ((await prevRes.json()) as any[]).map((r) => String(r.caption || "")).filter(Boolean) : [];
      const handle = String(ev.organizers?.instagram || "").trim();
      const facts: CaptionFacts = {
        title: String(ev.title_es || ev.name || "").trim(),
        venue: String(ev.location_name || "").trim(),
        city: String(ev.city || "").trim(),
        dateIso,
        time: ev.event_time ? String(ev.event_time).slice(0, 5) : null,
        isFree: isFreePrice(ev.price_text),
        priceText: isFreePrice(ev.price_text) ? null : (ev.price_text ? String(ev.price_text) : null),
        genres: String(ev.genre || "").split(/[,/]/).map((g: string) => g.trim()).filter(Boolean),
        artists: ev.artist_name ? [String(ev.artist_name).trim()] : [],
        description: cleanDescription(String(ev.description_es || ev.description || "")),
        isSeries: Boolean(ev.is_recurring) || ["weekly", "monthly"].includes(String(ev.recurrence_type || "").toLowerCase()),
        stage: stageForDays(days),
        venueHandle: handle ? (handle.startsWith("@") ? handle : `@${handle}`) : null,
        previousCaptions: prev,
      };
      const ai = await writeCaption(facts, apiKey);
      if (!ai.caption) { results.push({ queue_id: row.id, ok: false, problems: ai.problems }); continue; }
      // KI-Caption enthält Hashtags/CTA bereits → Admin-Extras leeren, sonst hängt der Runner sie doppelt an.
      const pr = (row.postiz_response && typeof row.postiz_response === "object") ? row.postiz_response : {};
      const adminExtras = { ...(pr._marcha_admin || {}), hashtags: "", cta_text: "" };
      const upd = await fetch(`${base}/rest/v1/social_queue?id=eq.${row.id}&status=eq.pending`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({
          caption: ai.caption,
          caption_template_id: `ai:${ai.promptVersion}`,
          hashtags: null,
          cta_text: null,
          postiz_response: { ...pr, _marcha_admin: adminExtras, _marcha_ai: { model: ai.model, prompt_version: ai.promptVersion, stage: facts.stage } },
          updated_at: new Date().toISOString(),
        }),
      });
      results.push({ queue_id: row.id, ok: upd.ok, attempts: ai.attempts });
    } catch (err) {
      results.push({ queue_id: row.id, ok: false, problem: String((err as Error)?.message || err) });
    }
  }
  console.log(JSON.stringify({ fn: "social-caption-ai", event: "queue_run", rows: rows.length, ok: results.filter((r) => r.ok).length }));
  return jsonCors({ results });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return jsonCors({ error: "Method not allowed" }, 405);
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || "";
  const base = Deno.env.get("SUPABASE_URL") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!apiKey || !base || !service) return jsonCors({ error: "Missing configuration" }, 500);

  const secret = Deno.env.get("MARCHA_SOCIAL_RUNNER_SECRET") || "";
  const hasSecret = Boolean(secret) && (req.headers.get("x-marcha-social-secret") || "") === secret;
  const body = await req.json().catch(() => ({}));
  const mode = String(body?.mode || "test");

  if (mode === "queue") {
    if (!hasSecret && !(await isAdminRequest(req, base))) return jsonCors({ error: "Unauthorized" }, 401);
    return runQueueMode(body, apiKey, base, service);
  }
  if (!hasSecret) return jsonCors({ error: "Unauthorized" }, 401);
  const count = Math.min(Math.max(Number(body?.count) || 10, 1), 12);
  if (mode !== "test") return jsonCors({ error: "Unknown mode" }, 400);

  const cols = "id,name,title_es,location_name,city,event_date,event_time,genre,artist_name,price_text,description,description_es,is_recurring,recurrence_type,recurrence_weekday,recurrence_day_of_month,organizers(instagram)";
  const res = await fetch(`${base}/rest/v1/events?select=${cols}&status=eq.approved&archived_at=is.null`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  if (!res.ok) return json({ error: `events ${res.status}` }, 500);
  // deno-lint-ignore no-explicit-any
  const events: any[] = await res.json();

  const today = todayIso();
  const horizon = addDays(today, 60);
  // Testpaare: pro kommendem Event mehrere Zeitpunkte (Termin passend zum Abstand gewählt)
  const OFFSET: Record<Stage, number> = { week: 6, three_days: 3, one_day: 1, today: 0 };
  const candidates = events.filter((ev) => nextOccurrence(ev, today) && String(nextOccurrence(ev, today)) <= horizon);
  const upcoming: { ev: any; date: string; stage: Stage }[] = [];
  for (let round = 0; upcoming.length < count && round < STAGES.length; round++) {
    candidates.forEach((ev, idx) => {
      if (upcoming.length >= count) return;
      const stage = STAGES[(idx + round) % STAGES.length];
      const date = nextOccurrence(ev, addDays(today, OFFSET[stage]));
      if (date && date <= horizon) upcoming.push({ ev, date, stage });
    });
  }

  const results = await Promise.all(upcoming.map(async ({ ev, date, stage }, i) => {
    const handle = String(ev.organizers?.instagram || "").trim();
    const facts: CaptionFacts = {
      title: String(ev.title_es || ev.name || "").trim(),
      venue: String(ev.location_name || "").trim(),
      city: String(ev.city || "").trim(),
      dateIso: String(date),
      time: ev.event_time ? String(ev.event_time).slice(0, 5) : null,
      isFree: isFreePrice(ev.price_text),
      priceText: isFreePrice(ev.price_text) ? null : (ev.price_text ? String(ev.price_text) : null),
      genres: String(ev.genre || "").split(/[,/]/).map((g) => g.trim()).filter(Boolean),
      artists: ev.artist_name ? [String(ev.artist_name).trim()] : [],
      description: cleanDescription(String(ev.description_es || ev.description || "")),
      isSeries: Boolean(ev.is_recurring),
      stage,
      venueHandle: handle ? (handle.startsWith("@") ? handle : `@${handle}`) : null,
      previousCaptions: [],
    };
    let ai = null;
    try {
      ai = await writeCaption(facts, apiKey);
    } catch (err) {
      ai = { caption: null, attempts: 0, problems: [String((err as Error)?.message || err)], model: "", promptVersion: "" };
    }
    return {
      event_id: ev.id, title: facts.title, date: facts.dateIso, short_date: spanishShortDate(facts.dateIso),
      stage: facts.stage, old: oldCaption(ev, facts, i), new: ai.caption, attempts: ai.attempts, problems: ai.problems,
      model: ai.model, prompt_version: ai.promptVersion,
    };
  }));

  console.log(JSON.stringify({ fn: "social-caption-ai", event: "test_run", count: results.length, failed: results.filter((r) => !r.new).length }));
  return json({ today, results });
});
