# Quellen-Inventur Event Scout (Roadmap-Aufgabe Q1)

Stand: 13.11.2026. Erstellt von Claude, **nur lesend**: Websuche und Abruf öffentlicher Seiten. In Marcha wurde nichts verändert.
Die Inventur beantwortet die Kernfrage aus dem Council: **Gibt es genug erlaubte, maschinenlesbar lesbare Quellen für einen Event Scout?**

## Kurzfassung

1. **Nur eine Quelle ist rechtlich und technisch sofort nutzbar:** die offenen Daten der Stadt Málaga (Agenda als CSV, täglich aktualisiert, Creative-Commons-Lizenz). Sie enthält aber nur städtische Veranstaltungen, also viel Kultur und wenig Bar-Livemusik.
2. **Gemeinde-Websites** haben selten einen Feed. Wo es einen gibt (Fuengirola), verlangt das Impressum eine **schriftliche Erlaubnis** für jede Weiterverwendung. Alhaurín de la Torre schützt seine Inhalte ebenfalls ausdrücklich.
3. **Marchas Kernangebot** sind Livemusik in Bars, Beachclubs und kleinen Locations. Diese Orte veröffentlichen fast nie Kalender-Feeds, sie kündigen über Instagram an, und Instagram darf nicht ausgelesen werden.
4. **Kommerzielle Plattformen** (La Ganzúa, Viral Agenda, conciertos.club, Fever, Eventbrite, El Corte Inglés) kommen nur mit Partnervertrag in Frage.

**Folgerung:** Ein Scout, der nur aus offenen Quellen liest, bringt wenig Bar-Livemusik. Den größten Hebel haben **persönliche Zustimmung** und die **Veranstalter-Konten**. Der Scout ist dann ein Werkzeug für Quellen, die zugestimmt haben, plus Málaga Open Data. Das bestätigt die Council-Warnung und gehört in die Entscheidung Q3.

## Ergebnisse je Quelle

Legende Technik: **Feed** = iCal/JSON-API/CSV vorhanden · **HTML** = nur Webseite (KI-Extraktion nötig) · **–** = nicht geprüft/nicht erreichbar

| # | Quelle | Art | Technik (geprüft) | Rechtliches (geprüft) | Bewertung |
|---|---|---|---|---|---|
| 1 | Málaga Open Data – Agenda 2026 (`datosabiertos.malaga.eu/recursos/cultura/agenda/2026.csv`) | Stadt Málaga | **Feed:** CSV, laut Katalog täglich aktualisiert. Den Inhalt der Datei konnte ich nicht abrufen (Schutz gegen automatischen Abruf beim Testwerkzeug). | **Offene Lizenz.** Das städtische Portal nennt CC BY 4.0, datos.gob.es nennt CC BY-SA 4.0. Vor Nutzung klären: Namensnennung ist Pflicht, bei BY-SA zusätzlich Weitergabe unter gleicher Lizenz. | ✅ **Startquelle A0.** Spaltenaufbau und Anteil Musik im Bau-Schritt prüfen. |
| 2 | Ayuntamiento Fuengirola (`fuengirola.es/agenda`) | Gemeinde | **Feed:** iCal (`/agenda/?ical=1`) und Events-API (The Events Calendar). Die API meldet nur **20 Events** (Feb.–Dez. 2026), davon ca. 3 musikalisch. | Aviso Legal: „la reproducción total o parcial, uso, explotación, distribución … requiere en todo caso la autorización escrita previa“ | 🟡 Nur mit **schriftlicher Erlaubnis**. Technisch ideal, aber kleine Menge. |
| 3 | Ayuntamiento Alhaurín de la Torre (`alhaurindelatorre.es/agenda/`) | Gemeinde | Strukturiert über die WordPress-API (Inhaltstyp `cpt_agenda`), aber keine Event-Daten für Google, kein iCal | Aviso Legal: Inhalte „protegidos por la legislación sobre propiedad intelectual“ | 🟡 Nur mit Erlaubnis. Eine Marcha-Location liegt dort. |
| 4 | Ayuntamiento Mijas (`mijas.es/portal/cultura/agenda/`) | Gemeinde | HTML (WordPress-API vorhanden, kein Event-Feed gefunden) | nicht geprüft | 🟡 Erst anfragen |
| 5 | Torremolinos Cultura (`torremolinoscultura.es/eventos`) | Gemeinde | HTML, kein Feed, keine strukturierten Daten | nicht geprüft | 🟡 Erst anfragen |
| 6 | Ayuntamiento Marbella (`marbella.es/temas/otros-eventos.html`) | Gemeinde | HTML (Joomla), kein Feed | nicht geprüft | 🟡 Erst anfragen; Agenda teils nur als Nachricht |
| 7 | Ayuntamiento Estepona (`ayuntamiento.estepona.es/agenda/…`) | Gemeinde | HTML, RSS (`/feed.xml`, vermutlich Nachrichten) | nicht geprüft | 🟡 Erst anfragen |
| 8 | Ayuntamiento Benalmádena | Gemeinde | Nur Nachrichten-RSS; Programme als Nachrichtentext (z. B. „Rumbo al Puerto“) | nicht geprüft | 🟠 Wenig ergiebig ohne KI-Extraktion |
| 9 | Ayuntamiento Nerja | Gemeinde | Keine Agenda-Seite gefunden (`/events` → 404) | nicht geprüft | 🟠 Später |
| 10 | Teatro Cervantes Málaga (`teatrocervantes.com/es/programacion/`) | Städtisches Theater | HTML, kein Feed | nicht geprüft | 🟡 Erst anfragen; eher Theater/Konzerte als Bar-Musik |
| 11 | Marenostrum Fuengirola (`marenostrumfuengirola.com/eventos/…`) | Konzert-Location | HTML (WordPress, Event-Seiten), keine Event-Daten für Google, kein iCal | nicht geprüft | 🟡 Persönlich anfragen; große Konzerte, saisonal |
| 12 | Sala París 15, Sala La Trinchera, La Cochera Cabaret, Starlite (Málaga/Marbella) | Konzert-Locations | – (Domain von Sala París 15 nicht auflösbar; andere nicht geprüft) | – | 🟡 Persönlich anfragen; Kandidaten für Veranstalter-Konten |
| 13 | La Ganzúa, Viral Agenda, conciertos.club, Fever, Eventbrite, El Corte Inglés Entradas | Kommerzielle Plattformen | Teils gut strukturiert | Geschäftsbedingungen von Plattformen verbieten in der Regel automatisches Auslesen | ⛔ Nur mit Partnervertrag |
| 14 | Instagram/Facebook von Bars, Bands, DJs | Social Media | – | Automatisches Auslesen durch die Meta-Bedingungen verboten | ⛔ Kein Scout; stattdessen Veranstalter-Konten + persönliche Ansprache |
| 15 | Visita Málaga, Costa del Sol Turismo | Tourismus | – (Agenda-Seiten nicht erreichbar); Monatsagenda teils als PDF | nicht geprüft | 🟡 Anfragen; Kontakt über die Tourismus-Büros |

