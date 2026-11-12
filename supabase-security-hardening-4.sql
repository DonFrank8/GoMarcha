-- =============================================================================
-- Marcha – Sicherheits-Härtung Teil 4 – 12.11.2026
--
-- Problem: Bei FREIGEGEBENEN Events konnte jeder Besucher über die öffentliche
-- API E-Mail und Name der Einreicher lesen (contact_email, submitted_by,
-- verification_notes). RLS regelt nur, WELCHE Zeilen man sieht, nicht welche Spalten.
--
-- Lösung: Die Rolle anon (Besucher ohne Login) darf nur noch die öffentlichen
-- Spalten lesen. Einreichen (INSERT) bleibt erlaubt. Zusätzlich TRUNCATE,
-- TRIGGER, REFERENCES für anon entzogen (braucht die Website nicht).
--
-- WICHTIG – Reihenfolge: ERST den Code live bringen (Website mit Cache v18 UND
-- den Cloudflare Worker workers/event-share neu deployen), DANN dieses SQL.
-- Sonst zeigt die Website/Share-Vorschau keine Events mehr („permission denied“).
--
-- Neue Spalte in events? Hier ergänzen UND EVENT_PUBLIC_COLUMNS in app.js +
-- workers/event-share/worker.js – sonst sehen Besucher sie nicht.
--
-- Noch offen: Angemeldete Nutzer (authenticated) sehen weiter alle Spalten.
-- Aktuell gibt es nur das Admin-Konto. Mit den Veranstalter-Konten wird das
-- ebenfalls eingeschränkt (Admin liest Einreicher-Daten dann über eine Admin-Funktion).
--
-- Abhängigkeiten: #17 (supabase-security-hardening-3.sql)
-- Ausführen: komplett im Supabase SQL-Editor. Mehrfaches Ausführen ist sicher.
-- Rückgängig: GRANT SELECT ON public.events TO anon;
-- =============================================================================

begin;

revoke select, truncate, trigger, references on public.events from anon;

grant select (
  id,
  name,
  location_name,
  city,
  country,
  event_date,
  event_time,
  genre,
  price_text,
  description,
  image_url,
  lat,
  lng,
  is_published,
  created_at,
  status,
  address,
  postal_code,
  geocoding_query,
  featured,
  promoted,
  is_recurring,
  recurrence_type,
  recurrence_interval,
  recurrence_days,
  recurrence_end_date,
  recurrence_until,
  recurrence_rule,
  recurrence_start_date,
  recurrence_weekday,
  recurrence_day_of_month,
  artist_name,
  title_de,
  title_en,
  title_es,
  description_de,
  description_en,
  description_es,
  artist_bio_de,
  artist_bio_en,
  artist_bio_es,
  image_urls,
  archived_at,
  original_event_id,
  is_featured,
  recurring_social_enabled,
  recurring_social_opt_out,
  end_time
) on public.events to anon;

commit;

-- Prüfung (sollte 3 Zeilen mit „false“ zeigen):
select column_name, has_column_privilege('anon', 'public.events', column_name, 'SELECT') as anon_darf_lesen
from information_schema.columns
where table_schema = 'public' and table_name = 'events'
  and column_name in ('contact_email', 'submitted_by', 'verification_notes');
