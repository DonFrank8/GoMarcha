// KOPIE von supabase/functions/social-caption-ai/caption-ai.ts – Änderungen immer in beiden Dateien!
/**
 * KI-Captions für Marcha-Social-Posts (Leitfaden: SOCIAL_POSTS_LEITFADEN.md)
 *
 * Grundsätze (Rat 13.11.2026):
 *   - Die KI bekommt nur ein Faktenpaket und schreibt nur Hook, 1–2 Sätze, CTA, EN-Zeile, Hashtags.
 *   - Datum, Uhrzeit, Preis, Ort und Markierungen setzt der Code (Infoblock).
 *   - Prüfregeln im Code (Sperrliste, Längen, Ziffern, Wochentage). Verstoß → 1 neuer Versuch, sonst null
 *     (der Aufrufer nutzt dann die alte Vorlage).
 */
import Anthropic from "npm:@anthropic-ai/sdk";

export const CAPTION_MODEL = "claude-sonnet-5-5";
export const CAPTION_PROMPT_VERSION = "2026-11-13.2";

export type Stage = "week" | "three_days" | "one_day" | "today";

export interface CaptionFacts {
  title: string;               // korrekter Eventname
  venue: string;               // Lokal
  city: string;                // Ort
  dateIso: string;             // YYYY-MM-DD des Termins
  time: string | null;         // HH:MM
  isFree: boolean;
  priceText: string | null;    // z. B. "15 €" (nur wenn nicht gratis)
  genres: string[];
  artists: string[];           // nur fest zugeordnete Künstler
  description: string;         // Beschreibung (gekürzt), nur als Quelle
  isSeries: boolean;           // wöchentliche Serie
  stage: Stage;
  venueHandle: string | null;  // @handle aus organizers.instagram
  previousCaptions: string[];  // letzte Captions zu diesem Event (gegen Wiederholung)
}

const WEEKDAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const WEEKDAYS_SHORT_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS_SHORT_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const WEEKDAYS_EN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const BANNED = [
  /no te lo pierdas/i, /inolvidable/i, /imperdible/i, /\bel mejor\b/i, /\bla mejor\b/i, /\blos mejores\b/i,
  /final call/i, /\ben vivo\b/i, /line-?up/i, /save the date/i, /\bboletos?\b/i, /\búnico\b/i, /\búnica\b/i,
  /últimas entradas/i, /\bplanazo\b.*\bplanazo\b/i, /\bvibes?\b/i, /\bshow\b/i,
];

function weekdayIndex(dateIso: string): number {
  return new Date(`${dateIso}T12:00:00Z`).getUTCDay();
}

