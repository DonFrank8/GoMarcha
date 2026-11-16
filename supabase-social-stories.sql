-- ============================================================================
-- #31  Stories in der Social Queue (16.11.2026)
-- ============================================================================
-- Zweck: Tages-Stories („Hoy en la Costa“ bzw. Marcha-Story ohne Event) laufen wie die
-- Feed-Posts über social_queue und werden im Admin freigegeben (nicht mehr in Postiz).
--   * event_id darf leer sein – eine Marcha-Story an einem Tag ohne Event gehört zu keinem Event.
--     Fremdschlüssel (on delete cascade) bleibt unverändert.
--   * post_stage 'story' ist seit #29 erlaubt.
--   * Story-Bilder liegen dauerhaft im Bucket event-images unter stories/ (Upload nur per
--     Service Role über die Edge Function social-postiz-admin, Lesen öffentlich wie alle Event-Bilder).
-- Ändert keine bestehenden Zeilen. Idempotent.
-- Abhängig von #6, #29.
-- ============================================================================

alter table public.social_queue alter column event_id drop not null;

comment on column public.social_queue.event_id is
  'Hauptevent des Posts. Leer nur bei Stories ohne Event (post_stage = story).';

-- Prüfung (nur lesen): erwartet is_nullable = YES
select column_name, is_nullable from information_schema.columns
where table_schema = 'public' and table_name = 'social_queue' and column_name = 'event_id';