**Hinweis:** „nicht geprüft“ heißt, ich habe das Impressum nicht gelesen. Erfahrungsgemäß verlangen spanische Gemeinde-Websites meist eine Erlaubnis zur Weiterverwendung, wie Fuengirola und Alhaurín. Eine Ausnahme sind ausdrücklich offene Daten wie die von Málaga.

## Empfehlung für Entscheidung Q3

1. **Scout-Durchstich mit Málaga Open Data starten** (A0, ohne KI für den Import, KI nur für Kategorie und Übersetzung). Das ist rechtlich sauber über die Lizenz, mit Quellenangabe „Fuente: Ayuntamiento de Málaga – datosabiertos.malaga.eu“.
2. **Parallel persönlich anfragen** (Vorlage unten), in dieser Reihenfolge:
   - Fuengirola (Feed vorhanden, nur Erlaubnis fehlt)
   - Alhaurín de la Torre (technisch strukturiert, dort gibt es schon Marcha-Events)
   - Marenostrum Fuengirola und die Konzert-Locations aus Zeile 12, idealerweise direkt als Veranstalter-Konto
3. **Erwartung realistisch halten:** Offene Quellen allein schließen die Lücke „mittwochs 0 Events“ nicht. Das Ziel „jeden Tag mindestens 3 Events“ ist nur mit Veranstalter-Konten und persönlicher Akquise erreichbar.
4. **Für den Scout zweitrangig:** HTML-Quellen mit KI-Extraktion (Marbella, Estepona, Mijas, Torremolinos) erst nach Erlaubnis und erst in Etappe E2.

## Vorlage für die Anfrage (Spanisch, von Frank persönlich zu senden)

> Asunto: Difundir vuestra agenda de eventos en Marcha
>
> Hola, soy Frank, de **Marcha** (www.gomarcha.com), una agenda gratuita de música en directo y eventos en la Costa del Sol, en español, inglés y alemán.
>
> Nos gustaría mostrar vuestros eventos en Marcha, siempre con el nombre de la fuente y un enlace a vuestra web. No usamos vuestras imágenes sin permiso y retiramos cualquier evento en cuanto nos lo pidáis.
>
> ¿Nos autorizáis a incluir los eventos de vuestra agenda (por ejemplo, a partir de vuestro calendario iCal o web)? Si lo preferís, también podéis publicarlos directamente con una cuenta gratuita de organizador.
>
> Muchas gracias y un saludo,
> Frank – Marcha · info@gomarcha.com

## Offene Punkte aus der Inventur

- Lizenz der Málaga-Agenda verbindlich klären: CC BY 4.0 oder CC BY-SA 4.0 (eine kurze Mail an das Open-Data-Portal oder die Lizenzangabe in der Datei selbst prüfen).
- Spaltenaufbau, Datenmenge und Anteil Musik der CSV prüfen. Das geht erst aus Supabase heraus beim Bau, weil der Abruf hier blockiert war.
- Geschäftsbedingungen von Eventbrite/Bandsintown-Partnerprogrammen nur prüfen, wenn das Angebot sonst zu klein bleibt.
