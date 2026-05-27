# Supabase Backup & Recovery — GoMarcha

> Nur Anleitung. Keine echten Secrets, Keys oder Passwörter in dieser Datei.
> Stand: 2026-05-27

---

## A) Was muss gesichert werden?

### Kritische Daten (Verlust = Datenverlust für Nutzer)

| Quelle | Inhalt | Kritikalität |
|--------|--------|-------------|
| Tabelle `public.events` | Alle eingereichten und genehmigten Events | **KRITISCH** |
| Storage-Bucket `event-images` | Hochgeladene Event-Bilder | **KRITISCH** |
| Tabelle `public.social_queue` | Social-Media-Warteschlange inkl. Status | HOCH |
| Tabelle `public.social_caption_usage` | Caption-Verlauf pro Event | MITTEL |

### Ergänzende Daten (rekonstruierbar oder verzichtbar)

| Quelle | Inhalt | Kritikalität |
|--------|--------|-------------|
| Tabelle `public.event_analytics` | View/Share-Tracking | NIEDRIG |
| Tabelle `public.qr_tracking` | QR-Code-Attribution | NIEDRIG |

### Konfiguration (muss separat dokumentiert/gesichert werden — nicht hier)

| Was | Wo aufbewahren |
|-----|----------------|
| Supabase Service Role Key | Passwort-Manager (z. B. 1Password, Bitwarden) |
| Supabase Anon Key | Passwort-Manager |
| Postiz API Key | Passwort-Manager |
| `MARCHA_SOCIAL_RUNNER_SECRET` | Passwort-Manager |
| Postiz Integration IDs (Instagram, Facebook) | Passwort-Manager |
| Cloudflare Worker Secrets | Passwort-Manager / Cloudflare Dashboard |
| Supabase JWT Secret | Supabase Dashboard → Settings → API |

> **Regel:** Kein Secret, kein Key, kein Passwort kommt in diese Datei oder ins Git-Repository.

---

## B) Manueller Export über das Supabase Dashboard

### Tabellen als CSV exportieren

1. Supabase Dashboard öffnen: `https://supabase.com/dashboard`
2. Projekt `GoMarcha` auswählen (Projekt-Ref: `dwyhpirtbjfmohcnhdak`)
3. Linke Navigation → **Table Editor**
4. Tabelle auswählen (z. B. `events`)
5. Oben rechts → **Export CSV** klicken
6. Datei lokal speichern mit Datum im Dateinamen, z. B.:
   ```
   events_backup_2026-05-27.csv
   social_queue_backup_2026-05-27.csv
   ```

Reihenfolge für vollständigen Export:

```
1. public.events
2. public.social_queue
3. public.social_caption_usage
4. public.event_analytics     (optional)
5. public.qr_tracking         (optional)
```

### Datenbankdump über das Dashboard (PostgreSQL)

1. Supabase Dashboard → **Settings** → **Database**
2. Abschnitt **Backups** → dort sind automatische tägliche Backups von Supabase sichtbar
3. Für einen manuellen Point-in-Time-Dump: **Download** neben dem gewünschten Backup-Datum

> Supabase Free-Plan: 1 Backup (letzter Tag). Pro-Plan: bis zu 7 Tage Point-in-Time-Recovery.

---

## C) Manueller Export über die Supabase CLI

