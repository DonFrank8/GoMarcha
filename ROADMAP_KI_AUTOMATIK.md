# Roadmap KI-Automatik — Marcha

Stand: 13.11.2026. Grundlage: Claude Council vom 13.11.2026 (5 Rollen als echte, parallel gestartete Sub-Agenten, Peer-Review, Zusatzrunde, Chairman-Urteil) und Franks Entscheidungen.
Kurzfassung und offene Punkte stehen in `OFFENE_PUNKTE.md` → Abschnitt „KI-Automatik“. Dieses Dokument ist die ausführliche Fassung.

**Status-Kennzeichen:** ✅ vorhanden · 🟡 teilweise vorhanden · 🆕 neu · ⛔ blockiert (Abhängigkeit offen) · 👤 Aufgabe für Frank

---

## 1. Grundsatzentscheidung

Marcha baut **keine Agenten-Plattform**, sondern eine **gemeinsame Automatik-Grundlage** im bestehenden Supabase plus **feste Abläufe**, in denen KI nur klar begrenzte Schritte übernimmt (Text → Daten, Übersetzen, Texte formulieren).
Autonomie wird **pro Aktion in Stufen** freigeschaltet, erst wenn Zahlen zeigen, dass ein Ablauf zuverlässig ist.

**Franks Entscheidungen (13.11.2026):**
1. Stufenmodell der Autonomie: ja.
2. Quellen: Standard ist **Zustimmung der Quelle ODER offener Kalender-Feed (iCal/JSON-LD) mit Nutzungsbedingungen, die das erlauben**. Kein Instagram/Facebook-Auslesen, keine Ticketplattformen gegen AGB.
3. Supabase Pro (25 $/Monat) für Backups und höhere Grenzen: ja.
4. Anwaltliche Prüfung: vorerst nicht. **Auslöser für die Prüfung:** vor dem Vertrieb (Phase 3), vor dem ersten bezahlten Angebot oder bei der ersten Beschwerde. Bis dahin gilt der vorsichtige Plan (Abschnitt 4).
5. Erfolgskriterium des Nachfrage-Tests: wird festgelegt, wenn Daten vorliegen.
6. SEO kommt früh, ist aber erst nach einer Reparatur der Event-Seiten wirksam.
7. Geteilte Links öffnen künftig eine echte Event-Seite mit Knopf „In der App öffnen“ statt sofort in die App weiterzuleiten.
8. Social-Posts bleiben vorerst dauerhaft auf Freigabe (Stufe 1).

---

## 2. Architektur (verbindlich)

```
pg_cron (✅ vorhanden, Job „marcha-social-queue-runner“)
  └─► Edge Function je Ablauf (Secret-geschützt, Muster wie social-queue-runner)
        prüft zuerst: Not-Aus? Budget? dry_run?
        KI: Claude Haiku 5.5 (Extraktion/Übersetzung), Sonnet 5.5 nur für Texte; API-Schlüssel mit hartem Ausgabenlimit
  └─► schreibt NUR in eigene Zwischentabellen (nur Admin lesbar, anon nichts)
        event_candidates · content_drafts · leads · reports
  └─► Freigabe durch Frank im Admin-Bereich „Automatik“ (eigene Datei, nicht in admin.js)
  └─► erst dann: events (bestehende Moderation) · social_queue → social-queue-runner → Postiz (Entwurf)

Gemeinsam: agent_settings · agent_runs · Quellenregister · Opt-out-Liste
SEO: Cloudflare Worker (✅ vorhanden) liefert echte Event-Seiten + Sitemap
```

**Nicht einführen:** n8n, eigener Server, Agenten-Frameworks, Vektor-Datenbank, Scraping-Dienste, automatischer Mailversand.
**Ergänzend erlaubt:** geplante Claude-Code-Cloud-Sitzungen **nur lesend** (Quellen-Inventur, Berichtsentwürfe). Claude Managed Agents nur bei konkretem Anlass neu prüfen. GitHub Actions nur als Ausweich.

