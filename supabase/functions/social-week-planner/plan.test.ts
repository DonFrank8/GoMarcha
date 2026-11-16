// Test der Planungslogik ohne Datenbank: node --experimental-strip-types supabase/functions/social-week-planner/plan.test.ts
import { planWeek, wallToUtcMs, isoWeekKey, mondayOf, occurrencesForWeek } from "./plan.ts";

let failed = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` → got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};
const TZ = "Europe/Madrid";
const img = "https://example.com/a.jpg";

// Zeitzone: Winter UTC+1, Sommer UTC+2, Umstellung 29.03.2026
eq("Winterzeit 13:30", new Date(wallToUtcMs("2026-11-19", "13:30", TZ)).toISOString(), "2026-11-19T12:30:00.000Z");
eq("Sommerzeit 13:30", new Date(wallToUtcMs("2026-07-02", "13:30", TZ)).toISOString(), "2026-07-02T11:30:00.000Z");
eq("Umstellungstag 12:00", new Date(wallToUtcMs("2026-03-29", "12:00", TZ)).toISOString(), "2026-03-29T10:00:00.000Z");
eq("ISO-Woche 16.11.2026", isoWeekKey("2026-11-16"), "2026-W47");
eq("ISO-Woche 28.12.2026", isoWeekKey("2026-12-28"), "2026-W53");
eq("ISO-Woche 04.01.2027", isoWeekKey("2027-01-04"), "2027-W01");
eq("ISO-Woche 01.01.2027 (gehört zu 2026)", isoWeekKey("2027-01-01"), "2026-W53");
eq("ISO-Woche 29.12.2025", isoWeekKey("2025-12-29"), "2026-W01");
eq("Montag von So 22.11.", mondayOf("2026-11-22"), "2026-11-16");

const events = [
  { id: "a", name: "Salsa Night", genre: "salsa", event_date: "2026-11-27", event_time: "21:00", city: "Marbella", location_name: "Bar Uno", image_url: img, status: "approved" },
  { id: "b", name: "Rock Band", genre: "rock", event_date: "2026-11-28", event_time: "22:00", city: "Fuengirola", location_name: "Rock Bar", image_url: "", status: "approved" },
  { id: "c", name: "Jazz Tuesday", genre: "jazz", event_date: "2026-11-24", event_time: "20:00", city: "Málaga", location_name: "Jazz Club", image_url: img, status: "approved" },
  { id: "d", name: "Weekly DJ", genre: "dj", is_recurring: true, recurrence_type: "weekly", recurrence_weekday: 5, recurrence_start_date: "2026-10-01", event_time: "23:00", city: "Mijas", image_url: img, status: "approved" },
  { id: "e", name: "Pending", genre: "salsa", event_date: "2026-11-27", event_time: "21:00", status: "pending", image_url: img },
  { id: "f", name: "Featured Sunday", genre: "pop", event_date: "2026-11-29", event_time: "18:00", city: "Nerja", image_url: img, featured: true, status: "approved" },
];

// Planung am Sonntag 22.11. 10:00 für die Woche ab 23.11.
const now = wallToUtcMs("2026-11-22", "10:00", TZ);
const { slots, occurrences } = planWeek(events, "2026-11-23", { tz: TZ, nowMs: now, fallbackImage: "https://fallback" });
eq("Termine (pending raus, Serie Fr dabei)", occurrences.map((o) => o.ref), ["c", "a", "d::2026-11-27", "b", "f"]);
eq("Plätze (Sa-Highlight entfällt: kein freies Sa/So-Event mit Bild)", slots.map((s) => s.slot_key), ["2026-W48:mon_collection", "2026-W48:wed_highlight", "2026-W48:thu_collection"]);
const mon = slots[0];
eq("Mo-Sammelpost mit nur 1 Event", [mon.main.id, mon.members.length], ["c", 0]);
eq("Mo-Post 13:30 Ortszeit", mon.scheduled_at, "2026-11-23T12:30:00.000Z");
const thu = slots[2];
eq("Do-Sammelpost: alle 4 Fr–So-Events (auch ohne Bild + Serie)", [thu.main.id, ...thu.members.map((m) => m.ref)].sort(), ["a", "b", "d::2026-11-27", "f"].sort());
eq("Do-Hauptevent = Featured mit Bild", thu.main.id, "f");
eq("Text listet Rock Band (ohne Bild)", thu.caption.includes("Rock Band"), true);
eq("Mi-Highlight = Featured", slots[1].main.id, "f");
const withSat = planWeek([...events, { id: "g", name: "Sat Gig", genre: "jazz", event_date: "2026-11-28", event_time: "20:00", image_url: img, status: "approved" }], "2026-11-23", { tz: TZ, nowMs: now });
eq("Sa-Highlight: anderes Event als Mi, mit Bild", withSat.slots.map((s) => `${s.slot_id}=${s.main.id}`), ["mon_collection=c", "wed_highlight=f", "thu_collection=f", "sat_highlight=g"]);
eq("Hashtags max 5, beginnt mit #gomarcha", [thu.hashtags.split(" ").length <= 5, thu.hashtags.startsWith("#gomarcha")], [true, true]);
const pref = planWeek(events, "2026-11-23", { tz: TZ, nowMs: now, preferMain: { "2026-W48:wed_highlight": "a" } });
eq("Bevorzugtes Highlight bleibt", pref.slots[1].main.id, "a");

// Am Donnerstag 14:00 sind Mo + Mi + Do vorbei → nur noch Sa
const late = planWeek(events, "2026-11-23", { tz: TZ, nowMs: wallToUtcMs("2026-11-26", "14:00", TZ) });
eq("Vergangene Plätze fallen weg", late.slots.map((s) => s.slot_id), ["sat_highlight"]);

// Begonnene Termine fallen weg
eq("Begonnene Termine raus", occurrencesForWeek(events, "2026-11-23", wallToUtcMs("2026-11-27", "21:30", TZ), TZ).map((o) => o.ref), ["d::2026-11-27", "b", "f"]);

const multi = planWeek([{ id: "m", name: "M", genre: "pop, rock, latin hits", event_date: "2026-11-28", event_time: "20:00", city: "Fuengirola", image_url: img, status: "approved" }], "2026-11-23", { tz: TZ, nowMs: now });
eq("Hashtag nur erstes Genre", multi.slots[0].hashtags, "#gomarcha #Fuengirola #pop #CostaDelSol");
const mixed = planWeek([{ ...events[3] }, { id: "x", name: "X", genre: "dj", event_date: "2026-11-27", event_time: "22:00", image_url: img, status: "approved" }], "2026-11-23", { tz: TZ, nowMs: now });
eq("Sammelpost-Hauptevent lieber kein Serientermin", mixed.slots.find((s) => s.slot_id === "thu_collection")!.main.id, "x");

console.log(`\n${failed ? `${failed} FEHLER` : "Alle Tests ok"}`);
if (failed) process.exit(1);
