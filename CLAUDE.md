# CLAUDE.md — Marcha (gomarcha.com)

Diese Datei liest Claude Code bei jedem Start. Sie beschreibt das Projekt, die Arbeitsregeln und die bekannten Stolperfallen.

## Projekt in einem Satz

Marcha ist eine Event-Plattform für Livemusik an der Costa del Sol (Bands, DJs, Venues). Öffentliche Seite + Admin-Dashboard + automatische Social-Media-Posts über Postiz.

## Wer hier arbeitet

Der Inhaber (Frank) ist **kein Programmierer**. Er gibt Aufgaben vor, prüft Ergebnisse und gibt Deploys frei.
- Erkläre Ergebnisse auf Deutsch, in einfachen Worten, ohne Fachjargon wo möglich.
- Wenn du ihn etwas prüfen lässt: sag genau, wo er klicken oder was er sehen soll.

## Arbeitsregeln (verbindlich)

1. **Erst analysieren, dann coden.** Bei jeder Aufgabe zuerst: Was ist die Ursache? Welche Dateien/Funktionen sind betroffen? Welcher Plan? → Plan vorlegen und auf Freigabe warten.
2. **Minimale Änderungen.** Nur das ändern, was für die Aufgabe nötig ist. Kein Umbau, kein „Aufräumen" nebenbei.
3. **Ein Thema pro Commit**, mit klarer Commit-Message im Stil `fix: …` / `feat: …`.
4. **Kein Push auf `main`, kein Deploy, keine SQL-Ausführung auf der Live-Datenbank ohne ausdrückliche Freigabe.** Das gilt auch für `supabase functions deploy` und `wrangler deploy`.
   Ausnahme (Frank, 11.11.2026): **Arbeits-Branches (alles außer `main`) dürfen ohne Rückfrage gepusht werden**, damit keine Arbeit verloren geht, wenn eine Session endet. Sie gehen dadurch nicht live (GitHub Pages veröffentlicht nur `main`). Nie mit `--force` auf fremde Branches, nie direkt auf `main`.
5. **Nach jeder Änderung:** kurz zusammenfassen, was geändert wurde, wie man es testet, und welche Risiken es gibt.
6. Bei Unsicherheit: nachfragen statt raten.

## Architektur

| Teil | Technik | Wo |
|------|---------|-----|
| Öffentliche Seite | Vanilla JS, kein Build-Schritt, kein Framework | `index.html`, `app.js` (~9.000 Zeilen), `style.css` |
| Admin-Dashboard | Vanilla JS | `admin.html`, `admin.js` (~11.500 Zeilen), `admin.css` |
| Hosting | GitHub Pages (`CNAME`, `.nojekyll`) | Push auf den Haupt-Branch = live |
| DNS/SSL | Cloudflare | — |
| Event-Share-Vorschau | Cloudflare Worker (Route `www.gomarcha.com/e/*`) | `workers/event-share/` |
| Backend | Supabase (Postgres, Auth per Magic Link, Storage-Bucket `event-images`) | `supabase/` |
| Edge Functions | Deno/TypeScript; im Repo laut `supabase/config.toml`: `social-queue-runner`, `event-share`, `notify-new-event`. `smart-action` (Übersetzung DE/EN/ES über OpenAI, Secret `OPENAI_API_KEY`; Code am 12.11.2026 aus Version 20 ins Repo geholt) | `supabase/functions/` |
| Social Media | Postiz (Facebook, Instagram), Captions aus festen spanischen Vorlagen (kein KI-Dienst; KI nur für Übersetzungen über `smart-action`) | `supabase/functions/social-queue-runner/` |
| Admin-Benachrichtigung | E-Mail per Zoho SMTP bei neuem Event | `supabase/functions/notify-new-event/` |
| Rechtliche Seiten | Statisches HTML | `legal.html`, `privacy.html`, `data-deletion.html` |
| SQL-Migrationen | Lose Dateien im Hauptordner (nicht unter `supabase/`) | `supabase-*.sql` |
| PWA | Service Worker | `service-worker.js` |
| Skripte | Node ≥ 18 | `scripts/` (Backup, Social-QA, Recurring-Logik) |

Hinweise:
- Die frühere Funktion `process-social-queue` wurde am 12.11.2026 aus dem Repo gelöscht (war seit Nov. 2026 nicht mehr deployt; abgelöst durch `social-queue-runner`).
- `smart-action` (Übersetzung) wird von `app.js` (`translateText`) und `admin.js` aufgerufen und ist **ohne Login aufrufbar** (JWT-Prüfung aus). Bekanntes Risiko: Fremde könnten über den öffentlichen Anon-Key OpenAI-Kosten verursachen. Absicherung (nur angemeldete Veranstalter/Admins, Längengrenze) ist für die Veranstalter-Konten geplant; bis dahin begrenzt ein Monatsbudget bei OpenAI die Kosten.
- Share-Vorschau gibt es doppelt: Cloudflare Worker (`workers/event-share/`, Route `/e/*`) und Edge Function `event-share`. Bei Änderungen an der Vorschau beide prüfen.

