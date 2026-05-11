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
};

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

function resolveEventImageUrl(event: EventRow, fallback: string): { url: string; source: string } {
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
      if (isHttpsImageUrl(u)) return { url: u.trim(), source: "events.image_urls" };
    }
  }
  const main = String(event.image_url || "").trim();
  if (isHttpsImageUrl(main)) return { url: main, source: "events.image_url" };
  return { url: fallback, source: "fallback_generic" };
}

async function validateImageUrl(url: string): Promise<{ ok: boolean; status?: number; contentType?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    let res = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        signal: ctrl.signal,
        redirect: "follow"
      });
    }
    const ct = res.headers.get("content-type") || "";
    const ok = res.ok && /image\//i.test(ct);
    return { ok, status: res.status, contentType: ct };
  } catch (e) {
    slog("image_url_validation_failed", { url, error: String(e) });
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
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

/** Blocks duplicate posts: same event+platform+UTC day already posted or being processed elsewhere. */
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
    .select("id")
    .eq("event_id", eventId)
    .eq("platform", platform)
    .neq("id", excludeQueueId)
    .gte("scheduled_at", start)
    .lte("scheduled_at", end)
    .in("status", ["posted", "processing"])
    .limit(1);
  if (error) {
    slog("dedupe_check_error", { message: error.message });
    return false;
  }
  return Boolean(data?.length);
}

function mediaPayloadFromUrl(url: string): { id: string; path: string } {
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

async function createPostizPost(args: {
  base: string;
  apiKey: string;
  integrationId: string;
  platform: SocialPlatform;
  scheduledIso: string;
  caption: string;
  imageUrl: string;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const url = `${args.base.replace(/\/$/, "")}/posts`;
  const image = [mediaPayloadFromUrl(args.imageUrl)];
  const body = {
    type: "schedule",
    date: args.scheduledIso,
    shortLink: false,
    tags: [],
    posts: [
      {
        integration: { id: args.integrationId },
        value: [{ content: args.caption, image }],
        settings: postizSettings(args.platform)
      }
    ]
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: args.apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = await res.text();
  }
  return { ok: res.ok, status: res.status, body: parsed };
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
        "id,name,city,location_name,event_date,event_time,genre,status,featured,image_url,image_urls"
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

    const { url: chosenImage, source: imageSource } = resolveEventImageUrl(ev, fallbackImage);
    const validation = await validateImageUrl(chosenImage);
    const finalImage = validation.ok
      ? chosenImage
      : fallbackImage;
    const imageLoggedSource = validation.ok ? imageSource : `${imageSource}_invalid_used_fallback`;

    if (!validation.ok && chosenImage !== fallbackImage) {
      slog("image_invalid_using_fallback", {
        queue_id: claimed.id,
        tried: chosenImage,
        head_status: validation.status,
        content_type: validation.contentType
      });
    }

    const hook = await pickHook(supabase, claimed.event_id);
    const { caption, template_id } = buildCaption(hook, ev);

    slog("post_prepare", {
      queue_id: claimed.id,
      event_id: claimed.event_id,
      platform: claimed.platform,
      scheduled_at: claimed.scheduled_at,
      image_url_selected: finalImage,
      image_source: imageLoggedSource,
      image_head_ok: validation.ok,
      caption_preview: caption.slice(0, 120),
      caption_template_id: template_id,
      postiz_integration_id: integrationId
    });

    const postizRes = await createPostizPost({
      base: postizBase,
      apiKey: postizKey,
      integrationId,
      platform: claimed.platform,
      scheduledIso: claimed.scheduled_at,
      caption,
      imageUrl: finalImage
    });

    slog("postiz_response", {
      queue_id: claimed.id,
      platform: claimed.platform,
      ok: postizRes.ok,
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
          resolved_image_url: finalImage,
          caption,
          caption_template_id: template_id,
          postiz_response: postizRes.body as object,
          last_error: `postiz_http_${postizRes.status}:${errText.slice(0, 800)}`,
          retry_count: claimed.retry_count + 1,
          updated_at: now
        })
        .eq("id", claimed.id);
      results.push({
        queue_id: claimed.id,
        ok: false,
        postiz_status: postizRes.status,
        postiz_body: postizRes.body
      });
      continue;
    }

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
        resolved_image_url: finalImage,
        caption,
        caption_template_id: template_id,
        postiz_response: postizRes.body as object,
        last_error: null,
        posted_at: now,
        updated_at: now
      })
      .eq("id", claimed.id);

    results.push({
      queue_id: claimed.id,
      ok: true,
      image_url: finalImage,
      image_source: imageLoggedSource,
      caption_template_id: template_id,
      postiz_status: postizRes.status
    });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...CORS, "Content-Type": "application/json" }
  });
});
