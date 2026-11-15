# Social-Media-Konzept Marcha (Neufassung)

Stand: 15.11.2026 · Status: **Entwurf zur Entscheidung durch Frank**
Baut auf `SOCIAL_POSTS_LEITFADEN.md` (Sprache, Sicherheitsregeln für die KI) auf und ersetzt dessen Abschnitt „Rhythmus“ sowie die heutige Post-Planung im Admin.

---

## 1. Warum neu?

**Befund (im Code und in der Datenbank geprüft, 15.11.2026):**

| Problem | Folge |
|---|---|
| Im Admin planen **drei Systeme unabhängig voneinander** Posts: Einzel-Event-Slots (inkl. „Sofort-Last-Call“), wöchentliche Serien (3 Posts pro Termin) und ein Wochenplan mit Sammel-Posts. | Doppelte Posts (Joolz: 2× „Última llamada“), 18 Entwürfe für eine einzige Bar in 2 Wochen. |
| Posts sind **pro Termin** gedacht („3 Tage vorher, Vortag, letzter Aufruf“). | Bei mehr Events wird der Kanal zur Flyer-Wand einzelner Bars. Follower sehen keinen Grund, Marcha zu folgen. |
| Admin zeigt den **Vorlagentext**, an Postiz geht ggf. der **KI-Text**. | Frank prüft etwas anderes, als veröffentlicht wird. |
| Automatischer Lauf (`marcha-social-queue-runner`) ist **ausgeschaltet**, alles läuft per Hand. | Hoher Zeitaufwand, Posts werden vergessen. |
| Kein Rückfluss: Man sieht nicht, welcher Post Besucher gebracht hat. | Keine Grundlage für Verbesserungen. |

**Kernidee der Neufassung:** Marcha postet als **Kurator** („Was lohnt sich diese Woche?“), nicht als Verteiler einzelner Flyer. Geplant wird **nach Formaten pro Woche**, nicht nach Terminen.

---

## 2. Ziel und Zielgruppe

**Ziel:** Wer an der Costa del Sol ausgehen will, folgt Marcha, weil er dort jede Woche **den Überblick** bekommt – und öffnet dafür die App/Webseite.

Messbar (siehe Abschnitt 8):
1. Besuche auf gomarcha.com, die von Instagram/Facebook kommen.
2. Gespeicherte und geteilte Posts (zeigen echten Nutzen besser als Likes).
3. Bars, die Marcha-Posts teilen oder selbst Events eintragen (Grundlage für spätere Veranstalter-Konten und bezahlte Platzierungen).

**Zielgruppen:**
- Einheimische und Residenten (Spanisch) – Hauptsprache der Posts.
- Ausländische Residenten/Urlauber (Englisch, viele Briten an der Küste Mijas/Calahonda) – eine kurze EN-Zeile pro Post.
- Bars, Bands, DJs – sollen sich markiert und gut dargestellt fühlen.

---

## 3. Kanäle

| Kanal | Rolle | Automatisch? |
|---|---|---|
| **Instagram** (Feed + Story) | Hauptkanal | ja (über Postiz) |
| **Facebook-Seite** | Spiegel von Instagram, mit Link zur Event-Seite | ja (über Postiz) |
| **Facebook-Gruppen** (z. B. Orts-Gruppen Calahonda, La Cala) | große Reichweite bei Residenten | **nein** – Frank teilt den Wochen-Post 1× pro Woche von Hand (Gruppenregeln, kein Spam-Risiko) |
| WhatsApp-Kanal | später, wöchentlicher Plan per Abo | später (braucht Einwilligung, Datenschutz R2) |
| TikTok / Reels | später, nur mit echtem Videomaterial | nein |

---

## 4. Formate und Wochenrhythmus

**Deckel:** höchstens **1 Feed-Post pro Tag**, Stories zusätzlich. Ergibt ca. **4–5 Feed-Posts pro Woche**, egal wie viele Events es gibt.

| Tag | Format | Inhalt | Wie entsteht es? |
|---|---|---|---|
| **Mo** | **„Esta semana en la Costa“** (Karussell, 5–8 Bilder) | Überblick der Woche: Titelbild + je ein Bild pro Tag/Highlight | automatisch aus freigegebenen Events |
| **Mi** | **Highlight der Woche** (Einzelpost) | 1 besonderes Event (Konzert, Festival, Special) | automatisch vorgeschlagen (Kennzeichen „Highlight“ oder Bewertung), Frank kann tauschen |
| **Do** | **„Plan de finde“** (Karussell) | 5–7 Tipps für Fr–So, alle Lokale markiert | automatisch |
| **Sa** | **Highlight 2** (optional) | nur wenn es am Wochenende ein zweites starkes Event gibt | automatisch, nur bei Bedarf |
| **1× im Monat** | **Porträt einer Serie/Bar** („Cada viernes en El Rincón de Cuba“) | feste Abende einer Bar vorstellen | automatisch vorgeschlagen, Frank wählt die Bar |
| **täglich** | **Story „Hoy en la Costa“** | 1–3 Events des Tages, Link zur App | automatisch (technisch zu prüfen, ob Postiz Instagram-Stories unterstützt) |

