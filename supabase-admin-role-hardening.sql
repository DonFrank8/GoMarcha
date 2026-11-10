-- Admin-Rolle absichern (Sicherheits-Fix)
--
-- Problem: marcha_auth_is_admin() hat die Admin-Rolle auch in `user_metadata` akzeptiert.
-- Dieses Feld kann jeder angemeldete Nutzer selbst ändern (supabase.auth.updateUser).
-- Danach zählt nur noch `app_metadata` (kann nur der Server bzw. der SQL-Editor setzen).
--
-- In ZWEI Schritten im Supabase SQL-Editor ausführen. Beide Schritte sind wiederholbar.


-- =====================================================================
-- TEIL 1 – NUR ANSEHEN (ändert nichts)
-- Zeigt alle Konten, die irgendwo eine Rolle eingetragen haben.
--   rolle_sicher   = app_metadata  (zählt nach dem Fix)
--   rolle_unsicher = user_metadata (zählt nach dem Fix NICHT mehr)
-- Unbekannte E-Mail-Adressen mit "admin" hier bitte melden.
-- =====================================================================
select
  email,
  raw_app_meta_data ->> 'role'  as rolle_sicher,
  raw_user_meta_data ->> 'role' as rolle_unsicher,
  last_sign_in_at
from auth.users
where raw_app_meta_data ->> 'role' is not null
   or raw_user_meta_data ->> 'role' is not null
order by email;


-- =====================================================================
-- TEIL 2 – ABSICHERN
-- Vorher in der Zeile `admin_email` DEINE Admin-E-Mail eintragen.
-- Ablauf:
--   1. Prüft, dass es dieses Konto gibt – sonst Abbruch, nichts wird geändert.
--   2. Setzt bei diesem Konto die Rolle "admin" im sicheren Feld (app_metadata)
--      und markiert es als Supervisor (darf später weitere Admins anlegen).
--   3. Erst dann wird die Prüf-Funktion auf das sichere Feld umgestellt.
-- Danach im Admin-Bereich einmal ab- und wieder anmelden.
-- =====================================================================
begin;

do $$
declare
  admin_email text := 'DEINE-ADMIN-EMAIL@beispiel.com';  -- <== hier anpassen
  found_count integer;
begin
  select count(*) into found_count from auth.users where lower(email) = lower(trim(admin_email));
  if found_count <> 1 then
    raise exception 'Kein (eindeutiges) Konto mit der E-Mail % gefunden. Es wurde nichts geändert.', admin_email;
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin', 'supervisor', true)
  where lower(email) = lower(trim(admin_email));
end $$;

create or replace function public.marcha_auth_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(trim(auth.jwt() -> 'app_metadata' ->> 'role'), ''), '') = 'admin';
$$;

revoke all on function public.marcha_auth_is_admin() from public;
grant execute on function public.marcha_auth_is_admin() to anon, authenticated;

commit;
