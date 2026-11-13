# SQL-Migrationsdokumentation — GoMarcha / Marcha

> Nur Analyse. Keine Migration wird hier ausgeführt.
> Stand: 2026-05-27

---

## A) Übersichtstabelle

| # | Dateiname | Zweck | Kritikalität | Idempotent | Abhängigkeiten |
|---|-----------|-------|-------------|------------|----------------|
| 1 | `supabase-rls.sql` | **Foundation**: Alle Kernspalten auf `events`, Status/Recurrence-Constraints, RLS aktivieren, alle Basis-Policies, `marcha_auth_is_admin()`, Storage-Bucket `event-images` | **KRITISCH** | Ja (ADD COLUMN IF NOT EXISTS, DO-Blöcke) | `public.events` muss bereits existieren |
| 2 | `supabase-description-column-migration.sql` | Tippfehler-Fix: `descrption_*` → `description_*` (de/en/es); Backfill-Daten | HOCH | Ja (transaktional, prüft Spaltenexistenz) | Abhängig von #1 |
| 3 | `supabase-event-archive-columns.sql` | Archiv-Workflow: `archived_at`, `original_event_id` (self-referential FK), `event_date` NOT NULL aufheben | MITTEL | Ja | Abhängig von #1 |
| 4 | `supabase-analytics-lite.sql` | Neue Tabelle `event_analytics`: View/Share-Tracking, RLS, Admin-Policies | NIEDRIG (optional) | Ja (CREATE IF NOT EXISTS) | Abhängig von #1 (marcha_auth_is_admin) |
| 5 | `supabase-qr-tracking.sql` | Neue Tabelle `qr_tracking`: QR-Code-Attribution | NIEDRIG (optional) | Ja | Unabhängig (keine FK-Deps) |
| 6 | `supabase-social-automation.sql` | Neue Tabellen `social_queue` + `social_caption_usage`: Social-Media-Warteschlange, Constraints, Indexes, vollständige RLS-Policies | HOCH | Ja | Abhängig von #1 (`events.id` FK) |
| 7 | `supabase-social-platforms-array.sql` | Erweitert `social_queue.platforms text[]`: migriert `platform` → Array, Constraint | MITTEL | Bedingt (UPDATE auf Daten) | Abhängig von #6 |
| 8 | `supabase-social-postiz-handoff.sql` | Postiz-Integration: `postiz_post_id`, `postiz_synced_at`, `admin_confirmed_at`; ersetzt Status-Constraint; Index `ready_for_postiz` | MITTEL | Ja | Abhängig von #6 |
| 9 | `supabase-recurring-social-safe-v1.sql` | Wiederkehrende Events: `is_recurring`, `recurring_social_enabled`, `recurring_social_opt_out` auf `events`; `post_stage` auf `social_queue` | HOCH | Ja | Abhängig von #6 |
| 10 | `supabase-social-queue-recurring-prep-fix.sql` | **Catch-All-Fix**: kombiniert #7 + #9 (platforms[], post_stage, recurring_social_opt_out, original_event_id); korrigierte platforms-Constraint (NULL-tolerant) | MITTEL | Ja | Abhängig von #6; überschreibt Teile von #7/#9 |
| 11 | `supabase-admin-delete-fix.sql` | Fix: DELETE-RLS für `events`, `social_queue`, `social_caption_usage`, `event_analytics` | HOCH | Ja | Abhängig von #1, #6 |
| 12 | `supabase-admin-save-reuse-fix.sql` | Fix: `archived_at`, `original_event_id` (FK), NOT NULL auf `event_date` aufheben, `is_featured` | MITTEL | Ja | Überschneidung mit #3, abhängig von #1 |
| 13 | `supabase-admin-select-events-fix.sql` | Fix: `marcha_auth_is_admin()` neu definieren, Admin-Select + Public-Read-Policies erneuern | HOCH | Ja (CREATE OR REPLACE, DROP IF EXISTS) | Überschreibt Teile von #1 |
| 14 | `supabase-admin-role-hardening.sql` | **Sicherheits-Fix**: `marcha_auth_is_admin()` akzeptiert nur noch `app_metadata.role` (nicht mehr das vom Nutzer änderbare `user_metadata`). Teil 1 nur lesen, Teil 2 setzt vorher die Admin-Rolle des eigenen Kontos in `app_metadata` (Aussperr-Schutz) | **KRITISCH** | Ja (Transaktion, Abbruch ohne Änderung, wenn das Admin-Konto fehlt) | Abhängig von #1; muss nach #1 und #13 laufen (beide sind inzwischen angepasst) |
| 15 | `supabase-security-hardening.sql` | **Sicherheits-Fix (Council 10.11.2026)**: Bilder löschen nur Admins; Upload nur `pending/` (Besucher) bzw. `admin-replacements/` (Admins), nur Bildendungen, Bucket-Limit 10 MB + Bild-MIME-Typen; BEFORE-INSERT-Trigger setzt für Nicht-Admins `status/featured/promoted/is_featured/archived_at/original_event_id` zurück; Längengrenzen (NOT VALID, nur neue Zeilen). Rückbau-Abschnitt am Dateiende | **KRITISCH** | Ja (DROP IF EXISTS, CREATE OR REPLACE, Constraint nur wenn nicht vorhanden) | Abhängig von #1 und #14 (`marcha_auth_is_admin()`) |
| 16 | `supabase-security-hardening-2.sql` | **Sicherheits-Fix (Security Advisor 11.11.2026)**: Dateiliste im Bucket `event-images` nur noch für Admins (öffentliche Bild-Links bleiben), Trigger-Funktion aus #15 nicht direkt aufrufbar | HOCH | Ja | Abhängig von #15 |
| 17 | `supabase-security-hardening-3.sql` | **DRINGENDER Sicherheits-Fix**: entfernt drei nicht im Repo angelegte Allow-All-Regeln auf `events` („Anyone can update events“, „Public can read events“, „Anyone can insert events“) | **KRITISCH** | Ja (DROP IF EXISTS) | Abhängig von #1, #15 |
| 18 | `supabase-security-hardening-4.sql` | **Sicherheits-Fix 12.11.2026**: Besucher (anon) dürfen `contact_email`, `submitted_by`, `verification_notes` nicht mehr lesen (Spaltenrechte); anon ohne TRUNCATE/TRIGGER/REFERENCES. **Erst nach** Live-Gang von Website (Cache v18) und Worker-Deploy ausführen | HOCH | Ja | Abhängig von #17 |
| 19 | `supabase-security-hardening-5.sql` | Security Advisor: direkter API-Aufruf von `rls_auto_enable()` für anon/authenticated gesperrt (Automatik bleibt aktiv) | NIEDRIG | Ja | keine |
| 21 | `supabase-security-hardening-6.sql` | Admin-Funktion `marcha_admin_event_private(ids)`: liefert `contact_email`, `submitted_by`, `verification_notes` nur für Admins. Ändert keine Rechte. **Vor** Live-Gang von Cache v19 / Admin-Build 2026.11.12 ausführen | MITTEL | Ja | Abhängig von #14 |
| 22 | `supabase-security-hardening-7.sql` | Angemeldete Nutzer (künftig Veranstalter) dürfen die Einreicher-Spalten nicht mehr direkt lesen (Spaltenrechte wie #18 für anon). **Erst nach** #21 + Live-Gang + Admin-Test ausführen | HOCH | Ja | Abhängig von #18, #20, #21 |
| 20 | `supabase-veranstalter-konten.sql` | **Veranstalter-Konten Etappe A**: Tabelle `organizers` (RLS, Status nur durch Admin), Spalte `events.organizer_id`, Trigger `marcha_events_guard` (ersetzt Insert-Trigger aus #15, schützt jetzt auch UPDATE; geprüfte Veranstalter → direkt `approved`), RLS „eigene Events lesen/bearbeiten“, Upload-Ordner `org/<uid>/`. Für Besucher ändert sich nichts | HOCH | Ja | Abhängig von #14–#18 |
| 23 | `supabase-veranstalter-etappe-c.sql` | **Veranstalter Etappe C (13.11.2026, von Claude per Management-API ausgeführt und geprüft)**: `organizers.admin_notes` für angemeldete Nutzer nicht mehr lesbar (Spaltenrechte); Admin-Funktionen `marcha_admin_list_organizers()` und `marcha_admin_set_organizer()`; Webhook-Trigger `notify-organizer-signup` (organizers INSERT/UPDATE) und `notify-event-status` (events UPDATE bei Statuswechsel mit Veranstalter) – Kopie der Einstellungen von `notify-new-event`, Secret nicht in der Datei | MITTEL | Ja | Abhängig von #20 und Webhook `notify-new-event`; Edge Function `notify-new-event` ab Version 8 |
| 24 | `supabase-veranstalter-b2.sql` | **Veranstalter Etappe B2 (13.11.2026, von Claude ausgeführt und geprüft)**: Hilfsfunktion `marcha_event_is_complete()`; Trigger `marcha_events_guard` setzt unvollständige Events von Veranstalter-Konten (ohne Bild, Datum, Uhrzeit, Ort, Musikrichtung) auf `pending` statt `approved` – beim Eintragen und Bearbeiten. Test: geprüfter Veranstalter ohne Bild → pending, mit Bild → approved (Transaktion zurückgerollt); alle 33 freigegebenen Events vollständig | MITTEL | Ja | Abhängig von #20 |
| 25 | `supabase-secrets-rotation.sql` | **Neue Schlüssel (13.11.2026, von Claude ausgeführt)**: Cron `marcha-social-queue-runner` liest den Schlüssel zur Laufzeit aus dem Vault (`marcha_social_runner_secret`), Timeout 60 s statt 5 s; Webhook-Trigger `notify-new-event`, `notify-organizer-signup`, `notify-event-status` mit neuem Schlüssel aus dem Vault (`marcha_notify_webhook_secret`). Vault-Einträge und Edge-Function-Secrets hat Frank angelegt. Geprüft: Webhook → „OK“, Cron 21:00 → Runner HTTP 200 (danach Postiz-Upload 401 → POSTIZ_API_KEY erneuern). Vorher: 22 veraltete Social-Queue-Einträge auf `skipped` gesetzt | HOCH | Ja | Vault-Einträge + Edge-Function-Secrets müssen existieren |
| 26 | `supabase-ai-usage.sql` | **KI-Nutzungszähler (13.11.2026, von Claude ausgeführt)**: Tabelle `ai_usage` (nur Service Role; IP nur als Hash), Cron `marcha-ai-usage-cleanup` löscht Einträge > 30 Tage. Für Tageslimits der Edge Function `event-extract` (Admin unbegrenzt, Veranstalter 20/Tag, ohne Konto 5/Tag pro Anschluss und 100/Tag gesamt) | NIEDRIG | Ja | keine |

---

## B) Recovery-Reihenfolge (Disaster Recovery)

> Voraussetzung: Supabase-Projekt mit leerer `public.events`-Tabelle (Minimalstruktur mit `id`, `event_date` etc.) und aktivierter `auth`-Extension.

### Stufe 1 — Foundation (zwingend zuerst)

```
1. supabase-rls.sql
```
Erstellt alle Kernspalten, Constraints, RLS, Admin-Funktion, Storage-Bucket.
**Ohne diesen Schritt schlagen alle weiteren fehl.**

---

### Stufe 2 — Datenmigration (direkt nach Foundation)

```
2. supabase-description-column-migration.sql
```
Behebt Tippfehler in Spaltennamen und migriert vorhandene Daten.
Muss vor App-Rollout ohne Legacy-Spalten laufen.

---

### Stufe 3 — Unabhängige Erweiterungen (Reihenfolge untereinander egal)

```
3. supabase-event-archive-columns.sql
4. supabase-analytics-lite.sql
5. supabase-qr-tracking.sql
```

---

### Stufe 4 — Social-Media-Core (zwingend vor Stufe 5)

```
6. supabase-social-automation.sql
```
Erstellt `social_queue` und `social_caption_usage`.
**Stufe 5 und 6 setzen diese Tabellen voraus.**

---

### Stufe 5 — Social-Erweiterungen (Reihenfolge untereinander egal)

```
7. supabase-social-postiz-handoff.sql
8. supabase-social-queue-recurring-prep-fix.sql
```

> **Hinweis:** `supabase-social-platforms-array.sql` und `supabase-recurring-social-safe-v1.sql`
> sind durch `supabase-social-queue-recurring-prep-fix.sql` (#10) vollständig abgedeckt.
> Bei einem Neuaufbau genügt #10 für beide. Bei bestehendem System alle drei laufen lassen (idempotent).

---

### Stufe 6 — Admin-Fixes (zuletzt, alle Tabellen müssen existieren)

```
9.  supabase-admin-save-reuse-fix.sql
10. supabase-admin-select-events-fix.sql
11. supabase-admin-delete-fix.sql
```

Diese drei können in beliebiger Reihenfolge laufen, solange alle Tabellen aus Stufe 1–4 existieren.

---

### Minimale Reihenfolge für Neuaufbau (kompakt)

```
1. supabase-rls.sql
2. supabase-description-column-migration.sql
3. supabase-event-archive-columns.sql
4. supabase-analytics-lite.sql
5. supabase-qr-tracking.sql
6. supabase-social-automation.sql
7. supabase-social-postiz-handoff.sql
8. supabase-social-queue-recurring-prep-fix.sql   ← deckt #7 + #9 ab
9. supabase-admin-save-reuse-fix.sql
10. supabase-admin-select-events-fix.sql
11. supabase-admin-delete-fix.sql
```

(`supabase-social-platforms-array.sql` und `supabase-recurring-social-safe-v1.sql` können weggelassen werden, da #8 sie vollständig enthält.)

---

## C) Risikoanalyse

### C.1 — Reihenfolgen, die Probleme verursachen würden

| Falsche Reihenfolge | Problem |
|---------------------|---------|
| `supabase-social-automation.sql` vor `supabase-rls.sql` | FK auf `events.id` schlägt fehl — `social_queue` und `social_caption_usage` können nicht angelegt werden |
| `supabase-social-postiz-handoff.sql` vor `supabase-social-automation.sql` | `social_queue` existiert nicht → `ALTER TABLE` schlägt fehl |
| `supabase-recurring-social-safe-v1.sql` vor `supabase-social-automation.sql` | `social_queue.post_stage` kann nicht hinzugefügt werden |
| `supabase-admin-delete-fix.sql` vor `supabase-social-automation.sql` | RLS-Policy auf `social_queue` schlägt fehl (Tabelle existiert nicht) |
| `supabase-social-platforms-array.sql` vor `supabase-social-queue-recurring-prep-fix.sql` (umgekehrt) | **Constraint-Konflikt**: `supabase-social-platforms-array.sql` setzt `platforms IS NOT NULL`, `supabase-social-queue-recurring-prep-fix.sql` erlaubt NULL. Wenn die strengere Constraint zuerst gesetzt wird, kann die Fix-Datei sie nicht überschreiben (Exception wird geschluckt). Ergebnis: `platforms IS NOT NULL` bleibt aktiv. Im Normalfall kein Problem, aber bei Recurring-Inserts ohne explizites `platforms` würde die NOT-NULL-Verletzung auftreten. |

### C.2 — Migrationen, die Daten beeinflussen könnten

| Datei | Dateneinfluss | Risiko |
|-------|--------------|--------|
| `supabase-rls.sql` | `UPDATE public.events SET status = ...` normalisiert alle NULL/leeren Status auf `'approved'`; normalisiert `recurrence_type` auf `'none'` | **Mittel**: Bestehende Zeilen mit unbekanntem Status werden auf `'pending'` gesetzt (nicht auf `'approved'`). Zeilen mit leerem/NULL-Status werden `'approved'` — könnte ungeprüfte Events veröffentlichen |
| `supabase-description-column-migration.sql` | Backfill von `descrption_*` → `description_*` und umgekehrt | Niedrig: nur wenn Typo-Spalten existieren; `COALESCE`-Logik bevorzugt vorhandenen Wert |
| `supabase-social-platforms-array.sql` | `UPDATE social_queue SET platforms = ...` migriert `platform`-String zu Array | Niedrig: `WHERE platforms IS NULL` schützt bestehende Werte |
| `supabase-social-queue-recurring-prep-fix.sql` | Gleiche `platforms`-Migration wie oben (doppelt) | Niedrig: idempotent durch `WHERE`-Klauseln |

### C.3 — Constraint-Konflikt zwischen #7 und #10

`supabase-social-platforms-array.sql` (Datei #7) definiert:
```sql
check (platforms is not null AND cardinality >= 1 AND platforms <@ ...)
```

`supabase-social-queue-recurring-prep-fix.sql` (Datei #10) definiert:
```sql
check (platforms IS NULL OR (cardinality >= 1 AND platforms <@ ...))
```

**Wenn #7 vor #10 läuft**: Die NOT-NULL-Version bleibt aktiv (#10 prüft Existenz und überspringt).
**Wenn nur #10 läuft** (Neuaufbau): Die NULL-tolerante Version wird gesetzt.
**Empfehlung**: Bei Neuaufbau nur #10 verwenden. Bei bestehendem System beide laufen lassen (kein Schaden).

---

## D) Empfehlungen

### D.1 — Zusammenführen empfohlen

| Dateien | Empfehlung |
|---------|-----------|
| `supabase-social-platforms-array.sql` + `supabase-recurring-social-safe-v1.sql` | Können archiviert werden — `supabase-social-queue-recurring-prep-fix.sql` enthält beide vollständig. Als Legacy-Referenz behalten, aber bei Neuaufbau nicht ausführen. |
| `supabase-event-archive-columns.sql` + `supabase-admin-save-reuse-fix.sql` | Überlappen stark (`archived_at`, `original_event_id`, NOT NULL drop). Können zu einer Datei zusammengeführt werden: `supabase-event-archive-and-draft.sql` |
| `supabase-rls.sql` + `supabase-admin-select-events-fix.sql` | Fix überschreibt Teile der Foundation. Langfristig sollte `supabase-rls.sql` direkt aktualisiert werden, damit beide Dateien nicht parallel existieren müssen. |
| `supabase-admin-delete-fix.sql` + `supabase-admin-select-events-fix.sql` | Beide sind Admin-Policy-Fixes. Können zu `supabase-admin-policies-fix.sql` zusammengeführt werden. |

### D.2 — Altlasten, die bleiben können

| Datei | Begründung |
|-------|-----------|
| `supabase-social-platforms-array.sql` | Vollständig durch #10 abgedeckt; idempotent; historische Referenz sinnvoll |
| `supabase-recurring-social-safe-v1.sql` | Vollständig durch #10 abgedeckt; idempotent; historische Referenz sinnvoll |
| `supabase-description-column-migration.sql` | Einmalige Migration; nach Entfernung der Typo-Spalten aus dem Schema obsolet, aber ungefährlich |

### D.3 — Fixes, die ungefährlich sind (jederzeit re-runbar)

Alle folgenden Dateien sind vollständig idempotent und können ohne Risiko erneut ausgeführt werden:

- `supabase-admin-delete-fix.sql` — nur DROP/CREATE POLICY + GRANT
- `supabase-admin-select-events-fix.sql` — CREATE OR REPLACE FUNCTION + DROP/CREATE POLICY
- `supabase-admin-save-reuse-fix.sql` — ADD COLUMN IF NOT EXISTS + DROP NOT NULL
- `supabase-analytics-lite.sql` — CREATE TABLE IF NOT EXISTS + DROP/CREATE POLICY
- `supabase-qr-tracking.sql` — CREATE TABLE IF NOT EXISTS + DROP/CREATE POLICY
- `supabase-event-archive-columns.sql` — ADD COLUMN IF NOT EXISTS + DROP NOT NULL
- `supabase-recurring-social-safe-v1.sql` — ADD COLUMN IF NOT EXISTS + DO-Blöcke
- `supabase-social-queue-recurring-prep-fix.sql` — vollständig idempotent mit allen Schutzmechanismen

### D.4 — Offene Aufgabe: Typo-Spalten entfernen

`supabase-description-column-migration.sql` enthält auskommentierte DROP-Befehle:
```sql
-- alter table public.events drop column if exists descrption_de;
-- alter table public.events drop column if exists descrption_en;
-- alter table public.events drop column if exists descrption_es;
```
**Nach vollständigem App-Rollout** (alle Clients nutzen `description_*`) sollten diese manuell ausgeführt werden.

---

## Abhängigkeitsgraph (visuell)

```
[public.events existiert]
        │
        ▼
 1. supabase-rls.sql  ◄─────────────────────────────────────────────────────┐
        │                                                                    │
        ├──► 2. supabase-description-column-migration.sql (Daten-Fix)       │
        ├──► 3. supabase-event-archive-columns.sql                          │
        ├──► 4. supabase-analytics-lite.sql (neue Tabelle)                  │
        ├──► 5. supabase-qr-tracking.sql (neue Tabelle, unabhängig)         │
        │                                                                    │
        └──► 6. supabase-social-automation.sql                              │
                  │  (erstellt social_queue + social_caption_usage)          │
                  │                                                          │
                  ├──► 7. supabase-social-platforms-array.sql  ──┐          │
                  ├──► 8. supabase-social-postiz-handoff.sql     │          │
                  ├──► 9. supabase-recurring-social-safe-v1.sql ─┤          │
                  │                                              │          │
                  └──► 10. supabase-social-queue-recurring-prep-fix.sql     │
                            (catch-all, übernimmt #7 + #9) ─────┘          │
                                                                            │
 11. supabase-admin-save-reuse-fix.sql ──────────────────────────────────►  │
 12. supabase-admin-select-events-fix.sql ───────────────────────────────►  │
 13. supabase-admin-delete-fix.sql (benötigt #6) ────────────────────────►  ┘
```

---

## Tabellen-/Spalten-Übersicht nach Migration

### `public.events` (Kerntabelle — alle Spalten nach vollständiger Migration)

| Spalte | Hinzugefügt durch |
|--------|------------------|
| `address`, `postal_code`, `submitted_by`, `contact_email` | #1 supabase-rls.sql |
| `verification_notes`, `geocoding_query`, `status`, `featured`, `promoted` | #1 |
| `image_url`, `recurrence_type`, `recurrence_start/end_date` | #1 |
| `recurrence_weekday`, `recurrence_day_of_month` | #1 |
| `place_id`, `formatted_address`, `street`, `province`, `region` | #1 |
| `description_de`, `description_en`, `description_es` | #2 |
| `archived_at`, `original_event_id` (FK self) | #3 / #12 |
| `image_urls` (jsonb) | #6 |
| `is_recurring`, `recurring_social_enabled` | #9 |
| `recurring_social_opt_out` | #9 / #10 |
| `is_featured` | #12 |

### `public.social_queue` (Kerntabelle Social)

| Spalte | Hinzugefügt durch |
|--------|------------------|
| Grundstruktur: id, created_at, event_id, platform, scheduled_at, status | #6 |
| `postiz_integration_id`, `resolved_image_url`, `caption`, etc. | #6 |
| `title`, `image_url`, `event_date`, `location_name`, `city`, `hashtags`, `cta_text` | #6 |
| `platforms text[]` | #7 / #10 |
| `postiz_post_id`, `postiz_synced_at`, `admin_confirmed_at` | #8 |
| `post_stage` | #9 / #10 |

### Neue Tabellen

| Tabelle | Erstellt durch |
|---------|---------------|
| `public.social_caption_usage` | #6 supabase-social-automation.sql |
| `public.event_analytics` | #4 supabase-analytics-lite.sql |
| `public.qr_tracking` | #5 supabase-qr-tracking.sql |

### Storage

| Bucket | Erstellt durch |
|--------|---------------|
| `event-images` (public) | #1 supabase-rls.sql |

---

*Geänderte Dateien: keine (reine Analyse)*
*Risiken: keine (keine SQL ausgeführt)*
*Testplan: Dokumentation prüfen durch Abgleich mit tatsächlichem Supabase-Schema via `information_schema.columns`*
