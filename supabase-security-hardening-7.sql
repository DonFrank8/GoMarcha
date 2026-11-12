-- =============================================================================
-- Marcha – Sicherheits-Härtung Teil 7 – 12.11.2026
--
-- Angemeldete Nutzer (Rolle authenticated – künftig auch Veranstalter) dürfen
-- contact_email, submitted_by und verification_notes NICHT mehr direkt lesen.
-- Admins lesen sie über marcha_admin_event_private (Teil 6).
-- Ändern (UPDATE) und Eintragen (INSERT) bleiben unverändert erlaubt (RLS regelt wer).
--
-- WICHTIG – erst ausführen, wenn:
--   - Teil 6 ausgeführt ist UND
--   - Website (Cache v19) und Admin-Bereich (Build 2026.11.12-einreicher-daten)
--     live sind und Frank den Admin-Bereich getestet hat.
-- Sonst zeigt der Admin-Bereich „permission denied“.
--
-- Neue Spalte in events? Hier, in Teil 4 (anon), app.js EVENT_PUBLIC_COLUMNS
-- und admin.js ADMIN_EVENT_COLUMNS ergänzen.
--
-- Abhängigkeiten: #18, #20, #21 (Teil 6). Mehrfaches Ausführen ist sicher.
-- Rückgängig: GRANT SELECT ON public.events TO authenticated;
-- =============================================================================

begin;

revoke select, truncate, trigger, references on public.events from authenticated;

grant select (
  id, name, location_name, city, country, event_date, event_time, genre, price_text,
  description, image_url, lat, lng, is_published, created_at, status, address,
  postal_code, geocoding_query, featured, promoted, is_recurring, recurrence_type,
  recurrence_interval, recurrence_days, recurrence_end_date, recurrence_until,
  recurrence_rule, recurrence_start_date, recurrence_weekday, recurrence_day_of_month,
  artist_name, title_de, title_en, title_es, description_de, description_en,
  description_es, artist_bio_de, artist_bio_en, artist_bio_es, image_urls, archived_at,
  original_event_id, is_featured, recurring_social_enabled, recurring_social_opt_out,
  end_time, organizer_id
) on public.events to authenticated;

commit;

-- Prüfung (sollte 3 Zeilen mit „false“ zeigen)
select column_name, has_column_privilege('authenticated', 'public.events', column_name, 'SELECT') as angemeldet_darf_lesen
from information_schema.columns
where table_schema = 'public' and table_name = 'events'
  and column_name in ('contact_email', 'submitted_by', 'verification_notes');
