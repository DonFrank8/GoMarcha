import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { CaptionFacts, Stage, writeCaption, spanishShortDate } from "./caption-ai.ts";

/**
 * social-caption-ai — KI-Captions (Probebetrieb, 13.11.2026)
 *
 * mode "test": erzeugt für die nächsten N kommenden Termine je eine alte (Vorlage) und eine
 * neue (Claude) Caption zum Vergleich. Schreibt NICHTS in die Datenbank und nichts an Postiz.
 *
 * Zugriff nur mit Header x-marcha-social-secret (= MARCHA_SOCIAL_RUNNER_SECRET, liegt im Vault;
 * Aufruf z. B. per pg_net aus der Datenbank).
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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = Deno.env.get("MARCHA_SOCIAL_RUNNER_SECRET") || "";
  if (!secret || (req.headers.get("x-marcha-social-secret") || "") !== secret) return json({ error: "Unauthorized" }, 401);
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || "";
  const base = Deno.env.get("SUPABASE_URL") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!apiKey || !base || !service) return json({ error: "Missing configuration" }, 500);

  const body = await req.json().catch(() => ({}));
  const mode = String(body?.mode || "test");
  const count = Math.min(Math.max(Number(body?.count) || 10, 1), 12);
  if (mode !== "test") return json({ error: "Only mode=test is available" }, 400);

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
