# Offene Punkte — Marcha

Merkliste für die nächsten Sessions. Stand: 11.11.2026 (Redesign Etappe 1).
Erledigtes hier streichen bzw. nach „Erledigt“ verschieben.

## Redesign (11.11.2026): neues Logo + Design in Etappen

**Logo entschieden: C3 „Disco-Sonne“** (M mit untergehender Sonne als halbe Discokugel, Schriftzug „marcha“ in Outfit Bold).
Paket (SVG/PNG, App-Icon, Favicon, Android adaptive, einfarbig) in Drive: „Logo Marcha final / Marcha Logo 2026 – C3 Disco-Sonne“.
Council (4 Prüfer) + Grafikdesigner-Review: Frank unterschreibt die Designer-Punkte vollständig.

**Etappe 1 – LIVE seit 11.11.2026** (Freigabe Frank, Branch `redesign-etappe-1` nach `main`):
eine Farbpalette (Orange = einzige Aktionsfarbe), Überschrift „Livemusik & Partys an der Costa del Sol“ (bewusst nicht „Nacht“ – es gibt auch Nachmittags-Partys),
kompakter Kopfbereich, Install-Hinweis erst ab 2. Besuch/erstem Favorit, wiederkehrende Events nur einmal in der Liste,
Übersetzungslücken (Footer u. a.), neues Logo + Icons v5 + neues Vorschaubild (`social-preview-es.jpg`, `social-preview.png`).
Frank-Feedback nach Live-Gang: Hinweis „Jeden Freitag“ geht auf der Karte unter → wird in Etappe 2 mit dem neuen Kartendesign sichtbarer.

**TO-DO Google Play (Frank, 11.11.2026):** neues App-Icon in die Android-App bringen.
- Das Android-Projekt (Play-Store-Build, `Marcha.aab`) liegt NICHT in diesem Repo.
- Dateien im Logo-Paket (Drive „Logo Marcha final / Marcha Logo 2026 – C3 Disco-Sonne“): `android-adaptive-vordergrund.svg` + `android-adaptive-hintergrund.svg` (Adaptive Icon), `marcha-icon-1024.png` / `marcha-icon-512.png`.
- Play Console: Store-Eintrag → App-Symbol (512 × 512 PNG) und Feature-Grafik tauschen; Screenshots (Canva „Marcha App Store Screens“) zeigen noch das alte Logo.
- Neuen Build im Closed Test hochladen (zusammen mit dem nächsten ohnehin fälligen Build).

**Etappe 2 (ca. 1 Woche):** neues Kartendesign (einheitlicher Rahmen statt Flyer-Pinnwand, Datum als Block),
Desktop: Liste volle Breite, Karte nur per Schalter; Event-Detailseite mit Info-Leiste (Wann/Wo/Preis) und fester Aktionsleiste (Route/Merken/Teilen);
neues Schriftpaar (z. B. Outfit/Unbounded + DM Sans statt Poppins/Inter); echtes Küsten-Foto statt Stock-Konzertfoto;
`style.css` mit EINEM Token-System neu aufsetzen (heute 3 Designs übereinander: Basis, „Marbella Beach Vibe Refresh“ ab ~Z. 3989, „Redesign 2026“ ab ~Z. 4642, darüber jetzt die Palette am Dateiende).
**Etappe 3:** richtiger Footer (Über uns, Kontakt, Instagram, „Für Veranstalter“), hervorgehobene Platzierungen für zahlende Kunden.

**Noch nicht entschieden – Schnellfilter nach Stimmung** (Live-Musik, DJ & Club, Latin, Beach & Sunset, Rooftop, Gratis):
Frank findet die Idee gut, will aber **keine Events verlieren** (wer „Salsa“ einträgt, muss bei „Latin“ gefunden werden).
Lösungsidee: Stimmungen als Obergruppen mit fester Zuordnung (Latin = Salsa, Bachata, Son, Merengue, Bolero, Cha Cha Cha, Reggaeton …);
„Beach & Sunset“/„Rooftop“ brauchen eine Angabe pro Location → mit den Veranstalter-Konten.