**Was wegfällt:**
- Pro-Termin-Posts „3 Tage vorher / Vortag / Última llamada“ → ersetzt durch die Wochenformate.
- Eigene Posts für jeden Termin wöchentlicher Serien → Serien erscheinen im Wochen-Karussell, in der Story am Tag und 1× im Monat im Porträt. Neuer Einzelpost nur bei Änderung (anderer Künstler, Special).
- Sofort-Post bei kurzfristig eingetragenen Events → das Event erscheint in der Tages-Story.

**Startwoche (jetzt):** Ausnahme, damit man sieht „Marcha ist wieder aktiv“: Die vorhandenen Entwürfe dürfen alle raus (Frank sendet sie per Hand). Ab Live-Gang der Neufassung gilt nur noch der Rhythmus oben.

---

## 5. Bilder

- **Einheitlicher Marcha-Look** für Wochen-Karussell, Plan de finde und Story: automatisch erzeugte Bildkarten (Event, Tag, Uhrzeit, Ort; Marcha-Farben und -Schriften), so wie das Bild für El Rincón de Cuba. Erkennbar im Feed, sieht nicht nach Flyer-Sammlung aus.
- **Flyer der Bar** nur beim Highlight-Post und im Porträt – und nur, wenn die Bar ihn selbst geliefert/öffentlich gepostet hat. Fremde Fotos von Künstlern nicht ohne Zustimmung.
- Erstes Bild jedes Karussells: Titelkarte („Plan de finde · 20–22 nov“) mit Marcha-Logo.

---

## 6. Texte

Es gelten die Regeln aus `SOCIAL_POSTS_LEITFADEN.md`: Spanien-Spanisch, „en directo“, keine Übertreibungen, Datum/Uhrzeit/Preis setzt der Code, die KI erfindet nichts, Sperrliste, Rückfall auf Vorlage.

Neu:
- **Der Text, den Frank im Admin sieht, ist genau der Text, der veröffentlicht wird.** Die KI schreibt ihn beim Anlegen des Entwurfs, nicht erst bei der Übergabe an Postiz.
- **Kein „Entradas …“, wenn kein Eintritt bekannt ist**; kein doppeltes Datum (Fehler der heutigen Vorlage).
- Pro Format eine eigene Anweisung an die KI (Karussell-Text ist eine Liste, Highlight erzählt, Story ist eine Zeile).
- Markierungen: @Lokal und @Künstler nur aus der Datenbank (Feld Instagram im Veranstalter-/Künstlerprofil).
- Link: Jeder Post bekommt einen eigenen Link mit Herkunft (z. B. `?src=ig_finde`), damit Abschnitt 8 messen kann.

---

## 7. Ablauf und Automatik

Stufe 2 aus der Roadmap: **automatisch, mit Einspruchsrecht.**

```
So 20:00  Planer erstellt die Woche: Mo-Karussell, Mi-Highlight, Do-Plan de finde (+ Sa optional)
          → Entwürfe mit KI-Text und fertigen Bildern im Admin („Social → Diese Woche“)
          → Frank bekommt eine E-Mail: „Deine Posts für die Woche sind bereit“
bis 24 h vorher   Frank kann ansehen, Text ändern, Event tauschen, Post streichen
24 h vorher       ohne Einspruch → automatisch in Postiz eingeplant → wird veröffentlicht
täglich 09:00     Story „Hoy en la Costa“ (automatisch, ohne Wartezeit – nur Fakten aus der DB)
Neue Events       landen automatisch im nächsten passenden Format, nicht als eigener Post
```

**Sicherungen (technisch erzwungen):**
- Not-Aus-Schalter im Admin (stoppt alle automatischen Posts sofort).
- Höchstens 1 Feed-Post pro Tag, keine Posts zu Events, die schon begonnen haben oder abgesagt sind.
- Nur freigegebene Events mit Bild und Ort.
- Keine Doppel-Posts: ein einziger Planer statt drei.
- Fällt KI oder Bilderzeugung aus, wird der Post nicht automatisch veröffentlicht, sondern bleibt als Entwurf und Frank bekommt eine Meldung.

