# Offene Punkte — Marcha

Merkliste für die nächsten Sessions. Stand: 10.11.2026.
Erledigtes hier streichen bzw. nach „Erledigt“ verschieben.

## 1. Veranstalter-Konten (nächstes großes Thema)

Mit Frank abgestimmt:

- Locations, Bars, Bands registrieren sich selbst (Login per E-Mail-Link) und geben einmal ihre Daten an:
  Name, Art (Location/Bar/Band/DJ), Ansprechpartner, Telefon, Adresse. **Website und Instagram freiwillig.**
- Frank prüft neue Veranstalter **täglich von Hand**. Bis zur Freigabe landen ihre Events wie bisher in der Moderation (`pending`).
- **Geprüfte Veranstalter veröffentlichen direkt** (Status setzt die Datenbank per Trigger/RLS, nicht der Browser).
- Veranstalter **bearbeiten ihre eigenen Events** (nur eigene, per RLS über `organizer_id = auth.uid()`).
- **Bilder statt Flyer**: 1–3 Fotos; Hinweis „Foto von Band/Location wirkt besser als ein Flyer mit viel Text“.
- Veranstalter haben **keinen Zugriff auf den Admin-Bereich** (keine `app_metadata.role`).
- Für Frank **einfach von unterwegs**: Mail bei neuer Anmeldung mit Ein-Tipp-„Freigeben“; schlanke Handy-Seite „Moderation“ mit großen Knöpfen (Freigeben, Offline nehmen, Sperren).
- Später automatisieren (nach ein paar Wochen Handbetrieb): E-Mail-Domain passt zur Website, Google-Maps-Eintrag, SMS-Bestätigung. Reine E-Mail-Bestätigung reicht nicht gegen Fakes.
- WhatsApp-Einreichung: **vorerst nicht** (Frank, 10.11.2026).
- Plan vor dem Coden vorlegen (SQL: Tabelle `organizers`, Spalte `events.organizer_id`, Trigger, RLS; Frontend; Admin).

## 2. Supervisor: „Admins verwalten“

- Frank (`app_metadata.supervisor = true`) soll im Admin-Bereich weitere Admins anlegen/entfernen können.
- Rollen dürfen nur serverseitig gesetzt werden → geschützte Edge Function nötig.
- Beim Anlegen weiterer Admins **`MARCHA_ADMIN_ALLOWED_EMAILS`** (Edge-Function-Secret) um deren E-Mail ergänzen (Komma-getrennt), sonst können sie die Social Queue nicht steuern.

## 3. Übersetzung `smart-action` absichern

- Funktion ist deployt, aber **nicht im Repo**. Code aus dem Supabase-Dashboard (Edge Functions → smart-action → Code) ins Repo holen.
- Ist **ohne Login aufrufbar** → Fremde könnten OpenAI-Kosten verursachen. Ein Monatsbudget bei OpenAI ist gesetzt (Frank, 10.11.2026).
- Mit den Veranstalter-Konten: nur noch angemeldete Veranstalter/Admins, Längengrenze pro Text.

## 4. `social-queue-runner` neu deployen

- Code-Fix (Admin-Rolle nur aus `app_metadata`) ist im Repo, auf dem Server läuft noch die alte Version.
- Bis zum Deploy schützt das Secret `MARCHA_ADMIN_ALLOWED_EMAILS` (gesetzt, geprüft).
- Deploy nur mit Franks Freigabe.

## 5. Eigener Mailserver für Supabase-Auth

- Supabase-Standard-Mails gehen nur begrenzt raus (meist nur an Team-Mitglieder). Für Veranstalter-Mails Zoho-SMTP in Supabase einrichten (Authentication → Emails → SMTP). Zoho-Daten liegen schon als Secrets (`SMTP_*`) für `notify-new-event`.

## 6. Kleinere Punkte

- **Titelbild**: Frank liefert ein eigenes Foto. Austausch in `style.css`, Abschnitt „Titelbild“ (aktuell Unsplash-Foto mit warmen Bühnenlichtern).
- **Schnellfilter**: Frank entscheidet später, ob weitere dazukommen (z. B. Gratis, Strand/Beach, Heute Abend).
- **Logo und Farbschema** können sich noch ändern; Farben stehen zentral in `style.css` → Abschnitt „Redesign 2026“ (`--m-accent` usw.).
- Ordner `supabase/functions/process-social-queue/` kann gelöscht werden (nicht mehr deployt, geprüft 10.11.2026).
- Desktop-Kopfbereich könnte noch kompakter werden.

## Testumgebung

- Cloudflare Pages-Projekt **`gomarcha-test`** baut jeden Branch automatisch:
  `https://<branch-name-mit-bindestrichen>.gomarcha-test.pages.dev` (z. B. `test-redesign-karten.gomarcha-test.pages.dev`).
  Keine eigene Domain daran hängen. Dort keine echten Events einreichen (gleiche Datenbank).

## Erledigt (10.11.2026)

- Sicherheitslücke Admin-Rolle (`user_metadata`) geschlossen, Frank als Supervisor markiert.
- Supabase: Site URL und Redirect URLs korrigiert; Secret `MARCHA_ADMIN_ALLOWED_EMAILS` gesetzt.
- Admin: „Passwort vergessen?“ und „Passwort ändern“.
- Redesign live: Event-Karten (4:5-Bild, Datum/Uhrzeit, Titel, Lokal · Ort, Preis), Schnellfilter Heute/Morgen/Wochenende + Musikrichtungen, Sunset-Orange, Vollbild-Details, große Handy-Karte mit „← Liste“, „Gemerkt“, Veranstalter-Hinweis, Fix: Route/Teilen ersetzen Marcha nicht mehr.
