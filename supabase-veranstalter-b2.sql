-- =============================================================================
-- Marcha – Veranstalter-Konten, Etappe B2 (Datenbank) – 13.11.2026
--
-- Was diese Datei macht:
--   Events von Veranstalter-Konten gehen nur live, wenn sie vollständig sind
--   (Name, Datum bzw. wiederkehrend, Uhrzeit, Ort, Bild, Musikrichtung – dieselben
--   Pflichtangaben wie bei der Freigabe im Admin). Unvollständige Events landen
--   ohne Fehlermeldung in der Moderation (status 'pending').
--   Gilt beim Eintragen und beim Bearbeiten. Admins und Server-Jobs sind nicht betroffen,
--   Besucher ohne Konto auch nicht (deren Events sind ohnehin immer 'pending').
--
-- Technik: neue Hilfsfunktion marcha_event_is_complete(events) + angepasster Trigger
--   marcha_events_guard (sonst identisch mit #20).
-- Abhängigkeiten: #20. Mehrfaches Ausführen ist sicher.
-- Rückbau: Funktion marcha_events_guard aus supabase-veranstalter-konten.sql erneut ausführen.
-- =============================================================================

begin;

create or replace function public.marcha_event_is_complete(e public.events)
returns boolean
language sql
immutable
as $$
  select coalesce(nullif(trim(e.name), ''), nullif(trim(e.title_es), ''), nullif(trim(e.title_en), ''), nullif(trim(e.title_de), '')) is not null
     and (e.event_date is not null or coalesce(e.is_recurring, false))
     and nullif(trim(coalesce(e.event_time, '')), '') is not null
     and nullif(trim(coalesce(e.location_name, '')), '') is not null
     and nullif(trim(coalesce(e.image_url, '')), '') is not null
     and nullif(trim(coalesce(e.genre, '')), '') is not null;
$$;

revoke all on function public.marcha_event_is_complete(public.events) from public;

create or replace function public.marcha_events_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_status text;
begin
  -- Admins und Server-Jobs (Social-Queue, Service-Role) bleiben unberührt.
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') or public.marcha_auth_is_admin() then
    return new;
  end if;

  org_status := case when auth.role() = 'authenticated' then public.marcha_current_organizer_status() end;

  if org_status = 'blocked' then
    raise exception 'Dieses Veranstalter-Konto ist gesperrt.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    -- Felder, die nur Admins setzen dürfen (wie bisher in #15).
    new := jsonb_populate_record(new, jsonb_build_object(
      'featured', false,
      'promoted', false,
      'is_featured', false,
      'archived_at', null,
      'original_event_id', null,
      -- recurring_social_enabled bleibt beim Eintragen auf dem Standard (true), wie bisher.
      'verification_notes', null
    ));

    if org_status is not null then
      new.organizer_id := auth.uid();
      new.status := case when org_status = 'verified' then 'approved' else 'pending' end;
      -- B2: Unvollständige Events geprüfter Veranstalter gehen in die Moderation statt live.
      if new.status = 'approved' and not public.marcha_event_is_complete(new) then
        new.status := 'pending';
      end if;
      new.contact_email := coalesce(nullif(trim(new.contact_email), ''), auth.jwt() ->> 'email');
    else
      new.organizer_id := null;
      new.status := 'pending';
    end if;

  else -- UPDATE (RLS lässt nur eigene Events von Veranstaltern durch)
    new.id                 := old.id;
    new.organizer_id       := old.organizer_id;
    new.created_at         := old.created_at;
    new.featured           := old.featured;
    new.promoted           := old.promoted;
    new.is_featured        := old.is_featured;
    new.archived_at        := old.archived_at;
    new.original_event_id  := old.original_event_id;
    new.recurring_social_enabled := old.recurring_social_enabled;
    new.verification_notes := old.verification_notes;
    new.status := case
      when org_status = 'verified' then old.status
      when old.status = 'approved' then 'pending'   -- ungeprüft: zurück in die Moderation
      else old.status
    end;
    -- B2: Wird ein freigegebenes Event unvollständig bearbeitet, geht es zurück in die Moderation.
    if new.status = 'approved' and not public.marcha_event_is_complete(new) then
      new.status := 'pending';
    end if;
  end if;

  return new;
end;
$$;

commit;

-- Prüfung:
-- select public.marcha_event_is_complete(e) as vollstaendig, count(*) from public.events e where status = 'approved' group by 1;
