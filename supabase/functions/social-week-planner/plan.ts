/**
 * social-week-planner / plan.ts – reine Planungslogik (ohne Datenbank, ohne Deno-APIs).
 *
 * Portiert aus admin.js (WEEKLY_SCHEDULE_PLAN, buildWeeklyScheduleRows, buildCollectionPostCaption …)
 * mit den Beschlüssen des Rats vom 16.11.2026:
 *   - Sammelposts entstehen schon ab 1 Event und listen ALLE Events im Text (auch ohne Bild).
 *   - Highlights (Mi/Sa) sind redaktionell: nur Events mit Bild, Featured/Promoted zuerst.
 *   - Alle Zeiten werden in der Zeitzone der Events gerechnet (Standard Europe/Madrid), nie im Browser.
 * Testbar mit: node --experimental-strip-types supabase/functions/social-week-planner/plan.test.ts
 */

// deno-lint-ignore no-explicit-any
export type Ev = Record<string, any>;

export interface Occ {
  ev: Ev;
  id: string;            // Event-ID (bei Serien: Master-ID)
  ref: string;           // Kennung für collection_event_ids: id oder <id>::<YYYY-MM-DD> bei Serien
  ymd: string;           // Termin (YYYY-MM-DD)
  time: string;          // HH:MM (leer = 00:00)
  startMs: number;       // Beginn als Zeitstempel
  recurring: boolean;    // Serie → nur Sammelposts
  hasImage: boolean;
}

export interface SlotDef {
  id: string;
  weekday: number;       // 1 = Mo … 6 = Sa
  time: string;          // HH:MM
  type: "collection" | "single";
  days: number[];        // erlaubte Wochentage der Events (0 = So)
}

export const WEEKLY_SLOTS: SlotDef[] = [
  { id: "mon_collection", weekday: 1, time: "13:30", type: "collection", days: [1, 2, 3, 4] },
  { id: "wed_highlight", weekday: 3, time: "20:30", type: "single", days: [4, 5, 6, 0] },
  { id: "thu_collection", weekday: 4, time: "13:30", type: "collection", days: [5, 6, 0] },
  { id: "sat_highlight", weekday: 6, time: "12:00", type: "single", days: [6, 0] },
];

export interface SlotPlan {
  slot_id: string;
  slot_key: string;
  type: "collection" | "single";
  scheduled_at: string;  // ISO (UTC)
  main: Occ;
  members: Occ[];        // weitere Events (nur Sammelpost)
  title: string;
  caption: string;       // Instagram (ohne Hashtags)
  caption_fb: string;    // Facebook (nur Sammelpost; leer bei Einzelpost)
  hashtags: string;
  image_url: string;
}

// ── Datum & Zeitzone ────────────────────────────────────────────────────────────

export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Wochentag eines Datums (0 = So … 6 = Sa). */
export function weekdayOf(ymd: string): number {
  return new Date(`${ymd}T12:00:00Z`).getUTCDay();
}

/** Heutiges Datum in der Zeitzone. */
export function todayIn(tz: string, nowMs: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(nowMs));
}

/** Montag der Woche eines Datums. */
export function mondayOf(ymd: string): string {
  const wd = weekdayOf(ymd);
  return addDays(ymd, wd === 0 ? -6 : 1 - wd);
}

