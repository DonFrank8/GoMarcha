# Offene Punkte — Marcha

Merkliste für die nächsten Sessions. Stand: 19.11.2026.
Erledigtes hier streichen bzw. nach „Erledigt“ verschieben.

## Erledigt am 19.11.2026 (Frank mit Claude)

- Google Search Console: Domain `gomarcha.com` bestätigt (über Cloudflare), beide Sitemaps eingereicht → „Erfolgreich“ (22 Event-Seiten + 4 feste Seiten).
- Cloudflare: Besucherzahlen unter gomarcha.com → Analytics → Visitors (serverseitig, zählt auch Bots; USA-Anteil = v. a. Crawler). Separates „Web Analytics“ (JS-Snippet) nicht nötig.
- Instagram: Bio-Link `https://www.gomarcha.com/?source=ig_bio` („Todos los eventos“). Alten Link „gomarcha“ entfernen (Frank). Angeheftete Posts: später, Claude baut passende Beiträge.
- Event 120 (Chilled Live Music): KI-Satz „hamburguesas“ ist in allen Sprachen weg.
- Postiz Do 19.11.: erledigt.
- **App-Icon Google Play: zurückgestellt** – Frank will das Logo/Icon erst nochmal überarbeiten.
- Gefunden: Cloudflare zeigt ~100 Serverfehler (5xx) pro Tag. Ursache: Share-Worker liefert 500 bei IDs, die keine Zahl sind (z. B. `/e/abc`, vermutlich auch Serientermine `/e/120::2026-11-21`). Korrektur geplant (Worker).

## SEO-Etappe (17.11.2026) – LIVE, Search Console erledigt 19.11.

Freigabe Frank 17.11.: echte Event-Seiten statt Weiterleitung, Sitemaps, Search Console. Details: `ROADMAP_KI_AUTOMATIK.md` S1–S7.
- Gebaut (Branch `claude/upbeat-noether-1a10lk`): Worker `workers/event-share/worker.js` – `/e/<id>` zeigt jetzt eine echte Event-Seite (Bild, Titel, Datum/Serie + nächster Termin, Lokal/Adresse, Preis, Beschreibung, Knöpfe „Ver en Marcha“ + „Cómo llegar“), keine automatische Weiterleitung mehr, JSON-LD `Event` (ohne Flyer-Bild), canonical ohne `?v`/`?source`; vergangene/archivierte Events → 410 + noindex; nicht gefunden → 404-Seite; `/e/sitemap.xml` mit allen kommenden Events. OG-Vorschau für WhatsApp/Facebook bleibt.
- Dazu: `sitemap.xml` (feste Seiten), beide Sitemaps in `robots.txt`, canonical von legal/privacy/data-deletion auf www.
- Getestet lokal mit echten Daten (Handy + Computer) und 26 Einzelprüfungen (Serien, Zeitzone, Preis, 410, Schutz vor Schadcode).
- **Reihenfolge Live-Gang:** 1. Frank spielt den Worker im Cloudflare-Dashboard ein → 2. Claude prüft live (Googlebot + Facebook-Vorschau mit `?v=`) → 3. Branch auf `main` (robots.txt/sitemap.xml) → 4. Frank: Google Search Console (S7).
- Offen: S6 (Edge Function `event-share` noindex). Hinweis: Beschreibung von Event 120 enthält KI-Text „en el cartel aparecen hamburguesas…“ → im Admin glätten.

## Social-Wochenplaner auf dem Server (16.11.2026) – LIVE (stündlich, SQL #30)

