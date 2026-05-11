# Marcha social automation — setup and QA

This document covers the Supabase queue, the `social-queue-runner` Edge Function, and **read-only** verification (no posts are published).

## Edge Function — scheduling (hard rules)

The runner **never** sends a Postiz `date` that is **on or after the event start**. Event start is computed from:

- **`events.event_date`** + **`events.event_time`** (wall clock) when `recurrence_type` is `none` or empty, and  
- **`events.recurrence_start_date`** + **`events.event_time`** when the event is recurring.

Wall times are interpreted in **`MARCHA_EVENT_TIMEZONE`** (default **`Europe/Berlin`**).

Behaviour:

- If **now ≥ event start** → job **`skipped`** (`event_already_started_or_past`). No post.
- If **`social_queue.scheduled_at` ≥ event start** (ISO parse) → **`skipped`** (`queue_scheduled_after_event_start`).
- Otherwise the effective Postiz time is derived from the queue row and clamped so it is **always &lt; event start** and, when not in the “last call” window, **≤ event start − 2 hours**.
- **Last call:** if the system is already within **2 hours** of event start, the post is scheduled **as soon as possible** (`now + 45s`), still strictly **before** event start (otherwise skip).
- **Same calendar day** (in the event timezone): if the queue time falls in the **afternoon (≥ 15:00)** before the event, it is clamped toward a **morning slot (~10:30)** when that remains valid and before the 2‑hour cutoff.

Logs: `schedule_resolved`, `schedule_skip` (with reason and trace).

## Edge Function — Postiz images

Postiz `posts:create` requires media `path` values on **`uploads.postiz.com`**. The runner:

1. Resolves the event (or fallback) **source** HTTPS URL as before.
2. If the source is not already on `uploads.postiz.com`, it **downloads** the file and **POST**s multipart form field `file` to **`POST {POSTIZ_API_BASE}/upload`** (same base as `/posts`).
3. Uses the JSON response **`id`** and **`path`** in the post body’s `image` array.
4. Persists **`social_queue.resolved_image_url`** as the Postiz **`path`** after a successful upload (and after a successful post). Upload failures increment **`retry_count`** like other failures.

Postiz rate limit: **30 requests/hour** across the API (each job uses at least **upload + posts**).

## Automated QA script (recommended)

**Script:** `scripts/check-social-automation.js`  
**Safe:** read-only `GET` requests to Supabase REST; does not call Postiz or the Edge Function.

### Prerequisites

