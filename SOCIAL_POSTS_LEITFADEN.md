# Leitfaden Social-Posts & Übersetzungen – Marcha

Stand: 13.11.2026. Grundlage: Rat aus 4 parallel gestarteten Claude-Agenten (Social-Media-Managerin, muttersprachlicher Texter aus Málaga, Zielgruppe, Contrarian) + Franks Entscheidungen. Verbindlich für den KI-Post-Generator und die Übersetzungs-Function.

## Franks Entscheidungen (13.11.2026)
1. Posts **auf Spanisch + eine kurze englische Faktenzeile** (abschaltbar). Deutsch nur in der App.
2. **Weniger Posts** (siehe Rhythmus).
3. **Lokale/Künstler markieren**: ja (nur Handles aus der Datenbank, mit Zustimmung im Veranstalter-Profil).
4. Alt-Daten bereinigt (Rincón, „y“ statt „und“, Habana N’ Talla, Genres). **„0 EUR“ = gratis** → „Entrada libre“.
5. KI: **Claude** für Posts und Übersetzungen (Anthropic-Key mit Ausgabenlimit).
6. Vor der Umstellung: **Blindtest mit 1–2 spanischen Muttersprachlern** (Frank kennt welche).
7. **Freigabe jedes Posts bleibt bei Frank** (Postiz-Entwurf). Kein Auto-Publish.

## Rhythmus
- **Einzel-Event:** 1 Feed-Post ca. 5–7 Tage vorher; am Tag selbst nur Story. Vortags-Post nur bei Highlights.
- **Wöchentliche Serie:** 1 Feed-Post pro Monat („Cada viernes …“), neuer Post nur bei Änderung (anderer Künstler, Special); sonst Story am Tag selbst.
- **Neue Formate:** „Plan de finde“ jeden Donnerstag (Karussell, 5–7 Tipps, alle Lokale markiert); später „Hoy en la Costa“ (Story) und monatliches Serien-Porträt.
- Deckel: max. 1 Feed-Post pro Tag.

## Aufbau eines Posts (Instagram; Facebook ohne Hashtag-Block, dafür Link zum Event)
1. **Hook** (1. Zeile, ≤ 60 Zeichen): konkret – Stil/Stimmung/Tag. Kein „Final call“.
2. **1–2 Sätze Inhalt**: was erwartet mich (Genre, Band, ein echtes Detail aus der Beschreibung).
3. **Infoblock** (vom Code gesetzt, nicht von der KI):
   `📍 Lokal · Ort` / `🗓 vie 20 nov · 18:00` / `🎟 Entrada libre` bzw. `Entrada: 15 €`
4. **CTA** wechselnd: „¿Con quién vas? Etiquétalo 👇“, „Guárdalo“, „Más planes en la app Marcha (link en bio)“.
5. **EN-Zeile**: `EN: Live Cuban music tomorrow afternoon, free entry.`
6. **Markierungen**: @Lokal (aus `organizers.instagram`), Künstler nur wenn Handle in der DB.
7. **Hashtags** 4–8: #gomarcha + Ort (#Mijas) + Stil (#salsa #tardeo #afrohouse) + #CostaDelSol. Kein #directo, kein #músicaenvivo.

## Sprache (Spanien-Spanisch)
- „tú“; „vosotros“ nur für Gruppen; Marcha ist nicht Gastgeber („os esperan“, nicht „os esperamos“).
- **en directo** (nie „en vivo“), **entradas** (nie „boletos“), tardeo, chiringuito, finde, toca, puesta de sol, pista.
- Keine Anglizismen („final call“, „line-up“, „save the date“), keine Superlative („el mejor“, „inolvidable“, „imperdible“), max. 1 „!“, 1–3 Emojis im Fließtext.
- Datum: `sáb 14 nov · 21:00` (klein, 24 h). Preis: `15 €`, `12,50 €`.
- Namen korrekt mit Akzenten (Rincón, Málaga). Genres klein mit Akzent (salsa, chachachá, música latina); elektronische Genres englisch (afro house).

## Sicherheitsregeln für die KI (technisch durchsetzen)
- KI bekommt ein **Faktenpaket (JSON)** aus der Datenbank und darf **nichts hinzufügen** (keine Künstler, Preise, Getränke, Uhrzeiten, Wetter, Andrang).
- **Datum, Uhrzeit, Preis setzt der Code** im Infoblock.
- Künstler aus „u. a.“-Listen nie einem bestimmten Termin zuordnen.
- **Sperrliste** (Regex, im Code): „no te lo pierdas“, „inolvidable“, „imperdible“, „el mejor“, „final call“, „en vivo“ …
- Länge/Emojis/Ausrufezeichen begrenzt; **Ähnlichkeit** zu den letzten 6 Posts des Events < 40 %.
- Verstoß → neuer Versuch; nach 2 Fehlversuchen **alte Vorlage**. API-Ausfall → alte Vorlage.
- Modell-ID und Prompt-Version pro Post speichern. „Publicidad“ nur über Feld `is_paid`, nie durch die KI.
- Nicht automatisieren: Freigabe, Antworten auf Kommentare/DMs, Bildbearbeitung, Markieren ohne Zustimmung.