**Übersetzungen müssen besser werden (Frank):** Automatische Übersetzungen klingen nicht natürlich/nativ.
Betrifft die Edge Function `smart-action` (OpenAI, Code NICHT im Repo) → Code ins Repo holen, Prompt auf natürliche, lokale Sprache
(Spanien-Spanisch, „en directo“, lockerer Ton) umstellen, feste Begriffe als Glossar vorgeben, Beispiele vorher/nachher prüfen.

**Beobachtung beim Test (11.11.2026):** Live sind nur 5 Events (alle wöchentlich). Mittwochs zeigt „Heute“ deshalb 0 Treffer.
Ortsangaben enthalten teils „Spanien“ (aus den Daten, z. B. „Alhaurín de la Torre, Spanien“) – auch auf EN/ES.

## 0. ALS NÄCHSTES (Frank, 10.11.2026: „machen wir gleich morgen“): Sicherheits-Fixes aus dem Council

Erst **Plan vorlegen**, dann umsetzen. Ergebnis eines Councils (4 Prüfer) vom 10.11.2026, Punkt 1 selbst im Code bestätigt:

1. **HOCH – Jeder kann alle Bilder löschen**: `supabase-rls.sql` Policy „Anyone can delete own event images path“ prüft nur `bucket_id`. → Löschen nur für Admins (`marcha_auth_is_admin()`); `app.js` ruft `remove` bei fehlgeschlagenem Upload auf (`deleteUploadedEventImage`) → dort Fehler still ignorieren.
2. **MITTEL-HOCH – Beliebige Dateien hochladen**: Policy „Anyone can upload event images“ ohne Typ/Größe/Ordner. → Im Dashboard beim Bucket `event-images` Größenlimit (z. B. 8 MB) und erlaubte Typen (jpeg/png/webp) setzen; Ordner-Bedingung in der Policy.
3. **MITTEL – Einreicher können `featured`, `promoted`, `is_featured`, `archived_at`, `original_event_id`, `recurring_social_enabled` mitsenden** (Insert-Policy prüft nur `status`). → `BEFORE INSERT`-Trigger setzt diese Felder für Nicht-Admins zurück.
4. **Vertrauen – fehlender Preis wird als „Gratis“/„Eintritt frei“ angezeigt** (`normalizeEvent`: `price_text || t("details_free")`, und `isFreePrice` zählt leer als gratis). → „Preis auf Anfrage“ o. ä. anzeigen.
5. **supabase-js ohne feste Version** (`@supabase/supabase-js@2` in `index.html` und `admin.html`) → auf exakte Version festlegen.
6. `social-queue-runner` neu deployen (siehe Punkt 4 unten), `smart-action`-Code ins Repo holen, Ordner `process-social-queue` löschen.
7. Spam/Statistik: Längengrenzen (CHECK) für Event-Texte, `qr_tracking`/`event_analytics` begrenzen; Captcha (Cloudflare Turnstile) später. `NOTIFY_WEBHOOK_SECRET` ist gesetzt (gesehen am 10.11.2026).
8. Frank: Supabase → **Advisors → Security** öffnen und Ergebnis zeigen (Tabelle `events` wird im Repo nirgends angelegt, weitere Tabellen sind nicht prüfbar).

## Council-Empfehlungen zu Strategie und Monetarisierung (10.11.2026) – noch nicht entschieden

