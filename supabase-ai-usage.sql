-- =============================================================================
-- Marcha – Nutzungszähler für KI-Funktionen (13.11.2026)
--
-- Zweck: Tageslimits für den KI-Schnelleintrag (Edge Function event-extract):
--   Admin unbegrenzt · Veranstalter-Konto 20/Tag · ohne Konto 5/Tag pro Anschluss, 100/Tag gesamt.
-- „subject“ ist die Konto-ID oder ein nicht umkehrbarer Hash der IP-Adresse (keine IP im Klartext).
-- Nur die Edge Function (Service Role) liest/schreibt; Besucher und Konten haben keinen Zugriff.
-- Alte Einträge (> 30 Tage) werden täglich gelöscht (Datensparsamkeit).
-- Mehrfaches Ausführen ist sicher. Rückbau unten.
-- =============================================================================

begin;

create table if not exists public.ai_usage (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  feature     text not null check (char_length(feature) <= 40),
  audience    text not null check (audience in ('admin', 'organizer', 'anon')),
  subject     text not null check (char_length(subject) <= 100),
  ok          boolean not null default true
);

create index if not exists ai_usage_subject_day_idx on public.ai_usage (feature, subject, created_at desc);
create index if not exists ai_usage_audience_day_idx on public.ai_usage (feature, audience, created_at desc);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

comment on table public.ai_usage is 'Zähler für KI-Funktionen (Tageslimits). Nur Service Role. Einträge > 30 Tage werden gelöscht.';

do $$
begin
  if exists (select 1 from cron.job where jobname = 'marcha-ai-usage-cleanup') then
    perform cron.unschedule('marcha-ai-usage-cleanup');
  end if;
  perform cron.schedule('marcha-ai-usage-cleanup', '17 3 * * *',
    $c$delete from public.ai_usage where created_at < now() - interval '30 days'$c$);
end $$;

commit;

-- Rückbau:
-- select cron.unschedule('marcha-ai-usage-cleanup');
-- drop table if exists public.ai_usage;
