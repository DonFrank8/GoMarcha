-- ============================================================================
-- #32  Instagram-Namen von Künstler und Lokal (24.11.2026)
-- ============================================================================
-- Zweck: Reichweite. Die Social-Posts markieren Band und Lokal automatisch mit @name
--   (die Markierten bekommen eine Benachrichtigung und teilen den Post oft weiter).
--   * events.artist_instagram – Instagram-Name des Künstlers, ohne @ (z. B. joolz_music)
--   * events.venue_instagram  – Instagram-Name des Lokals, ohne @
--   Beide optional. Erlaubt: Buchstaben, Ziffern, Punkt, Unterstrich, max. 30 Zeichen
--   (Instagram-Regel). Öffentliche Angaben: Leserecht wie artist_name (GRANT SELECT auf die 2 Spalten),
--   keine RLS-Änderung; Schreiben nach den bestehenden Regeln der Tabelle events.
-- Ändert keine bestehenden Zeilen. Idempotent.
-- Abhängig von: Tabelle events.
-- ============================================================================

alter table public.events add column if not exists artist_instagram text;
alter table public.events add column if not exists venue_instagram text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_artist_instagram_format') then
    alter table public.events add constraint events_artist_instagram_format
      check (artist_instagram is null or artist_instagram ~ '^[A-Za-z0-9._]{1,30}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'events_venue_instagram_format') then
    alter table public.events add constraint events_venue_instagram_format
      check (venue_instagram is null or venue_instagram ~ '^[A-Za-z0-9._]{1,30}$');
  end if;
end $$;

-- Leserecht: events hat Spalten-Rechte (SELECT je Spalte). Die Instagram-Namen sind öffentlich
-- (stehen ohnehin in den Posts) → wie artist_name lesbar für anon und authenticated.
-- Schreiben bleibt wie bisher über die bestehenden RLS-Regeln (nur Admin bzw. eigene Events).
grant select (artist_instagram, venue_instagram) on public.events to anon, authenticated;

comment on column public.events.artist_instagram is 'Instagram-Name des Künstlers ohne @ (für automatische Markierung in Social-Posts).';
comment on column public.events.venue_instagram is 'Instagram-Name des Lokals ohne @ (für automatische Markierung in Social-Posts).';

-- Prüfung (nur lesen): erwartet 2 Zeilen
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'events' and column_name in ('artist_instagram', 'venue_instagram');