**Warum Zwischentabellen Pflicht sind (geprüft im Code):**
- `marcha_events_guard` lässt die Service Role durch. Eine Edge Function könnte Events direkt auf `approved` setzen.
- Der Trigger `notify-new-event` mailt bei jedem `pending`-Insert → Mailflut.
- `MARCHA_POSTIZ_POST_MODE` gilt global; Postiz-Limit 30 Anfragen/h gemeinsam für alle → Agenten rufen Postiz nie selbst auf, sie füllen nur `social_queue.caption` (Runner übernimmt Captions ab 8 Zeichen).

---

## 3. Autonomie-Matrix

Stufe 0 = Vorschlag · 1 = Entwurf, Frank gibt frei · 2 = automatisch, rückgängig machbar, Frank wird informiert · 3 = voll automatisch

| Aktion | Start | Ziel |
|---|---|---|
| Quellen lesen, Kandidaten anlegen, Dubletten/Fehler markieren, vergangene Events archivieren, Alarme, Opt-out beachten, KI-/„Publicidad“-Hinweis setzen | 3 | 3 |
| Freigegebene Live-Daten ändern | 1 | max. 2 mit Rückgängig; **nie** Veranstalter-eigene Daten überschreiben |
| Event aus Quelle übernehmen | 1 | 2 nur bei Quellen mit Zustimmung, nach 50 Übernahmen ohne Korrektur, laufende Stichproben, **automatische Rückstufung bei jedem Fehler**, Durchsetzung in der Datenbank |
| Social-Caption entwerfen | 1 | 2 (automatisch als Postiz-Entwurf) |
| Social-Post veröffentlichen | 1 | 1 (vorerst dauerhaft) |
| Analysebericht (intern) | 3 | 3 |
| Erinnerung an Veranstalter | 1 | 2 nur mit dokumentierter Einwilligung + Abmeldelink |
| Veranstalter will Event entfernen | 2 (sofort ausblenden) | 2; endgültig löschen nur Frank |
| Antwort auf Beschwerden | Mensch | Mensch |
| Vertrieb: Erstkontakt, Angebot, Preis | 0 | 0 bis zur Rechtsprüfung, danach höchstens 1 |
| Rechte, Veranstalter-Status, Löschungen | Frank | Frank |

Technisch: Stufe je Aktion in `agent_settings`, je Quelle in `event_sources.autonomy_level`; ändern nur Admins (RLS), jede Änderung protokolliert. Für die Korrekturquote wird gespeichert, ob Frank den Vorschlag vor der Freigabe geändert hat.

---

## 4. Vorsichtiger Plan ohne Anwalt (gilt bis zur Rechtsprüfung)

- Nur Quellen nach Entscheidung 2; je Quelle Nutzungsbedingungen + robots.txt mit Datum dokumentieren.
- Keine Flyer/Bilder aus Scout-Quellen übernehmen; keine privaten Kontaktdaten (Handy, private Mails) speichern.
- Jede Event-Karte zeigt Quelle, „Fehler melden / Das ist mein Event / Entfernen“; Opt-out-Liste wirkt technisch (nie wieder lesen/anschreiben).
- Scout-Events erscheinen nicht in Sitemap/JSON-LD, bis die Quelle zugestimmt hat (sonst `noindex`).
- Kein Vertrieb über Stufe 0, keine Personen-Leads (DJs, Musiker).
- Rechtstexte selbst aktualisieren (R1–R3).

---

## 5. Umsetzungsreihenfolge

```
Etappe 0 (parallel):  F Fundament · M Messung · R Recht · S SEO · Q Quellen-Inventur
                         │
Etappe 1:             G Automatik-Grundlage  (Keimzelle des AI Managers)
                         │
Etappe 2:             P1 Event Scout (Durchstich)  ──► 8-Wochen-Prüfung (saisonbewusst)
                         │                                  │ nicht bestanden → Akquise/Veranstalter-Konten statt mehr Automatik
                         ▼
Etappe 3:             P2 Marketing light   ·   P4 Business Analyst (sobald Messung läuft)
                         │
Etappe 4:             P3 Sales (⛔ Rechtsprüfung + Nachfrage-Test)
                         │
Etappe 5:             P5 AI Manager (Koordination, wenn P1–P4 einzeln stabil)

Parallel und mit Vorrang vor Etappe 3: Veranstalter-Konten Etappen B–D (siehe OFFENE_PUNKTE.md Abschnitt 1)
```

---