Sprachen der Inhalte: Deutsch, Englisch, Spanisch (z. B. `description_de/en/es`).

## Wichtige Dokumente im Repo (vor Änderungen lesen)

- `OFFENE_PUNKTE.md` — **Merkliste mit Franks offenen Aufgaben und Entscheidungen.** Zu Beginn jeder Session lesen und Frank fragen, womit es weitergeht.
- `SQL_MIGRATIONS.md` — **Quelle der Wahrheit** für Datenbankschema und Reihenfolge der Migrationen
- `SOCIAL_AUTOMATION_SETUP.md` — Ablauf der Social-Media-Queue, Zeitregeln, Postiz
- `RECURRING_EVENTS_NOTES.md` — wiederkehrende Events (weekly/monthly)
- `SUPABASE_BACKUP_RECOVERY.md` — Backup und Wiederherstellung
- `IMPLEMENTATION_GUIDANCE_STEP10.md` — Frontend-Konventionen (State, Render-Reihenfolge)
- `MOBILE_WIREFRAME_SPEC.md` — mobiles Layout (Designvorgabe aus dem Redesign)

„VIBEON“ war ein früherer Projektname. Im Code heißen noch die `localStorage`-Schlüssel in `app.js` (`vibeon_*`, `vibeon.*`) so. Nicht umbenennen, sonst verlieren Nutzer Favoriten, Sprache und gespeicherten Standort.

## Bekannte Stolperfallen

- **Große Dateien:** `app.js` und `admin.js` sind sehr groß. Nie komplett neu schreiben, immer gezielt mit Suche nach Funktionsnamen arbeiten.
- **Cache:** Nach Änderungen an `app.js`, `style.css` oder Assets ggf. `CACHE_VERSION` in `service-worker.js` erhöhen, sonst sehen Nutzer die alte Version. `admin.html` lädt `social-post-image.js` mit fester `?v=`-Version → bei Änderung mit hochzählen.
- **Legacy-Namen:** Variablen `window.PARTYRADAR_*` sind absichtlich noch da (Kompatibilität). Nicht umbenennen.
- **Spalten-Tippfehler:** Alte Spalten `descrption_*` existieren evtl. noch neben `description_*`. Immer `description_*` verwenden.
- **Wiederkehrende Events:** Nur der Master-Datensatz liegt in der DB; Termine werden im Frontend erzeugt (IDs `<master_id>::<YYYY-MM-DD>`). Moderation immer am Master.
- **Social-Queue-Regeln:** Posts nie am oder nach Eventbeginn; Postiz-Entwürfe entstehen ca. 72 h vorher (`MARCHA_POSTIZ_REVIEW_WINDOW_HOURS`). Bereits an Postiz übergebene Einträge (`status = posted`) dürfen nicht doppelt erzeugt werden.
- **Zeitzone:** `MARCHA_EVENT_TIMEZONE` ist standardmäßig `Europe/Berlin` (gleiche Uhrzeit wie Spanien, aber bei Änderungen beachten).
- **Facebook/WhatsApp-Vorschau** cachen stark → beim Testen `?v=2`, `?v=3` usw. an Share-Links hängen.
- **Google-Play-Deeplink** (`.well-known/assetlinks.json`): bekanntes Problem, bewusst zurückgestellt bis nach dem Closed Test. Nicht anfassen ohne Auftrag.

## Sicherheit

- **Niemals** `SUPABASE_SERVICE_ROLE_KEY`, `POSTIZ_API_KEY`, SMTP-Daten oder andere Secrets in Frontend-Dateien oder ins Repo schreiben. Secrets liegen in Supabase bzw. Cloudflare.
- Admin-Rechte laufen **nur** über `app_metadata.role = 'admin'` und RLS-Policies (`supabase-rls.sql`). `user_metadata` darf **nie** für Rechte verwendet werden – das kann jeder Nutzer selbst ändern (Lücke im Nov. 2026 geschlossen, siehe `supabase-admin-role-hardening.sql`). Frank ist zusätzlich `app_metadata.supervisor = true`. Änderungen an RLS immer extra erklären und freigeben lassen.
- Selbst-Registrierung in Supabase ist **an** (nötig für spätere Veranstalter-Konten). Neue Nutzer haben keine Rechte außer denen, die RLS ausdrücklich erlaubt.
- Lokale Backups (`backups/`, `.env.backup.local`) nie committen.

## Testen

- Es gibt keine automatischen Tests. Nach Änderungen beschreiben, wie Frank es im Browser prüfen kann (Handy + Desktop).
- Social-Automation read-only prüfen: `node scripts/check-social-automation.js` (braucht `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY`, veröffentlicht nichts).
- Share-Vorschau prüfen: `curl -i -A "facebookexternalhit/1.1" "https://www.gomarcha.com/e/<id>?v=1"`

## Neue SQL-Migrationen

- Als eigene Datei `supabase-<thema>.sql` anlegen, idempotent schreiben (`IF NOT EXISTS`).
- In `SQL_MIGRATIONS.md` eintragen (Zweck, Abhängigkeiten, Reihenfolge).
- Frank führt SQL selbst im Supabase-Editor aus, nach Freigabe.
