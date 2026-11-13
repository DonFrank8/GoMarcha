import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

/**
 * smart-action — Übersetzung von Event-Texten (DE / EN / ES)
 *
 * Version 13.11.2026 (Leitfaden: SOCIAL_POSTS_LEITFADEN.md):
 *   - Übersetzt mit Claude (Sonnet 5.5) nach der Anweisung des muttersprachlichen Texters.
 *   - Fällt Claude aus (Fehler/Ablehnung), wird wie bisher OpenAI gpt-4o-mini genutzt.
 *   - Zugriff:
 *       * angemeldete Nutzer (gültiges Supabase-Login-Token): bis 8.000 Zeichen
 *       * ohne Login (öffentliches Einreichformular): nur von gomarcha.com bzw. der
 *         Testumgebung aus und bis 4.000 Zeichen. Kosten zusätzlich durch das
 *         Monatslimit bei Anthropic/OpenAI gedeckelt.
 *   - Antwortformat unverändert: { translated }  (+ provider)
 *
 * Secrets: ANTHROPIC_API_KEY (neu), OPENAI_API_KEY (Ausweich).
 * Standard-Umgebungsvariablen: SUPABASE_URL, SUPABASE_ANON_KEY.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CLAUDE_MODEL = "claude-sonnet-5-5";
const MAX_CHARS_AUTH = 8000;
const MAX_CHARS_ANON = 4000;

const TARGETS: Record<string, { code: string; name: string }> = {
  de: { code: "de", name: "German" }, german: { code: "de", name: "German" }, deutsch: { code: "de", name: "German" },
  en: { code: "en", name: "English" }, english: { code: "en", name: "English" }, englisch: { code: "en", name: "English" },
  es: { code: "es", name: "Spanish" }, spanish: { code: "es", name: "Spanish" }, "español": { code: "es", name: "Spanish" }, spanisch: { code: "es", name: "Spanish" },
};

const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.)?gomarcha\.com$/i,
  /^https:\/\/[a-z0-9-]+\.gomarcha-test\.pages\.dev$/i,
  /^https:\/\/gomarcha-test\.pages\.dev$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];

const SYSTEM_PROMPT = `You are a native copywriter for Marcha, a free live-music & party app on the Costa del Sol (Málaga province). Rewrite the event text given by the user in the requested target language so it reads as if a local native speaker wrote it originally — not as a translation.

Target variants:
- Spanish: Spain Spanish (Andalusian-friendly, never caricature). Use "tú"; "vosotros" only for groups. "en directo" (never "en vivo"), "entradas" (never "boletos"), "finde", "tardeo", "chiringuito". No anglicisms like "final call", "line-up", "save the date".
- English: British English, relaxed, aimed at expats/tourists. Keep "tardeo" and "chiringuito" (explain once if needed: "tardeo (afternoon party)").
- German: natural, "du", locker; no stiff "Sie", no literal Spanish syntax.

Never translate or alter: artist/band names, venue names, event series names (e.g. "Tardeo Cubano", "Domingo Latino"), place names, Instagram handles, URLs. Do translate connecting words inside titles (e.g. "Rey Falco und El Chepe" → ES "Rey Falco y El Chepe", EN "Rey Falco and El Chepe").
Genres: keep salsa, bachata, merengue, son, bolero, cha-cha-chá, afro house, deep house as genre names; in Spanish write them lowercase with correct accents (chachachá, música latina).
Prices: "0 EUR"/0 → ES "Entrada libre", EN "Free entry", DE "Eintritt frei". Otherwise ES/DE "15 €" (comma decimals), EN "€15".
Dates/times: 24h clock; ES "sábado 14 de noviembre, 21:00 h"; never change a date, time, price or fact.
Content: keep all facts; do not invent anything (no "best night ever", no extra artists, no prices). If the source contradicts itself (e.g. genres), keep what the source text says, don't resolve it.
Tone: friendly, local, concrete, no fake hype; max one exclamation mark per paragraph.
Emojis: keep at most 3 from the original that carry meaning; drop decorative chains and flag strings.
Length: similar to the original, never longer than +15 %. Keep paragraph breaks; no markdown, no hashtags unless present.
If the text is already in the target language, return it with only minimal corrections.
Glossary (DE / EN → ES): Livemusik / live music → música en directo; Eintritt frei / free entry → entrada libre; Tickets → entradas; Wochenende / weekend → el finde; Sonnenuntergang / sunset → puesta de sol; Tanzfläche / dance floor → pista; heute Abend / tonight → esta noche; jeden Freitag / every Friday → todos los viernes; Konzert / concert → concierto; Line-up → cartel / artistas; Lokal / venue → local / sala; und / and → y.
Output only the final text, nothing else.`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function slog(event: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({ fn: "smart-action", event, ...data }));
}

/** app.js schickt im zweiten Versuch eine eingepackte Anweisung – nur den eigentlichen Text verwenden. */
function unwrapStrictPrompt(text: string): string {
  if (!/^Translate the following text into /i.test(text)) return text;
  const parts = text.split(/\n\s*\n/);
  return parts.length > 1 ? parts.slice(1).join("\n\n").trim() : text;
}

