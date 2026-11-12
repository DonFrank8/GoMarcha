-- =============================================================================
-- Marcha – Veranstalter-Konten, Etappe A (Datenbank) – Entwurf 12.11.2026
--
-- Was diese Datei macht:
--   1. Neue Tabelle `organizers`: ein Eintrag pro Veranstalter-Konto
--      (Name, Art, Ansprechpartner, Telefon, Adresse, Website/Instagram freiwillig,
--      Status pending / verified / blocked).
--   2. Neue Spalte `events.organizer_id`: verknüpft ein Event mit seinem Veranstalter.
--   3. Trigger auf `events` (ersetzt den Insert-Trigger aus #15):
--        - Besucher ohne Konto: wie bisher → Event wartet in der Moderation.
--        - Geprüfter Veranstalter → Event geht direkt live (status 'approved').
--        - Ungeprüfter Veranstalter → Event wartet in der Moderation.
--        - Gesperrter Veranstalter → kann nichts eintragen oder ändern.
--        - Beim BEARBEITEN können Veranstalter Hervorhebung, Archiv, Status und
--          Zuordnung nicht verändern. Ändert ein UNgeprüfter Veranstalter ein
--          freigegebenes Event, geht es zurück in die Moderation.
--   4. RLS: Veranstalter sehen und bearbeiten nur ihre eigenen Events
--      (auch wartende). Löschen bleibt Admins vorbehalten.
--   5. Bilder: Veranstalter laden zusätzlich in ihren eigenen Ordner `org/<konto-id>/`.
--
-- Was diese Datei NICHT macht (bewusst, kommt mit Etappe B/C):
--   - Die Lücke „angemeldete Nutzer sehen contact_email/submitted_by/verification_notes“
--     wird hier noch NICHT geschlossen. Dafür muss zuerst admin.js die Einreicher-Daten
--     über eine Admin-Funktion lesen. → Eigene SQL-Datei VOR dem Start der
--     Veranstalter-Anmeldung (Etappe B). Bis dahin gibt es keine Veranstalter-Konten,
--     weil die Website noch keine Anmeldung anbietet.
--
-- Für Besucher und die Website ändert sich durch diese Datei NICHTS:
--   Alles Neue ist zusätzlich. Der bisherige Weg (Event einreichen ohne Konto,
--   Admin moderiert) funktioniert unverändert.
--
-- Abhängigkeiten: #14 (marcha_auth_is_admin), #15 (Insert-Trigger), #16, #17, #18
-- Ausführen: komplett im Supabase SQL-Editor. Mehrfaches Ausführen ist sicher.
-- Rückbau: ganz unten (auskommentiert).
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) Tabelle organizers
-- -----------------------------------------------------------------------------
create table if not exists public.organizers (
  id              uuid primary key references auth.users (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 200),
  kind            text not null check (kind in ('location', 'bar', 'band', 'dj', 'other')),
  contact_person  text not null check (char_length(contact_person) between 1 and 200),
  phone           text not null check (char_length(phone) between 3 and 40),
  address         text not null check (char_length(address) between 3 and 300),
  city            text check (city is null or char_length(city) <= 120),
  website         text check (website is null or char_length(website) <= 300),
  instagram       text check (instagram is null or char_length(instagram) <= 100),
  status          text not null default 'pending' check (status in ('pending', 'verified', 'blocked')),
  admin_notes     text check (admin_notes is null or char_length(admin_notes) <= 2000),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  verified_at     timestamptz
);

comment on table public.organizers is
  'Veranstalter-Konten (Locations, Bars, Bands, DJs). Status setzt nur ein Admin.';

alter table public.organizers enable row level security;

-- Besucher ohne Login haben hier nichts zu suchen.
revoke all on public.organizers from anon;
grant select, insert, update, delete on public.organizers to authenticated;

-- Hilfsfunktion: Status des eigenen Veranstalter-Kontos (null = kein Konto).
create or replace function public.marcha_current_organizer_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select o.status from public.organizers o where o.id = auth.uid();
$$;

revoke all on function public.marcha_current_organizer_status() from public;
grant execute on function public.marcha_current_organizer_status() to anon, authenticated;

-- RLS-Regeln für organizers
drop policy if exists "Organizers read own profile" on public.organizers;
create policy "Organizers read own profile"
on public.organizers for select to authenticated
using (id = auth.uid() or public.marcha_auth_is_admin());

drop policy if exists "Organizers create own profile" on public.organizers;
create policy "Organizers create own profile"
on public.organizers for insert to authenticated
with check (id = auth.uid());

drop policy if exists "Organizers update own profile" on public.organizers;
create policy "Organizers update own profile"
on public.organizers for update to authenticated
using (id = auth.uid() or public.marcha_auth_is_admin())
with check (id = auth.uid() or public.marcha_auth_is_admin());

drop policy if exists "Admins delete organizers" on public.organizers;
create policy "Admins delete organizers"
on public.organizers for delete to authenticated
using (public.marcha_auth_is_admin());

