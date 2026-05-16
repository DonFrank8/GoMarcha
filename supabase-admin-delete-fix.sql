-- Admin event delete: RLS + grants (idempotent). Run in Supabase SQL Editor if dashboard delete returns 0 rows.
-- Frontend uses anon key + authenticated admin JWT (app_metadata.role = 'admin'). No service role.

alter table public.events enable row level security;

grant delete on table public.events to authenticated;

drop policy if exists "Admins can delete events via role" on public.events;
create policy "Admins can delete events via role"
on public.events
for delete
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

-- Child tables: admin delete before events (app order); FK cascade also applies if parent delete succeeds.
alter table public.social_queue enable row level security;
alter table public.social_caption_usage enable row level security;

grant delete on table public.social_queue to authenticated;
grant delete on table public.social_caption_usage to authenticated;

drop policy if exists "Admins can delete social_queue via role" on public.social_queue;
create policy "Admins can delete social_queue via role"
on public.social_queue
for delete
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

drop policy if exists "Admins can delete social_caption_usage via role" on public.social_caption_usage;
create policy "Admins can delete social_caption_usage via role"
on public.social_caption_usage
for delete
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

-- Optional analytics rows (text event_id, no FK to events).
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'event_analytics'
  ) then
    execute 'alter table public.event_analytics enable row level security';
    execute 'grant delete on table public.event_analytics to authenticated';
    execute 'drop policy if exists "Admins delete event analytics" on public.event_analytics';
    execute $p$
      create policy "Admins delete event analytics"
      on public.event_analytics
      for delete
      to authenticated
      using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
    $p$;
  end if;
end $$;
