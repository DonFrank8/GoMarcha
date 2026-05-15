-- Marcha: lightweight event analytics (public insert, admin read/delete).
-- Run in Supabase SQL Editor after public.events exists.
-- Frontend: anon key + insert only; Admin: JWT app_metadata.role = admin for SELECT/DELETE.

create table if not exists public.event_analytics (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_id text not null,
  action text not null,
  share_channel text,
  source text,
  page_url text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  constraint event_analytics_action_check check (action in ('event_view', 'share')),
  constraint event_analytics_event_id_len check (char_length(event_id) between 1 and 200),
  constraint event_analytics_share_channel_len check (share_channel is null or char_length(share_channel) <= 64),
  constraint event_analytics_source_len check (source is null or char_length(source) <= 128),
  constraint event_analytics_page_url_len check (page_url is null or char_length(page_url) <= 2048),
  constraint event_analytics_user_agent_len check (user_agent is null or char_length(user_agent) <= 1024),
  constraint event_analytics_metadata_size check (octet_length(metadata::text) <= 8192)
);

create index if not exists event_analytics_created_at_idx on public.event_analytics (created_at desc);
create index if not exists event_analytics_event_action_idx on public.event_analytics (event_id, action, created_at desc);

alter table public.event_analytics enable row level security;

grant insert on table public.event_analytics to anon, authenticated;
grant select, delete on table public.event_analytics to authenticated;

do $$
declare
  seq_name text;
begin
  seq_name := pg_get_serial_sequence('public.event_analytics', 'id');
  if seq_name is not null then
    execute format('grant usage, select on sequence %s to anon, authenticated', seq_name);
  end if;
end $$;

drop policy if exists "Public insert safe event analytics rows" on public.event_analytics;
create policy "Public insert safe event analytics rows"
on public.event_analytics
for insert
to anon, authenticated
with check (
  action in ('event_view', 'share')
  and event_id ~ '^[A-Za-z0-9:_-]{1,200}$'
  and (share_channel is null or share_channel ~ '^[A-Za-z0-9._-]{1,64}$')
  and (source is null or length(source) <= 128)
  and (page_url is null or length(page_url) <= 2048)
  and (user_agent is null or length(user_agent) <= 1024)
  and metadata is not null
  and jsonb_typeof(metadata) = 'object'
);

drop policy if exists "Admins select event analytics" on public.event_analytics;
create policy "Admins select event analytics"
on public.event_analytics
for select
to authenticated
using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "Admins delete event analytics" on public.event_analytics;
create policy "Admins delete event analytics"
on public.event_analytics
for delete
to authenticated
using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
