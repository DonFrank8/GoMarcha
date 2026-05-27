-- Recurring weekly auto-prep: ensure social_queue + events columns match admin.js payloads.
-- Run in Supabase SQL Editor (idempotent). Safe to re-run.
-- occurrence_date is NOT a column — admin uses event_date on social_queue rows.

-- platforms[] (multi-platform single row)
alter table public.social_queue add column if not exists platforms text[];

update public.social_queue
set platforms = array[platform]::text[]
where platforms is null
  and platform is not null
  and trim(platform) <> '';

update public.social_queue
set platforms = array['instagram', 'facebook']::text[]
where platforms is null
   or cardinality(platforms) = 0;

alter table public.social_queue
  alter column platforms set default array['instagram', 'facebook']::text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'social_queue_platforms_check'
      and conrelid = 'public.social_queue'::regclass
  ) then
    alter table public.social_queue
      add constraint social_queue_platforms_check
      check (
        platforms is null
        or (
          cardinality(platforms) >= 1
          and platforms <@ array['instagram', 'facebook']::text[]
        )
      );
  end if;
exception
  when others then null;
end $$;

-- Recurring post stages
alter table public.social_queue add column if not exists post_stage text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'social_queue_post_stage_check'
      and conrelid = 'public.social_queue'::regclass
  ) then
    alter table public.social_queue
      add constraint social_queue_post_stage_check
      check (
        post_stage is null
        or post_stage in ('early_reminder', 'tomorrow', 'last_call')
      );
  end if;
exception
  when others then null;
end $$;

-- Recurring social defaults (opt-out persists explicit disable)
alter table public.events add column if not exists recurring_social_opt_out boolean not null default false;

-- Child events for recurring series
alter table public.events add column if not exists original_event_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'events_original_event_id_fkey'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_original_event_id_fkey
      foreign key (original_event_id) references public.events (id) on delete set null;
  end if;
exception
  when others then null;
end $$;

-- Notify PostgREST to reload schema cache after migration
notify pgrst, 'reload schema';
