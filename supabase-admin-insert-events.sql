-- Admins dürfen neue Events in jedem Status anlegen (15.11.2026).
--
-- Problem: Der KI-Schnelleintrag im Admin speichert mit „direkt freigeben“
-- ein neues Event mit status = 'approved'. Bisher gab es nur zwei Insert-Regeln:
--   * „Anonymous can submit pending events“ (nur status = 'pending')
--   * „Verified organizers publish events“ (nur geprüfte Veranstalter)
-- → Fehler „new row violates row-level security policy for table "events"“.
--
-- Lösung: eine zusätzliche Insert-Regel nur für Admins.
-- Admin = app_metadata.role = 'admin' (gleiche Prüfung wie beim Ändern/Löschen,
-- siehe supabase-admin-role-hardening.sql). Besucher und Veranstalter bekommen
-- dadurch KEINE neuen Rechte.
--
-- Idempotent: kann mehrfach ausgeführt werden.
-- Rückgängig: drop policy if exists "Admins can insert events via role" on public.events;

drop policy if exists "Admins can insert events via role" on public.events;
create policy "Admins can insert events via role"
on public.events
for insert
to authenticated
with check (public.marcha_auth_is_admin());