Voraussetzung: [Supabase CLI](https://supabase.com/docs/guides/cli) installiert, Projekt gelinkt.

```bash
# Projekt verknüpfen (einmalig)
supabase link --project-ref dwyhpirtbjfmohcnhdak

# Vollständiger Datenbankdump (Schema + Daten)
supabase db dump --data-only -f backup_data_$(date +%Y-%m-%d).sql

# Nur Schema (ohne Daten — für Rebuild-Dokumentation)
supabase db dump -f backup_schema_$(date +%Y-%m-%d).sql
```

> Der `--data-only`-Dump enthält alle Tabellendaten als SQL INSERT-Statements.
> Für Disaster Recovery: Schema zuerst (via SQL_MIGRATIONS.md), dann Datendump einspielen.

### Einzelne Tabelle via psql exportieren

```bash
# Verbindungsstring aus Supabase Dashboard → Settings → Database → Connection string
psql "postgresql://postgres:[DB-PASSWORT]@db.dwyhpirtbjfmohcnhdak.supabase.co:5432/postgres" \
  -c "\COPY public.events TO 'events_backup_$(date +%Y-%m-%d).csv' WITH CSV HEADER"
```

> Das DB-Passwort niemals in Scripts hardcoden. Aus Passwort-Manager holen und nur temporär in der Shell setzen.

---

## D) Storage-Bucket `event-images` sichern

### Über das Supabase Dashboard

1. Supabase Dashboard → **Storage**
2. Bucket `event-images` öffnen
3. Dateien manuell herunterladen (bei kleinem Bucket praktikabel)

### Über die Supabase CLI

```bash
# Alle Dateien aus dem Bucket lokal spiegeln
supabase storage cp --recursive 'ss:///event-images' ./backup_event-images_$(date +%Y-%m-%d)/
```

### Über die REST API (skriptbar)

```bash
# Liste aller Objekte im Bucket abrufen (Anon Key reicht für public bucket)
curl "https://dwyhpirtbjfmohcnhdak.supabase.co/storage/v1/object/list/event-images" \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"prefix": "", "limit": 1000}'
```

> Für Massendownload: wget/curl über die öffentlichen URLs der Dateien (Bucket ist public).
> Öffentliche URL-Struktur:
> `https://dwyhpirtbjfmohcnhdak.supabase.co/storage/v1/object/public/event-images/[dateiname]`

---

## E) Edge Function Secrets — Übersicht (ohne Werte)

Diese Secrets müssen nach einem Projekt-Restore in Supabase neu gesetzt werden.
**Werte niemals hier eintragen — nur im Passwort-Manager aufbewahren.**

### Supabase Edge Function Secrets (via `supabase secrets set`)

| Secret-Name | Verwendung | Funktion |
|-------------|-----------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | DB-Zugriff ohne RLS | alle Edge Functions |
| `POSTIZ_API_KEY` | Postiz API-Authentifizierung | `process-social-queue`, `social-queue-runner` |
| `POSTIZ_BASE_URL` | Postiz API-Endpunkt | `process-social-queue` |
| `POSTIZ_API_BASE` | Postiz API-Endpunkt (Runner) | `social-queue-runner` |
| `POSTIZ_INTEGRATION_IDS` | Komma-getrennnte Integration-IDs | `process-social-queue` |
| `POSTIZ_INSTAGRAM_INTEGRATION_ID` | Instagram Channel-ID in Postiz | `social-queue-runner` |
| `POSTIZ_FACEBOOK_INTEGRATION_ID` | Facebook Channel-ID in Postiz | `social-queue-runner` |
| `MARCHA_SOCIAL_RUNNER_SECRET` | Bearer-Token für Runner-Webhook | `social-queue-runner` |
| `MARCHA_POSTIZ_POST_MODE` | `draft` oder `schedule` | `social-queue-runner` |
| `MARCHA_POSTIZ_MIN_REVIEW_HOURS` | Mindest-Vorlaufzeit (Stunden) | `social-queue-runner` |
| `MARCHA_POSTIZ_REVIEW_WINDOW_HOURS` | Review-Fenster (Stunden) | `social-queue-runner` |
| `MARCHA_PUBLIC_SITE_URL` | Öffentliche Site-URL | `social-queue-runner` |
| `MARCHA_DEFAULT_SOCIAL_IMAGE_URL` | Fallback-Bild für Social Posts | `social-queue-runner` |
| `MARCHA_EVENT_TIMEZONE` | Zeitzone für Event-Scheduling | `social-queue-runner` |
| `MARCHA_ADMIN_ALLOWED_EMAILS` | Admin-E-Mail-Allowlist | `social-queue-runner` |

### Cloudflare Worker Secrets (via `wrangler secret put`)

| Secret-Name | Verwendung | Worker |
|-------------|-----------|--------|
| `SUPABASE_ANON_KEY` oder `SUPABASE_SERVICE_ROLE_KEY` | DB-Leserecht für Event-Share | `event-share` (gomarcha-event-share) |

### Secrets nach Restore setzen

```bash
# Beispiel (Wert aus Passwort-Manager einfügen, nicht hier speichern)
supabase secrets set POSTIZ_API_KEY=<wert-aus-passwort-manager>
supabase secrets set MARCHA_SOCIAL_RUNNER_SECRET=<wert-aus-passwort-manager>
# ... alle weiteren Secrets analog
```

---

## F) Restore-Grundablauf

> Vollständiger Ablauf bei komplettem Datenverlust (neues Supabase-Projekt).
> Details zur Migrations-Reihenfolge: [SQL_MIGRATIONS.md](SQL_MIGRATIONS.md)

### Schritt 1 — Neues Supabase-Projekt anlegen

1. `https://supabase.com` → New Project
2. Projekt-Name: `GoMarcha` (oder Staging-Name)
3. Region: Europa (Frankfurt oder ähnlich)
4. Datenbank-Passwort: sicher generieren und im Passwort-Manager speichern

### Schritt 2 — Datenbankschema aufbauen

SQL-Dateien in dieser Reihenfolge im Supabase SQL-Editor ausführen (siehe [SQL_MIGRATIONS.md](SQL_MIGRATIONS.md)):

```
1. supabase-rls.sql
2. supabase-description-column-migration.sql
3. supabase-event-archive-columns.sql
4. supabase-analytics-lite.sql
5. supabase-qr-tracking.sql
6. supabase-social-automation.sql
7. supabase-social-postiz-handoff.sql
8. supabase-social-queue-recurring-prep-fix.sql
9. supabase-admin-save-reuse-fix.sql
10. supabase-admin-select-events-fix.sql
11. supabase-admin-delete-fix.sql
```

### Schritt 3 — Daten importieren

```bash
# Option A: via psql (Datenbankdump)
psql "postgresql://postgres:[PASSWORT]@db.[NEUE-REF].supabase.co:5432/postgres" \
  -f backup_data_YYYY-MM-DD.sql

# Option B: via Supabase Dashboard → Table Editor → Import CSV
# events zuerst importieren (FK-Referenz für social_queue)
```

Reihenfolge bei CSV-Import (FK-Abhängigkeiten beachten):
```
1. events          (keine FK-Abhängigkeit)
2. social_queue    (FK → events.id)
3. social_caption_usage  (FK → events.id)
4. event_analytics (keine FK-Abhängigkeit)
5. qr_tracking     (keine FK-Abhängigkeit)
```

### Schritt 4 — Storage wiederherstellen

```bash
supabase storage cp --recursive ./backup_event-images_YYYY-MM-DD/ 'ss:///event-images'
```

### Schritt 5 — Edge Function Secrets setzen

Alle Secrets aus Abschnitt E aus dem Passwort-Manager holen und setzen:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<wert>
supabase secrets set POSTIZ_API_KEY=<wert>
# ... alle weiteren Secrets aus Tabelle E
```

### Schritt 6 — Edge Functions deployen

```bash
supabase functions deploy event-share
supabase functions deploy process-social-queue
supabase functions deploy social-queue-runner
```

### Schritt 7 — Admin-User wiederherstellen

```sql
-- Im Supabase SQL-Editor des neuen Projekts ausführen
-- E-Mail-Adresse des Admin-Users anpassen
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email in ('admin@yourdomain.com');
```

### Schritt 8 — Cloudflare Worker neu deployen

```bash
cd workers/event-share
wrangler secret put SUPABASE_ANON_KEY   # oder SUPABASE_SERVICE_ROLE_KEY
wrangler deploy
```

### Schritt 9 — Funktionstest

- [ ] Event-Liste auf `www.gomarcha.com` lädt approved Events
- [ ] Event-Submission als Anon-User ergibt Status `pending`
- [ ] Admin-Login unter `admin.html` funktioniert
- [ ] Admin sieht pending/approved/rejected Events
- [ ] Social Queue im Admin-Dashboard sichtbar
- [ ] `/e/[event-id]` OG-Preview funktioniert (Cloudflare Worker)

---

## G) Empfohlene Backup-Frequenz

| Datei | Frequenz | Methode |
|-------|----------|---------|
| `public.events` | **Wöchentlich** | CSV-Export oder CLI-Dump |
| `public.social_queue` | Wöchentlich | CSV-Export |
| `public.social_caption_usage` | Monatlich | CSV-Export |
| Storage `event-images` | Monatlich | CLI oder manuell |
| `public.event_analytics` | Optional / Monatlich | CSV-Export |
| Edge Function Secrets | Bei jeder Änderung | Passwort-Manager aktualisieren |

> **Supabase Pro-Plan**: Automatische tägliche Backups sind aktiv. Trotzdem empfiehlt sich ein monatlicher manueller Export als zweite Sicherung außerhalb von Supabase.

> **Supabase Free-Plan**: Nur 1 automatisches Backup. Manueller Export ist hier besonders wichtig.

---

## H) Checkliste für den monatlichen Backup-Test

Einmal im Monat prüfen:

- [ ] Supabase Dashboard → Settings → Backups: letzter Backup-Zeitstempel aktuell?
- [ ] CSV-Export `public.events` durchführen und Zeilenanzahl mit letztem Export vergleichen
- [ ] CSV-Export `public.social_queue` durchführen
- [ ] Storage-Bucket `event-images`: stichprobenartig 2–3 Bild-URLs manuell aufrufen und prüfen, ob sie erreichbar sind
- [ ] Alle Secrets im Passwort-Manager noch aktuell? (Falls ein Key rotiert wurde, eintragen)
- [ ] Backup-Dateien lokal und/oder auf externem Speicher (z. B. verschlüsselte externe Festplatte, privates Cloud-Backup) vorhanden?
- [ ] `SQL_MIGRATIONS.md` noch aktuell? Neue Migrationen seit letztem Backup-Test?

---

*Geänderte Dateien: keine (reine Dokumentation)*
*Risiken: keine (keine Datenbank, kein Code, keine Secrets berührt)*
*Testplan: Datei in Markdown-Renderer prüfen; alle Links verifizieren*
