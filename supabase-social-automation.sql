-- Marcha / PartyRadar — social queue + caption history (idempotent).
-- Run in Supabase SQL after supabase-rls.sql. Uses service role from Edge Functions (bypasses RLS).

-- Optional: gallery JSON for future-proofing. Each entry: string URL or {"url":"...","featured":true}.
alter table public.events add column if not exists image_urls jsonb;

-- Caption templates used per event (avoid repetition).
create table if not exists public.social_caption_usage (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  template_id text not null,
  caption text not null,
  platform text not null,
  created_at timestamptz not null default now()
);

create index if not exists social_caption_usage_event_created_idx
  on public.social_caption_usage (event_id, created_at desc);

-- Queue for scheduled social posts (create if missing; extend if already present).
create table if not exists public.social_queue (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_id uuid not null references public.events (id) on delete cascade,
  platform text not null,
  scheduled_at timestamptz not null,
  status text not null default 'pending',
  postiz_integration_id text,
  resolved_image_url text,
  caption text,
  caption_template_id text,
  postiz_response jsonb,
  last_error text,
  retry_count int not null default 0,
  last_attempt_at timestamptz,
  posted_at timestamptz
);

alter table public.social_queue add column if not exists postiz_integration_id text;
alter table public.social_queue add column if not exists resolved_image_url text;
alter table public.social_queue add column if not exists caption text;
alter table public.social_queue add column if not exists caption_template_id text;
alter table public.social_queue add column if not exists postiz_response jsonb;
alter table public.social_queue add column if not exists last_error text;
alter table public.social_queue add column if not exists retry_count int default 0;
alter table public.social_queue add column if not exists last_attempt_at timestamptz;
alter table public.social_queue add column if not exists posted_at timestamptz;

-- Best-effort constraints (skip if already present).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'social_queue_platform_check'
      and conrelid = 'public.social_queue'::regclass
  ) then
    alter table public.social_queue
      add constraint social_queue_platform_check
      check (platform in ('instagram', 'facebook'));
  end if;
exception
  when others then null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'social_queue_status_check'
      and conrelid = 'public.social_queue'::regclass
  ) then
    alter table public.social_queue
      add constraint social_queue_status_check
      check (status in ('pending', 'processing', 'posted', 'failed', 'skipped'));
  end if;
exception
  when others then null;
end $$;

-- Fast lookup for dedupe checks (non-unique: avoids migration failures on legacy duplicates).
create index if not exists social_queue_event_platform_posted_day_idx
  on public.social_queue (event_id, platform, ((posted_at at time zone 'utc')::date))
  where status = 'posted' and posted_at is not null;

alter table public.social_caption_usage enable row level security;
alter table public.social_queue enable row level security;

grant select, insert, update, delete on table public.social_queue to authenticated;
grant select, insert on table public.social_caption_usage to authenticated;

drop policy if exists "Admins can manage social queue via role" on public.social_queue;
create policy "Admins can manage social queue via role"
on public.social_queue
for all
to authenticated
using (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
)
with check (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

drop policy if exists "Admins can read caption usage via role" on public.social_caption_usage;
create policy "Admins can read caption usage via role"
on public.social_caption_usage
for select
to authenticated
using (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);