- **Monetarisierung:** Idee A (Eintragen gratis, Social-Media-Promotion verkaufen) = ja, aber später. Idee B (zahlen ab X Events/Monat) = nein (bestraft die fleißigsten Locations, leicht zu umgehen).
  Vorschlag: Gratis / **Boost** 15–29 € pro Event (oben + „Gesponsert“, eigener Post + Story, kleiner Bericht) / **Location Pro** 39–49 €/Monat. Start erst bei ca. 30–50 aktiven Veranstaltern und mehreren tausend lokalen Followern. Vorher Autónomo, 21 % IVA, Rechnungen (Verifactu) mit Gestoría klären; bezahlte Posts als „Publicidad“ kennzeichnen.
  Vergleich: My Guide Marbella Premium 49,99 €/Monat; Bandsintown Boost 50 $/Event; Eventbrite nur Ticketgebühr.
- **Entscheidung Frank (10.11.2026):** Veranstalter-Konten werden **fertig gebaut** (nach den Sicherheits-Fixes), und Frank startet **gleichzeitig** den Nachfrage-Test: Locations persönlich ansprechen, 2–3 Promotions von Hand verkaufen (z. B. 10–20 €), notieren wer mitmacht/zahlt und wie viel Zeit es kostet. Ergebnisse des Tests hier eintragen.
- **Jetzt schon messen:** Besucher/Monat (z. B. Plausible/Umami), Klicks pro Event auf Route/Teilen/Merken/Ticket, Reichweite pro Post (Postiz/Meta), Follower-Zuwachs.
- **Für die Veranstalter-Konten vormerken:** eigene Location-Seite, Pflichtfelder Preis + Straße, Knopf „Absagen“, Feld Ticket-/Reservierungs-Link, „Gesponsert“-Kennzeichnung, ein Status `hidden` für gesperrte Veranstalter, Felder `featured_until`/`promoted_until`; nur ein Feld statt `featured` + `is_featured`. Technische Fallstricke (Trigger auch für UPDATE, `organizer_id` erzwingen, Bilder-Ordner `org/<uid>/`, wiederkehrende Events) stehen im Council-Bericht „Technik“.
- Betriebsaufwand mit Konten geschätzt 4–9 h/Woche für Frank allein. „Admins verwalten“ erst, wenn es eine zweite Person gibt.
- Produkt-Kleinigkeiten: Überschrift „Für dich entdeckt“ → ehrlicher z. B. „Heute & demnächst“; Schnellfilter „Strand/Beach“, „Gratis“, „Heute Abend“ prüfen.

## 1. Veranstalter-Konten (nächstes großes Thema)

**Reihenfolge:** nach Punkt 0 (Sicherheits-Fixes). Plan vorlegen, dann bauen. Mit Frank abgestimmt:

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

## 5. Zoho-E-Mail-Konten für Marcha + Mailserver für Supabase-Auth

- **To-do Frank (eingetragen 10.11.2026, Kalender 11.11.):** Zoho-E-Mail-Konten für Marcha einrichten bzw. ordnen. Vorschlag, mit Frank abzustimmen:
  - `info@gomarcha.com` – öffentliche Kontaktadresse (Impressum, Veranstalter-Anfragen, Promotion-Verkauf)
  - `noreply@gomarcha.com` (oder `hola@…`) – Absender für automatische Mails (Login-Links, Bestätigungen, Benachrichtigungen)
  - Franks Admin-Login bleibt vorerst `derhilgersfrank@gmail.com`; ein Umzug auf eine Marcha-Adresse wäre ein eigener Schritt (dann `MARCHA_ADMIN_ALLOWED_EMAILS` und `app_metadata` anpassen).
  - DNS bei Cloudflare prüfen: SPF, DKIM, DMARC für gomarcha.com, damit Mails nicht im Spam landen.
- Danach: Supabase-Standard-Mails gehen nur begrenzt raus (meist nur an Team-Mitglieder). Für Veranstalter-Mails Zoho-SMTP in Supabase einrichten (Authentication → Emails → SMTP Settings) mit dem Absender-Konto oben. Zoho-Daten liegen schon als Secrets (`SMTP_*`) für `notify-new-event` – prüfen, welches Konto dort hinterlegt ist.

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
