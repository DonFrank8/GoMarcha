-- =============================================================================
-- Marcha – Sicherheits-Härtung Teil 6 – 12.11.2026
--
-- Neue Admin-Funktion marcha_admin_event_private(ids): liefert E-Mail, Name und
-- Notizen der Einreicher – NUR wenn ein Admin fragt, sonst Fehler.
-- Admin-Bereich (admin.js) und Website (app.js, Admin-Ansicht) lesen diese
-- Felder darüber, statt direkt aus der Tabelle.
--
-- Diese Datei ändert KEINE Rechte. Sie ist Voraussetzung für Teil 7, der die
-- Spalten für angemeldete Nutzer (künftige Veranstalter) sperrt.
--
-- Reihenfolge: 1) DIESE Datei ausführen, 2) Code (Cache v19, Admin-Build
-- 2026.11.12-einreicher-daten) live bringen und testen, 3) Teil 7 ausführen.
--
-- Abhängigkeiten: #14 (marcha_auth_is_admin). Mehrfaches Ausführen ist sicher.
-- =============================================================================

create or replace function public.marcha_admin_event_private(p_ids bigint[])
returns table (id bigint, contact_email text, submitted_by text, verification_notes text)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.marcha_auth_is_admin() then
    raise exception 'Nur für Admins.' using errcode = '42501';
  end if;
  return query
    select e.id, e.contact_email, e.submitted_by, e.verification_notes
    from public.events e
    where e.id = any (p_ids);
end;
$$;

revoke all on function public.marcha_admin_event_private(bigint[]) from public, anon;
grant execute on function public.marcha_admin_event_private(bigint[]) to authenticated;

-- Prüfung: sollte 1 Zeile mit „true“ zeigen
select to_regprocedure('public.marcha_admin_event_private(bigint[])') is not null as funktion_vorhanden;
