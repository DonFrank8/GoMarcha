#!/usr/bin/env node
/**
 * Read-only QA checks for Marcha social automation (Supabase social_queue + events).
 * Does not publish, call Postiz, or invoke Edge Functions.
 *
 * Env:
 *   SUPABASE_URL                     – required
 *   SUPABASE_SERVICE_ROLE_KEY       – required (bypasses RLS for queue read)
 *   MARCHA_DEFAULT_SOCIAL_IMAGE_URL  – optional (fallback URL for checks 4–5)
 *   POSTIZ_INSTAGRAM_INTEGRATION_ID  – optional row fallback for instagram
 *   POSTIZ_FACEBOOK_INTEGRATION_ID   – optional row fallback for facebook
 *   SOCIAL_QA_STRICT_IMAGE           – "1"/"true" to HEAD-request image URLs (slower)
 *   SOCIAL_QA_MAX_RETRY              – default 5 (must match Edge Function)
 */

const {
  DEFAULT_SOCIAL_FALLBACK_IMAGE: DEFAULT_FALLBACK_IMAGE,
  resolveSocialPostImage,
  isPostizUploadsHost
} = require("../social-post-image.js");
const MAX_RETRY_DEFAULT = 5;

function isHttpsImageUrl(raw) {
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

function utcDayKey(iso) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function eventHasUsableEventImage(event, fallback) {
  const resolution = resolveSocialPostImage(event, { event, fallbackUrl: fallback });
  return !resolution.fallbackUsed;
}

function queueDraftUsesEventImage(row, event, fallback) {
  const resolution = resolveSocialPostImage(row, { event, fallbackUrl: fallback });
  return !resolution.fallbackUsed;
}

function captionMentionsEventFields(caption, event) {
  const cap = String(caption || "").toLowerCase();
  if (!cap) return { ok: false, reason: "empty" };
  const terms = [
    event?.name,
    event?.artist_name,
    event?.location_name,
    event?.city,
    event?.genre
  ]
    .map((t) => String(t || "").trim())
    .filter((t) => t.length >= 4);
  const hit = terms.find((t) => cap.includes(t.toLowerCase()));
  return hit ? { ok: true, term: hit } : { ok: false, reason: "no title/artist/venue/city/genre" };
}

function looksSpanish(text) {
  if (!text || typeof text !== "string") return false;
  const s = text.trim();
  if (!s.length) return false;
  const spanishSignal =
    /(¿|¡|[áéíóúñüÁÉÍÓÚÑÜ]|\b(la|el|los|las|en|con|para|más|música|noche|hoy|este|esta|detalles|vivo|directo|ciudad|plan|finde|última|llamada|vive|especial|gomarcha)\b)/i;
  return spanishSignal.test(s);
}

function rowPlatforms(row) {
  if (Array.isArray(row.platforms) && row.platforms.length) {
    return row.platforms.map((p) => String(p).toLowerCase()).filter(Boolean);
  }
  const legacy = String(row.platform || "").toLowerCase();
  return legacy ? [legacy] : ["instagram", "facebook"];
}

function integrationForRow(row, envIg, envFb) {
  const fromRow = row.postiz_integration_id && String(row.postiz_integration_id).trim();
  if (fromRow) return fromRow;
  for (const platform of rowPlatforms(row)) {
    if (platform === "instagram" && envIg) return envIg;
    if (platform === "facebook" && envFb) return envFb;
  }
  return "";
}

async function restGet(baseUrl, key, pathWithQuery) {
  const url = `${baseUrl.replace(/\/$/, "")}/rest/v1/${pathWithQuery}`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json"
    }
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function headImageOk(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
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
    return { headOk: ok, status: res.status, contentType: ct };
  } catch {
    return { headOk: false };
  } finally {
    clearTimeout(timer);
  }
}

function printResult(ok, code, detail) {
  const label = ok ? "PASS" : "FAIL";
  console.log(`[${label}] ${code}${detail ? ` – ${detail}` : ""}`);
}

