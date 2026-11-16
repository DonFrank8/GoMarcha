// Test Abgleich Plan ↔ social_queue: node --experimental-strip-types reconcile.test.ts
import { planWeek, wallToUtcMs } from "./plan.ts";
import { reconcile } from "./reconcile.ts";

let failed = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` → got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};
const TZ = "Europe/Madrid";
const img = "https://example.com/a.jpg";
const ev = (id: string, date: string, extra = {}) => ({ id, name: id, genre: "salsa", event_date: date, event_time: "21:00", city: "Marbella", image_url: img, status: "approved", ...extra });
const now = wallToUtcMs("2026-11-22", "10:00", TZ);
const kinds = (r: ReturnType<typeof reconcile>) => r.actions.map((a) => `${"plan" in a ? a.plan.slot_key.split(":")[1] : a.slot_key.split(":")[1]}:${a.kind}`);

// 1) Leere Queue → alles neu anlegen
let p = planWeek([ev("a", "2026-11-24"), ev("b", "2026-11-27"), ev("c", "2026-11-28")], "2026-11-23", { tz: TZ, nowMs: now });
let r = reconcile(p.slots, p.slotTimes, [], p.occurrences);
eq("leer → insert", kinds(r), ["mon_collection:insert", "wed_highlight:insert", "thu_collection:insert", "sat_highlight:insert"]);
eq("alles abgedeckt", r.uncovered.length, 0);

// 2) Do-Entwurf (pending) existiert mit nur b → neues Event c wird ergänzt (update)
const thuPlan = p.slots.find((s) => s.slot_id === "thu_collection")!;
const pendingThu = { id: "q1", slot_key: thuPlan.slot_key, status: "pending", event_id: "b", collection_event_ids: [], caption: "alt", image_url: img, scheduled_at: thuPlan.scheduled_at };
r = reconcile(p.slots, p.slotTimes, [pendingThu], p.occurrences);
eq("pending Do → update", kinds(r).find((k) => k.startsWith("thu")), "thu_collection:update");

// 3) Do-Entwurf schon an Postiz (sent_to_postiz) ohne c → eingefroren, c fehlt, c nur Story
const sentThu = { ...pendingThu, status: "sent_to_postiz" };
r = reconcile(p.slots, p.slotTimes, [sentThu], p.occurrences);
const frozen = r.actions.find((a) => a.kind === "frozen");
eq("gesendet → frozen, c fehlt", frozen && frozen.kind === "frozen" ? frozen.missing : null, ["c"]);
eq("c ist aber im Sa-Highlight", r.uncovered.map((o) => o.ref), []);

// 4) Freigegeben (admin_confirmed_at) zählt als eingefroren
r = reconcile(p.slots, p.slotTimes, [{ ...pendingThu, admin_confirmed_at: "2026-11-21T10:00:00Z" }], p.occurrences);
eq("freigegeben → frozen", kinds(r).find((k) => k.startsWith("thu")), "thu_collection:frozen");

// 5) Alter Eintrag ohne slot_key zur selben Zeit → respektieren (kein Doppelpost)
r = reconcile(p.slots, p.slotTimes, [{ ...pendingThu, slot_key: null }], p.occurrences);
eq("alter Eintrag → frozen statt insert", kinds(r).find((k) => k.startsWith("thu")), "thu_collection:frozen");

// 6) Unverändert → nichts tun
r = reconcile(p.slots, p.slotTimes, [{ ...pendingThu, event_id: thuPlan.main.id, collection_event_ids: thuPlan.members.map((m) => m.ref), caption: thuPlan.caption, image_url: thuPlan.image_url }], p.occurrences);
eq("gleich → unchanged", kinds(r).find((k) => k.startsWith("thu")), "thu_collection:unchanged");

// 7) Event abgelehnt → Platz leer → Entwurf wird verworfen (empty)
p = planWeek([ev("a", "2026-11-24")], "2026-11-23", { tz: TZ, nowMs: now });
r = reconcile(p.slots, p.slotTimes, [pendingThu], p.occurrences);
eq("kein Event mehr → empty", kinds(r).find((k) => k.startsWith("thu")), "thu_collection:empty");

// 8) Event nach allen Posts (So 20:00, angelegt am Sa 13:00) → nur Story
const satNoon = wallToUtcMs("2026-11-28", "13:00", TZ);
p = planWeek([ev("z", "2026-11-29", { event_time: "20:00" })], "2026-11-23", { tz: TZ, nowMs: satNoon });
r = reconcile(p.slots, p.slotTimes, [], p.occurrences);
eq("zu spät → Story-Liste", r.uncovered.map((o) => o.ref), ["z"]);

// 9) Serie: Termin im Sammelpost als id::datum, alter Eintrag mit Master-ID zählt auch
const series = { id: "s", name: "Weekly", genre: "dj", is_recurring: true, recurrence_type: "weekly", recurrence_weekday: 5, recurrence_start_date: "2026-10-01", event_time: "23:00", image_url: img, status: "approved" };
p = planWeek([series, ev("b", "2026-11-28")], "2026-11-23", { tz: TZ, nowMs: now });
const thu2 = p.slots.find((s) => s.slot_id === "thu_collection")!;
r = reconcile(p.slots, p.slotTimes, [{ id: "q2", slot_key: null, status: "sent_to_postiz", event_id: "b", collection_event_ids: ["s"], scheduled_at: thu2.scheduled_at }], p.occurrences);
eq("Serie über Master-ID abgedeckt", r.uncovered.map((o) => o.ref), []);

console.log(`\n${failed ? `${failed} FEHLER` : "Alle Tests ok"}`);
if (failed) process.exit(1);
