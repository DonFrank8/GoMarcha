-- =============================================================================
-- Marcha – Sicherheits-Härtung (Council vom 10.11.2026), Stand 11.11.2026
--
-- Zweck:
--   1. Bilder im Bucket `event-images` dürfen nur noch Admins löschen
--      (vorher: JEDER Besucher konnte JEDES Bild löschen).
--   2. Hochladen nur noch in den Ordner `pending/` (Besucher) bzw. zusätzlich
--      `admin-replacements/` (Admins); nur Bildformate, höchstens 10 MB.
--   3. Beim Eintragen eines Events setzt die Datenbank für Nicht-Admins
--      Hervorhebungs- und Archiv-Felder zurück (featured, promoted, …).
--   4. Längengrenzen gegen Spam – gelten nur für NEUE Einträge (NOT VALID).
--
-- Abhängigkeiten: supabase-rls.sql, supabase-admin-role-hardening.sql
--   (Funktion public.marcha_auth_is_admin() muss existieren).
-- Ausführen: komplett im Supabase SQL-Editor. Mehrfaches Ausführen ist sicher.
-- Rückbau: siehe Abschnitt ganz unten (auskommentiert).
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) Löschen nur für Admins
-- -----------------------------------------------------------------------------
drop policy if exists "Anyone can delete own event images path" on storage.objects;
drop policy if exists "Admins can delete event images" on storage.objects;
create policy "Admins can delete event images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-images'
  and public.marcha_auth_is_admin()
);

-- -----------------------------------------------------------------------------
-- 2) Hochladen: nur richtige Ordner und Bildendungen; Bucket-Limits
-- -----------------------------------------------------------------------------
drop policy if exists "Anyone can upload event images" on storage.objects;
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
  )
);

-- Größe und Dateiart prüft Supabase zusätzlich direkt am Bucket.
update storage.buckets
set
  file_size_limit = 10485760, -- 10 MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'event-images';

-- -----------------------------------------------------------------------------
-- 3) Eintragen: Nicht-Admins können keine Hervorhebung/Archiv-Felder setzen
-- -----------------------------------------------------------------------------
create or replace function public.marcha_events_sanitize_public_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nur Anfragen über die Website (anon/authenticated) ohne Admin-Rolle.
  -- Datenbank-Jobs und Service-Role (z. B. Social-Queue) bleiben unberührt.
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and not public.marcha_auth_is_admin() then
    -- jsonb_populate_record setzt nur Spalten, die es in events wirklich gibt;
    -- fehlende Spalten werden ignoriert (kein Fehler beim Eintragen).
    new := jsonb_populate_record(
      new,
      jsonb_build_object(
        'status', 'pending',
        'featured', false,
        'promoted', false,
        'is_featured', false,
        'archived_at', null,
        'original_event_id', null
      )
    );
  end if;
  return new;
end;
$$;

revoke all on function public.marcha_events_sanitize_public_insert() from public;

drop trigger if exists marcha_events_sanitize_public_insert on public.events;
create trigger marcha_events_sanitize_public_insert
before insert on public.events
for each row
execute function public.marcha_events_sanitize_public_insert();

-- -----------------------------------------------------------------------------
-- 4) Längengrenzen gegen Spam (nur neue/geänderte Zeilen, bestehende bleiben)
-- -----------------------------------------------------------------------------
do $$
declare
  limits constant jsonb := jsonb_build_object(
    'name', 300, 'title', 300, 'title_de', 300, 'title_en', 300, 'title_es', 300,
    'location_name', 200, 'street', 300, 'address', 300, 'postal_code', 20,
    'city', 120, 'province', 120, 'region', 120, 'country', 80,
    'genre', 200, 'artist_name', 200, 'additional_artists', 500, 'price_text', 80,
    'description', 8000, 'description_de', 8000, 'description_en', 8000, 'description_es', 8000,
    'artist_bio', 4000, 'artist_bio_de', 4000, 'artist_bio_en', 4000, 'artist_bio_es', 4000,
    'image_url', 1000, 'contact_email', 254, 'submitted_by', 200
  );
  col text;
  max_len int;
  constraint_name text;
begin
  for col, max_len in select key, value::int from jsonb_each_text(limits) loop
    constraint_name := 'events_len_' || col;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'events' and column_name = col
    ) and not exists (
      select 1 from pg_constraint
      where conname = constraint_name and conrelid = 'public.events'::regclass
    ) then
      execute format(
        'alter table public.events add constraint %I check (%I is null or char_length(%I::text) <= %s) not valid',
        constraint_name, col, col, max_len
      );
    end if;
  end loop;
end $$;

commit;

-- =============================================================================
-- RÜCKBAU (nur falls Besucher keine Events/Bilder mehr eintragen können):
-- Die folgenden Zeilen markieren und ausführen.
-- =============================================================================
-- drop policy if exists "Visitors upload event images to pending" on storage.objects;
-- create policy "Anyone can upload event images" on storage.objects
--   for insert to anon, authenticated with check (bucket_id = 'event-images');
-- update storage.buckets set file_size_limit = null, allowed_mime_types = null where id = 'event-images';
-- drop trigger if exists marcha_events_sanitize_public_insert on public.events;
-- (Die Lösch-Regel NICHT zurückbauen – sie war die eigentliche Lücke.)
