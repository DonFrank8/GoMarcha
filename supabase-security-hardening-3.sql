-- =============================================================================
-- Marcha – Sicherheits-Härtung Teil 3 (DRINGEND) – 11.11.2026
--
-- Gefunden über Security Advisor („RLS Policy Always True“) + pg_policies:
-- Auf public.events gab es drei Regeln, die NICHT aus diesem Repo stammen
-- und alles erlauben (Bedingung `true`):
--   - "Anyone can update events"  (UPDATE, public): JEDER konnte JEDES Event ändern
--   - "Public can read events"    (SELECT, public): JEDER konnte ALLE Events lesen,
--                                  auch pending/rejected inkl. E-Mail der Einreicher
--   - "Anyone can insert events"  (INSERT, public): umging die Status-Regel
--
-- Die Website braucht keine davon. Es bleiben die sicheren Regeln aus supabase-rls.sql:
--   - "Public can read approved events"      (nur freigegebene)
--   - "Anonymous can submit pending events"  (nur Status pending)
--   - "Admins can … via role"                (lesen/ändern/löschen nur Admins)
--
-- Abhängigkeiten: supabase-rls.sql (#1), supabase-security-hardening.sql (#15)
-- Ausführen: komplett im Supabase SQL-Editor. Mehrfaches Ausführen ist sicher.
-- =============================================================================

begin;

drop policy if exists "Anyone can update events" on public.events;
drop policy if exists "Public can read events" on public.events;
drop policy if exists "Anyone can insert events" on public.events;

commit;

-- Kontrolle danach (nur lesen): es dürfen keine Zeilen mit qual/with_check = true mehr kommen
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'events';