## 6. Aufgaben im Detail

### Etappe 0 — F: Fundament

| ID | Aufgabe | Status | Abhängigkeit | Wer |
|---|---|---|---|---|
| F1 | `smart-action` absichern (nur angemeldete Veranstalter/Admins, Längengrenze) = Veranstalter-Konten Etappe D | 🟡 geplant | — | Claude + Frank-Deploy |
| F2 | Google Places 403 beheben (API aktiviert? Schlüssel-Einschränkungen? Abrechnung?) | ⛔ | — | 👤 Frank (Cloud Console) |
| F3 | Supabase Pro aktivieren: Billing → Pro, **Spend Cap an lassen**; nach 24 h prüfen, ob unter Database → Backups ein Backup erscheint; „Leaked Password Protection“ einschalten; **keine Testwiederherstellung auf dem Live-Projekt** | 🆕 | — | 👤 Frank |
| F4 | Backup-Skript anpassen: `organizers` + neue Tabellen ergänzen, `qr_tracking` (existiert nicht) klären; weiter mindestens monatlich laufen lassen, weil **Bilder im Bucket nicht in den Supabase-Backups enthalten sind** | 🟡 | F3 | Claude |
| F5 | Deploy-Weg: Supabase-Zugangs-Token und Cloudflare-API-Token als Network Secret, sonst Deploys weiter über Dashboard | 🆕 | — | 👤 Frank |
| F6 | Feste Kategorienliste (Zuordnung der 19 Genre-Freitexte; hängt mit Stimmungs-Schnellfiltern zusammen) | 🆕 | — | 👤 Entscheidung, Claude baut |
| F7 | Anthropic-API-Schlüssel mit hartem Ausgabenlimit anlegen, als Supabase-Secret | 🆕 | — | 👤 Frank |
| F8 | `SUPABASE_BACKUP_RECOVERY.md` korrigieren (PITR ist Zusatzpaket, nicht in Pro enthalten) | 🆕 | F3 | Claude |

### Etappe 0 — M: Messung

| ID | Aufgabe | Status | Abhängigkeit |
|---|---|---|---|
| M1 | Datenschutzfreundliches Besucher-Tracking ohne Cookies (z. B. Plausible/Umami/Cloudflare Web Analytics – Entscheidung offen) | 🆕 | R2 |
| M2 | `qr_tracking`: Tabelle anlegen oder Code in `app.js` entfernen (Code schreibt in nicht existierende Tabelle) | 🟡 | — |
| M3 | Handzeit messen: wie lange braucht Frank heute pro Event (Vergleichsbasis für den Scout) | 🆕 👤 | — |
| ✅ | `event_analytics` (Views/Shares) vorhanden | ✅ | — |

### Etappe 0 — R: Recht und Vertrauen

| ID | Aufgabe | Status |
|---|---|---|
| R1 | Aviso Legal: NIF ergänzen; Satz „Marcha actúa como intermediario … aportados por terceros“ an Selbstsammlung anpassen | 🆕 👤 NIF liefern |
| R2 | Datenschutzerklärung auf Spanisch (und DE/EN), KI-Dienstleister (OpenAI, Anthropic) nennen, Datenherkunft „fuentes públicas“ (Art. 14 DSGVO); Hilfe: AEPD „Facilita RGPD“ | 🆕 |
| R3 | Kennzeichnungsregeln: „Event recogido de fuente pública · fuente: …“, „Textos con ayuda de IA, revisados por una persona“, „Publicidad“ bei bezahlten Posts | 🆕 |
| R4 | Rechtsprüfung einplanen mit Auslösern (siehe Entscheidung 4) | 🆕 👤 |
| R5 | Seite „Über uns“ auf Spanisch mit Frank als Gesicht (war für Redesign Etappe 3 geplant) | 🟡 |

### Etappe 0 — S: SEO-Grundlage (früh, Franks Entscheidung)

Befund (im Code geprüft, Council-Zusatzrunde): Event-Seiten sind heute für Google praktisch nicht indexierbar.

