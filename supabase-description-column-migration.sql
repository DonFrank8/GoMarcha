-- GoMarcha: migrate legacy typo columns descrption_* -> description_*
-- Run this in Supabase SQL editor before removing legacy compatibility in app.js.
-- Idempotent and safe to re-run.

begin;

-- 1) Ensure canonical columns exist.
alter table public.events add column if not exists description_de text;
alter table public.events add column if not exists description_en text;
alter table public.events add column if not exists description_es text;

-- 2) If legacy typo columns exist, backfill canonical columns from them.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'descrption_de'
  ) then
    execute $sql$
      update public.events
      set description_de = coalesce(nullif(btrim(description_de), ''), nullif(btrim(descrption_de), ''))
      where coalesce(nullif(btrim(description_de), ''), nullif(btrim(descrption_de), '')) is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'descrption_en'
  ) then
    execute $sql$
      update public.events
      set description_en = coalesce(nullif(btrim(description_en), ''), nullif(btrim(descrption_en), ''))
      where coalesce(nullif(btrim(description_en), ''), nullif(btrim(descrption_en), '')) is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'descrption_es'
  ) then
    execute $sql$
      update public.events
      set description_es = coalesce(nullif(btrim(description_es), ''), nullif(btrim(descrption_es), ''))
      where coalesce(nullif(btrim(description_es), ''), nullif(btrim(descrption_es), '')) is not null
    $sql$;
  end if;
end $$;

-- 3) Optionally keep legacy typo columns in sync during transition (one-time copy canonical -> typo if typo exists).
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'descrption_de'
  ) then
    execute $sql$
      update public.events
      set descrption_de = coalesce(nullif(btrim(descrption_de), ''), nullif(btrim(description_de), ''))
      where coalesce(nullif(btrim(descrption_de), ''), nullif(btrim(description_de), '')) is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'descrption_en'
  ) then
    execute $sql$
      update public.events
      set descrption_en = coalesce(nullif(btrim(descrption_en), ''), nullif(btrim(description_en), ''))
      where coalesce(nullif(btrim(descrption_en), ''), nullif(btrim(description_en), '')) is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'descrption_es'
  ) then
    execute $sql$
      update public.events
      set descrption_es = coalesce(nullif(btrim(descrption_es), ''), nullif(btrim(description_es), ''))
      where coalesce(nullif(btrim(descrption_es), ''), nullif(btrim(description_es), '')) is not null
    $sql$;
  end if;
end $$;

commit;

-- 4) Verification query:
-- select id, description_de, description_en, description_es, descrption_de, descrption_en, descrption_es
-- from public.events
-- order by created_at desc
-- limit 20;

-- 5) After app rollout is stable and canonical columns are populated,
--    you can remove typo columns manually:
-- alter table public.events drop column if exists descrption_de;
-- alter table public.events drop column if exists descrption_en;
-- alter table public.events drop column if exists descrption_es;
