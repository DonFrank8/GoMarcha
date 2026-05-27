/**
 * Canonical recurring series policy (Node QA mirror of admin.js auto-prep grouping).
 * Used by scripts/check-social-automation.js — keep in sync with admin build policy.
 */

function normalizeRecurrenceType(value) {
  const normalized = String(value || "none").trim().toLowerCase();
  if (normalized === "weekly" || normalized === "monthly") return normalized;
  return "none";
}

function isChildEvent(event) {
  return Boolean(String(event?.original_event_id ?? "").trim());
}

function isRejectedOrDeleted(event) {
  const status = String(event?.status || "").toLowerCase();
  return status === "rejected" || status === "deleted";
}

function isRecurringSocialExplicitOptOut(event) {
  return event?.recurring_social_opt_out === true;
}

function eventIsRecurringForSocialDefaults(event) {
  if (!event || typeof event !== "object") return false;
  if (isChildEvent(event)) return false;
  const stored = normalizeRecurrenceType(event.recurrence_type);
  if (event.is_recurring === true && (stored === "weekly" || stored === "monthly")) return true;
  return stored === "weekly" || stored === "monthly";
}

function applyRecurringSocialDefaults(event) {
  if (!event || typeof event !== "object") return event;
  if (!eventIsRecurringForSocialDefaults(event)) {
    return { ...event, recurring_social_enabled: false, recurring_social_opt_out: false };
  }
  if (isRecurringSocialExplicitOptOut(event)) {
    return { ...event, recurring_social_enabled: false, recurring_social_opt_out: true };
  }
  if (event.recurring_social_enabled === true) {
    return { ...event, recurring_social_enabled: true, recurring_social_opt_out: false };
  }
  return { ...event, recurring_social_enabled: true, recurring_social_opt_out: false };
}

function isRecurringSocialEnabled(series) {
  return applyRecurringSocialDefaults(series).recurring_social_enabled === true;
}

function buildRecurringSeriesIndex(allEvents) {
  const list = Array.isArray(allEvents) ? allEvents : [];
  const byId = new Map();
  const childrenByMaster = new Map();
  for (const ev of list) {
    const id = String(ev?.id || "").trim();
    if (id) byId.set(id, ev);
    const parentId = String(ev?.original_event_id || "").trim();
    if (parentId) {
      if (!childrenByMaster.has(parentId)) childrenByMaster.set(parentId, []);
      childrenByMaster.get(parentId).push(ev);
    }
  }
  return { list, byId, childrenByMaster };
}

function inferRecurringPatternFromSiblings(event, ctx) {
  const label = String(event?.name || event?.title || "")
    .trim()
    .toLowerCase();
  if (!label || label.length < 3) return false;
  const siblings = ctx.list.filter((row) => {
    if (String(row?.id) === String(event?.id)) return false;
    return (
      String(row?.name || row?.title || "")
        .trim()
        .toLowerCase() === label
    );
  });
  if (!siblings.length) return false;
  const dates = [event, ...siblings]
    .map((row) => String(row?.event_date || "").trim())
    .filter(Boolean);
  if (dates.length < 2) return false;
  const weekdays = new Set(
    dates.map((ymd) => {
      const d = new Date(`${ymd}T12:00:00`);
      return Number.isNaN(d.getTime()) ? null : d.getDay();
    })
  );
  weekdays.delete(null);
  return weekdays.size === 1;
}

function eventHasRecurringAutomationSignals(event, ctx) {
  const raw = event && typeof event === "object" ? event : {};
  if (isRejectedOrDeleted(raw)) return false;
  if (raw.is_recurring === true) return true;
  const stored = normalizeRecurrenceType(raw.recurrence_type);
  if (stored === "weekly" || stored === "monthly") return true;
  if (Number.isInteger(Number(raw.recurrence_weekday))) return true;
  if (Number.isInteger(Number(raw.recurrence_day_of_month))) return true;
  if (Number.isInteger(Number(raw.recurrence_day_of_week))) return true;
  if (isChildEvent(raw)) return true;
  const id = String(raw.id || "").trim();
  if (id && (ctx.childrenByMaster.get(id) || []).length > 0) return true;
  if (isRecurringSocialEnabled(raw) && inferRecurringPatternFromSiblings(raw, ctx)) return true;
  return false;
}

function resolveCanonicalSeriesIdForEvent(event, ctx) {
  const id = String(event?.id || "").trim();
  const parentId = String(event?.original_event_id || "").trim();
  if (parentId) return parentId;
  if (id && (ctx.childrenByMaster.get(id) || []).length > 0) return id;
  return id;
}

function pickCanonicalSeriesMaster(members) {
  const list = [...(members || [])];
  const score = (ev) => {
    let s = 0;
    if (!isChildEvent(ev)) s += 12;
    if (ev?.is_recurring === true) s += 6;
    if (normalizeRecurrenceType(ev?.recurrence_type) !== "none") s += 5;
    if (String(ev?.status || "").toLowerCase() === "approved") s += 4;
    if (!ev?.archived_at) s += 2;
    return s;
  };
  list.sort((a, b) => score(b) - score(a));
  return list[0] || null;
}

