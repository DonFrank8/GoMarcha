-- ============================================================================
-- #30  Social-Wochenplaner: stündlicher Lauf + Testmodus aus (16.11.2026, Freigabe Frank)
-- ============================================================================
-- Zweck:
--   * pg_cron-Job `marcha-social-week-planner` ruft stündlich (Minute 7) die Edge Function
--     `social-week-planner` auf. Der Schlüssel wird zur Laufzeit aus dem Vault gelesen
--     (wie beim Runner, siehe #25) – kein Secret in dieser Datei.
--   * Testmodus aus: social_planner_settings.dry_run = false → der Planer legt Entwürfe an
--     und hält offene Entwürfe aktuell. Freigabepflicht und Not-Aus bleiben unverändert.
-- Rückgängig: update public.social_planner_settings set dry_run = true where id = 1;
--             select cron.unschedule('marcha-social-week-planner');
-- Idempotent. Abhängig von #25 (Vault-Secret marcha_social_runner_secret) und #29.
-- ============================================================================

do $$
declare
  job_id bigint;
begin
  select jobid into job_id from cron.job where jobname = 'marcha-social-week-planner';
  if job_id is not null then
    perform cron.unschedule(job_id);
  end if;
  perform cron.schedule(
    'marcha-social-week-planner',
    '7 * * * *',
    $cmd$
  select net.http_post(
    url := 'https://dwyhpirtbjfmohcnhdak.supabase.co/functions/v1/social-week-planner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-marcha-social-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'marcha_social_runner_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$cmd$
  );
end $$;

update public.social_planner_settings
set dry_run = false, updated_at = now(), updated_by = 'migration #30 (Freigabe Frank 16.11.2026)'
where id = 1;

-- Prüfungen (nur lesen):
-- select jobname, schedule, active from cron.job where jobname like 'marcha-social%';
-- select * from public.social_planner_settings;
