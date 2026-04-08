-- PartyRadar security baseline for moderated admin workflow
-- Run these statements in the Supabase SQL editor.

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
using (status = 'approved');

-- 4) Anyone can submit new events, but only as pending
create policy "Anonymous can submit pending events"
on public.events
for insert
to anon, authenticated
with check (
  lower(coalesce(status, 'pending')) = 'pending'
);

-- 4b) Optional: anonymous users can read pending rows
-- Keep disabled unless your frontend requires `insert(...).select(...)` responses.
-- create policy "Anonymous can read pending events"
-- on public.events
-- for select
-- to anon, authenticated
-- using (status = 'pending');

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
