-- One social_queue row = one campaign draft/stage targeting multiple platforms.
-- Run in Supabase SQL Editor after supabase-social-automation.sql.

alter table public.social_queue
  add column if not exists platforms text[];

update public.social_queue
set platforms = array[platform]::text[]
where platforms is null
  and platform is not null
  and trim(platform) <> '';

update public.social_queue
set platforms = array['instagram', 'facebook']::text[]
where platforms is null
   or cardinality(platforms) = 0;

alter table public.social_queue
  alter column platforms set default array['instagram', 'facebook']::text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'social_queue_platforms_check'
      and conrelid = 'public.social_queue'::regclass
  ) then
    alter table public.social_queue
      add constraint social_queue_platforms_check
      check (
        platforms is not null
        and cardinality(platforms) >= 1
        and platforms <@ array['instagram', 'facebook']::text[]
      );
  end if;
exception
  when others then null;
end $$;

-- Keep legacy `platform` in sync (first target) for older clients.
update public.social_queue
set platform = platforms[1]
where platforms is not null
  and cardinality(platforms) >= 1
  and (platform is null or platform is distinct from platforms[1]);