Rat (4 Prüfer) + Freigabe Frank: Jedes Event erscheint auf der Website + im Sammelpost (Mo/Do, alle Events, ab 1 Event) oder in der Story am Veranstaltungstag; Highlights Mi/Sa bleiben Auswahl (später „Destacado“). Nicht freigegeben = geht nicht raus.
- ERLEDIGT: SQL #29 ausgeführt (slot_key, collection_event_ids, social_planner_settings: dry_run=an, require_approval=an). Edge Function `social-week-planner` v2 deployt, Testlauf ok. Admin-Badge „Nicht im Wochenplan“ live (PR #143).
- Gefunden: alter Browser-Planer hat für Do 19.11. einen ZWEITEN, falschen „Planes de finde“ (Events 27.–29.11.) an Postiz gegeben (queue 8ffc1076…) → **Frank: in Postiz löschen.** Diese Woche fehlt „Chilled Live Music“ (Sa 21.11.) im Do-Post → nur Story/Website.
- ERLEDIGT 16.11.: Testmodus aus, pg_cron stündlich, Browser-Planer im Admin abgeschaltet (ruft nur noch den Server an, Build `2026.11.16-server-planner`).
- ERLEDIGT 16.11.: Edge Function `social-postiz-admin` (list / withdraw / refresh) deployt. Falscher Doppelpost war in Postiz schon gelöscht (DB-Eintrag 8ffc… → skipped). Do-19.11.-Sammelpost erneuert: jetzt 6 Events inkl. Chilled Live Music + Magasax, neuer Postiz-Entwurf wartet auf Freigabe.
- Auffällig in Postiz: Mi 18.11. zwei Feed-Posts (14:00 Joolz „última llamada“ + 20:30 Highlight) → Regel „max. 1 Feed-Post/Tag“ verletzt; alte last_call-Einzelposts bis 18.12. prüfen.
- ERLEDIGT 16.11.: 6 alte last_call-Einzelposts (20.11.–18.12.) aus Postiz zurückgezogen (Freigabe Frank); Mi 18.11. bleibt (Frank hat 14:00 + 20:30 freigegeben).
- Story-Test 16.11.: Canva-Story „Hoy en la Costa“ Mi 18.11. (Joolz, Design DAHbGc8C3yI) per `social-postiz-admin` action `story_draft` als Instagram-Story-ENTWURF für 18.11. 12:00 an Postiz (postId cmwjiqobk…). **Frank: in Postiz prüfen, ob es als Story erscheint, dann freigeben.** Ablauf künftig: täglich kurz mit Claude die Story bauen (Canva → story_draft → Frank gibt frei).
  - 16.11.: erste Canva-Story (KI-Bild) passte nicht → aus Postiz gelöscht (action `delete_post`). Entscheidung Frank: **nur echte Fotos** (Event-Foto → Franks Fotos → Canva-Stockfoto), keine KI-Bilder; ohne Event eine Story über Marcha. Canva-Ordner „Marcha Story-Fotos“ (FAHbGct6aLs) für Franks Fotos angelegt. Kein Canva-Brand-Kit vorhanden.
  - Kalender: täglich 9:15 „Tages-Story mit Claude bauen + freigeben“.
  - **Story-Stil freigegeben (Frank 16.11.):** Canva-Design DAHbGZYsVow (Joolz, 18.11.) = Vorlage: echtes Foto vollflächig, oben „HOY EN LA COSTA · <Wochentag> <Tag> <Monat>“, unten dunkler Balken mit Name groß, Genre „en directo“, „Uhrzeit · Lokal“, Ort, „gomarcha.com“; Akzent #FF7A3D auf Dunkelblau. Als Story-Entwurf für Mi 18.11. 12:00 in Postiz (postId cmwjjhhee…) – Frank gibt frei.
- Nächste Schritte: (2) Versender: nur freigegebene Posts an Postiz, Prüfung vor Versand; (3) Admin „Social → Diese Woche“ mit Not-Aus; (4) Story „Hoy en la Costa“ als Entwurf (prüfen, ob Postiz Stories per Schnittstelle kann); (5) Veranstalter-Hinweis + Teil-Paket.
- Auffällig: viele alte „last_call“-Einzelposts (bis 18.12.) liegen schon bei Postiz – mit Konzept v2 prüfen (max. 1 Feed-Post/Tag).

## KI-Hilfe im Formular „Event hinzufügen“ (16.11.2026) – LIVE

