-- supabase-analytics-actions.sql
-- Zweck (Social-Media-Konzept v2, Abschnitt 8; Rat Analytics 15.11.2026):
--   event_analytics nimmt zusätzlich zwei Aktionen an:
--     'landing'      – Besuch über einen Link mit ?source= (z. B. ig_post, fb_group, qr_<ort>),
--                      einmal pro Sitzung, event_id = '_landing'. Ersetzt die nie angelegte Tabelle qr_tracking.
--     'outbound_map' – Besucher tippt bei einem Event auf „Route“ (Weiterklick = Hauptkennzahl).
-- Was sich NICHT ändert: Besucher dürfen weiterhin nur einfügen (nicht lesen/ändern/löschen),
--   alle übrigen Prüfungen der Einfüge-Regel bleiben gleich. Lesen nur Admins.
-- Idempotent: kann mehrfach ausgeführt werden.
-- Abhängigkeit: supabase-analytics-lite.sql (#4).

begin;

-- 1) Erlaubte Aktionen (Constraint)
alter table public.event_analytics drop constraint if exists event_analytics_action_check;
alter table public.event_analytics
  add constraint event_analytics_action_check
  check (action = any (array['event_view', 'share', 'landing', 'outbound_map']));

-- 2) Einfüge-Regel für Besucher: identisch zur bisherigen, nur mit den zwei neuen Aktionen
drop policy if exists "Public insert safe event analytics rows" on public.event_analytics;
create policy "Public insert safe event analytics rows"
  on public.event_analytics
  for insert
  to anon, authenticated
  with check (
    action = any (array['event_view', 'share', 'landing', 'outbound_map'])
    and event_id ~ '^[A-Za-z0-9:_-]{1,200}$'
    and (share_channel is null or share_channel ~ '^[A-Za-z0-9._-]{1,64}$')
    and (source is null or length(source) <= 128)
    and (page_url is null or length(page_url) <= 2048)
    and (user_agent is null or length(user_agent) <= 1024)
    and metadata is not null
    and jsonb_typeof(metadata) = 'object'
  );

commit;

-- Prüfen (nur lesen):
-- select pg_get_constraintdef(oid) from pg_constraint where conname = 'event_analytics_action_check';
-- select with_check from pg_policies where tablename = 'event_analytics' and cmd = 'INSERT';