| ID | Aufgabe | Status | Hinweis |
|---|---|---|---|
| S1 | `index.html` Zeile 20: canonical `https://gomarcha.com/` → `https://www.gomarcha.com/` (Domain läuft auf www) | 🆕 | Cache-Version beachten |
| S2 | `robots.txt` anlegen (mit Verweis auf Sitemap) | 🆕 | statisch, GitHub Pages |
| S3 | Worker `/e/<id>`: echte Event-Seite **ohne automatische Weiterleitung** (Text, Datum, Ort, Beschreibung, Knopf „In der App öffnen“), canonical auf sich selbst, JSON-LD `Event` (bei Serien nächster Termin, Veranstalter als `organizer`, keine fremden Flyer) | 🟡 Worker vorhanden | Deploy ohne Cloudflare-Token per Dashboard; Vorschau in WhatsApp/Facebook danach prüfen |
| S4 | `sitemap.xml` über Worker-Route, nur kommende, freigegebene Events | 🆕 | Scout-Events erst nach Zustimmung |
| S5 | Vergangene/archivierte Events: 410 oder `noindex` (`isShareableEvent` prüft heute nur `status`) | 🆕 | — |
| S6 | Edge Function `event-share`: `noindex`, damit keine Dubletten auf supabase.co entstehen | 🆕 | doppelte Share-Vorschau |
| S7 | Google Search Console verifizieren (DNS-Eintrag bei Cloudflare), Sitemap einreichen | 🆕 👤 | — |
| S8 | Später: Sprachversionen DE/EN/ES mit hreflang | 🆕 | nach S3 |

Abhängigkeit: F2 (Adressen/Koordinaten für JSON-LD). Aufwand (Schätzung): 2–3 Sessions + ca. 2 h Frank.

### Etappe 0 — Q: Quellen-Inventur („Wahrheit über das Angebot“)

| ID | Aufgabe | Status |
|---|---|---|
| Q1 | Liste von ca. 15 Quellen-Kandidaten (Veranstalter-Websites, Rathaus-/Tourismuskalender, Locations): gibt es iCal/JSON-LD, robots.txt, Nutzungsbedingungen, Ansprechpartner, geschätzte Events/Woche. Recherche durch Claude, **nur lesend** | 🆕 |
| Q2 | Frank fragt Quellen persönlich („¿Podemos listar vuestros eventos en Marcha?“) – zugleich Nachfrage-Test und Erlaubnis | 🆕 👤 |
| Q3 | Entscheidung: Gibt es genug erlaubte Quellen? Wenn nein → Schwerpunkt Veranstalter-Konten + persönliche Akquise statt Scout | 🆕 👤 |

### Etappe 1 — G: Automatik-Grundlage (Keimzelle des AI Managers)

| ID | Aufgabe | Status |
|---|---|---|
| G1 | SQL `supabase-agenten-grundlage.sql`: `agent_settings` (agent, enabled, dry_run, autonomy je Aktion, model, Tages-/Monatsbudget, globaler Not-Aus) + `agent_runs` (Start, Ende, Status, Anzahl, Tokens, Kosten, Fehler); RLS nur Admin, anon nichts; Standard **aus** + `dry_run = true`; Prüfabfragen + Rückbau; Eintrag in `SQL_MIGRATIONS.md` | 🆕 |
| G2 | Gemeinsames Hilfsmodul für Edge Functions: Not-Aus prüfen, Budget prüfen (Monatssumme aus `agent_runs`), Lauf protokollieren, Kosten berechnen | 🆕 |
| G3 | Alarm: Ablauf/Quelle liefert X Läufe lang nichts oder Fehlerserie → Mail an Frank (bestehender Zoho-SMTP) | 🆕 |
| G4 | Admin-Bereich „Automatik“ in eigener Datei `admin-agents.js` + Bereich in `admin.html`: Status je Ablauf, letzte Läufe, Kosten, Fehler, Not-Aus-Schalter, offene Freigaben | 🆕 |
| G5 | Wöchentliche Kurzmail an Frank: neue Vorschläge, Kosten, Fehler | 🆕 |
| G6 | Opt-out-Liste (Tabelle) + Quellenregister-Grundstruktur | 🆕 |
| ✅ | Muster pg_cron → Edge Function mit Secret, Admin-Rollenprüfung, Zoho-SMTP | ✅ |

Cron-Secrets künftig im Supabase Vault (Ablage des bestehenden Secrets ist nicht dokumentiert).

