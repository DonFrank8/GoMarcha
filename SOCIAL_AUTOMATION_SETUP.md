# Marcha social automation — setup and QA

This document covers the Supabase queue, the `social-queue-runner` Edge Function, and **read-only** verification (no posts are published).

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
| `CHK04_event_image_when_available` | If the event has an HTTPS image (`image_urls` or `image_url`), the effective URL matches the resolver output. |
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
3. **Image in Postiz UI:** Open a scheduled post in Postiz and confirm the media matches the event’s public Supabase storage URL (not only the generic Marcha asset).
4. **Logs:** In Supabase → Edge Functions → `social-queue-runner`, confirm logs show `image_url_selected`, caption preview, and Postiz HTTP status on success/failure.
5. **Retry:** After a `failed` row, confirm `retry_count` increments and the runner picks it up again after backoff (or fix data and re-run).

## Related files

- SQL: `supabase-social-automation.sql`
- Runner: `supabase/functions/social-queue-runner/index.ts`
- Verification: `scripts/check-social-automation.js`
