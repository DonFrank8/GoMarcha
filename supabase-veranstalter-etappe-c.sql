-- =============================================================================
-- Marcha – Veranstalter-Konten, Etappe C (Datenbank) – 13.11.2026
--
-- Was diese Datei macht:
--   1. Admin-Notizen schützen: Angemeldete Nutzer (Veranstalter) dürfen die Spalte
--      organizers.admin_notes nicht mehr lesen (Spaltenrechte). Alle anderen Spalten
--      ihres eigenen Profils bleiben lesbar.
--   2. Zwei Admin-Funktionen für den neuen Bereich „Veranstalter“ im Admin:
--        marcha_admin_list_organizers()   → Liste mit E-Mail, Notizen, Event-Zahlen
--        marcha_admin_set_organizer(...)  → Status (pending/verified/blocked) + Notiz
--      Beide prüfen marcha_auth_is_admin() und brechen sonst ab.
--   3. Benachrichtigungen (gleicher Webhook wie „notify-new-event“, gleiche Edge Function):
--        - neue Veranstalter-Anmeldung      → Mail an Frank
--        - Veranstalter freigeschaltet      → Mail an den Veranstalter
--        - Event-Status geändert (Moderation) → Mail an den Veranstalter (nur Events mit Konto)
--      Die Trigger übernehmen URL und Kopfzeilen (inkl. Secret) vom bestehenden Trigger
--      „notify-new-event“ direkt in der Datenbank – das Secret steht nicht in dieser Datei.
--
-- Für Besucher und die Website ändert sich nichts.
-- Abhängigkeiten: #20 (supabase-veranstalter-konten.sql), Webhook „notify-new-event“
-- Mehrfaches Ausführen ist sicher. Rückbau: ganz unten (auskommentiert).
-- =============================================================================

begin;

-- 1) Admin-Notizen nicht mehr für angemeldete Nutzer lesbar --------------------
revoke select on public.organizers from authenticated;
grant select (
  id, name, kind, contact_person, phone, address, city, website, instagram,
  status, created_at, updated_at, verified_at
) on public.organizers to authenticated;

-- 2a) Liste für den Admin ------------------------------------------------------
create or replace function public.marcha_admin_list_organizers()
returns table (
  id uuid, name text, kind text, contact_person text, phone text, address text,
  city text, website text, instagram text, status text, admin_notes text,
  created_at timestamptz, verified_at timestamptz, email text,
  events_total bigint, events_pending bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.marcha_auth_is_admin() then
    raise exception 'Nur für Admins.' using errcode = '42501';
  end if;
  return query
  select o.id, o.name, o.kind, o.contact_person, o.phone, o.address, o.city,
         o.website, o.instagram, o.status, o.admin_notes, o.created_at, o.verified_at,
         u.email::text,
         (select count(*) from public.events e where e.organizer_id = o.id),
         (select count(*) from public.events e where e.organizer_id = o.id and e.status = 'pending')
  from public.organizers o
  left join auth.users u on u.id = o.id
  order by (o.status = 'pending') desc, o.created_at desc;
end;
$$;

revoke all on function public.marcha_admin_list_organizers() from public;
grant execute on function public.marcha_admin_list_organizers() to authenticated;

-- 2b) Status / Notiz setzen ----------------------------------------------------
create or replace function public.marcha_admin_set_organizer(
  p_id uuid, p_status text, p_admin_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.marcha_auth_is_admin() then
    raise exception 'Nur für Admins.' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'verified', 'blocked') then
    raise exception 'Ungültiger Status: %', p_status;
  end if;
  update public.organizers
     set status = p_status,
         admin_notes = nullif(trim(coalesce(p_admin_notes, '')), '')
   where id = p_id;
  if not found then
    raise exception 'Veranstalter nicht gefunden.';
  end if;
end;
$$;

revoke all on function public.marcha_admin_set_organizer(uuid, text, text) from public;
grant execute on function public.marcha_admin_set_organizer(uuid, text, text) to authenticated;

-- 3) Benachrichtigungs-Trigger (Kopie der Webhook-Einstellungen) ---------------
do $$
declare
  raw text;
  a_url text; a_method text; a_headers text; a_params text; a_timeout text;
begin
  select encode(t.tgargs, 'escape') into raw
  from pg_trigger t
  where t.tgname = 'notify-new-event' and t.tgrelid = 'public.events'::regclass;

  if raw is null then
    raise exception 'Webhook-Trigger notify-new-event nicht gefunden – Abbruch.';
  end if;

  a_url     := split_part(raw, '\000', 1);
  a_method  := split_part(raw, '\000', 2);
  a_headers := split_part(raw, '\000', 3);
  a_params  := split_part(raw, '\000', 4);
  a_timeout := split_part(raw, '\000', 5);

  if a_url not like 'https://%/functions/v1/notify-new-event' or a_headers not like '{%}' then
    raise exception 'Webhook-Einstellungen unerwartet – Abbruch.';
  end if;

  execute 'drop trigger if exists "notify-organizer-signup" on public.organizers';
  execute format(
    'create trigger "notify-organizer-signup" after insert or update on public.organizers
       for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    a_url, a_method, a_headers, a_params, a_timeout);

  execute 'drop trigger if exists "notify-event-status" on public.events';
  execute format(
    'create trigger "notify-event-status" after update on public.events
       for each row when (old.status is distinct from new.status and new.organizer_id is not null)
       execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    a_url, a_method, a_headers, a_params, a_timeout);
end;
$$;

commit;

-- -----------------------------------------------------------------------------
-- Prüfungen (nach dem Ausführen)
-- -----------------------------------------------------------------------------
-- select has_column_privilege('authenticated', 'public.organizers', 'admin_notes', 'SELECT') as notizen_lesbar;  -- false
-- select has_column_privilege('authenticated', 'public.organizers', 'name', 'SELECT') as name_lesbar;            -- true
-- select tgname, tgrelid::regclass from pg_trigger where tgname in ('notify-organizer-signup','notify-event-status');

-- -----------------------------------------------------------------------------
-- Rückbau (bei Bedarf einzeln ausführen)
-- -----------------------------------------------------------------------------
-- drop trigger if exists "notify-organizer-signup" on public.organizers;
-- drop trigger if exists "notify-event-status" on public.events;
-- drop function if exists public.marcha_admin_set_organizer(uuid, text, text);
-- drop function if exists public.marcha_admin_list_organizers();
-- grant select on public.organizers to authenticated;
