import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { type Ev, mondayOf, addDays, planWeek, todayIn, type SlotPlan, type Occ } from "./plan.ts";
import { reconcile, type QueueRow } from "./reconcile.ts";

/**
 * social-week-planner — Wochenplan für Social Posts auf dem Server (16.11.2026, Rat + Freigabe Frank)
 *
 * Plant diese und nächste Woche (Mo „La semana en la Costa“, Mi Highlight, Do „Planes de finde“,
 * Sa Highlight) und hält offene Entwürfe aktuell, bis sie freigegeben/übergeben sind.
 * Löst den Planer im Admin-Browser ab (läuft dann auch ohne geöffneten Admin, z. B. per pg_cron).
 *
 * Sicherheit:
 *   - Zugriff nur mit Header x-marcha-social-secret (= MARCHA_SOCIAL_RUNNER_SECRET) oder als Admin
 *     (app_metadata.role = 'admin', nie user_metadata).
 *   - Testmodus (dry_run): rechnet nur und schreibt NICHTS. Aktiv, solange in social_planner_settings
 *     dry_run = true ist ODER der Aufruf dry_run: true schickt ODER die SQL #29 noch fehlt.
 *   - Not-Aus: social_planner_settings.paused = true → tut nichts.
 *   - Eingefrorene Einträge (freigegeben, an Postiz übergeben, von Hand bearbeitet) werden nie verändert.
 *   - Pro Platz höchstens ein Eintrag (slot_key, eindeutiger Index aus SQL #29).
 *
 * Body (optional): { dry_run?: boolean, weeks?: 1|2 }
 * Antwort: Plan pro Platz (Aktion, Hauptevent, Anzahl Events), fehlende Events in eingefrorenen Posts,
 *          Events nur für Story/Website.
 * Secrets: MARCHA_SOCIAL_RUNNER_SECRET. Standard: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 * Optional: MARCHA_EVENT_TIMEZONE (Standard Europe/Madrid), MARCHA_DEFAULT_SOCIAL_IMAGE_URL.
 */

const DEFAULT_IMAGE = "https://gomarcha.com/assets/social-preview-es.jpg";
const EVENT_COLS = [
  "id", "name", "title_es", "artist_name", "genre", "event_date", "event_time", "location_name", "city",
  "image_url", "price_text", "featured", "is_featured", "promoted", "status", "is_recurring", "original_event_id",
  "recurrence_type", "recurrence_weekday", "recurrence_day_of_month", "recurrence_start_date", "recurrence_end_date",
  "recurring_social_opt_out",
].join(",");
const QUEUE_COLS_FULL =
  "id,slot_key,status,event_id,collection_event_ids,occurrence_date,caption,caption_template_id,admin_confirmed_at,scheduled_at,post_stage,image_url,postiz_response";
const QUEUE_COLS_LEGACY =
  "id,status,event_id,caption,caption_template_id,admin_confirmed_at,scheduled_at,post_stage,image_url,postiz_response";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-marcha-social-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: { "Content-Type": "application/json", ...CORS } });
}
function slog(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ fn: "social-week-planner", event, ...data }));
}

