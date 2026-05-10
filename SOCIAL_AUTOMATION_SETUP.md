# Marcha Social Automation Setup

This document explains how to set up the automated social media pipeline for approved events.

## 1) Run SQL migrations

Run these SQL files in Supabase SQL Editor:

1. `supabase-social-automation.sql`
2. `supabase-qr-tracking.sql` (optional, if you also want QR/source attribution)

The social automation migration creates:

- `social_queue` table
- unique index on `(event_id, post_stage)` to avoid duplicate jobs
- trigger on `events.status` changes to `approved`
- helper function `enqueue_social_jobs_for_event(uuid, boolean)`
- RLS policies for admin usage

## 2) Deploy the Edge Function

Function name: `process-social-queue`

Files:

- `supabase/functions/process-social-queue/index.ts`
- `supabase/functions/process-social-queue/caption.ts`
- `supabase/functions/process-social-queue/postiz.ts`

Deploy:

```bash
supabase functions deploy process-social-queue
```

## 3) Configure environment variables

Set these for the Edge Function environment:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POSTIZ_API_KEY`
- `POSTIZ_BASE_URL`

Optional:

- `POSTIZ_INTEGRATION_IDS` (comma-separated).  
  If not set, defaults to:
  - Instagram: `cmp0a20b201b1p40yg9srpshq`
  - Facebook: `cmp0a44690059qg0ywxs10b6d`

If you later add AI caption generation:

- `OPENAI_API_KEY` or `OPENROUTER_API_KEY`

## 4) Schedule queue processing

Invoke `process-social-queue` regularly (for example every 10 minutes) using Supabase scheduled functions / cron.

Expected behavior:

- picks due jobs (`scheduled_for <= now()`)
- processes only `pending` and `failed` jobs with attempts `< 3`
- updates status to `scheduled`, `published`, `failed`, or `skipped`

## 5) Admin/debug actions in dashboard

In the admin moderation workspace:

- enter Event UUID
- **Queue laden** (load jobs)
- **Jobs erzeugen** (manual generation)
- **Fehlgeschlagene retry** (reset failed to pending)
- **Pending auf skipped** (mark pending/failed skipped)

This is useful for manual recovery and verification.

## 6) Logging and safety

The Edge Function logs only safe context:

- `event_id`
- `post_stage`
- `status`

No API secrets are logged.

## 7) Notes

- Approval flow remains safe: trigger function catches internal errors and avoids blocking event approvals.
- Captions are generated in Spanish with stage-specific tone and CTA to `gomarcha.com`.
- Social image uses the same event image URL (`event.image_url`).
