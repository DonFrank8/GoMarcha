/**
 * social-week-planner / reconcile.ts – Abgleich Plan ↔ vorhandene Einträge in social_queue (rein, ohne IO).
 *
 * Regeln (Rat 16.11.2026):
 *   - Pro Platz (slot_key) höchstens ein Eintrag.
 *   - Solange ein Eintrag „pending“ ist (nicht freigegeben, nicht von Hand bearbeitet), wird er bei
 *     jedem Lauf neu berechnet → später freigegebene Events kommen noch hinein.
 *   - Ab Freigabe/Übergabe an Postiz ist er eingefroren und wird nie mehr verändert.
 *   - Alte Einträge ohne slot_key (vom Admin-Browser angelegt) am selben Zeitpunkt werden respektiert.
 *   - Events, die in keinem Post stehen, landen in der Liste „nur Story/Website“.
 */
import type { Occ, SlotPlan } from "./plan.ts";

// deno-lint-ignore no-explicit-any
export type QueueRow = Record<string, any>;

export type Action =
  | { kind: "insert"; plan: SlotPlan }
  | { kind: "update"; plan: SlotPlan; row: QueueRow; mainChanged: boolean }
  | { kind: "unchanged"; plan: SlotPlan; row: QueueRow }
  | { kind: "frozen"; slot_key: string; row: QueueRow; missing: string[] }
  | { kind: "empty"; slot_key: string; row: QueueRow };

export interface ReconcileResult {
  actions: Action[];
  uncovered: Occ[];   // in keinem Post → nur Story/Website
}

const EDITABLE = new Set(["pending", "draft"]);

export function memberRefs(row: QueueRow): string[] {
  if (Array.isArray(row?.collection_event_ids)) return row.collection_event_ids.map(String);
  const ids = row?.postiz_response?._marcha_collection_event_ids;
  return Array.isArray(ids) ? ids.map(String) : [];
}

export function isFrozen(row: QueueRow): boolean {
  return !EDITABLE.has(String(row?.status || "")) ||
    Boolean(row?.admin_confirmed_at) ||
    String(row?.caption_template_id || "") === "manual";
}

/** Deckt ein Eintrag den Termin ab? (Hauptevent oder Mitglied; Serien über id bzw. id::datum) */
function rowCovers(row: QueueRow, o: Occ): boolean {
  if (String(row?.event_id || "") === o.id && (!row?.occurrence_date || !o.recurring || String(row.occurrence_date) === o.ymd)) {
    return true;
  }
  return memberRefs(row).some((ref) => ref === o.ref || (!o.recurring && ref.split("::")[0] === o.id) ||
    (o.recurring && ref === o.id));
}

function planCovers(plan: SlotPlan, o: Occ): boolean {
  return plan.main.ref === o.ref || plan.members.some((m) => m.ref === o.ref);
}

function samePlan(plan: SlotPlan, row: QueueRow): boolean {
  const a = [...plan.members.map((m) => m.ref)].sort().join(",");
  const b = [...memberRefs(row)].sort().join(",");
  return String(row?.event_id || "") === plan.main.id && a === b &&
    (plan.type === "single" || String(row?.caption || "") === plan.caption) &&
    String(row?.image_url || "") === plan.image_url;
}

/**
 * @param plans     geplante Plätze (alle betrachteten Wochen)
 * @param slotTimes alle Plätze der betrachteten Wochen: slot_key → scheduled_at (auch ohne Plan)
 * @param rows      vorhandene Einträge im Zeitraum (status ≠ skipped)
 * @param occs      alle Termine im Zeitraum
 */
export function reconcile(
  plans: SlotPlan[],
  slotTimes: Record<string, string>,
  rows: QueueRow[],
  occs: Occ[],
): ReconcileResult {
  const live = rows.filter((r) => String(r?.status || "") !== "skipped");
  const bySlot = new Map<string, QueueRow>();
  for (const r of live) if (r.slot_key && !bySlot.has(r.slot_key)) bySlot.set(r.slot_key, r);
  const legacyAt = (iso: string) =>
    live.find((r) => !r.slot_key && Date.parse(r.scheduled_at) === Date.parse(iso));

  const planByKey = new Map(plans.map((p) => [p.slot_key, p]));
  const actions: Action[] = [];
  const effective: Array<{ plan?: SlotPlan; row?: QueueRow }> = [];

  for (const [slot_key, iso] of Object.entries(slotTimes)) {
    const plan = planByKey.get(slot_key);
    const row = bySlot.get(slot_key) || legacyAt(iso);
    if (!row) {
      if (plan) {
        actions.push({ kind: "insert", plan });
        effective.push({ plan });
      }
      continue;
    }
    if (isFrozen(row) || !row.slot_key) {
      // eingefroren oder alter Eintrag ohne Schlüssel: nicht anfassen, aber fehlende Events melden
      const missing = plan
        ? [plan.main, ...plan.members].filter((o) => !rowCovers(row, o)).map((o) => o.ref)
        : [];
      actions.push({ kind: "frozen", slot_key, row, missing });
      effective.push({ row });
      continue;
    }
    if (!plan) {
      actions.push({ kind: "empty", slot_key, row });
      continue;
    }
    if (samePlan(plan, row)) {
      actions.push({ kind: "unchanged", plan, row });
    } else {
      actions.push({ kind: "update", plan, row, mainChanged: String(row.event_id || "") !== plan.main.id });
    }
    effective.push({ plan });
  }

  // Auch Einträge außerhalb des Wochenplans zählen (z. B. ältere Einzel-Posts eines Events).
  const slotRowIds = new Set([...bySlot.values()].map((r) => r.id));
  const otherRows = live.filter((r) => !slotRowIds.has(r.id) && !Object.values(slotTimes).some((iso) => Date.parse(iso) === Date.parse(r.scheduled_at)));
  const uncovered = occs.filter((o) =>
    !effective.some((e) => (e.plan ? planCovers(e.plan, o) : e.row ? rowCovers(e.row, o) : false)) &&
    !otherRows.some((r) => rowCovers(r, o))
  );
  return { actions, uncovered };
}
