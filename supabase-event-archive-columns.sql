-- Marcha: optional columns for archive / reuse lineage (idempotent).
-- Run in Supabase SQL after core events table exists.

alter table public.events add column if not exists archived_at timestamptz;

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

-- Draft copies can omit a date until the editor fills it in.
alter table public.events alter column event_date drop not null;