function enrichCanonicalSeriesMaster(master, members) {
  if (!master || typeof master !== "object") return master;
  const enriched = { ...master };
  const pool = [...(members || [])];
  const firstWith = (pick) => {
    for (const row of pool) {
      const v = pick(row);
      if (v != null && v !== "") return v;
    }
    return null;
  };
  const typeFromPool = firstWith((row) => {
    const t = normalizeRecurrenceType(row?.recurrence_type);
    return t === "weekly" || t === "monthly" ? t : null;
  });
  if (typeFromPool) enriched.recurrence_type = typeFromPool;
  if (!Number.isInteger(Number(enriched.recurrence_weekday))) {
    const wd = firstWith((row) =>
      Number.isInteger(Number(row?.recurrence_weekday))
        ? row.recurrence_weekday
        : Number.isInteger(Number(row?.recurrence_day_of_week))
          ? row.recurrence_day_of_week
          : null
    );
    if (Number.isInteger(Number(wd))) enriched.recurrence_weekday = wd;
  }
  return enriched;
}

function evaluateCanonicalRecurringSeries(series) {
  const master = series?.master;
  const members = series?.members || [];
  const type = normalizeRecurrenceType(master?.recurrence_type);
  if (!master) return { included: false, reason: "no_canonical_master" };
  if (!isRecurringSocialEnabled(applyRecurringSocialDefaults(master))) {
    return { included: false, reason: "recurring_social_disabled" };
  }
  if (members.length && members.every((row) => isRejectedOrDeleted(row))) {
    return { included: false, reason: "rejected_or_deleted" };
  }
  const hasApproved = members.some((row) => String(row?.status || "").toLowerCase() === "approved");
  if (!hasApproved) return { included: false, reason: "status_not_approved" };
  const activeMembers = members.filter((row) => !row?.archived_at && !isRejectedOrDeleted(row));
  if (!activeMembers.length) return { included: false, reason: "archived" };
  if (type !== "weekly" && type !== "monthly") {
    return { included: false, reason: "recurrence_type_missing" };
  }
  return { included: true, reason: "included" };
}

function buildCanonicalRecurringSeriesList(allEvents) {
  const ctx = buildRecurringSeriesIndex(allEvents);
  const groups = new Map();

  for (const ev of ctx.list) {
    if (!eventHasRecurringAutomationSignals(ev, ctx)) continue;
    const seriesId = resolveCanonicalSeriesIdForEvent(ev, ctx);
    if (!seriesId) continue;
    if (!groups.has(seriesId)) {
      groups.set(seriesId, { canonicalSeriesId: seriesId, members: [], sourceEventIds: new Set() });
    }
    const group = groups.get(seriesId);
    if (!group.members.some((m) => String(m.id) === String(ev.id))) group.members.push(ev);
    if (ev?.id) group.sourceEventIds.add(String(ev.id));
    const parentRow = ctx.byId.get(seriesId);
    if (parentRow && !group.members.some((m) => String(m.id) === seriesId)) {
      group.members.push(parentRow);
      group.sourceEventIds.add(seriesId);
    }
  }

  const series = [];
  for (const group of groups.values()) {
    const picked = pickCanonicalSeriesMaster(group.members);
    const master = applyRecurringSocialDefaults(enrichCanonicalSeriesMaster(picked, group.members));
    const evaluation = evaluateCanonicalRecurringSeries({ ...group, master });
    series.push({
      canonicalSeriesId: group.canonicalSeriesId,
      sourceEventIds: [...group.sourceEventIds],
      members: group.members,
      master,
      seriesMemberIds: [...new Set([...group.sourceEventIds, group.canonicalSeriesId])],
      ...evaluation
    });
  }
  return series;
}

function rowPlatforms(row) {
  if (Array.isArray(row.platforms) && row.platforms.length) {
    return row.platforms.map((p) => String(p).toLowerCase()).filter(Boolean);
  }
  const legacy = String(row.platform || "").toLowerCase();
  return legacy ? [legacy] : ["instagram", "facebook"];
}

function platformsOverlap(a, b) {
  const pa = new Set(rowPlatforms(a));
  const pb = new Set(rowPlatforms(b));
  for (const p of pa) {
    if (pb.has(p)) return true;
  }
  return false;
}

function recurringDedupeKey(row, eventIdToSeriesId) {
  const eventId = String(row?.event_id || "").trim();
  const seriesId = eventIdToSeriesId.get(eventId) || eventId;
  const occurrence = String(row?.event_date || row?.occurrence_date || "").trim();
  const stage = String(row?.post_stage || "").trim();
  const plats = rowPlatforms(row).sort().join("+");
  return `${seriesId}|${occurrence}|${stage}|${plats}`;
}

module.exports = {
  buildCanonicalRecurringSeriesList,
  buildRecurringSeriesIndex,
  recurringDedupeKey,
  rowPlatforms,
  platformsOverlap,
  normalizeRecurrenceType,
  isChildEvent,
  isRecurringSocialEnabled,
  applyRecurringSocialDefaults
};
