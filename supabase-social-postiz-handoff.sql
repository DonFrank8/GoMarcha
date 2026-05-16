-- Postiz handoff: admin-confirmed posts → Postiz draft (no auto-publish).
-- Run in Supabase SQL Editor after supabase-social-automation.sql.

alter table public.social_queue add column if not exists postiz_post_id text;
alter table public.social_queue add column if not exists postiz_synced_at timestamptz;
alter table public.social_queue add column if not exists admin_confirmed_at timestamptz;

do $$
begin
  alter table public.social_queue drop constraint if exists social_queue_status_check;
  alter table public.social_queue
    add constraint social_queue_status_check
    check (
      status in (
        'pending',
        'draft',
        'ready_for_postiz',
        'processing',
        'sent_to_postiz',
        'posted',
        'failed',
        'skipped'
      )
    );
exception
  when others then null;
end $$;

create index if not exists social_queue_ready_for_postiz_idx
  on public.social_queue (scheduled_at asc)
  where status = 'ready_for_postiz';
