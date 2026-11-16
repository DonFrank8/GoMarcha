-- ============================================================================
-- #29  Social-Wochenplaner auf dem Server – Grundlage (16.11.2026)
-- ============================================================================
-- Zweck (Rat 16.11.2026, Freigabe Frank):
--   * Jeder Platz des Wochenplans bekommt einen festen Schlüssel `slot_key`
--     (z. B. `2026-W47:thu_collection`). Ein eindeutiger Index verhindert
--     Doppelposts – auch wenn Admin-Planer (Browser) und Server-Planer
--     gleichzeitig laufen.
--   * Die Events eines Sammelposts stehen in einer eigenen Spalte
--     `collection_event_ids` (bisher nur im JSON `postiz_response`).
--   * `occurrence_date` = Termin des Hauptevents (wichtig bei Serien, wo nur der
--     Master in der Datenbank liegt).
--   * View `social_event_coverage`: In welchem Post steckt welches Event?
--   * Tabelle `social_planner_settings`: Not-Aus, Freigabepflicht, Testmodus.
--
-- Ändert KEINE bestehenden Posts inhaltlich, löscht nichts, startet keinen Cron.
-- Idempotent: kann mehrfach ausgeführt werden.
-- Abhängig von #6, #8, #10 (social_queue mit status/post_stage/platforms).
-- ============================================================================

-- 1) Neue Spalten -------------------------------------------------------------
alter table public.social_queue add column if not exists slot_key text;
alter table public.social_queue add column if not exists collection_event_ids text[];
alter table public.social_queue add column if not exists occurrence_date date;

comment on column public.social_queue.slot_key is
  'Fester Platz im Wochenplan: <ISO-Woche>:<slot_id>, z. B. 2026-W47:thu_collection. Eindeutig (außer skipped).';
comment on column public.social_queue.collection_event_ids is
  'Weitere Events eines Sammelposts (IDs als Text; Serien als Master-ID). Hauptevent steht in event_id.';
comment on column public.social_queue.occurrence_date is
  'Termin des Hauptevents (bei Serien das Datum des Einzeltermins).';

-- 2) post_stage: bisherige Werte (live geprüft 16.11.2026) + 'story' ------------
--    NOT VALID: bestehende Zeilen werden nicht geprüft, nur neue/geänderte.
do $$
begin
  alter table public.social_queue drop constraint if exists social_queue_post_stage_check;
  alter table public.social_queue
    add constraint social_queue_post_stage_check
    check (
      post_stage is null
      or post_stage in ('early_reminder', 'tomorrow', 'last_call', 'event_day', 'collection', 'story')
    ) not valid;
end $$;

-- 3) Backfill: Mitglieder aus dem JSON übernehmen -----------------------------
update public.social_queue
set collection_event_ids = array(
  select jsonb_array_elements_text(postiz_response -> '_marcha_collection_event_ids')
)
where collection_event_ids is null
  and jsonb_typeof(postiz_response -> '_marcha_collection_event_ids') = 'array';

-- 4) Backfill: slot_key für noch nicht verschickte Posts des Wochenplans ------
--    Zuordnung über Wochentag + Uhrzeit in spanischer Zeit:
--    Mo 13:30 mon_collection · Mi 20:30 wed_highlight · Do 13:30 thu_collection · Sa 12:00 sat_highlight
--    Pro Platz nur der älteste Eintrag (falls es doch Dubletten gibt).
with candidates as (
  select
    q.id,
    to_char(q.scheduled_at at time zone 'Europe/Madrid', 'IYYY-"W"IW') || ':' ||
      case to_char(q.scheduled_at at time zone 'Europe/Madrid', 'ID HH24:MI')
        when '1 13:30' then 'mon_collection'
        when '3 20:30' then 'wed_highlight'
        when '4 13:30' then 'thu_collection'
        when '6 12:00' then 'sat_highlight'
      end as key,
    q.created_at
  from public.social_queue q
  where q.slot_key is null
    and q.status <> 'skipped'
    and q.scheduled_at > now() - interval '1 day'
    and to_char(q.scheduled_at at time zone 'Europe/Madrid', 'ID HH24:MI')
        in ('1 13:30', '3 20:30', '4 13:30', '6 12:00')
),
ranked as (
  select c.*, row_number() over (partition by c.key order by c.created_at, c.id) as rn
  from candidates c
  where not exists (
    select 1 from public.social_queue x
    where x.slot_key = c.key and x.status <> 'skipped'
  )
)
update public.social_queue q
set slot_key = r.key
from ranked r
where q.id = r.id and r.rn = 1;

-- 5) Eindeutigkeit pro Platz ---------------------------------------------------
create unique index if not exists social_queue_slot_key_uidx
  on public.social_queue (slot_key)
  where slot_key is not null and status <> 'skipped';

-- 6) Abdeckung pro Event --------------------------------------------------------
--    Eine Zeile pro (Event, Post). role = 'main' (eigener Post / Hauptevent)
--    oder 'member' (steckt in einem Sammelpost). security_invoker: es gelten die
--    RLS-Regeln von social_queue (nur Admins).
create or replace view public.social_event_coverage
with (security_invoker = true) as
select
  q.event_id::text           as event_id,
  'main'::text               as role,
  q.id                       as queue_id,
  q.slot_key,
  q.post_stage,
  q.status,
  q.scheduled_at,
  q.occurrence_date
from public.social_queue q
union all
select
  split_part(m.member_id, '::', 1) as event_id,
  'member'::text                   as role,
  q.id                             as queue_id,
  q.slot_key,
  q.post_stage,
  q.status,
  q.scheduled_at,
  q.occurrence_date
from public.social_queue q
cross join lateral unnest(coalesce(q.collection_event_ids, '{}'::text[])) as m(member_id);

grant select on public.social_event_coverage to authenticated;

-- 7) Einstellungen des Planers (eine Zeile) ------------------------------------
create table if not exists public.social_planner_settings (
  id               int primary key default 1 check (id = 1),
  paused           boolean not null default false,  -- Not-Aus: Planer + Versand stoppen
  require_approval boolean not null default true,   -- nur freigegebene Posts gehen an Postiz
  dry_run          boolean not null default true,   -- Server-Planer rechnet nur, schreibt nichts
  updated_at       timestamptz not null default now(),
  updated_by       text
);
insert into public.social_planner_settings (id) values (1) on conflict (id) do nothing;

alter table public.social_planner_settings enable row level security;
grant select, update on public.social_planner_settings to authenticated;

drop policy if exists "Admins can read social_planner_settings" on public.social_planner_settings;
create policy "Admins can read social_planner_settings"
on public.social_planner_settings
for select
to authenticated
using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "Admins can update social_planner_settings" on public.social_planner_settings;
create policy "Admins can update social_planner_settings"
on public.social_planner_settings
for update
to authenticated
using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

comment on table public.social_planner_settings is
  'Social-Wochenplaner: Not-Aus (paused), Freigabepflicht (require_approval), Testmodus (dry_run). Nur Admins.';

-- 8) Prüfungen (nur lesen) ------------------------------------------------------
-- a) Neue Spalten vorhanden?
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'social_queue'
  and column_name in ('slot_key', 'collection_event_ids', 'occurrence_date');
-- b) Posts mit Platz-Schlüssel (erwartet: die kommenden Wochenplan-Posts)
select slot_key, status, post_stage, scheduled_at, coalesce(array_length(collection_event_ids, 1), 0) as weitere_events
from public.social_queue where slot_key is not null order by scheduled_at;
-- c) Einstellungen (erwartet: paused=false, require_approval=true, dry_run=true)
select * from public.social_planner_settings;