async function main() {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fallbackImage = (process.env.MARCHA_DEFAULT_SOCIAL_IMAGE_URL || DEFAULT_FALLBACK_IMAGE).trim();
  const envIg = (process.env.POSTIZ_INSTAGRAM_INTEGRATION_ID || "").trim();
  const envFb = (process.env.POSTIZ_FACEBOOK_INTEGRATION_ID || "").trim();
  const strictImage = ["1", "true", "yes"].includes(
    String(process.env.SOCIAL_QA_STRICT_IMAGE || "").toLowerCase()
  );
  const maxRetry = Math.max(
    1,
    parseInt(process.env.SOCIAL_QA_MAX_RETRY || String(MAX_RETRY_DEFAULT), 10) || MAX_RETRY_DEFAULT
  );

  if (!baseUrl || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  console.log("Marcha social automation QA (read-only)\n");

  let queue = [];
  const eventsMap = new Map();
  let recurringMasters = [];

  try {
    queue = await restGet(baseUrl, key, `social_queue?select=*&order=scheduled_at.asc&limit=500`);
    if (!Array.isArray(queue)) {
      console.error("Unexpected response for social_queue:", queue);
      process.exit(1);
    }

    const eventIds = [...new Set(queue.map((r) => r.event_id).filter(Boolean))];
    if (eventIds.length) {
      const inList = eventIds.map((id) => `"${id}"`).join(",");
      const evs = await restGet(
        baseUrl,
        key,
        `events?id=in.(${inList})&select=id,status,image_url,image_urls,name,artist_name,location_name,city,genre,original_event_id,is_recurring,recurring_social_enabled,event_date`
      );
      if (Array.isArray(evs)) {
        for (const e of evs) {
          eventsMap.set(e.id, e);
        }
      }
    }

    recurringMasters = await restGet(
      baseUrl,
      key,
      "events?is_recurring=eq.true&recurring_social_enabled=eq.true&status=eq.approved&select=id,name,recurrence_type,recurrence_weekday,event_date,recurrence_start_date"
    );
    if (!Array.isArray(recurringMasters)) recurringMasters = [];
  } catch (e) {
    console.error("Failed to load Supabase data:", e.message || e);
    process.exit(1);
  }

  let fail = 0;

  // --- CHK01: every queue row references an approved event ---
  {
    const bad = [];
    for (const row of queue) {
      const ev = eventsMap.get(row.event_id);
      if (!ev) {
        bad.push(`${row.id}: missing event ${row.event_id}`);
        continue;
      }
      if (String(ev.status || "").toLowerCase() !== "approved") {
        bad.push(`${row.id}: event ${row.event_id} status=${ev.status}`);
      }
    }
    if (bad.length) {
      fail++;
      printResult(false, "CHK01_jobs_for_approved_events", `${bad.length} issue(s): ${bad.slice(0, 5).join("; ")}${bad.length > 5 ? "…" : ""}`);
    } else if (queue.length === 0) {
      printResult(true, "CHK01_jobs_for_approved_events", "no queue rows");
    } else {
      printResult(true, "CHK01_jobs_for_approved_events", `${queue.length} row(s) → approved`);
    }
  }

  // --- CHK02: no duplicate (event + post_stage + UTC day) for non-skipped rows ---
  {
    const bucket = new Map();
    for (const row of queue) {
      if (row.status === "skipped") continue;
      const day = utcDayKey(row.scheduled_at);
      const stage = String(row.post_stage || "").trim();
      const occurrence = String(row.event_date || row.occurrence_date || "").trim();
      const k = `${row.event_id}|${stage}|${occurrence}|${day}`;
      if (!bucket.has(k)) bucket.set(k, []);
      bucket.get(k).push(row);
    }
    const dups = [];
    for (const [, rows] of bucket) {
      if (rows.length > 1) {
        dups.push(
          rows.map((r) => ({
            id: r.id,
            status: r.status,
            platforms: rowPlatforms(r),
            post_stage: r.post_stage || null
          }))
        );
      }
    }
    if (dups.length) {
      fail++;
      printResult(false, "CHK02_no_duplicate_event_post_stage", JSON.stringify(dups.slice(0, 3)));
    } else {
      printResult(
        true,
        "CHK02_no_duplicate_event_post_stage",
        "one campaign row per event/post_stage/UTC day (platforms[] on row)"
      );
    }
  }

  // --- CHK03–05: image URL, event image preference, fallback only when missing ---
  {
    const invalidFormat = [];
    const headFails = [];
    const eventImageWrong = [];
    const fallbackMisuse = [];

    for (const row of queue) {
      const ev = eventsMap.get(row.event_id);
      if (!ev) continue;
      const expected = resolveSocialPostImage(row, { event: ev, fallbackUrl: fallbackImage });
      const resolved = String(expected.selectedImage || "").trim();

      if (!isHttpsImageUrl(resolved)) {
        invalidFormat.push(`${row.id}: "${resolved}"`);
        continue;
      }
      if (strictImage) {
        const h = await headImageOk(resolved);
        if (!h.headOk) headFails.push(`${row.id}: ${resolved}`);
      }
      if (eventHasUsableEventImage(ev, fallbackImage)) {
        if (expected.fallbackUsed) {
          fallbackMisuse.push(row.id);
        } else if (expected.source === "fallback_generic") {
          fallbackMisuse.push(row.id);
        }
      } else if (!expected.fallbackUsed && expected.source !== "fallback_generic") {
        /* event has no dedicated image — generic fallback is allowed */
      } else if (expected.fallbackUsed) {
        /* no event image — fallback ok */
      }

      if (queueDraftUsesEventImage(row, ev, fallbackImage) && expected.fallbackUsed) {
        eventImageWrong.push(`${row.id}: event image available but fallback selected`);
      }
    }

    if (invalidFormat.length) {
      fail++;
      printResult(false, "CHK03_valid_image_url", invalidFormat.slice(0, 5).join("; "));
    } else {
      printResult(
        true,
        "CHK03_valid_image_url",
        strictImage ? "HTTPS + HEAD image/*" : "HTTPS format (SOCIAL_QA_STRICT_IMAGE=1 for HEAD)"
      );
    }

    if (strictImage && headFails.length) {
      fail++;
      printResult(false, "CHK03b_image_reachable", headFails.slice(0, 5).join("; "));
    } else if (strictImage) {
      printResult(true, "CHK03b_image_reachable", "HEAD/GET returned image/*");
    }

    if (eventImageWrong.length) {
      fail++;
      printResult(false, "CHK04_event_image_when_available", eventImageWrong.slice(0, 5).join("; "));
    } else {
      printResult(true, "CHK04_event_image_when_available", "event URL or Postiz CDN after upload");
    }

    if (fallbackMisuse.length) {
      fail++;
      printResult(false, "CHK05_fallback_only_when_missing", `row id(s): ${fallbackMisuse.slice(0, 8).join(", ")}`);
    } else {
      printResult(true, "CHK05_fallback_only_when_missing", `fallback ref: ${fallbackImage.slice(0, 56)}…`);
    }
  }

  // --- CHK06–08: captions (rows touched by runner: posted / failed) ---
  {
    const captionRows = queue.filter((r) => r.status === "posted" || r.status === "failed");
    const emptyCaption = captionRows.filter((r) => !String(r.caption || "").trim());
    const notSpanish = captionRows.filter((r) => String(r.caption || "").trim() && !looksSpanish(r.caption));
    const byEvent = new Map();
    for (const row of queue) {
      const c = String(row.caption || "").trim();
      if (!c) continue;
      if (!byEvent.has(row.event_id)) byEvent.set(row.event_id, []);
      byEvent.get(row.event_id).push(c);
    }
    const duplicateCaptions = [];
    for (const [eid, list] of byEvent) {
      const uniq = new Set(list);
      if (uniq.size < list.length) duplicateCaptions.push(eid);
    }

    if (captionRows.length === 0) {
      printResult(true, "CHK06_caption_non_empty", "no posted/failed rows (caption optional on pending)");
    } else if (emptyCaption.length) {
      fail++;
      printResult(false, "CHK06_caption_non_empty", emptyCaption.map((r) => r.id).slice(0, 8).join(", "));
    } else {
      printResult(true, "CHK06_caption_non_empty", `${captionRows.length} posted/failed with caption`);
    }

    if (captionRows.length === 0) {
      printResult(true, "CHK07_caption_spanish", "skipped (no posted/failed)");
    } else if (notSpanish.length) {
      fail++;
      printResult(false, "CHK07_caption_spanish", notSpanish.map((r) => r.id).slice(0, 8).join(", "));
    } else {
      printResult(true, "CHK07_caption_spanish", "heuristic marker present (¿¡ñ… or common words)");
    }

    if ([...byEvent.keys()].length === 0) {
      printResult(true, "CHK08_caption_variation_per_event", "no captioned rows");
    } else if (duplicateCaptions.length) {
      fail++;
      printResult(false, "CHK08_caption_variation_per_event", `event_id(s): ${duplicateCaptions.join(", ")}`);
    } else {
      printResult(true, "CHK08_caption_variation_per_event", "no duplicate caption text per event");
    }
  }

  // --- CHK09: Postiz integration id on row or env ---
  {
    const missing = [];
    for (const row of queue) {
      if (row.status === "skipped") continue;
      const pid = integrationForRow(row, envIg, envFb);
      if (!pid) missing.push(`${row.id} (${rowPlatforms(row).join("+")})`);
    }
    if (missing.length) {
      fail++;
      printResult(false, "CHK09_postiz_integration_ids", missing.slice(0, 8).join("; "));
    } else {
      printResult(
        true,
        "CHK09_postiz_integration_ids",
        queue.length ? "row or POSTIZ_* env set" : "no active queue rows"
      );
    }
  }

  // --- CHK10a: platforms[] includes instagram + facebook on active drafts ---
  {
    const bad = [];
    for (const row of queue) {
      if (row.status === "skipped" || row.status === "posted") continue;
      const plats = rowPlatforms(row);
      if (!plats.includes("instagram") || !plats.includes("facebook")) {
        bad.push(`${row.id} (${plats.join("+") || "none"})`);
      }
    }
    if (bad.length) {
      fail++;
      printResult(false, "CHK10a_platforms_instagram_facebook", bad.slice(0, 8).join("; "));
    } else {
      printResult(true, "CHK10a_platforms_instagram_facebook", "active rows include instagram + facebook");
    }
  }

  // --- CHK11: recurring masters have a future queue row (child or master) ---
  {
    const nowMs = Date.now();
    const missing = [];
    for (const master of recurringMasters) {
      const futureRows = queue.filter((row) => {
        if (row.status === "skipped") return false;
        const scheduled = new Date(row.scheduled_at).getTime();
        if (!Number.isFinite(scheduled) || scheduled <= nowMs) return false;
        const ev = eventsMap.get(row.event_id);
        if (!ev) return false;
        if (String(ev.id) === String(master.id)) return true;
        return String(ev.original_event_id || "") === String(master.id);
      });
      if (!futureRows.length) missing.push(master.id);
    }
    if (recurringMasters.length === 0) {
      printResult(true, "CHK11_recurring_future_rows", "no recurring_social_enabled masters");
    } else if (missing.length) {
      fail++;
      printResult(false, "CHK11_recurring_future_rows", `master id(s): ${missing.slice(0, 8).join(", ")}`);
    } else {
      printResult(true, "CHK11_recurring_future_rows", `${recurringMasters.length} master(s) with upcoming queue row(s)`);
    }
  }

  // --- CHK12: captions mention event-specific fields when available ---
  {
    const weak = [];
    for (const row of queue) {
      if (row.status === "skipped") continue;
      const caption = String(row.caption || "").trim();
      if (!caption) continue;
      const ev = eventsMap.get(row.event_id);
      if (!ev) continue;
      const hasSignal =
        String(ev.name || "").trim().length >= 4 ||
        String(ev.artist_name || "").trim().length >= 4 ||
        String(ev.location_name || "").trim().length >= 4 ||
        String(ev.city || "").trim().length >= 4;
      if (!hasSignal) continue;
      const check = captionMentionsEventFields(caption, ev);
      if (!check.ok) weak.push(`${row.id}: ${check.reason}`);
    }
    if (weak.length) {
      fail++;
      printResult(false, "CHK12_caption_event_specific", weak.slice(0, 8).join("; "));
    } else {
      printResult(true, "CHK12_caption_event_specific", "caption cites title/artist/venue/city/genre when present");
    }
  }

  // --- CHK10: failed jobs still retryable (retry_count < max) ---
  {
    const exhausted = queue.filter((r) => r.status === "failed" && Number(r.retry_count) >= maxRetry);
    const canRetry = queue.filter((r) => r.status === "failed" && Number(r.retry_count) < maxRetry);

    if (exhausted.length) {
      fail++;
      printResult(false, "CHK10_failed_retryable", `exhausted retry_count≥${maxRetry}: ${exhausted.map((r) => r.id).join(", ")}`);
    } else {
      printResult(
        true,
        "CHK10_failed_retryable",
        queue.filter((r) => r.status === "failed").length
          ? `${canRetry.length} failed row(s) still under retry cap (${maxRetry})`
          : "no failed rows"
      );
    }
  }

  console.log("");
  if (fail === 0) {
    console.log("OVERALL: PASS (all checks passed)");
    process.exit(0);
  }
  console.log(`OVERALL: FAIL (${fail} check(s) failed)`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