-- Trigger: Veranstalter können Status, Notizen und Zeitstempel nicht selbst setzen.
create or replace function public.marcha_organizers_protect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.marcha_auth_is_admin() or coalesce(auth.role(), '') not in ('anon', 'authenticated') then
    -- Admin oder Server: darf alles; Freigabe-Zeitpunkt automatisch merken.
    if new.status = 'verified' and (tg_op = 'INSERT' or old.status is distinct from 'verified') then
      new.verified_at := now();
    end if;
  elsif tg_op = 'INSERT' then
    new.status      := 'pending';
    new.admin_notes := null;
    new.verified_at := null;
    new.created_at  := now();
  else
    new.id          := old.id;
    new.status      := old.status;
    new.admin_notes := old.admin_notes;
    new.verified_at := old.verified_at;
    new.created_at  := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.marcha_organizers_protect() from public;

drop trigger if exists marcha_organizers_protect on public.organizers;
create trigger marcha_organizers_protect
before insert or update on public.organizers
for each row execute function public.marcha_organizers_protect();

-- -----------------------------------------------------------------------------
-- 2) Spalte events.organizer_id
-- -----------------------------------------------------------------------------
alter table public.events
  add column if not exists organizer_id uuid references public.organizers (id) on delete set null;

create index if not exists events_organizer_id_idx on public.events (organizer_id);

-- Besucher dürfen die Zuordnung sehen (nötig für spätere Location-Seiten,
-- verrät nur eine zufällige Konto-ID). Ergänzt die Spaltenliste aus #18.
grant select (organizer_id) on public.events to anon;

-- -----------------------------------------------------------------------------
-- 3) Trigger auf events: Eintragen UND Bearbeiten durch Nicht-Admins
--    (ersetzt marcha_events_sanitize_public_insert aus #15)
-- -----------------------------------------------------------------------------
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
  end if;

  return new;
end;
$$;

revoke all on function public.marcha_events_guard() from public;

drop trigger if exists marcha_events_sanitize_public_insert on public.events;
drop trigger if exists marcha_events_guard on public.events;
create trigger marcha_events_guard
before insert or update on public.events
for each row execute function public.marcha_events_guard();

-- Alte Funktion aus #15 wird nicht mehr gebraucht.
drop function if exists public.marcha_events_sanitize_public_insert();

-- -----------------------------------------------------------------------------
-- 4) RLS auf events für Veranstalter
-- -----------------------------------------------------------------------------
-- Geprüfte Veranstalter dürfen direkt freigegebene Events anlegen
-- (die bestehende Regel „Anonymous can submit pending events“ erlaubt nur pending).
drop policy if exists "Verified organizers publish events" on public.events;
create policy "Verified organizers publish events"
on public.events for insert to authenticated
with check (
  organizer_id = auth.uid()
  and status = 'approved'
  and public.marcha_current_organizer_status() = 'verified'
);

-- Eigene Events sehen (auch wartende/abgelehnte).
drop policy if exists "Organizers read own events" on public.events;
create policy "Organizers read own events"
on public.events for select to authenticated
using (organizer_id = auth.uid());

-- Eigene Events bearbeiten (nicht gesperrt).
drop policy if exists "Organizers update own events" on public.events;
create policy "Organizers update own events"
on public.events for update to authenticated
using (
  organizer_id = auth.uid()
  and public.marcha_current_organizer_status() in ('pending', 'verified')
)
with check (organizer_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 5) Bilder: eigener Ordner org/<konto-id>/ für Veranstalter
-- -----------------------------------------------------------------------------
drop policy if exists "Visitors upload event images to pending" on storage.objects;
create policy "Visitors upload event images to pending"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'event-images'
  and lower(coalesce(storage.extension(name), '')) in ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
  and (
    (storage.foldername(name))[1] = 'pending'
    or (
      (storage.foldername(name))[1] = 'admin-replacements'
      and public.marcha_auth_is_admin()
    )
    or (
      (storage.foldername(name))[1] = 'org'
      and (storage.foldername(name))[2] = auth.uid()::text
      and public.marcha_current_organizer_status() in ('pending', 'verified')
    )
  )
);

commit;

-- -----------------------------------------------------------------------------
-- Prüfung (sollte 5 Zeilen mit ok = true zeigen)
-- -----------------------------------------------------------------------------
select 'Tabelle organizers' as pruefung, to_regclass('public.organizers') is not null as ok
union all select 'Spalte events.organizer_id',
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'events' and column_name = 'organizer_id')
union all select 'Trigger marcha_events_guard',
  exists (select 1 from pg_trigger where tgname = 'marcha_events_guard' and tgrelid = 'public.events'::regclass)
union all select 'alter Trigger entfernt',
  not exists (select 1 from pg_trigger where tgname = 'marcha_events_sanitize_public_insert')
union all select 'Besucher lesen keine Einreicher-E-Mail',
  not has_column_privilege('anon', 'public.events', 'contact_email', 'SELECT');

-- =============================================================================
-- RÜCKBAU (nur im Notfall; markieren und ausführen):
-- =============================================================================
-- begin;
-- drop policy if exists "Verified organizers publish events" on public.events;
-- drop policy if exists "Organizers read own events" on public.events;
-- drop policy if exists "Organizers update own events" on public.events;
-- drop trigger if exists marcha_events_guard on public.events;
-- -- danach supabase-security-hardening.sql Abschnitt 3 erneut ausführen (alter Insert-Trigger)
-- -- Upload-Regel: supabase-security-hardening.sql Abschnitt 2 erneut ausführen
-- alter table public.events drop column if exists organizer_id;
-- drop table if exists public.organizers;
-- drop function if exists public.marcha_current_organizer_status();
-- drop function if exists public.marcha_organizers_protect();
-- drop function if exists public.marcha_events_guard();
-- commit;
