-- Social automation queue for Postiz publishing.
create extension if not exists pgcrypto;

create table if not exists public.social_queue (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  platform text not null default 'instagram,facebook',
  post_stage text not null check (post_stage in ('approval', 'two_days_before', 'one_day_before', 'same_day', 'last_call')),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'published', 'failed', 'skipped')),
  caption text,
  image_url text,
  postiz_response jsonb,
  error_message text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_queue add column if not exists platform text not null default 'instagram,facebook';
alter table public.social_queue add column if not exists caption text;
alter table public.social_queue add column if not exists image_url text;
alter table public.social_queue add column if not exists postiz_response jsonb;
alter table public.social_queue add column if not exists error_message text;
alter table public.social_queue add column if not exists attempts int not null default 0;
alter table public.social_queue add column if not exists created_at timestamptz not null default now();
alter table public.social_queue add column if not exists updated_at timestamptz not null default now();

create unique index if not exists uq_social_queue_event_stage on public.social_queue(event_id, post_stage);
create index if not exists idx_social_queue_status_schedule on public.social_queue(status, scheduled_for);

create or replace function public.set_social_queue_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_social_queue_set_updated_at on public.social_queue;
create trigger trg_social_queue_set_updated_at
before update on public.social_queue
for each row
execute function public.set_social_queue_updated_at();

create or replace function public.enqueue_social_jobs_for_event(
  p_event_id uuid,
  p_force boolean default false
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
  v_event_date date;
  v_event_time text;
  v_hour int := 20;
  v_minute int := 0;
  v_timezone text := 'Europe/Madrid';
  v_event_start timestamptz;
  v_same_day_morning timestamptz;
  v_inserted int := 0;
begin
  -- Only allow authenticated admins to call manually.
  if auth.role() is not null and coalesce(auth.jwt() ->> 'role', '') <> 'admin' then
    raise exception 'Admin role required for enqueue_social_jobs_for_event';
  end if;

  select *
  into v_event
  from public.events
  where id = p_event_id;

  if not found then
    return 0;
  end if;

  if lower(coalesce(v_event.status, '')) <> 'approved' then
    return 0;
  end if;

  v_event_date := coalesce(v_event.event_date::date, (now() at time zone v_timezone)::date);
  v_event_time := nullif(trim(coalesce(v_event.event_time, '')), '');

  if v_event_time is not null and v_event_time ~ '^\d{1,2}:\d{2}' then
    v_hour := greatest(0, least(23, split_part(v_event_time, ':', 1)::int));
    v_minute := greatest(0, least(59, split_part(v_event_time, ':', 2)::int));
  end if;

  v_event_start := (v_event_date::timestamp + make_interval(hours => v_hour, mins => v_minute)) at time zone v_timezone;
  v_same_day_morning := (v_event_date::timestamp + time '09:00') at time zone v_timezone;

  if p_force then
    delete from public.social_queue where event_id = p_event_id;
  end if;

  insert into public.social_queue (
    event_id,
    platform,
    post_stage,
    scheduled_for,
    status,
    image_url,
    caption
  )
  select
    p_event_id,
    'instagram,facebook',
    stage_rows.post_stage,
    stage_rows.scheduled_for,
    'pending',
    coalesce(v_event.image_url, ''),
    null
  from (
    values
      ('approval'::text, now()),
      ('two_days_before'::text, v_event_start - interval '2 days'),
      ('one_day_before'::text, v_event_start - interval '1 day'),
      ('same_day'::text, v_same_day_morning),
      ('last_call'::text, v_event_start - interval '3 hours')
  ) as stage_rows(post_stage, scheduled_for)
  on conflict (event_id, post_stage) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
exception
  when others then
    raise warning 'enqueue_social_jobs_for_event failed for event %: %', p_event_id, sqlerrm;
    return 0;
end;
$$;

create or replace function public.enqueue_social_queue_on_event_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.status, '')) = 'approved' and lower(coalesce(old.status, '')) <> 'approved' then
    perform public.enqueue_social_jobs_for_event(new.id, false);
  end if;
  return new;
exception
  when others then
    raise warning 'enqueue_social_queue_on_event_approved failed for event %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_enqueue_social_queue_on_approval on public.events;
create trigger trg_enqueue_social_queue_on_approval
after update of status on public.events
for each row
execute function public.enqueue_social_queue_on_event_approved();

alter table public.social_queue enable row level security;

grant select, insert, update on public.social_queue to authenticated;
grant execute on function public.enqueue_social_jobs_for_event(uuid, boolean) to authenticated;

drop policy if exists "Admin can select social queue" on public.social_queue;
create policy "Admin can select social queue"
on public.social_queue
for select
to authenticated
using (coalesce(auth.jwt() ->> 'role', '') = 'admin');

drop policy if exists "Admin can update social queue" on public.social_queue;
create policy "Admin can update social queue"
on public.social_queue
for update
to authenticated
using (coalesce(auth.jwt() ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() ->> 'role', '') = 'admin');

drop policy if exists "Admin can insert social queue" on public.social_queue;
create policy "Admin can insert social queue"
on public.social_queue
for insert
to authenticated
with check (coalesce(auth.jwt() ->> 'role', '') = 'admin');