**Nicht automatisiert:** Antworten auf Kommentare und Nachrichten, Teilen in Facebook-Gruppen, Markieren ohne Zustimmung, bezahlte Werbung.

**Probezeit:** die ersten 2 Wochen weiter mit Freigabe jedes Posts (Stufe 1). Wenn ≤ 1 von 5 Posts geändert werden muss → Umstellung auf Stufe 2.

---

## 8. Messung (Analytics)

| Was | Quelle | Wo sichtbar |
|---|---|---|
| Besuche auf gomarcha.com gesamt, Herkunft (Instagram, Facebook, Google, WhatsApp) | Cloudflare Web Analytics (ohne Cookies, kostenlos) | Cloudflare-Dashboard; Zahlen im Wochenbericht |
| Klicks pro Post / Format | Link-Herkunft `?src=…` → Tabelle `event_analytics` (gibt es schon) | Admin „Statistik“ |
| Aufrufe/Teilen pro Event | `event_analytics` | Admin „Statistik“ |
| Reichweite, Speichern, Teilen pro Post | Postiz-Statistik bzw. Instagram Insights | Wochenbericht |

**Wochenbericht** (jeden Montag per E-Mail an Frank, automatisch): Besucher der Woche, bester Post, bestes Format, Top-5-Events, Bars, die geteilt haben.

Ziele werden erst nach **4 Wochen Messung** festgelegt (Ausgangswert), nicht vorher geraten.

---

## 9. Technische Umsetzung (Überblick)

| Schritt | Inhalt | Wo |
|---|---|---|
| T1 | Die drei bisherigen Planer im Admin abschalten (bleiben im Code, per Schalter deaktiviert) | `admin.js` |
| T2 | Ein neuer Wochenplaner (läuft serverseitig, sonntags) | neue Edge Function + `pg_cron` |
| T3 | Bildkarten automatisch erzeugen (Karussell, Story) | neue Edge Function, Bilder in Bucket `event-images` |
| T4 | KI-Texte pro Format beim Anlegen (nutzt vorhandenes `caption-ai.ts`) | `social-caption-ai` |
| T5 | Admin „Social → Diese Woche“: Vorschau mit echtem Text und Bild, Ändern, Tauschen, Streichen, Not-Aus | `admin.js` |
| T6 | Automatische Einplanung in Postiz 24 h vorher, Karussell-Unterstützung | `social-queue-runner` |
| T7 | Link-Herkunft `?src=` erfassen, Statistik-Ansicht im Admin, Wochenbericht-Mail | `app.js`, `admin.js`, `notify-new-event`-Mailweg |
| T8 | Cloudflare Web Analytics einschalten (Frank, 5 Minuten) | Cloudflare-Dashboard |

Datenbank: `social_queue` braucht ein Feld für das Format (Karussell/Story/Highlight) und mehrere Bilder pro Post; Wochen-Posts ohne einzelnes Event. Wird als eigene Migration beschrieben und vor Ausführung erklärt.

**Reihenfolge:**
1. **Etappe 1 (ca. 2 Sessions):** T1, T4, T5 und Text-Korrekturen → sofort weniger und bessere Posts, weiter mit Freigabe.
2. **Etappe 2 (ca. 2–3 Sessions):** T2, T3, T6 → Wochen-Karussell und Plan de finde automatisch.
3. **Etappe 3 (ca. 1–2 Sessions):** T7, T8 → Messung und Wochenbericht. T8 kann Frank sofort erledigen.
4. Danach: Story täglich (nach Prüfung Postiz), Serien-Porträt, Umstellung auf Stufe 2.

Jede Etappe: eigener Branch, Live-Gang und Deploy nur mit Franks Freigabe.

---

## 10. Entscheidungen für Frank

1. **Grundidee:** Wochenformate statt Posts pro Termin – einverstanden?
2. **Rhythmus:** Mo Woche · Mi Highlight · Do Plan de finde · (Sa Highlight 2) · tägliche Story – passt das, oder andere Tage?
3. **Automatik:** erst 2 Wochen mit Freigabe, dann automatisch mit 24 h Einspruchsrecht – einverstanden?
4. **Einheitlicher Marcha-Bildlook** statt Bar-Flyer (Flyer nur bei Highlights) – einverstanden?
5. **EN-Zeile** in jedem Post beibehalten?
6. **Facebook-Gruppen:** teilst du den Wochen-Post selbst? Welche Gruppen?
7. **Cloudflare Web Analytics** einschalten (ich gebe dir die Klick-Anleitung)?
8. **Blindtest** mit 1–2 spanischen Muttersprachlern vor dem Start (laut Leitfaden geplant) – wer?
