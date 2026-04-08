-- PartyRadar security baseline for moderated admin workflow
-- Run these statements in the Supabase SQL editor.

-- 1) Ensure RLS is enabled
alter table public.events enable row level security;

-- 2) Drop old permissive policies if present (idempotent)
drop policy if exists "Public can read approved events" on public.events;
drop policy if exists "Anonymous can submit pending events" on public.events;
drop policy if exists "Admins can moderate events" on public.events;

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
-- Replace emails in the allowlist with your real admin addresses.
create policy "Admins can moderate events"
on public.events
for update
to authenticated
using (
  auth.jwt() ->> 'email' in (
    'admin@example.com'
  )
)
with check (
  auth.jwt() ->> 'email' in (
    'admin@example.com'
  )
);
