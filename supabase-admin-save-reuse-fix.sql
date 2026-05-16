-- Admin save + archive reuse: idempotent schema helpers (RLS unchanged).
-- Run in Supabase SQL if admin updates/inserts fail due to missing columns or NOT NULL event_date.
-- Safe to re-run.

-- UUID lineage for "Erneut verwenden" (optional FK if constraint already exists elsewhere).
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

-- Draft copies: allow NULL event_date until the editor sets a date (admin reuse / pending drafts).
alter table public.events alter column event_date drop not null;

-- Optional alias used by some clients; harmless if unused.
alter table public.events add column if not exists is_featured boolean default false;