Limit-Meldung kommt jetzt in der Sprache der Seite (vorher immer deutscher Server-Text). Ohne Anmeldung zeigt das Formular oben den Hinweis „¿Eres organizador? Crea tu cuenta gratis …“ mit Link auf `veranstalter.html`. Live über PR #142 (Freigabe Frank).
Hinweis: Veranstalter-Konten (Etappen A, B, B2, C) sind seit 13.11.2026 live – Anmeldung über `veranstalter.html` bzw. Footer-Link „Para organizadores“.
- ERLEDIGT 17.11.: Frank hat geprüft – Hinweis war da, aber schlecht sichtbar. Neu (Webdesigner-Vorschlag, live 17.11., Freigabe Frank): ruhiger grauer Kasten, Frage fett, orangefarbener Link, ganzer Kasten antippbar. Text spricht direkt an: „¿Tienes un bar o local? ¿Eres músico o DJ?“ (DE/EN entsprechend; „músico“ statt „banda“, damit auch Solokünstler gemeint sind).

## Social-Media-Konzept v2 (15.11.2026) – Etappe 1 LIVE

**Ausführlich:** `SOCIAL_MEDIA_KONZEPT.md` (Rat aus 5 Prüfern, Beschlüsse Abschnitt 11).

**Live seit 15.11.2026 (Freigabe Frank):** ein Wochenplaner (Mo 13:30 „La semana en la Costa“, Mi 20:30 Highlight, Do 13:30 „Planes de finde“, Sa 12:00 Highlight 2) statt Posts pro Termin; neue Vorlagentexte (Infoblock, kein „Entradas“ ohne Preis, 3–5 Hashtags, EN-Zeile/-Absatz); KI-Text schon im Entwurf (`social-caption-ai` mode „queue“, Runner übernimmt `ai:`/`manual`); Klickmessung (`?source=` nur pro Sitzung, `landing`/`outbound_map` in `event_analytics`, Migration #28 ausgeführt); Worker gibt `source` weiter (von Frank deployt, geprüft). 16 alte Serien-Entwürfe gelöscht.

**Offen:**
- **Frank:** Admin → Social öffnen, die neuen Entwürfe Mi 18.11./Do 19.11. prüfen, Screenshot an Claude (KI-Text im Entwurf ist noch ungetestet).
- **Frank:** Cloudflare Web Analytics einschalten · Instagram-Profil (Bio-Link `?source=ig_bio`, 3 angeheftete Posts) · Blindtest (1 Person aus Málaga + 1 Brite) · 3–4 Facebook-Ortsgruppen auswählen.
- **Claude, nächste Session:** Admin „Social → Diese Woche“ mit Not-Aus; Karten-Vorlage 4:5; danach SEO-Etappe (Event-Seiten ohne Weiterleitung, Sitemap, Search Console).
- 4-Wochen-Test „Planes de finde“ (Klicks pro Post, teilen Bars?) → erst dann Bildgenerator/Stories/Automatik (Stufe 2).
- `CLAUDE.md` ist veraltet (sagt „Captions ohne KI“) – bei Gelegenheit korrigieren.

## KI-Automatik (neues Großprojekt, Council 13.11.2026)

**Ausführlich:** `ROADMAP_KI_AUTOMATIK.md` (Aufgaben-IDs, Abhängigkeiten, Tests, Kosten). Hier nur die Übersicht.

**Grundsatz:** keine Agenten-Plattform, sondern gemeinsame Automatik-Grundlage in Supabase (pg_cron + Edge Functions + Zwischentabellen + Admin-Bereich „Automatik“) und feste Abläufe. Autonomie in Stufen pro Aktion (0 Vorschlag · 1 Freigabe · 2 automatisch mit Rückgängig · 3 voll automatisch), hochstufen nur nach Zahlen. Kein n8n, kein Scraping von Instagram/Facebook, kein automatischer Mailversand.

**Franks Entscheidungen (13.11.2026):** Stufenmodell ja · Quellen = Zustimmung oder offener Feed mit erlaubenden Bedingungen · Supabase Pro ja · Anwalt vorerst nicht (Auslöser: vor Vertrieb, vor bezahltem Angebot, bei erster Beschwerde) · SEO früh · geteilte Links öffnen echte Event-Seite mit Knopf „In der App öffnen“ · Social-Posts bleiben auf Freigabe.

**Reihenfolge:**
- **Etappe 0 (parallel):**
  - F Fundament: smart-action absichern, Places 403, Supabase Pro, Backup-Skript (Bilder sind nicht in Supabase-Backups!), Deploy-Token, Kategorienliste, Anthropic-Key mit Limit
  - M Messung: Besucher-Tracking, `qr_tracking`, Handzeit pro Event
  - R Recht: NIF, Aviso Legal, Datenschutz auf Spanisch mit KI-Dienstleistern, Kennzeichnung
  - S SEO: canonical auf www, robots.txt, echte Event-Seite ohne Weiterleitung + JSON-LD, Sitemap, vergangene Events 410, Search Console
  - Q Quellen-Inventur und persönliche Anfragen bei den Quellen
- **Etappe 1:** G Automatik-Grundlage (`agent_settings`, `agent_runs`, Not-Aus, Budget, Alarm, Admin-Bereich) = Keimzelle des AI Managers
- **Etappe 2:** Phase 1 Event Scout (Durchstich mit 3–10 erlaubten Feeds, Zwischentabelle `event_candidates`, Quellenangabe/Entfernen/Opt-out) → **8-Wochen-Prüfung** (≥ 3 Events an jedem Wochentag, ≥ 60 % ohne Korrektur, < 2 h/Woche Prüfzeit). Nicht bestanden → Schwerpunkt Akquise statt mehr Automatik.
- **Etappe 3:** Phase 2 Marketing light (KI-Captions DE/ES/EN, Posts ohne Event, Digest) und Phase 4 Business Analyst (SQL-Kennzahlen, Datenprobleme, Wochenbericht)
- **Etappe 4:** Phase 3 Sales Agent – **blockiert** bis Rechtsprüfung + Nachfrage-Test; nur Listen und Entwürfe, nie Versand
- **Etappe 5:** Phase 5 AI Manager (Koordination, Autonomie-Hochstufung), wenn Phasen 1–4 einzeln stabil laufen
- Veranstalter-Konten B–D (Abschnitt 1) laufen parallel und haben Vorrang vor Etappe 3.

**Neue Befunde aus dem Council (im Code geprüft):**
- `marcha_events_guard` lässt die Service Role durch → Agenten dürfen nie direkt in `events` schreiben.
- `index.html` canonical zeigt auf `https://gomarcha.com/` (ohne www), die Seite läuft aber auf www.
- Share-Seite `/e/<id>` leitet sofort weiter → für Google kaum indexierbar.
- Backup-Skript ohne `organizers`; enthält `qr_tracking`, das es nicht gibt.
- `MARCHA_POSTIZ_POST_MODE` gilt global, nicht pro Post.

**Quellen-Inventur erledigt (13.11.2026, `QUELLEN_INVENTUR.md`):**
- Nur Málaga Open Data (Agenda-CSV, offene Lizenz) ist sofort nutzbar.
- Fuengirola hat einen Feed, verlangt aber eine schriftliche Erlaubnis.
- Bars und Locations haben keine Feeds.
- → Ohne persönliche Zustimmung und Veranstalter-Konten bleibt der Scout klein. Anfrage-Vorlage auf Spanisch liegt bei.

**Entscheidung Frank (13.11.2026, nach der Inventur):** Der Event Scout (Phase 1) wird **zurückgestellt**. Frank sucht Events selbst, trägt sie ein und schreibt Bars und Bands persönlich an. Weiter geht es mit den offenen Punkten: Veranstalter-Konten B–D, Fundament, SEO. Neu vorgeschlagen ist ein **KI-Schnelleintrag im Admin**: Text oder Flyer einfügen, die Felder werden vorausgefüllt, Frank prüft (Stufe 1). Das spart Zeit bei der Handarbeit.

**Nächster Schritt:**
- **Frank:** Supabase Pro aktivieren, Google Places prüfen, NIF liefern, Anthropic-Key mit Limit anlegen.
- **Claude:** Quellen-Inventur (nur Recherche) und SEO-Schnellkorrekturen (canonical, robots.txt) als Branch zur Prüfung.

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

**Etappe 2 – LIVE (auf `main`, Stand 12.11.2026 geprüft):**
neue Schriften (Outfit/DM Sans), neue Event-Karte (Handy: Flyer frei, nur Herz + gelbes „Jeden Freitag“, Datum/Preis orange darunter; Computer: Kalender-Block),
Computer: Liste volle Breite + Karte per Schalter, Detailseite (Info-Kacheln, feste Leiste Route/Merken/Teilen, Teilen-Menü), Flyer-Großansicht,
Kopfbereich mit Abendverlauf statt Stockfoto, Karte: eine Markierung pro Serie (vorher 45, Tipp zeigte Termin im Jan. 2027), Cache v16.
Noch offen aus Etappe 2: `style.css` komplett auf EIN Token-System umbauen (bisher nur die neu gebauten Teile bereinigt); rechtliche Seiten und Admin nutzen noch Poppins/Inter.
Ursprünglicher Plan Etappe 2: neues Kartendesign (einheitlicher Rahmen statt Flyer-Pinnwand, Datum als Block),
Desktop: Liste volle Breite, Karte nur per Schalter; Event-Detailseite mit Info-Leiste (Wann/Wo/Preis) und fester Aktionsleiste (Route/Merken/Teilen);
neues Schriftpaar (z. B. Outfit/Unbounded + DM Sans statt Poppins/Inter); echtes Küsten-Foto statt Stock-Konzertfoto;
`style.css` mit EINEM Token-System neu aufsetzen (heute 3 Designs übereinander: Basis, „Marbella Beach Vibe Refresh“ ab ~Z. 3989, „Redesign 2026“ ab ~Z. 4642, darüber jetzt die Palette am Dateiende).
**Etappe 3:** richtiger Footer (Über uns, Kontakt, Instagram, „Für Veranstalter“), hervorgehobene Platzierungen für zahlende Kunden.

**Noch nicht entschieden – Schnellfilter nach Stimmung** (Live-Musik, DJ & Club, Latin, Beach & Sunset, Rooftop, Gratis):
Frank findet die Idee gut, will aber **keine Events verlieren** (wer „Salsa“ einträgt, muss bei „Latin“ gefunden werden).
Lösungsidee: Stimmungen als Obergruppen mit fester Zuordnung (Latin = Salsa, Bachata, Son, Merengue, Bolero, Cha Cha Cha, Reggaeton …);
„Beach & Sunset“/„Rooftop“ brauchen eine Angabe pro Location → mit den Veranstalter-Konten.

**Übersetzungen müssen besser werden (Frank):** Automatische Übersetzungen klingen nicht natürlich/nativ.
Betrifft die Edge Function `smart-action` (OpenAI, Code seit 12.11.2026 im Repo) → Prompt auf natürliche, lokale Sprache
(Spanien-Spanisch, „en directo“, lockerer Ton) umstellen, feste Begriffe als Glossar vorgeben, Beispiele vorher/nachher prüfen.

**Beobachtung beim Test (11.11.2026):** Live sind nur 5 Events (alle wöchentlich). Mittwochs zeigt „Heute“ deshalb 0 Treffer.
Ortsangaben enthalten teils „Spanien“ (aus den Daten, z. B. „Alhaurín de la Torre, Spanien“) – auch auf EN/ES.

## 0. Sicherheits-Fixes – Stand 11.11.2026

**In der Live-Datenbank ERLEDIGT (Frank hat SQL #15, #16, #17 ausgeführt, von Claude als Besucher getestet):**
- Bilder löschen nur noch Admins; Upload nur `pending/` (+ `admin-replacements/` für Admins), nur Bilder, max. 10 MB; Dateiliste gesperrt.
- Insert-Trigger setzt für Nicht-Admins status/featured/promoted/is_featured/archived_at/original_event_id zurück; Längengrenzen (NOT VALID).
- **Gefunden + entfernt:** drei nicht im Repo angelegte Allow-All-Regeln auf `events` („Anyone can update events“ – jeder konnte Events ändern; „Public can read events“ – jeder konnte auch pending/rejected inkl. E-Mail lesen; „Anyone can insert events“).
- Test als Besucher danach: pending lesen 0, Event ändern blockiert, Upload pending/ ok, Dateiliste leer, Bild-Links ok, 33 freigegebene Events lesbar.

**Code LIVE (auf `main`, Cache v17):** automatische Bildverkleinerung vor Upload, Preis-Pflicht mit Häkchen „Eintritt frei“, leerer Preis = „Preis auf Anfrage“, supabase-js fest 2.118.0, Cache v17.
Test-Event mit Handy-Foto + „Eintritt frei“ eintragen und in der Moderation löschen: **von Frank am 12.11.2026 erledigt, alles funktioniert.**

**Noch offen:**
- **E-Mail/Name der Einreicher bei FREIGEGEBENEN Events** – **ERLEDIGT 12.11.2026:** Branch `security-einreicher-daten` auf `main` (Website + Share-Worker mit fester Spaltenliste, Cache v18), Worker `gomarcha-event-share` von Frank im Cloudflare-Dashboard aktualisiert (Zeile `select` ersetzt, kein wrangler-Token vorhanden), SQL #18 ausgeführt. Test als Besucher: contact_email/submitted_by/verification_notes → „permission denied“, 33 freigegebene Events lesbar, Website zeigt 5 Events, Share-Links (63, 91, 56) mit Titel + Bild.
  Hinweis: Worker-Code im Dashboard und `workers/event-share/worker.js` sind inhaltlich gleich, aber nicht byte-gleich (Dashboard-Version ohne eigene Konstante). Beim nächsten `wrangler deploy` wird die Repo-Version übernommen – dafür braucht es einen Cloudflare-API-Token (Vorlage „Edit Cloudflare Workers“, Zone gomarcha.com).
  Rest-Lücke: angemeldete Nutzer (`authenticated`) sehen noch alle Spalten. Heute gibt es nur Franks Admin-Konto (geprüft 12.11.) → mit den Veranstalter-Konten schließen (Admin liest Einreicher-Daten dann über eine Admin-Funktion).
- Security Advisor: `rls_auto_enable()` direkter Aufruf gesperrt – **SQL #19 ausgeführt 12.11.2026, getestet** („permission denied for function“). `marcha_auth_is_admin()` bleibt aufrufbar (nötig für RLS, harmlos). `pg_net` in public: lassen. „Leaked Password Protection“: gibt es nur im Pro-Tarif (Supabase → Authentication → Attack Protection); Projekt läuft im Gratis-Tarif → bleibt aus (Frank, 12.11.2026).
- Zwei Testbilder `pending/2026/11/11/sicherheitstest*.jpg` – von Frank gelöscht (12.11.2026).

### Ursprüngliche Council-Liste (10.11.2026)

Erst **Plan vorlegen**, dann umsetzen. Ergebnis eines Councils (4 Prüfer) vom 10.11.2026, Punkt 1 selbst im Code bestätigt:

1. **HOCH – Jeder kann alle Bilder löschen**: `supabase-rls.sql` Policy „Anyone can delete own event images path“ prüft nur `bucket_id`. → Löschen nur für Admins (`marcha_auth_is_admin()`); `app.js` ruft `remove` bei fehlgeschlagenem Upload auf (`deleteUploadedEventImage`) → dort Fehler still ignorieren.
2. **MITTEL-HOCH – Beliebige Dateien hochladen**: Policy „Anyone can upload event images“ ohne Typ/Größe/Ordner. → Im Dashboard beim Bucket `event-images` Größenlimit (z. B. 8 MB) und erlaubte Typen (jpeg/png/webp) setzen; Ordner-Bedingung in der Policy.
3. **MITTEL – Einreicher können `featured`, `promoted`, `is_featured`, `archived_at`, `original_event_id`, `recurring_social_enabled` mitsenden** (Insert-Policy prüft nur `status`). → `BEFORE INSERT`-Trigger setzt diese Felder für Nicht-Admins zurück.
4. **Vertrauen – fehlender Preis wird als „Gratis“/„Eintritt frei“ angezeigt** (`normalizeEvent`: `price_text || t("details_free")`, und `isFreePrice` zählt leer als gratis). → „Preis auf Anfrage“ o. ä. anzeigen.
5. **supabase-js ohne feste Version** (`@supabase/supabase-js@2` in `index.html` und `admin.html`) → auf exakte Version festlegen.
6. `social-queue-runner` neu deployen (siehe Punkt 4 unten), `smart-action`-Code ins Repo holen, Ordner `process-social-queue` löschen (**erledigt 12.11.2026**).
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
- **Etappe A ERLEDIGT 12.11.2026:** `supabase-veranstalter-konten.sql` (#20) von Frank ausgeführt, alle 5 Prüfungen ok.
  Von Claude getestet: Besucher sehen `organizers` nicht und können nichts ändern, 33 freigegebene Events lesbar, Website zeigt 5 Events, Share-Links ok.
  Test-Event ohne Konto (id 102): Status pending, kein Veranstalter, featured/promoted aus, recurring_social_enabled bleibt an → alter Weg funktioniert unverändert.
  **Vor Etappe B (Pflicht):** Lücke „angemeldete Nutzer sehen contact_email/submitted_by/verification_notes“ schließen.
  **ERLEDIGT 12.11.2026:** Code live (Cache v19, Admin-Build `2026.11.12-einreicher-daten`; admin.js/app.js lesen feste Spaltenliste, Einreicher-Daten über `marcha_admin_event_private`), SQL #21 + #22 ausgeführt. Frank hat den Admin-Bereich auf der Testseite geprüft (Liste, Notiz speichern/löschen, Social Queue). Claude-Test: normales Konto liest 33 freigegebene Events, aber keine Einreicher-Spalten; Admin liest 35 Events + Einreicher-Daten über die Funktion, Speichern klappt.
  Hinweis für künftigen Code: Spalten `contact_email`, `submitted_by`, `verification_notes` nie mehr per `select("*")` oder `SET x = x` lesen – nur über die Admin-Funktion.
- **Plan vorgelegt 12.11.2026** (Etappen A Datenbank, B Seite `veranstalter.html`, C Moderation fürs Handy + Mail bei neuer Anmeldung, D `smart-action` absichern). Frank: eigene Seite `veranstalter.html` = ja; Etappe A starten, **nachdem die übrigen offenen Punkte erledigt sind**. Freigabe neuer Veranstalter: Link in der Mail öffnet die Moderationsseite (Login nötig), keine Ein-Tipp-Freigabe direkt aus der Mail (Frank: B).

## 2. Supervisor: „Admins verwalten“

- Frank (`app_metadata.supervisor = true`) soll im Admin-Bereich weitere Admins anlegen/entfernen können.
- Rollen dürfen nur serverseitig gesetzt werden → geschützte Edge Function nötig.
- Beim Anlegen weiterer Admins **`MARCHA_ADMIN_ALLOWED_EMAILS`** (Edge-Function-Secret) um deren E-Mail ergänzen (Komma-getrennt), sonst können sie die Social Queue nicht steuern.

## 3. Übersetzung `smart-action` absichern

**ERLEDIGT 13.11.2026 (Version 25, von Claude deployt und getestet):** Übersetzt jetzt mit Claude Sonnet 5.5 nach dem Leitfaden (`SOCIAL_POSTS_LEITFADEN.md`), OpenAI nur noch als Ausweich. Zugriff: angemeldet bis 8.000 Zeichen; ohne Login nur von gomarcha.com/Testumgebung aus und bis 4.000 Zeichen (fremde Herkunft → 403, getestet). Secret `ANTHROPIC_API_KEY` (Frank, mit Monatslimit). Bisheriger Text unten nur noch zur Historie.


- Code liegt seit 12.11.2026 im Repo (`supabase/functions/smart-action/index.ts`, deployte Version 20, unverändert übernommen).
- Ist **ohne Login aufrufbar** → Fremde könnten OpenAI-Kosten verursachen. Ein Monatsbudget bei OpenAI ist gesetzt (Frank, 10.11.2026).
- Mit den Veranstalter-Konten: nur noch angemeldete Veranstalter/Admins, Längengrenze pro Text.

## 4. `social-queue-runner` neu deployen – ERLEDIGT 12.11.2026

- Frank hat die Repo-Version im Supabase-Dashboard eingespielt (Version 28). Von Claude geprüft: Code identisch mit dem Repo, Aufruf ohne Secret → 401.
- Für künftige Deploys ohne Dashboard: Supabase-Zugangs-Token (Account → Access Tokens) bzw. Cloudflare-API-Token als Network Secret in der Claude-Umgebung hinterlegen (Formular in der App hat am 12.11. nicht funktioniert).

## 5. Zoho-E-Mail-Konten für Marcha + Mailserver für Supabase-Auth

**ERLEDIGT 12.11.2026:**
- Cloudflare-DNS: SPF (`v=spf1 include:zohomail.eu ~all`), DMARC (`_dmarc`, `p=none`, Berichte an info@) und DKIM (Selector `zmail`, in Zoho verifiziert) eingetragen.
- Supabase → Authentication → SMTP: Zoho (`smtp.zoho.eu:465`, Absender „Marcha <info@gomarcha.com>“, eigenes Zoho-App-Passwort, nirgends sonst gespeichert – bei Verlust neues anlegen).
- Test „Passwort vergessen?“: Mail kommt an, Gmail meldet SPF/DKIM/DMARC = pass. Anfangs Warnhinweis in Gmail (wohl: englische Standardvorlage + Link auf `*.supabase.co`), nach „sicher“ markieren weg.
- **Mail-Vorlagen ERLEDIGT 12.11.2026:** Reset Password, Magic Link, Confirm signup in Supabase eingetragen (Reihenfolge ES/EN/DE, Logo `assets/icon-192-v5.png`, Dateien in `supabase/email-templates/`). Getestet: Reset Password (mit Logo). Magic Link + Confirm signup mit Etappe B testen. Optional später: eigene Auth-Domain, damit Links auf gomarcha.com zeigen (kostenpflichtig). `noreply@` vorerst nicht nötig.

**Ursprüngliche Notiz:**
- **To-do Frank (eingetragen 10.11.2026, Kalender 11.11.):** Zoho-E-Mail-Konten für Marcha einrichten bzw. ordnen. Vorschlag, mit Frank abzustimmen:
  - `info@gomarcha.com` – öffentliche Kontaktadresse (Impressum, Veranstalter-Anfragen, Promotion-Verkauf)
  - `noreply@gomarcha.com` (oder `hola@…`) – Absender für automatische Mails (Login-Links, Bestätigungen, Benachrichtigungen)
  - Franks Admin-Login bleibt vorerst `derhilgersfrank@gmail.com`; ein Umzug auf eine Marcha-Adresse wäre ein eigener Schritt (dann `MARCHA_ADMIN_ALLOWED_EMAILS` und `app_metadata` anpassen).
  - DNS bei Cloudflare prüfen: SPF, DKIM, DMARC für gomarcha.com, damit Mails nicht im Spam landen.
- Danach: Supabase-Standard-Mails gehen nur begrenzt raus (meist nur an Team-Mitglieder). Für Veranstalter-Mails Zoho-SMTP in Supabase einrichten (Authentication → Emails → SMTP Settings) mit dem Absender-Konto oben. Zoho-Daten liegen schon als Secrets (`SMTP_*`) für `notify-new-event` – prüfen, welches Konto dort hinterlegt ist.

## 6. Kleinere Punkte

- **Admin-Bedienung (Frank, 12.11.2026):** Notizen speichern ist nicht intuitiv (eigener Knopf „💾 Notizen“ auf der Karte, nicht im „Bearbeiten“-Dialog). Außerdem zeigt der Admin-Bereich Einreicher-Name/E-Mail nirgends an (nur in der Suche). → Beim Umbau der Moderation (Veranstalter Etappe C) mitlösen.

- **NEU 12.11.2026 – Google-Adresssuche im Einreichformular funktioniert nicht:** `places.googleapis.com/v1/places:autocomplete` antwortet 403 „The caller does not have permission“ (mit Schlüssel aus `index.html`, Referer gomarcha.com). Folge: neue Events ohne lat/lng → erscheinen nicht auf der Karte (Einreichen selbst klappt). Mit Frank in der Google Cloud Console prüfen: „Places API (New)“ aktiviert? Schlüssel-Einschränkungen (APIs + Websites)? Abrechnung aktiv?

- **Titelbild**: Frank liefert ein eigenes Foto. Austausch in `style.css`, Abschnitt „Titelbild“ (aktuell Unsplash-Foto mit warmen Bühnenlichtern).
- **Schnellfilter**: Frank entscheidet später, ob weitere dazukommen (z. B. Gratis, Strand/Beach, Heute Abend).
- **Logo und Farbschema** können sich noch ändern; Farben stehen zentral in `style.css` → Abschnitt „Redesign 2026“ (`--m-accent` usw.).
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