### Phase 1 — P1: Marcha Event Scout

| ID | Aufgabe | Status | Abhängigkeit |
|---|---|---|---|
| P1.1 | `event_sources` (Name, URL, Typ ical/jsonld/rss/html, aktiv, Erlaubnis/AGB-Notiz mit Datum, letzter Abruf, Inhalts-Prüfsumme, Erfolgsquote, `autonomy_level`, `is_test`) | 🆕 | G1, Q1 |
| P1.2 | `event_candidates` (Rohdaten, normalisierte Felder, Quelle + Quell-URL, Dublettenschlüssel, confidence, Status neu/übernommen/abgelehnt/Dublette, `matched_event_id`, Änderungsvergleich) | 🆕 | G1 |
| P1.3 | Spalten in `events`: `source_url`, `source_name`, `source_candidate_id` (optional, idempotent) | 🆕 | — |
| P1.4 | Edge Function `agent-event-scout`, Variante **A0**: iCal/JSON-LD ohne KI importieren; KI (Haiku) nur für Normalisierung, Kategorie, Übersetzung DE/EN/ES; Prüfsumme → KI nur bei Änderung | 🆕 | G2, F6, F7 |
| P1.5 | Plausibilitätsregeln (Datum in der Zukunft, Ort an der Costa del Sol, Pflichtfelder) und Erkennung fehlender Angaben | 🆕 | — |
| P1.6 | Dublettenprüfung gegen Events **und** wiederkehrende Serien (Wochentag + Ort, Master-Datensatz) sowie abgelehnte Events | 🆕 | — |
| P1.7 | Kandidaten-Ansicht im Admin: Übernehmen (legt Event per Admin-Aktion an), Ablehnen, Dublette; Speicherung, ob vor Freigabe korrigiert wurde | 🆕 | G4 |
| P1.8 | Event-Karte (App + Event-Seite): Quellenangabe, „Fehler melden / Das ist mein Event / Entfernen“, KI-Hinweis; Entfernen-Wunsch blendet sofort aus | 🆕 | R3 |
| P1.9 | Abgleich nach Übernahme: Quelle geändert/abgesagt → Hinweis an Frank (nicht stillschweigend überschreiben) | 🆕 | P1.4 |
| P1.10 | Sammelmail statt Einzelmail für Scout-Vorschläge (`notify-new-event` bleibt für Einreichungen unverändert) | 🆕 | — |
| P1.11 | Später (E2): HTML-Quellen mit KI-Extraktion, mehr Quellen, Autonomie-Hochstufung je Quelle per Datenbankfunktion | 🆕 | 8-Wochen-Prüfung |
| ✅ | Moderation pending/approved/rejected, Guard-Trigger, Mehrsprachigkeit (`title_*`, `description_*`) | ✅ | — |

**8-Wochen-Prüfung (Startdatum mit Frank festlegen, Saison beachten):** an jedem Wochentag ≥ 3 freigegebene Events · ≥ 60 % Vorschläge ohne Korrektur · Prüfzeit < 2 h/Woche (Ziel, kein Planwert) · 0 ungeprüfte Veröffentlichungen · Vergleich mit Null-Variante (nur Selbsteintrag + Handauswahl).

### Phase 2 — P2: Marcha Marketing Agent

| ID | Aufgabe | Status | Abhängigkeit |
|---|---|---|---|
| ✅ | `social_queue`, `social-queue-runner` v28, Postiz-Übergabe (Entwurf), Zeitregeln, Duplikatschutz, `social_caption_usage` (Vorlagen-Wiederholung) | ✅ | — |
| P2.1 | `content_drafts` (Format, Sprache, Text, Hashtags, Bildkonzept, Status, Bezug zu Event optional) | 🆕 | G1 |
| P2.2 | KI-Captions DE/ES/EN statt fester spanischer Vorlagen → nach Freigabe in `social_queue.caption` (Runner übernimmt ab 8 Zeichen) | 🟡 | P2.1, Marken-Tonalität/Glossar |
| P2.3 | Posts ohne Event („Was ist Marcha?“, „Frage des Tages“): Lösung klären, da `social_queue.event_id` Pflicht ist | 🆕 ❓ | Entscheidung |
| P2.4 | Redaktionskalender und Content-Ideen aus kommenden Events | 🆕 | P1 |
| P2.5 | Wochenend-Digest (Karussell, später Newsletter/WhatsApp-Kanal mit Einwilligung) | 🆕 | P1, R2 |
| P2.6 | Wiederholungsschutz für Formate und Texte | 🟡 | — |
| P2.7 | Natürliche, lokale Sprache (Spanien-Spanisch, Glossar) – gemeinsam mit Übersetzungs-Verbesserung `smart-action` | 🟡 | — |