/** ISO-Woche wie Postgres to_char(…, 'IYYY-"W"IW'), z. B. 2026-W47. */
export function isoWeekKey(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  const wd = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - wd); // Donnerstag derselben Woche
  const year = d.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  const week = Math.floor(Math.floor((d.getTime() - jan1) / 86400000) / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function tzOffsetMs(tz: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value || 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Ortszeit (Datum + HH:MM in tz) → Zeitstempel. Richtig auch bei Sommer-/Winterzeit. */
export function wallToUtcMs(ymd: string, hhmm: string, tz: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const [hh, mm] = (hhmm || "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh || 0, mm || 0);
  let ms = guess - tzOffsetMs(tz, guess);
  ms = guess - tzOffsetMs(tz, ms); // zweiter Schritt für die Umstellungsnächte
  return ms;
}

export function cleanTime(v: unknown): string {
  const m = String(v ?? "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const h = Number(m[1]);
  return h < 24 && Number(m[2]) < 60 ? `${String(h).padStart(2, "0")}:${m[2]}` : "";
}

// ── Events der Woche (inkl. Serien) ───────────────────────────────────────────────

function validYmd(v: unknown): string {
  const s = String(v ?? "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

function hasHttpsImage(ev: Ev): boolean {
  return /^https:\/\//i.test(String(ev?.image_url || "").trim());
}

/**
 * Alle Termine einer Woche (Mo–So) aus freigegebenen Events.
 * Einzel-Events über event_date; Serien (weekly/monthly) nur über den Master-Datensatz.
 * Termine, die zum Zeitpunkt nowMs schon begonnen haben, fallen weg.
 */
export function occurrencesForWeek(events: Ev[], monday: string, nowMs: number, tz: string): Occ[] {
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const out: Occ[] = [];
  for (const ev of events || []) {
    if (String(ev?.status || "approved") !== "approved") continue;
    if (String(ev?.original_event_id || "").trim()) continue; // Kind-Datensätze alter Serien
    const time = cleanTime(ev?.event_time);
    const recurring = ev?.is_recurring === true;
    const push = (ymd: string) => {
      const startMs = wallToUtcMs(ymd, time || "00:00", tz);
      if (startMs <= nowMs) return;
      out.push({
        ev, id: String(ev.id), ref: recurring ? `${ev.id}::${ymd}` : String(ev.id),
        ymd, time, startMs, recurring, hasImage: hasHttpsImage(ev),
      });
    };
    if (!recurring) {
      const ymd = validYmd(ev?.event_date);
      if (ymd && days.includes(ymd)) push(ymd);
      continue;
    }
    if (ev?.recurring_social_opt_out === true) continue;
    const type = String(ev?.recurrence_type || "").toLowerCase();
    const start = validYmd(ev?.recurrence_start_date) || validYmd(ev?.event_date);
    const end = validYmd(ev?.recurrence_end_date);
    for (const ymd of days) {
      if (start && ymd < start) continue;
      if (end && ymd > end) continue;
      if (type === "weekly") {
        const wdRaw = ev?.recurrence_weekday;
        const wd = wdRaw === null || wdRaw === undefined || wdRaw === "" ? (start ? weekdayOf(start) : -1) : Number(wdRaw);
        if (weekdayOf(ymd) === wd) push(ymd);
      } else if (type === "monthly") {
        const domRaw = ev?.recurrence_day_of_month;
        const dom = domRaw ? Number(domRaw) : (start ? Number(start.slice(8, 10)) : 0);
        if (Number(ymd.slice(8, 10)) === dom) push(ymd);
      }
    }
  }
  return out.sort((a, b) => a.startMs - b.startMs);
}

// ── Reihenfolge & Texte ───────────────────────────────────────────────────────────

const GENRE_PRIORITY: Array<[string, number]> = [
  ["salsa", 1], ["bachata", 1], ["latin", 1], ["latina", 1], ["cumbia", 1], ["merengue", 1], ["reggaeton", 1], ["reggaetón", 1],
  ["jazz", 2], ["soul", 2], ["live music", 2], ["live band", 2], ["blues", 2], ["r&b", 2], ["funk", 2], ["swing", 2],
  ["beach", 3], ["sunset", 3], ["beach party", 3], ["rooftop", 3], ["chill", 3],
  ["rock", 4], ["pop", 4], ["indie", 4], ["folk", 4],
  ["dj set", 5], ["dj", 5], ["electronic", 5], ["techno", 5], ["house", 5], ["edm", 5],
];

export function genreRank(ev: Ev): number {
  const g = String(ev?.genre || "").toLowerCase();
  for (const [kw, rank] of GENRE_PRIORITY) if (g.includes(kw)) return rank;
  return 6;
}

const isHighlight = (o: Occ) => o.ev?.featured === true || o.ev?.is_featured === true || o.ev?.promoted === true;

/** Boost/Featured zuerst, dann mit Bild, dann Genre-Rang, dann Uhrzeit. */
export function sortForSlot(list: Occ[]): Occ[] {
  return [...list].sort((a, b) =>
    Number(isHighlight(b)) - Number(isHighlight(a)) ||
    Number(b.hasImage) - Number(a.hasImage) ||
    genreRank(a.ev) - genreRank(b.ev) ||
    a.startMs - b.startMs
  );
}

const ES_WD = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const ES_MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const EN_WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EN_MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** „vie 20 nov · 21:00“ */
export function shortDateEs(ymd: string, time: string): string {
  const base = `${ES_WD[weekdayOf(ymd)]} ${Number(ymd.slice(8, 10))} ${ES_MON[Number(ymd.slice(5, 7)) - 1]}`;
  return time ? `${base} · ${time}` : base;
}

export function shortDateEn(ymd: string, time: string): string {
  const base = `${EN_WD[weekdayOf(ymd)]} ${Number(ymd.slice(8, 10))} ${EN_MON[Number(ymd.slice(5, 7)) - 1]}`;
  return time ? `${base}, ${time}` : base;
}

export function genreEs(genre: unknown): string {
  const g = String(genre || "").trim().toLowerCase();
  if (!g) return "";
  if (g === "latin" || g === "latina" || g === "latino") return "música latina";
  if (g === "live music") return "música en directo";
  return g;
}

function placeOf(ev: Ev): string {
  const venue = String(ev?.location_name || "").trim();
  const city = String(ev?.city || "").trim();
  return [venue, city && !venue.toLowerCase().includes(city.toLowerCase()) ? city : ""].filter(Boolean).join(", ");
}

function whoOf(ev: Ev): string {
  return String(ev?.artist_name || ev?.name || ev?.title_es || "").trim();
}

function rangeText(occs: Occ[]): string {
  const first = occs[0].ymd;
  const last = occs[occs.length - 1].ymd;
  const d = (y: string) => Number(y.slice(8, 10));
  const m = (y: string) => ES_MON[Number(y.slice(5, 7)) - 1];
  if (first === last) return `${d(first)} ${m(first)}`;
  if (first.slice(0, 7) === last.slice(0, 7)) return `${d(first)}–${d(last)} ${m(last)}`;
  return `${d(first)} ${m(first)} – ${d(last)} ${m(last)}`;
}

function listCities(occs: Occ[]): string[] {
  return [...new Set(occs.map((o) => String(o.ev?.city || "").trim()).filter(Boolean))];
}

/** Sammelpost-Text (Instagram oder Facebook). Listet alle Events in zeitlicher Reihenfolge. */
export function collectionCaption(occs: Occ[], scope: "weekdays" | "weekend", platform: "instagram" | "facebook"): string {
  const sorted = [...occs].sort((a, b) => a.startMs - b.startMs);
  if (!sorted.length) return "";
  const weekend = scope === "weekend";
  const range = rangeText(sorted);
  const title = weekend ? `Planes de finde · ${range} 🎶` : `La semana en la Costa · ${range} 🎶`;
  const cities = listCities(sorted);
  const cityText = cities.length <= 1 ? cities[0] || "la Costa" : `${cities.slice(0, -1).join(", ")} y ${cities[cities.length - 1]}`;
  const n = sorted.length;
  const intro = n === 1
    ? (weekend ? `Este finde hay música en directo en ${cityText}.` : `Esta semana hay música en directo en ${cityText}.`)
    : weekend
      ? `Del viernes al domingo, música en directo en ${cityText}. Aquí tienes ${n} planes.`
      : `Esta semana hay música en directo en ${cityText}. Aquí tienes ${n} planes.`;
  const lines = sorted.map((o) => {
    const genre = genreEs(o.ev?.genre);
    const where = placeOf(o.ev);
    return `${shortDateEs(o.ymd, o.time)} — ${whoOf(o.ev)}${genre ? ` (${genre})` : ""}${where ? ` · 📍 ${where}` : ""}`;
  });
  const genres = [...new Set(sorted.map((o) => String(o.ev?.genre || "").trim().toLowerCase()).filter(Boolean))];
  const genreText = genres.length ? genres.slice(0, 3).join(", ") : "live music";
  const citiesEn = cities.length ? cities.join(", ") : "the Costa del Sol";
  if (platform === "facebook") {
    const plans = n === 1 ? "1 plan" : `${n} plans`;
    const en = weekend
      ? `This weekend on the Costa del Sol: ${genreText} live in ${citiesEn}. ${plans} from Friday to Sunday – details and map on gomarcha.com.`
      : `This week on the Costa del Sol: ${genreText} live in ${citiesEn}. ${plans} – details and map on gomarcha.com.`;
    return [title, intro, lines.join("\n"), en, "Más planes / more plans: gomarcha.com"].join("\n\n");
  }
  const cta = weekend ? "¿Con quién vas? Etiquétalo 👇" : "Guárdalo para tener el plan a mano 📌";
  const enLine = weekend ? `EN: Live ${genreText} this weekend in ${citiesEn}.` : `EN: Live ${genreText} this week in ${citiesEn}.`;
  return [title, intro, lines.join("\n"), cta, enLine].join("\n\n");
}

/** Vorläufiger Text für ein Highlight. Die KI (social-caption-ai, mode "queue") ersetzt ihn danach. */
export function singleCaption(o: Occ): string {
  const ev = o.ev;
  const name = String(ev?.name || ev?.title_es || "").trim();
  const genre = genreEs(ev?.genre);
  const where = placeOf(ev);
  const price = String(ev?.price_text || "").trim();
  const priceLine = !price ? "" : /^\s*(0([.,]0+)?\s*(eur|€|euros?)?|gratis|free|entrada libre)\s*$/i.test(price)
    ? "🎟 Entrada libre" : `🎟 Entrada: ${price.replace(/\s*EUR\b/i, " €")}`;
  const lines = [
    `${name}${genre ? ` · ${genre}` : ""}`,
    `🗓 ${shortDateEs(o.ymd, o.time)}${where ? `\n📍 ${where}` : ""}${priceLine ? `\n${priceLine}` : ""}`,
    "Más planes en gomarcha.com",
    `EN: Live ${String(ev?.genre || "music").toLowerCase()} on ${shortDateEn(o.ymd, o.time)}${ev?.city ? ` in ${ev.city}` : ""}.`,
  ];
  return lines.join("\n\n");
}

function slugTag(v: unknown): string {
  return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 28);
}

/** 3–5 Hashtags: #gomarcha + bis zu 2 Orte + häufigstes Genre + #CostaDelSol. */
export function hashtagsFor(occs: Occ[]): string {
  const tags: string[] = [];
  const seen = new Set<string>();
  const push = (raw: unknown) => {
    const t = slugTag(raw);
    if (!t || t.length < 3 || seen.has(t.toLowerCase())) return;
    seen.add(t.toLowerCase());
    tags.push(`#${t}`);
  };
  const count = (key: string) => {
    const m = new Map<string, number>();
    for (const o of occs) {
      const v = String(o.ev?.[key] || "").trim();
      if (v) m.set(v, (m.get(v) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
  };
  push("gomarcha");
  count("city").slice(0, 2).forEach((c) => push(c));
  const g = count("genre")[0];
  if (g) push(g.split(/[,/&+]| y | and /i)[0].trim().toLowerCase()); // nur das erste Genre
  push("CostaDelSol");
  return tags.slice(0, 5).join(" ");
}

/** Bild für den Sammelpost: wechselt die Genre-Gruppe pro Woche, nie zweimal hintereinander dasselbe. */
export function collectionImage(occs: Occ[], lastImage: string, weekNo: number, fallback: string): string {
  const target = (weekNo % 4) + 1;
  const sorted = [...occs].sort((a, b) => genreRank(a.ev) - genreRank(b.ev) || a.startMs - b.startMs);
  const pool = [...sorted.filter((o) => genreRank(o.ev) === target), ...sorted];
  const images = [...new Set(pool.map((o) => String(o.ev?.image_url || "").trim()).filter((u) => /^https:\/\//i.test(u)))];
  return images.find((u) => u !== lastImage) || images[0] || fallback;
}

// ── Wochenplan ────────────────────────────────────────────────────────────────────

export interface PlanOptions {
  tz: string;
  nowMs: number;
  lastCollectionImage?: string;
  fallbackImage?: string;
  /** Bevorzugtes Event je Highlight-Platz (z. B. das schon im Entwurf stehende) – sorgt für Ruhe. */
  preferMain?: Record<string, string>;
}

/** Plant eine Woche. Gibt nur Plätze zurück, für die es Events gibt und die noch in der Zukunft liegen. */
export function planWeek(
  events: Ev[],
  monday: string,
  opts: PlanOptions,
): { slots: SlotPlan[]; occurrences: Occ[]; slotTimes: Record<string, string> } {
  const occs = occurrencesForWeek(events, monday, opts.nowMs, opts.tz);
  const week = isoWeekKey(monday);
  const weekNo = Number(week.slice(-2));
  const slots: SlotPlan[] = [];
  const usedHighlights = new Set<string>();
  const slotTimes: Record<string, string> = {};

  for (const def of WEEKLY_SLOTS) {
    const slotYmd = addDays(monday, def.weekday - 1);
    const slotMs = wallToUtcMs(slotYmd, def.time, opts.tz);
    if (slotMs <= opts.nowMs) continue;
    const inScope = occs.filter((o) => def.days.includes(weekdayOf(o.ymd)) && o.startMs > slotMs);
    const slot_key = `${week}:${def.id}`;
    const scheduled_at = new Date(slotMs).toISOString();
    slotTimes[slot_key] = scheduled_at;

    if (def.type === "collection") {
      if (!inScope.length) continue;
      const ordered = sortForSlot(inScope);
      // Hauptevent lieber ein Einzel-Event mit Bild (der Versender prüft den Beginn am Hauptevent)
      const main = ordered.find((o) => o.hasImage && !o.recurring) || ordered.find((o) => o.hasImage) || ordered[0];
      const members = inScope.filter((o) => o !== main);
      const scope = def.id === "thu_collection" ? "weekend" : "weekdays";
      slots.push({
        slot_id: def.id, slot_key, type: "collection", scheduled_at, main, members,
        title: scope === "weekend" ? "Planes de finde" : "La semana en la Costa",
        caption: collectionCaption(inScope, scope, "instagram"),
        caption_fb: collectionCaption(inScope, scope, "facebook"),
        hashtags: hashtagsFor(inScope),
        image_url: collectionImage(inScope, opts.lastCollectionImage || "", weekNo, opts.fallbackImage || ""),
      });
    } else {
      const eligible = inScope.filter((o) => !o.recurring && o.hasImage && !usedHighlights.has(o.id));
      if (!eligible.length) continue;
      const preferred = opts.preferMain?.[slot_key];
      const main = eligible.find((o) => o.id === preferred) || sortForSlot(eligible)[0];
      usedHighlights.add(main.id);
      slots.push({
        slot_id: def.id, slot_key, type: "single", scheduled_at, main, members: [],
        title: String(main.ev?.name || main.ev?.title_es || "").trim(),
        caption: singleCaption(main),
        caption_fb: "",
        hashtags: hashtagsFor([main]),
        image_url: String(main.ev?.image_url || "").trim(),
      });
    }
  }
  return { slots, occurrences: occs, slotTimes };
}
