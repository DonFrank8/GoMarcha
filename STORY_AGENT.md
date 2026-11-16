# Story-Agent – tägliche Instagram-Story (seit 16.11.2026)

Läuft täglich um 8:13 Uhr (Europe/Madrid) als geplante Aufgabe in der Claude-Sitzung, die Canva und Supabase verbunden hat.
Ziel: die Tages-Story als **Entwurf** in Postiz anlegen. **Nie selbst veröffentlichen** – Frank gibt in Postiz frei.

## Feste Regeln

- **Nur echte Fotos** (Entscheidung Frank 16.11.2026): 1. Event-Foto aus Marcha, 2. Franks Fotos im Canva-Ordner
  „Marcha Story-Fotos“ (Folder-ID `FAHbGct6aLs`), 3. echtes Canva-Stockfoto. **Nie KI-generierte Bilder**, keine Illustrationen.
- Fakten (Datum, Uhrzeit, Ort, Name, Preis) nur aus der Datenbank. Nichts erfinden.
- Spanien-Spanisch, „en directo“ (nie „en vivo“), max. 1 „!“.
- Keine Code-Änderungen, keine Commits, nichts in der Datenbank ändern außer über `social-postiz-admin`.
- Bei Fehlern: nichts raten, abbrechen, Frank kurz sagen, was fehlt und was er tun soll.

## Ablauf

1. **Zieltag:** heute (Europe/Madrid). Nach 11:30 Uhr → morgen.
2. **Events laden** (Supabase-Projekt `dwyhpirtbjfmohcnhdak`, `execute_sql`, `:d` = Zieltag):
   ```sql
   select id, name, artist_name, genre, event_date, event_time, location_name, city, price_text, image_url, is_recurring
   from public.events
   where status = 'approved' and archived_at is null and original_event_id is null and (
     (coalesce(is_recurring,false) = false and event_date = :d)
     or (is_recurring and coalesce(recurring_social_opt_out,false) = false
         and coalesce(recurrence_start_date, event_date) <= :d and (recurrence_end_date is null or recurrence_end_date >= :d)
         and ((recurrence_type = 'weekly' and recurrence_weekday = extract(dow from :d::date))
           or (recurrence_type = 'monthly' and recurrence_day_of_month = extract(day from :d::date))))
   ) order by event_time;
   ```
   `recurrence_weekday`: 0 = Sonntag … 6 = Samstag. Höchstens 3 Events (bevorzugt mit Bild, sonst nach Uhrzeit).
3. **Doppelte vermeiden:** `social-postiz-admin` mit `{"action":"list","from":"<Zieltag>T00:00:00Z","to":"<Zieltag>T23:59:59Z"}`.
   Instagram-Einträge zwischen 12:00 und 12:15 Madrider Zeit mit leerem Text = Stories → schon vorhanden: nichts anlegen, Frank informieren.
4. **Story bauen** (Canva `create-design`, Format „Instagram Story“, je Event eine Story):
   - Bild: `event.image_url` per `upload-asset-from-url` nach Canva, mit `move-item-to-folder` in `FAHbGct6aLs`; ohne Bild Foto aus `FAHbGct6aLs` oder echtes Stockfoto.
   - `references` = [Asset-ID], Brief (Platzhalter ersetzen):
     > Instagram Story (vertical 9:16) for Marcha, a live-music guide for the Costa del Sol. Use ONLY the supplied real photo as full-bleed background (no AI images, no illustrations, no other photos). Minimal and readable: small label at the top 'HOY EN LA COSTA' and the line '<Wochentag> <Tag> <Monat>' (Spanish, e.g. 'Miércoles 18 nov'); near the bottom a dark semi-transparent band with the big name '<artist_name or name>', the line '<genre> en directo', then '<HH:MM> · <location_name>', '<city>', and at the very bottom 'gomarcha.com'. Colours: sunset orange #FF7A3D accent on dark navy. Bold modern sans-serif. Spanish text exactly as given, nothing else added, no prices.
   - Freigegebene Vorlage: Canva-Design `DAHbGZYsVow` (Joolz, 18.11.2026).
   - **Kein Event** → Marcha-Story, gleicher Stil, Foto aus `FAHbGct6aLs` oder Stockfoto (Livemusik, Strand, Costa del Sol). Thema:
     Mo/Di „Esta semana en la Costa – todos los planes en gomarcha.com“ · Mi/Do „Planes de finde: míralos en gomarcha.com“ ·
     Fr/Sa/So „¿Tocas en directo o tienes un bar? Sube tu evento gratis en gomarcha.com“.
   - Auf das Design warten (`get-create-design-async-job`, `polling_policy` beachten).
5. **Export:** `export-design` als jpg (quality 90).
6. **An Postiz** (Story-Entwurf, 12:00 Madrid, weitere 12:05/12:10; UTC = Winter −1 h, Sommer −2 h):
   ```sql
   select net.http_post(
     url := 'https://dwyhpirtbjfmohcnhdak.supabase.co/functions/v1/social-postiz-admin',
     headers := jsonb_build_object('Content-Type','application/json','x-marcha-social-secret',
       (select decrypted_secret from vault.decrypted_secrets where name = 'marcha_social_runner_secret')),
     body := jsonb_build_object('action','story_draft','date','<ISO-UTC>','image_url','<Canva-Export-URL>'),
     timeout_milliseconds := 60000) as request_id;
   ```
   ~10 s warten, dann `select status_code, content::text from net._http_response where id = <request_id>;` – Erfolg: `"ok": true` + `postId`.
7. **Nachricht an Frank** (Push, kurz, Deutsch): „Story für <Tag> liegt in Postiz (12:00) – bitte prüfen und freigeben.“ + je Story Event/Thema und Canva-Link. Bei Problemen: was fehlt, was zu tun ist.

## Hinweise

- Canva-Export-Links laufen nach einigen Stunden ab → Export und Übergabe direkt hintereinander.
- Canva-Bilder können in der Sitzung nicht angesehen werden (Netzwerk gesperrt) → Franks Sichtprüfung in Postiz ist Pflicht.
- Löschen eines falschen Story-Entwurfs: `{"action":"delete_post","post_id":"<postId>"}`.
