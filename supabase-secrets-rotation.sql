-- =============================================================================
-- Marcha – neue Schlüssel für Cron und Webhooks (13.11.2026)
--
-- Hintergrund: Der Social-Cron schickte einen schwachen, im Klartext gespeicherten
-- Schlüssel und brach nach 5 s ab (Social-Queue seit 10.06.2026 ohne Übergabe an Postiz).
-- Außerdem waren beide Schlüssel in einer Claude-Sitzung sichtbar → erneuern.
--
-- VORAUSSETZUNG (Frank, siehe Anleitung im Chat):
--   1. Im Supabase Vault existieren die Einträge
--        marcha_social_runner_secret   und   marcha_notify_webhook_secret
--   2. Die Edge-Function-Secrets sind auf dieselben Werte gesetzt:
--        MARCHA_SOCIAL_RUNNER_SECRET = marcha_social_runner_secret
--        NOTIFY_WEBHOOK_SECRET       = marcha_notify_webhook_secret
--
-- Was diese Datei macht (die Schlüssel stehen NICHT in dieser Datei):
--   a) Cron-Job „marcha-social-queue-runner“ liest den Schlüssel bei jedem Lauf aus dem Vault
--      und wartet bis zu 60 s statt 5 s.
--   b) Die drei Webhook-Trigger (notify-new-event, notify-organizer-signup, notify-event-status)
--      bekommen den neuen Schlüssel aus dem Vault in ihre Kopfzeile.
-- Mehrfaches Ausführen ist sicher.
-- =============================================================================

begin;

do $$
declare
  social_secret text;
  webhook_secret text;
  hook_url text := 'https://dwyhpirtbjfmohcnhdak.supabase.co/functions/v1/notify-new-event';
  hook_headers text;
  job_id bigint;
begin
  select decrypted_secret into social_secret from vault.decrypted_secrets where name = 'marcha_social_runner_secret';
  select decrypted_secret into webhook_secret from vault.decrypted_secrets where name = 'marcha_notify_webhook_secret';
  if coalesce(length(social_secret), 0) < 32 or coalesce(length(webhook_secret), 0) < 32 then
    raise exception 'Vault-Einträge fehlen oder sind zu kurz – Abbruch, nichts geändert.';
  end if;

  -- a) Cron: Schlüssel zur Laufzeit aus dem Vault, Timeout 60 s
  select jobid into job_id from cron.job where jobname = 'marcha-social-queue-runner';
  if job_id is null then
    raise exception 'Cron-Job marcha-social-queue-runner nicht gefunden – Abbruch.';
  end if;
  perform cron.alter_job(
    job_id,
    command := $cmd$
  select net.http_post(
    url := 'https://dwyhpirtbjfmohcnhdak.supabase.co/functions/v1/social-queue-runner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-marcha-social-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'marcha_social_runner_secret')
    ),
    body := jsonb_build_object('limit', 10),
    timeout_milliseconds := 60000
  );
$cmd$
  );

  -- b) Webhook-Trigger mit neuem Schlüssel neu anlegen
  hook_headers := jsonb_build_object('Content-type', 'application/json', 'x-marcha-webhook-secret', webhook_secret)::text;

  execute 'drop trigger if exists "notify-new-event" on public.events';
  execute format('create trigger "notify-new-event" after insert on public.events
    for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    hook_url, 'POST', hook_headers, '{}', '5000');

  execute 'drop trigger if exists "notify-organizer-signup" on public.organizers';
  execute format('create trigger "notify-organizer-signup" after insert or update on public.organizers
    for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    hook_url, 'POST', hook_headers, '{}', '5000');

  execute 'drop trigger if exists "notify-event-status" on public.events';
  execute format('create trigger "notify-event-status" after update on public.events
    for each row when (old.status is distinct from new.status and new.organizer_id is not null)
    execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    hook_url, 'POST', hook_headers, '{}', '5000');
end;
$$;

commit;

-- Prüfung (zeigt keine Schlüssel):
-- select jobname, position('vault.decrypted_secrets' in command) > 0 as liest_vault, position('timeout_milliseconds' in command) > 0 as timeout from cron.job;
-- select tgname, tgrelid::regclass from pg_trigger where tgname in ('notify-new-event','notify-organizer-signup','notify-event-status');