Veröffentlichung bleibt Stufe 1 (Freigabe in Postiz). Postiz nie direkt vom Agenten aufrufen.

### Phase 3 — P3: Marcha Sales Agent (⛔ bis Rechtsprüfung + Nachfrage-Test)

| ID | Aufgabe | Status |
|---|---|---|
| P3.1 | `leads` (Firma, Typ Bar/Restaurant/Beachclub/Chiringuito/Veranstalter/Location/Hotel, Ort, öffentliche Firmendaten, Quelle, Rechtsgrundlage, Opt-out, Status, Notizen); **keine Einzelpersonen (DJs, Musiker) vor Rechtsprüfung** | 🆕 |
| P3.2 | Dublettenprüfung Leads gegen `organizers` und Opt-out-Liste | 🆕 |
| P3.3 | Listen und Gesprächsnotizen für Franks persönliche Besuche; „Wir listen dich bereits – übernimm deinen Eintrag“ | 🆕 |
| P3.4 | Mehrsprachige Angebots-/Mail-**Entwürfe**; **keine Versandfunktion im Code** | 🆕 |
| P3.5 | Auswertung Akquise (kontaktiert, Antwort, Konto angelegt, bezahlt) | 🆕 |

### Phase 4 — P4: Marcha Business Analyst

| ID | Aufgabe | Status | Abhängigkeit |
|---|---|---|---|
| P4.1 | SQL-Kennzahlen im Admin (ohne KI): neue/aktive/abgelaufene Events, nach Ort/Kategorie, Veranstalter-Entwicklung, Social-Queue-Status | 🆕 | F6 |
| P4.2 | Datenprobleme erkennen: fehlende Koordinaten/Preis/Bild, Dubletten, Lücken an Wochentagen und Kategorien | 🆕 | — |
| P4.3 | Wöchentlicher Bericht mit Handlungsempfehlungen (KI optional, Sonnet); nicht verfügbare Daten ausdrücklich als „nicht verfügbar“ | 🆕 | M1, G1 |
| P4.4 | Social-Performance aus Postiz/Meta, soweit verfügbar | 🆕 ❓ | Schnittstelle klären |
| P4.5 | Später: Monatsübersicht pro Veranstalter (Verkaufsargument Pro) – erst mit belastbarem Tracking | 🆕 | M1 |

### Phase 5 — P5: Marcha AI Manager (nach erfolgreicher Einzelprüfung von P1–P4)

| ID | Aufgabe | Status |
|---|---|---|
| P5.1 | Zentrale Übersicht (wächst aus G4): Status, laufende Aufgaben, neue Events, Content-Vorschläge, offene Freigaben, Vertrieb, Berichte, Fehler, Kosten | 🟡 ab G4 |
| P5.2 | Koordination: neues Event → Post-Entwurf → Lead-Hinweis → Auswertung, ohne Doppelarbeit (Ereignisse statt Neuberechnung) | 🆕 |
| P5.3 | Aufgaben starten/pausieren/abbrechen, Prioritäten | 🟡 ab G1 |
| P5.4 | Autonomie-Hochstufung nach Zahlen + automatische Rückstufung | 🆕 |
| P5.5 | Kosten- und API-Verbrauchskontrolle über alle Abläufe, Benachrichtigung bei Problemen | 🟡 ab G2/G3 |

---

## 7. Test- und Sicherheitsanforderungen (für alle Etappen)

