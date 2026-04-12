-- Marcha security baseline for moderated admin workflow
-- Run these statements in the Supabase SQL editor.

-- 0) Bootstrap legacy schemas (idempotent)
alter table public.events add column if not exists address text;
alter table public.events add column if not exists postal_code text;
alter table public.events add column if not exists submitted_by text;
alter table public.events add column if not exists contact_email text;
alter table public.events add column if not exists verification_notes text;
alter table public.events add column if not exists geocoding_query text;
alter table public.events add column if not exists status text;
alter table public.events add column if not exists featured boolean default false;
alter table public.events add column if not exists promoted boolean default false;

-- Ensure image URL column exists for event main image uploads.
alter table public.events add column if not exists image_url text;
alter table public.events add column if not exists recurrence_type text;
alter table public.events add column if not exists recurrence_start_date date;
alter table public.events add column if not exists recurrence_end_date date;
alter table public.events add column if not exists recurrence_weekday smallint;
alter table public.events add column if not exists recurrence_day_of_month smallint;

-- Normalize status values for existing rows.
update public.events
set status = case
  when status is null or btrim(status) = '' then 'approved'
  when lower(status) in ('pending', 'approved', 'rejected') then lower(status)
  else 'pending'
end;

alter table public.events alter column status set default 'pending';
alter table public.events alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_status_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
    add constraint events_status_check
    check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- Normalize recurrence values for existing rows.
update public.events
set recurrence_type = case
  when recurrence_type is null or btrim(recurrence_type) = '' then 'none'
  when lower(recurrence_type) in ('none', 'weekly', 'monthly') then lower(recurrence_type)
  else 'none'
end;

alter table public.events alter column recurrence_type set default 'none';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_recurrence_type_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
    add constraint events_recurrence_type_check
    check (recurrence_type in ('none', 'weekly', 'monthly'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_recurrence_weekday_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
    add constraint events_recurrence_weekday_check
    check (recurrence_weekday is null or recurrence_weekday between 0 and 6);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_recurrence_day_of_month_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
    add constraint events_recurrence_day_of_month_check
    check (recurrence_day_of_month is null or recurrence_day_of_month between 1 and 31);
  end if;
end $$;

-- 1) Ensure RLS is enabled
alter table public.events enable row level security;

-- 2) Drop ALL existing policies on events (idempotent)
-- This avoids stale restrictive policies from older setups.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
  loop
    execute format('drop policy if exists %I on public.events', policy_row.policyname);
  end loop;
end $$;

-- 2b) Ensure table privileges exist for public submit/read flow
grant select, insert on table public.events to anon, authenticated;
grant update on table public.events to authenticated;

-- 3) Public read-only access to approved events
create policy "Public can read approved events"
on public.events
for select
to anon, authenticated
using (status::text = 'approved');

-- 4) Anyone can submit new events, but only as pending
create policy "Anonymous can submit pending events"
on public.events
for insert
to anon, authenticated
with check (
  coalesce(status::text, 'pending') = 'pending'
);

-- 4b) Optional: anonymous users can read pending rows
-- Keep disabled unless your frontend requires `insert(...).select(...)` responses.
-- create policy "Anonymous can read pending events"
-- on public.events
-- for select
-- to anon, authenticated
-- using (status::text = 'pending');

-- 4c) Authenticated admins can read all events (including pending/rejected)
-- Required so moderation dashboards can fetch rows to review.
create policy "Admins can read all events via role"
on public.events
for select
to authenticated
using (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

-- 5) Only authenticated admins can moderate (update status/notes)
-- Requires app_metadata.role = 'admin' in auth.users JWT payload.
create policy "Admins can moderate events via role"
on public.events
for update
to authenticated
using (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
)
with check (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

-- 6) Storage bucket + policies for event image uploads
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can read event images" on storage.objects;
create policy "Public can read event images"
on storage.objects
for select
to public
using (bucket_id = 'event-images');

drop policy if exists "Anyone can upload event images" on storage.objects;
create policy "Anyone can upload event images"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'event-images');

drop policy if exists "Anyone can delete own event images path" on storage.objects;
create policy "Anyone can delete own event images path"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'event-images');