## Abwechslung ohne Erfinden
Blickwinkel pro Post aus fester Liste (Genre · Ort · Wochentag/Planung · Künstler bei festem Line-up · Zeitpunkt), nicht zweimal hintereinander; Satzbau variieren. Optionales Feld „Dato curioso“ (vom Veranstalter/Frank) als echte Hook-Quelle.

## Testplan vor der Umstellung
1. 20 echte Events × Zeitpunkte: alte Vorlage vs. KI.
2. Automatischer Faktencheck: **0 erfundene Fakten**.
3. **Blindvergleich** durch Frank + 1–2 Muttersprachler: Natürlichkeit, Lust hinzugehen, „klingt nach KI“ (1–5). Umstellen, wenn KI ≥ 65 % vorne und „klingt nach KI“ < 2,5.
4. Übersetzungen: 30 Beschreibungen, gpt-4o-mini vs. Claude, blind bewertet.
5. **2 Wochen Probebetrieb**: KI-Texte neben den alten; Ziel < 30 % der Entwürfe mit Änderungen.

## Übersetzungs-Anweisung für Claude (vom Muttersprachler)
```
You are a native copywriter for Marcha, a free live-music & party app on the Costa del Sol (Málaga province). Rewrite the event text below in {TARGET_LANGUAGE} so it reads as if a local native speaker wrote it originally — not as a translation.

Target variants:
- Spanish: Spain Spanish (Andalusian-friendly, never caricature). Use "tú"; "vosotros" only for groups. "en directo" (never "en vivo"), "entradas" (never "boletos"), "finde", "tardeo", "chiringuito". No anglicisms like "final call", "line-up", "save the date".
- English: British English, relaxed, aimed at expats/tourists. Keep "tardeo" and "chiringuito" (explain once if needed: "tardeo (afternoon party)").
- German: natural, "du", locker; no stiff "Sie", no literal Spanish syntax.

Never translate or alter: artist/band names, venue names, event series names (e.g. "Tardeo Cubano", "Domingo Latino"), place names, Instagram handles, URLs. Do translate connecting words inside titles (e.g. "Rey Falco und El Chepe" → ES "Rey Falco y El Chepe", EN "Rey Falco and El Chepe").
Genres: keep salsa, bachata, merengue, son, bolero, cha-cha-chá, afro house, deep house as genre names; in Spanish write them lowercase with correct accents (chachachá, música latina).
Prices: "0 EUR"/0 → ES "Entrada libre", EN "Free entry", DE "Eintritt frei". Otherwise ES/DE "15 €" (comma decimals), EN "€15".
Dates/times: 24h clock; ES "sábado 14 de noviembre, 21:00 h"; never change a date, time, price or fact.
Content: keep all facts; do not invent anything (no "best night ever", no extra artists, no prices). If the source contradicts itself (e.g. genres), keep what the source text says, don't resolve it.
Tone: friendly, local, concrete, no fake hype; max one exclamation mark per paragraph.
Emojis: keep at most 3 from the original that carry meaning; drop decorative chains and flag strings.
Length: similar to the original, never longer than +15 %. Keep paragraph breaks; no markdown, no hashtags unless present.
Output only the final text, nothing else.

Source language: {SOURCE_LANGUAGE}
Text:
{TEXT}
```

## Glossar
| DE / EN | ES |
|---|---|
| Livemusik / live music | música en directo |
| live | en directo |
| Eintritt frei / free entry | entrada libre |
| Tickets | entradas |
| Wochenende / weekend | el finde |
| Nachmittagsparty / day party | tardeo (bleibt) |
| Strandbar / beach bar | chiringuito (bleibt) |
| Sonnenuntergang / sunset | puesta de sol |
| Tanzfläche / dance floor | pista |
| heute Abend / tonight | esta noche |
| jeden Freitag / every Friday | todos los viernes |
| Konzert / concert | concierto |
| Line-up | cartel / artistas |
| Veranstalter / organiser | organizador/a |
| Lokal / venue | local / sala |
| und / and | y |

Nie übersetzen: Künstler-/Bandnamen, Lokalnamen, Eventreihen-Namen, Ortsnamen, Genres, Marcha/gomarcha, Instagram-Handles, URLs.