- Neue Abläufe starten mit `enabled = false`, dann `dry_run = true` (nur Protokoll), dann Zwischentabelle.
- Jede Edge Function lehnt Aufrufe ohne Secret ab (Test per `curl` ohne Secret → 401).
- Besucher (anon) lesen aus allen neuen Tabellen 0 Zeilen (Test als Besucher).
- Keine Secrets im Frontend oder Repo; Anthropic-Key nur als Supabase-Secret.
- Test- und Live-Umgebung nutzen dieselbe Datenbank → Testquellen mit `is_test`, im Admin ausgeblendet, nach Test löschen.
- Jede SQL-Datei idempotent, mit Prüfabfragen und Rückbau-Abschnitt; Frank führt sie nach Freigabe aus.
- Scout-Test: 10 Kandidaten gegen Originalseite (Datum, Uhrzeit, Ort); bekannte Dublette muss erkannt werden; Not-Aus testen.
- Marketing-Test: Posts bleiben in Postiz `draft`; Runner übernimmt Caption.
- Sales: Code enthält keine Versandfunktion (Review).
- SEO-Test: `curl -A Googlebot` auf `/e/<id>` → 200 ohne Weiterleitung, JSON-LD vorhanden; vergangenes Event → 410/noindex; Share-Vorschau WhatsApp/Facebook mit `?v=` prüfen.

---

## 8. Aufwand (Schätzung)

| Etappe | Claude-Code-Sessions | Frank-Zeit |
|---|---|---|
| 0 F/M/R | 2–3 | 3–5 h |
| 0 S (SEO) | 2–3 | ca. 2 h |
| 0 Q (Quellen) | 1 | 2–4 h (Gespräche) |
| 1 G | 2–3 | 1–2 h |
| 2 P1 Durchstich | 3–4 | 3–5 h, danach 1–2 h/Woche Kandidaten |
| 3 P2 + P4 | 3–5 | 2–3 h, danach ca. 1 h/Woche |
| 4 P3 | 2–3 | 2–3 h + Rechtsprüfung |
| 5 P5 | 2–3 | 1–2 h |

## 9. Laufende Kosten (Schätzung, Stand 13.11.2026)

| | Schlanker Start | Leistungsfähig | Weitgehend autonom (spekulativ) |
|---|---|---|---|
| Supabase Pro | 25 $ | 25 $ | 25–50 $ |
| Claude API | 1–5 $ | 10–40 $ | 40–150 $ |
| Websuche (Preis vor Nutzung prüfen) | 0 | 0–10 $ | 10–40 $ |
| Tracking ohne Cookies | 0–10 € | 10–20 € | 10–20 € |
| Newsletter | 0 | 0–15 € | 15–40 € |
| **Summe Technik** | **ca. 25–40 €** | **ca. 45–110 €** | **ca. 100–300 €** |

Zusätzlich bestehend/unbekannt: Postiz-Abo, OpenAI (gedeckelt), Claude-Code-Abo, Google-Places-Abrechnung nach Reparatur, Anthropic-Mindestguthaben. Einmalig später: Rechtsprüfung (einige hundert bis niedrig vierstellig €), Muttersprachler-Review. Größter Posten: Franks Zeit; Wartung der Quellen ca. 0,5–1 h/Woche.

## 10. Offene Fragen und Entscheidungen

1. Kategorienliste und Stimmungs-Schnellfilter (F6).
2. Welches Tracking-Werkzeug (M1).
3. Posts ohne Event: eigene Tabelle oder `social_queue` erweitern (P2.3).
4. Startdatum der 8-Wochen-Prüfung (Saison).
5. Erfolgskriterium Nachfrage-Test (wenn Daten vorliegen).
6. Social-Performance-Daten: liefert Postiz/Meta eine nutzbare Schnittstelle (P4.4)?
7. Mittelfristig Übersetzung (`smart-action`) von OpenAI auf Claude vereinheitlichen?
8. Genaue Laufzeitgrenzen der Edge Functions im Pro-Tarif vor dem Scout-Design prüfen.

## 11. Konkreter erster Schritt

- **Frank:** Supabase Pro aktivieren (F3), Google Places prüfen (F2), NIF für Aviso Legal liefern (R1), Anthropic-Schlüssel mit Limit anlegen (F7).
- **Claude (ohne Eingriff ins Live-System):** Quellen-Inventur Q1 (nur Recherche, Ergebnis als Liste zur Entscheidung) und SEO-Schnellkorrekturen S1/S2 als Branch zur Prüfung auf der Testumgebung.
