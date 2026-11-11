-- =============================================================================
-- Marcha – Sicherheits-Härtung Teil 2 (Security Advisor, 11.11.2026)
--
-- Zweck:
--   1. Bilder-Bucket: Dateiliste nicht mehr für jeden abrufbar
--      (Warnung „Public Bucket Allows Listing“). Öffentliche Bild-Links
--      funktionieren weiter, weil der Bucket „public“ ist – dafür braucht es
--      keine SELECT-Regel. Website/Admin rufen die Liste nirgends ab.
--   2. Trigger-Funktion marcha_events_sanitize_public_insert() darf niemand
--      direkt aufrufen (Warnung „SECURITY DEFINER callable“). Der Trigger
--      läuft weiterhin automatisch beim Eintragen.
--
-- Bewusst NICHT geändert (siehe Erklärung in OFFENE_PUNKTE.md):
--   - marcha_auth_is_admin(): wird von den RLS-Regeln gebraucht, verrät nur,
--     ob der Aufrufer selbst Admin ist.
--   - rls_auto_enable(), pg_net: nicht aus diesem Repo, erst ansehen.
--
-- Abhängigkeiten: supabase-security-hardening.sql (#15)
-- Ausführen: komplett im Supabase SQL-Editor. Mehrfaches Ausführen ist sicher.
-- =============================================================================

begin;

-- 1) Dateiliste sperren (Bild-Links bleiben öffentlich erreichbar)
drop policy if exists "Public can read event images" on storage.objects;

-- Admins dürfen die Dateien weiterhin sehen (z. B. im Supabase-Dashboard über die API)
drop policy if exists "Admins can list event images" on storage.objects;
create policy "Admins can list event images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'event-images'
  and public.marcha_auth_is_admin()
);

-- 2) Trigger-Funktion nicht direkt aufrufbar
revoke execute on function public.marcha_events_sanitize_public_insert() from public, anon, authenticated;

commit;

-- RÜCKBAU (falls Bilder nicht mehr angezeigt werden – sollte nicht passieren):
-- create policy "Public can read event images" on storage.objects
--   for select to public using (bucket_id = 'event-images');
