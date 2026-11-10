-- Admin SELECT fix: moderation dashboard must load ALL events (pending/approved/rejected, past/future).
-- Public/anon still only sees approved rows. Safe to re-run.
-- Run in Supabase SQL Editor when admin.js logs fewer rows than expected (RLS blocking).

create or replace function public.marcha_auth_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Nur app_metadata zählt; user_metadata kann jeder Nutzer selbst ändern.
  select coalesce(nullif(trim(auth.jwt() -> 'app_metadata' ->> 'role'), ''), '') = 'admin';
$$;

revoke all on function public.marcha_auth_is_admin() from public;
grant execute on function public.marcha_auth_is_admin() to anon, authenticated;

alter table public.events enable row level security;

drop policy if exists "Admins can read all events via role" on public.events;
create policy "Admins can read all events via role"
on public.events
for select
to authenticated
using (public.marcha_auth_is_admin());

-- Keep public read scoped to approved (anon + authenticated non-admin still use this OR admin policy above).
drop policy if exists "Public can read approved events" on public.events;
create policy "Public can read approved events"
on public.events
for select
to anon, authenticated
using (status::text = 'approved');

grant select on table public.events to anon, authenticated;
