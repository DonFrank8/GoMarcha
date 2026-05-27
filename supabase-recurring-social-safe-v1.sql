-- Recurring social automation (safe additive). Run after supabase-social-automation.sql.
-- Phase A fields only; no triggers. Application controls row creation.

alter table public.events add column if not exists is_recurring boolean not null default false;
alter table public.events add column if not exists recurring_social_enabled boolean not null default true;
alter table public.events add column if not exists recurring_social_opt_out boolean not null default false;

alter table public.social_queue add column if not exists post_stage text;

comment on column public.events.is_recurring is 'Master series flag; false = legacy one-time behaviour unchanged.';
comment on column public.events.recurring_social_enabled is 'When true with is_recurring: weekly auto-prep (7d horizon) on Social Queue + manual prepare.';
comment on column public.events.recurring_social_opt_out is 'When true: admin explicitly disabled Social Automation for this series; legacy false without opt_out is treated as enabled in app.';
comment on column public.social_queue.post_stage is 'Recurring slot stage: early_reminder | tomorrow | last_call';

create index if not exists social_queue_event_platform_stage_idx
  on public.social_queue (event_id, platform, post_stage)
  where post_stage is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'social_queue_post_stage_check'
      and conrelid = 'public.social_queue'::regclass
  ) then
    alter table public.social_queue
      add constraint social_queue_post_stage_check
      check (
        post_stage is null
        or post_stage in ('early_reminder', 'tomorrow', 'last_call')
      );
  end if;
exception
  when others then null;
end $$;
