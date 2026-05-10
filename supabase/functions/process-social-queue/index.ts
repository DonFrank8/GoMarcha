import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildSpanishCaption, type SocialStage } from "./caption.ts";
import { createPostizPost } from "./postiz.ts";

type SocialQueueRow = {
  id: string;
  event_id: string;
  post_stage: SocialStage;
  scheduled_for: string;
  status: "pending" | "scheduled" | "published" | "failed" | "skipped";
  caption: string | null;
  image_url: string | null;
  attempts: number;
  platform: string;
};

type EventRow = {
  id: string;
  status: string | null;
  title: string | null;
  name: string | null;
  event_date: string | null;
  event_time: string | null;
  location_name: string | null;
  city: string | null;
  country: string | null;
  image_url: string | null;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const POSTIZ_API_KEY = Deno.env.get("POSTIZ_API_KEY") || "";
const POSTIZ_BASE_URL = Deno.env.get("POSTIZ_BASE_URL") || "";
const DEFAULT_INTEGRATION_IDS = "cmp0a20b201b1p40yg9srpshq,cmp0a44690059qg0ywxs10b6d";
const POSTIZ_INTEGRATION_IDS = (Deno.env.get("POSTIZ_INTEGRATION_IDS") || DEFAULT_INTEGRATION_IDS)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function eventPublicUrl(eventId: string): string {
  return `https://www.gomarcha.com/?event_id=${encodeURIComponent(eventId)}`;
}

async function loadDueJobs(limit = 25): Promise<SocialQueueRow[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("social_queue")
    .select("*")
    .in("status", ["pending", "failed"])
    .lt("attempts", 3)
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message || "Unable to load social queue.");
  return (data || []) as SocialQueueRow[];
}

async function loadEvent(eventId: string): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw new Error(error.message || "Unable to load event.");
  return (data || null) as EventRow | null;
}

async function updateQueueRow(job: SocialQueueRow, patch: Partial<SocialQueueRow> & Record<string, unknown>) {
  const { error } = await supabase
    .from("social_queue")
    .update({
      ...patch,
      updated_at: new Date().toISOString()
    })
    .eq("id", job.id);
  if (error) throw new Error(error.message || "Unable to update social queue row.");
}

async function processSingleJob(job: SocialQueueRow) {
  const nextAttempts = Number(job.attempts || 0) + 1;
  try {
    const event = await loadEvent(job.event_id);
    if (!event || String(event.status || "").toLowerCase() !== "approved") {
      await updateQueueRow(job, {
        status: "skipped",
        attempts: nextAttempts,
        error_message: "Event missing or not approved."
      });
      console.log(`[social-queue] event_id=${job.event_id} stage=${job.post_stage} status=skipped`);
      return { status: "skipped" };
    }

    const caption = (job.caption || "").trim() || buildSpanishCaption(event, job.post_stage, eventPublicUrl(event.id));
    const imageUrl = String(event.image_url || job.image_url || "").trim();
    const postizResult = await createPostizPost({
      caption,
      imageUrl,
      scheduledFor: job.scheduled_for,
      integrationIds: POSTIZ_INTEGRATION_IDS,
      baseUrl: POSTIZ_BASE_URL,
      apiKey: POSTIZ_API_KEY
    });

    await updateQueueRow(job, {
      status: postizResult.status,
      attempts: nextAttempts,
      caption,
      image_url: imageUrl,
      postiz_response: postizResult.payload,
      error_message: null
    });
    console.log(`[social-queue] event_id=${job.event_id} stage=${job.post_stage} status=${postizResult.status}`);
    return { status: postizResult.status };
  } catch (error) {
    await updateQueueRow(job, {
      status: "failed",
      attempts: nextAttempts,
      error_message: error instanceof Error ? error.message : String(error)
    });
    console.log(`[social-queue] event_id=${job.event_id} stage=${job.post_stage} status=failed`);
    return { status: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST" && request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const jobs = await loadDueJobs();
    const summary = {
      total: jobs.length,
      scheduled: 0,
      published: 0,
      failed: 0,
      skipped: 0
    };

    for (const job of jobs) {
      const result = await processSingleJob(job);
      if (result.status in summary) {
        summary[result.status as keyof typeof summary] += 1;
      }
    }

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});
