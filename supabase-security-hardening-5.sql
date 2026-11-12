-- =============================================================================
-- Marcha – Sicherheits-Härtung Teil 5 (Aufräumen Security Advisor) – 12.11.2026
--
-- rls_auto_enable() ist die Supabase-Automatik „RLS für neue Tabellen automatisch
-- einschalten“ (Event-Trigger ensure_rls). Die Automatik ist nützlich und BLEIBT.
-- Nur der direkte Aufruf über die API (/rest/v1/rpc/rls_auto_enable) wird für
-- Besucher und angemeldete Nutzer gesperrt. Der Trigger selbst läuft weiter.
--
-- Bewusst NICHT geändert:
--   - marcha_auth_is_admin(): wird von den RLS-Regeln gebraucht und verrät nur,
--     ob der Aufrufer selbst Admin ist. Sperren würde die Website brechen.
--   - pg_net im Schema public: Verschieben kann Webhooks brechen, Risiko gering.
--
-- Abhängigkeiten: keine. Mehrfaches Ausführen ist sicher.
-- =============================================================================

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
