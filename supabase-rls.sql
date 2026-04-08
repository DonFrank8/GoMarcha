-- PartyRadar security baseline for moderated admin workflow
-- Run these statements in the Supabase SQL editor.

-- 1) Ensure RLS is enabled
alter table public.events enable row level security;

-- 2) Drop old permissive policies if present (idempotent)
drop policy if exists "Public can read approved events" on public.events;
drop policy if exists "Anonymous can submit pending events" on public.events;
drop policy if exists "Admins can moderate events" on public.events;
drop policy if exists "Admins can moderate events via role" on public.events;

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
  status = 'pending'
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