/** „vie 20 nov“ */
export function spanishShortDate(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00Z`);
  return `${WEEKDAYS_SHORT_ES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_SHORT_ES[d.getUTCMonth()]}`;
}

function relativeDayEs(stage: Stage, dateIso: string): string {
  const wd = WEEKDAYS_ES[weekdayIndex(dateIso)];
  if (stage === "today") return "hoy";
  if (stage === "one_day") return "mañana";
  if (stage === "three_days") return `este ${wd}`;
  return `el ${wd} que viene`;
}

function countEmojis(text: string): number {
  return (text.match(/\p{Extended_Pictographic}/gu) || []).length;
}

function normalizeTag(tag: string): string {
  return tag.replace(/^#/, "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9ñÑ]/g, "");
}

function trigramSet(text: string): Set<string> {
  const t = text.toLowerCase().replace(/\s+/g, " ");
  const set = new Set<string>();
  for (let i = 0; i < t.length - 2; i++) set.add(t.slice(i, i + 3));
  return set;
}
function similarity(a: string, b: string): number {
  const A = trigramSet(a), B = trigramSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / Math.min(A.size, B.size);
}

interface Out { hook: string; body: string; cta: string; en_line: string; hashtags: string[] }
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    hook: { type: "string" },
    body: { type: "string" },
    cta: { type: "string" },
    en_line: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
  },
  required: ["hook", "body", "cta", "en_line", "hashtags"],
  additionalProperties: false,
};

function parseOut(text: string): Out | null {
  try {
    const o = JSON.parse(text);
    if (typeof o?.hook !== "string" || typeof o?.body !== "string" || typeof o?.cta !== "string" ||
        typeof o?.en_line !== "string" || !Array.isArray(o?.hashtags)) return null;
    return { hook: o.hook, body: o.body, cta: o.cta, en_line: o.en_line, hashtags: o.hashtags.map(String) };
  } catch {
    return null;
  }
}

const SYSTEM = `Eres la persona que escribe los posts de Instagram de Marcha, una app gratuita de música en directo y planes en la Costa del Sol. Escribes como una amiga de la zona que recomienda un plan: cercano, concreto, natural, español de España (tuteo). Nunca suenas a anuncio ni a traducción.

Escribe SOLO estas partes (el resto — fecha, hora, precio, lugar y menciones — lo añade el sistema):
- hook: primera línea, máx. 60 caracteres, concreta (estilo de música, ambiente o el día relativo que te doy). Puede llevar 1 emoji al final.
- body: 1–2 frases (máx. 240 caracteres) sobre qué se encuentra la gente, usando SOLO los datos del paquete (géneros, artistas, descripción). Si la descripción menciona un detalle real (pista, puesta de sol, cócteles…), puedes usarlo.
- cta: una frase corta que varíe: invitar a etiquetar a alguien, a guardarlo, o "Más planes en la app Marcha (link en bio)".
- en_line: una línea en inglés británico, máx. 90 caracteres, solo hechos (estilo + cuándo de forma relativa + si es gratis). Sin hora ni precio en cifras.
- hashtags: 4–7 etiquetas sin "#", relevantes: estilo (salsa, tardeo, afrohouse…), ciudad, costadelsol. No uses "directo" ni "musicaenvivo".

Reglas estrictas:
- No inventes nada: ni artistas, ni precios, ni horas, ni bebidas, ni comida, ni clima, ni cuánta gente va.
- No escribas cifras (ni horas, ni fechas, ni precios) en hook, body, cta ni en_line.
- Usa el día relativo que te doy ("hoy", "mañana", "este viernes"…) tal cual, sin paréntesis; no menciones otros días de la semana.
- Usa la franja que te doy: si es "noche", no digas "tarde" (aunque la descripción lo diga), y al revés.
- En hook y body NO menciones el precio ni que es gratis, ni repitas la ciudad si ya está en el hook: eso va en la línea de datos que añade el sistema. En en_line sí puedes decir "free entry".
- No digas "es una cita que se repite": como mucho "cada sábado" una vez.
- Escribe los géneros en español correcto y en minúscula (chachachá, música latina, son cubano).
- "en directo", nunca "en vivo". Nada de "final call", "line-up", "show", "vibes", "no te lo pierdas", "inolvidable", "imperdible", "el mejor", "único".
- Máximo un signo de exclamación en total y máximo 2 emojis entre hook y body.
- Los nombres de artistas, locales y eventos se escriben exactamente como en el paquete.
- Si es una serie semanal, puedes decir "cada viernes" (con el día correcto).
- No repitas frases ni la estructura de los posts anteriores que te paso.`;

function buildUserMessage(f: CaptionFacts, feedback: string | null): string {
  const pack = {
    evento: f.title,
    local: f.venue,
    ciudad: f.city,
    dia_relativo: relativeDayEs(f.stage, f.dateIso),
    dia_de_la_semana: WEEKDAYS_ES[weekdayIndex(f.dateIso)],
    franja: !f.time ? "sin hora" : Number(f.time.slice(0, 2)) < 14 ? "mediodía" : Number(f.time.slice(0, 2)) < 20 ? "tarde" : "noche",
    serie_semanal: f.isSeries ? `sí, cada ${WEEKDAYS_ES[weekdayIndex(f.dateIso)]}` : "no",
    gratis: f.isFree,
    generos: f.genres,
    artistas: f.artists,
    descripcion: f.description,
  };
  const prev = f.previousCaptions.length
    ? `\n\nPosts anteriores de este evento (no los repitas):\n${f.previousCaptions.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
    : "";
  const fb = feedback ? `\n\nTu intento anterior no cumplía estas reglas, corrígelo: ${feedback}` : "";
  return `Paquete de datos:\n${JSON.stringify(pack, null, 2)}${prev}${fb}`;
}

export function validate(out: Out, f: CaptionFacts): string[] {
  const problems: string[] = [];
  const prose = `${out.hook}\n${out.body}\n${out.cta}`;
  const all = `${prose}\n${out.en_line}`;
  if (!out.hook.trim() || out.hook.length > 70) problems.push("hook vacío o de más de 70 caracteres");
  if (!out.body.trim() || out.body.length > 280) problems.push("body vacío o de más de 280 caracteres");
  if (out.en_line.length > 110) problems.push("en_line demasiado larga");
  for (const re of BANNED) if (re.test(all)) problems.push(`expresión prohibida: ${re.source}`);
  // Ziffern nur, wenn sie Teil eines Namens aus dem Paket sind (z. B. „1920 Piano Bar“)
  const allowedDigits = new Set((`${f.title} ${f.venue} ${f.artists.join(" ")}`.match(/\d+/g) || []));
  for (const num of all.match(/\d+/g) || []) if (!allowedDigits.has(num)) problems.push(`cifra no permitida: ${num}`);
  if ((`${out.hook}${out.body}`.match(/!/g) || []).length > 1) problems.push("más de un signo de exclamación");
  if (countEmojis(`${out.hook}${out.body}`) > 2) problems.push("más de 2 emojis en hook+body");
  const wd = weekdayIndex(f.dateIso);
  WEEKDAYS_ES.forEach((name, i) => {
    if (i !== wd && new RegExp(`\\b${name}s?\\b`, "i").test(prose)) problems.push(`día de la semana incorrecto: ${name}`);
  });
  WEEKDAYS_EN.forEach((name, i) => {
    if (i !== wd && new RegExp(`\\b${name}s?\\b`, "i").test(out.en_line)) problems.push(`weekday incorrect: ${name}`);
  });
  if (!f.isFree && /gratis|entrada libre|\bfree\b/i.test(all)) problems.push("dice gratis pero no es gratis");
  if (/gratis|entrada libre/i.test(prose)) problems.push("no menciones el precio ni 'gratis' en hook/body/cta");
  if (/\(\s*(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s*\)/i.test(all)) problems.push("sin paréntesis alrededor del día");
  if (/se repite/i.test(prose)) problems.push("evita 'se repite'");
  for (const prev of f.previousCaptions) {
    if (similarity(prose, prev) > 0.6) { problems.push("demasiado parecido a un post anterior"); break; }
  }
  return problems;
}

function escapeRe(x: string): string {
  return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Schreibweise von Namen (Titel-Teile, Lokal, Künstler) exakt wie in der Datenbank wiederherstellen. */
export function restoreNames(text: string, f: CaptionFacts): string {
  const names = new Set<string>();
  // Nur Titelteile, die wie ein Name beginnen (Großbuchstabe/Ziffer) – nicht „en el Rincón …“
  for (const part of f.title.split(/\s+[-–]\s+/)) if (part.trim().length >= 3 && /^[\p{Lu}\d]/u.test(part.trim())) names.add(part.trim());
  if (f.venue) names.add(f.venue);
  for (const a of f.artists) if (a) names.add(a);
  let out = text;
  for (const name of [...names].sort((a, b) => b.length - a.length)) {
    const pattern = escapeRe(name).replace(/[’'`´]/g, "['’`´]?").replace(/\\\s|\s+/g, "\\s+");
    out = out.replace(new RegExp(pattern, "gi"), name);
  }
  return out;
}

export function assembleCaption(out: Out, f: CaptionFacts, withEnglish = true): string {
  out = { ...out, hook: restoreNames(out.hook, f), body: restoreNames(out.body, f), cta: restoreNames(out.cta, f), en_line: restoreNames(out.en_line, f) };
  const info = [
    `📍 ${f.venueHandle ? `${f.venue} (${f.venueHandle})` : f.venue} · ${f.city}`,
    `🗓 ${spanishShortDate(f.dateIso)}${f.time ? ` · ${f.time}` : ""}${f.isFree ? " · 🎟 Entrada libre" : f.priceText ? ` · 🎟 Entrada: ${f.priceText}` : ""}`,
  ].join("\n");
  const tags = new Map<string, string>();
  for (const raw of [...out.hashtags, f.city, "costadelsol", "gomarcha"]) {
    const t = normalizeTag(raw);
    if (t && !/^(directo|musicaenvivo)$/i.test(t)) tags.set(t.toLowerCase(), t);
  }
  const tagLine = [...tags.values()].slice(0, 8).map((t) => `#${t}`).join(" ");
  return [
    `${out.hook.trim()}\n${out.body.trim()}`,
    info,
    [out.cta.trim(), withEnglish ? `EN: ${out.en_line.trim()}` : ""].filter(Boolean).join("\n"),
    tagLine,
  ].join("\n\n");
}

export interface CaptionResult {
  caption: string | null;
  attempts: number;
  problems: string[];
  model: string;
  promptVersion: string;
}

export async function writeCaption(f: CaptionFacts, apiKey: string): Promise<CaptionResult> {
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 60_000 });
  let feedback: string | null = null;
  let problems: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await client.messages.create({
      model: CAPTION_MODEL,
      max_tokens: 4000,
      output_config: { effort: "medium", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: buildUserMessage(f, feedback) }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text).join("");
    const out = response.stop_reason === "refusal" ? null : parseOut(text);
    if (!out) {
      problems = ["sin respuesta válida"];
      continue;
    }
    problems = validate(out, f);
    if (!problems.length) {
      return { caption: assembleCaption(out, f), attempts: attempt, problems: [], model: CAPTION_MODEL, promptVersion: CAPTION_PROMPT_VERSION };
    }
    feedback = problems.join("; ");
  }
  return { caption: null, attempts: 2, problems, model: CAPTION_MODEL, promptVersion: CAPTION_PROMPT_VERSION };
}