async function isAdminRequest(req: Request, base: string): Promise<boolean> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!token || token.split(".").length !== 3 || !base || !anon) return false;
  const res = await fetch(`${base}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  const user = await res.json().catch(() => null);
  return user?.app_metadata?.role === "admin";
}

function rowFromPlan(plan: SlotPlan): Record<string, unknown> {
  const members = plan.members.map((m) => m.ref);
  const isCollection = plan.type === "collection";
  return {
    event_id: plan.main.id,
    platform: "instagram",
    platforms: ["instagram", "facebook"],
    status: "pending",
    scheduled_at: plan.scheduled_at,
    slot_key: plan.slot_key,
    title: plan.title,
    caption: plan.caption,
    hashtags: plan.hashtags,
    cta_text: null,
    image_url: plan.image_url,
    resolved_image_url: plan.image_url,
    event_date: plan.main.ymd,
    occurrence_date: plan.main.ymd,
    location_name: String(plan.main.ev?.location_name || "").trim() || null,
    city: String(plan.main.ev?.city || "").trim() || null,
    retry_count: 0,
    post_stage: isCollection ? "collection" : "early_reminder",
    collection_event_ids: isCollection ? members : null,
    postiz_response: {
      _marcha_admin: { hashtags: plan.hashtags, cta_text: "", style_mode: "natural" },
      post_stage: isCollection ? "collection" : "early_reminder",
      _marcha_planner: { slot_key: plan.slot_key, source: "social-week-planner" },
      ...(isCollection ? { _marcha_collection_event_ids: members, _marcha_fb_caption: plan.caption_fb } : {}),
    },
  };
}

const describe = (o: Occ) => ({ ref: o.ref, name: String(o.ev?.name || ""), date: o.ymd, time: o.time || null });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const base = Deno.env.get("SUPABASE_URL") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!base || !service) return json({ error: "Missing configuration" }, 500);

  const secret = Deno.env.get("MARCHA_SOCIAL_RUNNER_SECRET") || "";
  const hasSecret = Boolean(secret) && (req.headers.get("x-marcha-social-secret") || "") === secret;
  if (!hasSecret && !(await isAdminRequest(req, base))) return json({ error: "Unauthorized" }, 401);

  // deno-lint-ignore no-explicit-any
  const body: any = await req.json().catch(() => ({}));
  const tz = Deno.env.get("MARCHA_EVENT_TIMEZONE") || "Europe/Madrid";
  const fallbackImage = Deno.env.get("MARCHA_DEFAULT_SOCIAL_IMAGE_URL") || DEFAULT_IMAGE;
  const headers = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
  const rest = (path: string, init: RequestInit = {}) =>
    fetch(`${base}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });

  // ── Einstellungen (Not-Aus / Testmodus) ──────────────────────────────────────
  let settings = { paused: false, require_approval: true, dry_run: true, schema_ready: false };
  const sRes = await rest("social_planner_settings?select=paused,require_approval,dry_run&id=eq.1");
  if (sRes.ok) {
    const s = (await sRes.json())?.[0];
    if (s) settings = { paused: s.paused === true, require_approval: s.require_approval !== false, dry_run: s.dry_run !== false, schema_ready: true };
  }
  if (settings.paused) {
    slog("paused");
    return json({ paused: true, message: "Not-Aus ist an – der Planer tut nichts." });
  }
  const dryRun = !settings.schema_ready || settings.dry_run || body?.dry_run === true;

  // ── Zeitraum ────────────────────────────────────────────────────────────────
  const nowMs = Date.now();
  const weeks = Number(body?.weeks) === 1 ? 1 : 2;
  const monday0 = mondayOf(todayIn(tz, nowMs));
  const mondays = Array.from({ length: weeks }, (_, i) => addDays(monday0, 7 * i));
  const rangeEnd = addDays(monday0, 7 * weeks);

  // ── Events ──────────────────────────────────────────────────────────────────
  const evRes = await rest(
    `events?select=${EVENT_COLS}&status=eq.approved&archived_at=is.null` +
      `&or=(is_recurring.eq.true,and(event_date.gte.${monday0},event_date.lt.${rangeEnd}))`,
  );
  if (!evRes.ok) return json({ error: `events ${evRes.status}`, detail: (await evRes.text()).slice(0, 300) }, 500);
  const events = (await evRes.json()) as Ev[];

  // ── Vorhandene Einträge im Zeitraum (± 1 Tag Puffer) ────────────────────────
  const fromIso = new Date(Date.parse(`${monday0}T00:00:00Z`) - 86400000).toISOString();
  const toIso = new Date(Date.parse(`${rangeEnd}T00:00:00Z`) + 86400000).toISOString();
  const qFilter = `&status=neq.skipped&scheduled_at=gte.${fromIso}&scheduled_at=lt.${toIso}&order=scheduled_at.asc`;
  let qRes = await rest(`social_queue?select=${QUEUE_COLS_FULL}${qFilter}`);
  if (!qRes.ok) qRes = await rest(`social_queue?select=${QUEUE_COLS_LEGACY}${qFilter}`); // SQL #29 fehlt noch
  if (!qRes.ok) return json({ error: `social_queue ${qRes.status}` }, 500);
  const rows = (await qRes.json()) as QueueRow[];

  const lastImgRes = await rest(
    `social_queue?select=image_url&post_stage=eq.collection&status=neq.skipped&scheduled_at=lt.${new Date(nowMs).toISOString()}&order=scheduled_at.desc&limit=1`,
  );
  let lastCollectionImage = lastImgRes.ok ? String((await lastImgRes.json())?.[0]?.image_url || "") : "";

  // ── Planen ──────────────────────────────────────────────────────────────────
  const preferMain: Record<string, string> = {};
  for (const r of rows) if (r.slot_key && r.post_stage !== "collection" && r.event_id) preferMain[r.slot_key] = String(r.event_id);

  const plans: SlotPlan[] = [];
  const slotTimes: Record<string, string> = {};
  const occs: Occ[] = [];
  for (const monday of mondays) {
    const w = planWeek(events, monday, { tz, nowMs, lastCollectionImage, fallbackImage, preferMain });
    plans.push(...w.slots);
    Object.assign(slotTimes, w.slotTimes);
    occs.push(...w.occurrences);
    const lastCol = w.slots.filter((s) => s.type === "collection").pop();
    if (lastCol) lastCollectionImage = lastCol.image_url;
  }
  const result = reconcile(plans, slotTimes, rows, occs);

  // ── Schreiben (nur ohne Testmodus) ──────────────────────────────────────────
  const written: Array<Record<string, unknown>> = [];
  const aiQueueIds: string[] = [];
  if (!dryRun) {
    for (const a of result.actions) {
      try {
        if (a.kind === "insert") {
          const res = await rest("social_queue", {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(rowFromPlan(a.plan)),
          });
          const ok = res.ok;
          const created = ok ? (await res.json())?.[0] : null;
          if (created?.id && a.plan.type === "single") aiQueueIds.push(String(created.id));
          written.push({ slot_key: a.plan.slot_key, action: "insert", ok, status: res.status, detail: ok ? undefined : (await res.text()).slice(0, 200) });
        } else if (a.kind === "update") {
          const patch: Record<string, unknown> = { ...rowFromPlan(a.plan), updated_at: new Date().toISOString() };
          delete patch.status;
          delete patch.retry_count;
          if (a.plan.type === "single" && !a.mainChanged) {
            // gleiches Highlight: KI-Text behalten, nur Bild/Daten auffrischen
            delete patch.caption;
            delete patch.hashtags;
          } else if (a.plan.type === "single") {
            patch.caption_template_id = null; // neues Event → KI schreibt den Text neu
          }
          // nur ändern, solange der Eintrag noch offen ist (Schutz gegen gleichzeitige Freigabe)
          const res = await rest(
            `social_queue?id=eq.${a.row.id}&status=in.(pending,draft)&admin_confirmed_at=is.null`,
            { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) },
          );
          if (res.ok && a.plan.type === "single" && a.mainChanged) aiQueueIds.push(String(a.row.id));
          written.push({ slot_key: a.plan.slot_key, action: "update", ok: res.ok, status: res.status });
        } else if (a.kind === "empty") {
          const res = await rest(
            `social_queue?id=eq.${a.row.id}&status=in.(pending,draft)&admin_confirmed_at=is.null`,
            {
              method: "PATCH",
              headers: { Prefer: "return=minimal" },
              body: JSON.stringify({ status: "skipped", last_error: "planner:no_events", updated_at: new Date().toISOString() }),
            },
          );
          written.push({ slot_key: a.slot_key, action: "skip_empty", ok: res.ok, status: res.status });
        }
      } catch (err) {
        written.push({ action: a.kind, ok: false, error: String((err as Error)?.message || err) });
      }
    }
    // KI-Text für neue/geänderte Highlights (wie im Admin: social-caption-ai, mode "queue")
    if (aiQueueIds.length && secret) {
      try {
        const aiRes = await fetch(`${base}/functions/v1/social-caption-ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-marcha-social-secret": secret, Authorization: `Bearer ${service}` },
          body: JSON.stringify({ mode: "queue", queue_ids: aiQueueIds }),
        });
        slog("ai_caption_queue", { ok: aiRes.ok, status: aiRes.status, ids: aiQueueIds });
      } catch (err) {
        slog("ai_caption_queue_error", { error: String((err as Error)?.message || err) });
      }
    }
  }

  // ── Bericht ─────────────────────────────────────────────────────────────────
  const report = result.actions.map((a) => {
    if (a.kind === "frozen") {
      return { slot_key: a.slot_key, action: "frozen", status: a.row.status, queue_id: a.row.id, missing_events: a.missing };
    }
    if (a.kind === "empty") return { slot_key: a.slot_key, action: "empty", queue_id: a.row.id };
    const p = a.plan;
    return {
      slot_key: p.slot_key,
      action: a.kind,
      scheduled_at: p.scheduled_at,
      type: p.type,
      main: describe(p.main),
      events: 1 + p.members.length,
      members: p.members.map(describe),
      image_url: p.image_url,
      ...(body?.with_captions ? { caption: p.caption, hashtags: p.hashtags } : {}),
    };
  });
  slog("run", {
    dry_run: dryRun, weeks, events: occs.length, slots: report.length,
    uncovered: result.uncovered.length, written: written.length,
  });
  return json({
    dry_run: dryRun,
    schema_ready: settings.schema_ready,
    require_approval: settings.require_approval,
    timezone: tz,
    weeks: mondays,
    occurrences: occs.length,
    slots: report,
    story_only: result.uncovered.map(describe),
    written,
  });
});