- Node.js **18+** (includes `fetch`).
- A Supabase **service role** key (required to read `social_queue` and join `events` under RLS).

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Yes | Project URL (`https://<ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (keep local / CI secret) |
| `MARCHA_DEFAULT_SOCIAL_IMAGE_URL` | No | Must match Edge Function fallback when checking CHK04–05 (default: `https://gomarcha.com/assets/logo.png`) |
| `MARCHA_EVENT_TIMEZONE` | No | IANA zone for interpreting `event_date` + `event_time` (default `Europe/Berlin`) |
| `POSTIZ_INSTAGRAM_INTEGRATION_ID` | No | Default Postiz integration id for `platform=instagram` when row has null `postiz_integration_id` |
| `POSTIZ_FACEBOOK_INTEGRATION_ID` | No | Same for `facebook` |
| `SOCIAL_QA_STRICT_IMAGE` | No | Set to `1` or `true` to **HEAD** each image URL (slower; catches broken URLs) |
| `SOCIAL_QA_MAX_RETRY` | No | Must match runner (default **5**) for CHK10 |

**Never** commit keys. Use `.env` locally (not tracked) or your CI secret store.

### Run

```bash
export SUPABASE_URL="https://YOUR_REF.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Optional: match production secrets
export MARCHA_DEFAULT_SOCIAL_IMAGE_URL="https://…"
export POSTIZ_INSTAGRAM_INTEGRATION_ID="…"
export POSTIZ_FACEBOOK_INTEGRATION_ID="…"

node scripts/check-social-automation.js
```

Optional stricter image checks:

```bash
export SOCIAL_QA_STRICT_IMAGE=1
node scripts/check-social-automation.js
```

Exit code **0** = all checks **PASS**, **1** = at least one **FAIL** or startup error (`OVERALL: PASS` / `OVERALL: FAIL`).

### What the script validates (aligned with product rules)

| Code | Rule |
|------|------|
| `CHK01_jobs_for_approved_events` | Every `social_queue` row points at an `events` row with `status = approved`. |
| `CHK02_no_duplicate_event_post_stage` | No two non-`skipped` rows share the same **event** + **platform** (post stage: `instagram` \| `facebook`) + **UTC calendar day** of `scheduled_at`. |
| `CHK03_valid_image_url` | Each row has a resolvable HTTPS image (uses `resolved_image_url` when set, else the same resolver as the Edge Function). |
| `CHK03b_image_reachable` | Only when `SOCIAL_QA_STRICT_IMAGE=1`: URL returns an `image/*` response. |
| `CHK04_event_image_when_available` | If the event has an HTTPS image, the effective URL is either the same as the resolver output **or** a `uploads.postiz.com` URL (after Postiz upload). |
| `CHK05_fallback_only_when_missing` | If the event has a real image, the effective URL must not be the generic fallback. |
| `CHK06_caption_non_empty` | Rows with `status` in `posted`, `failed` must have a non-empty `caption` (pending may still be empty). |
| `CHK07_caption_spanish` | Same rows: heuristic for Spanish (punctuation, accents, or common Spanish tokens). Tune copy if false positives. |
| `CHK08_caption_variation_per_event` | For each `event_id`, all non-empty captions must be **pairwise distinct** (IG + FB must not reuse identical text). |
| `CHK09_postiz_integration_ids` | Each non-`skipped` row has `postiz_integration_id`, or the matching `POSTIZ_*` env id is set. |
| `CHK10_failed_retryable` | No `failed` row may have `retry_count` ≥ max (default 5), so jobs remain eligible for retry. |

**Schema note:** There is no separate `post_stage` column; **`platform`** is the post stage in the database.

## Manual QA checklist (optional)

Use when debugging or before a release if you want human eyes on top of the script.

1. **Approved-only:** In Supabase Table Editor, confirm each `social_queue.event_id` joins to `events.status = approved`.
2. **Single slot per stage/day:** For each event, only one Instagram and one Facebook job per UTC day (unless older rows are `skipped`).
3. **Image in Postiz UI:** Open a scheduled post and confirm the asset is correct visually (stored URL will be `uploads.postiz.com/…` after upload).
4. **Logs:** In Supabase → Edge Functions → `social-queue-runner`, confirm logs show `event_image_audit`, `event_image_selected`, `event_image_postiz_uploaded`, `schedule_resolved`, `postiz_upload_*`, `source_image_url`, `postiz_image_path`, caption preview, and Postiz HTTP status on success/failure.
5. **Retry:** After a `failed` row, confirm `retry_count` increments and the runner picks it up again after backoff (or fix data and re-run).

## Regression test — event id `34`

Use this when **`public.events.id = 34`** applies in your database (integer PK). If `id` is **UUID**, replace `where id = 34` with `where id = '<your-uuid>'`.

### 1) Inspect the row

```sql
select id, name, status, event_date, event_time,
       recurrence_type, recurrence_start_date,
       image_url, image_urls
from public.events
where id = 34;
```

Confirm `status = 'approved'`, `event_date` / `event_time` (or recurrence fields) are set, and `image_url` / `image_urls` point at a real **HTTPS** event image (not only `gomarcha.com` logo/QR paths).

### 2) Schedule-after-start (expect **skipped**)

Insert a queue row whose `scheduled_at` is **after** the computed event start (ISO string in the past or future as needed), then run the Edge Function with `queue_id` set to that row. Expect **`status = skipped`**, `last_error` like `schedule:queue_scheduled_after_event_start` or `schedule:event_already_started_or_past`, and logs **`schedule_skip`**.

### 3) Valid job (expect **posted** or Postiz success path)

Insert `social_queue` with `event_id = 34`, `scheduled_at` **before** event start and **before** `now()` if you need the worker to pick it up (remember the worker only selects rows with `scheduled_at <= now()` unless you adjust for testing). Invoke the function. In logs, find **`event_image_audit`** (raw `image_url` / `image_urls`), **`event_image_selected`** (`selected_source_image_url`), **`event_image_postiz_uploaded`**, and **`schedule_resolved`** (`effective_post_at` strictly before event start).

### 4) Image sanity

Confirm `selected_source_image_url` is the **Supabase (or other) event image URL**, not a generic Marcha logo/QR path, unless the event truly has no non-generic reachable image.

## Related files

- SQL: `supabase-social-automation.sql`
- Runner: `supabase/functions/social-queue-runner/index.ts`
- Verification: `scripts/check-social-automation.js`