async function isAuthenticated(req: Request): Promise<boolean> {
  const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const base = Deno.env.get("SUPABASE_URL") || "";
  if (!auth || auth === anonKey || auth.split(".").length !== 3 || !base) return false;
  try {
    const res = await fetch(`${base}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${auth}` } });
    if (!res.ok) return false;
    const user = await res.json();
    return typeof user?.id === "string" && user.id.length > 0;
  } catch {
    return false;
  }
}

function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin") || "";
  return ALLOWED_ORIGINS.some((re) => re.test(origin));
}

async function translateWithClaude(text: string, targetName: string): Promise<string | null> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || "";
  if (!apiKey) return null;
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 45_000 });
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Target language: ${targetName}\n\nText:\n${text}` }],
  });
  if (response.stop_reason === "refusal") {
    slog("claude_refusal", { category: response.stop_details?.category ?? null });
    return null;
  }
  const out = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return out || null;
}

async function translateWithOpenAI(text: string, targetName: string): Promise<string | null> {
  const key = Deno.env.get("OPENAI_API_KEY") || "";
  if (!key) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: `Translate naturally into ${targetName}. Keep artist names, venue names and music genres unchanged. Text:\n\n${text}`,
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const out = String(data.output_text || data.output?.[0]?.content?.[0]?.text || "").trim();
  return out || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const rawText = String(body?.text ?? "").trim();
    const target = TARGETS[String(body?.targetLang ?? "").trim().toLowerCase()];
    if (!rawText || !target) return json({ error: "Missing text or targetLang" }, 400);

    const authed = await isAuthenticated(req);
    if (!authed && !originAllowed(req)) {
      slog("rejected_origin", { origin: req.headers.get("origin") || null });
      return json({ error: "Forbidden" }, 403);
    }
    const text = unwrapStrictPrompt(rawText);
    const limit = authed ? MAX_CHARS_AUTH : MAX_CHARS_ANON;
    if (text.length > limit) return json({ error: `Text too long (max ${limit} characters)` }, 413);

    let translated: string | null = null;
    let provider = "claude";
    try {
      translated = await translateWithClaude(text, target.name);
    } catch (err) {
      slog("claude_error", { error: err instanceof Error ? err.message : String(err) });
    }
    if (!translated) {
      provider = "openai";
      translated = await translateWithOpenAI(text, target.name);
    }
    if (!translated) return json({ error: "Translation failed" }, 502);

    slog("translated", { provider, target: target.code, authed, chars: text.length });
    return json({ translated, provider });
  } catch (error) {
    return json({ error: String((error as Error)?.message || error) }, 500);
  }
});
