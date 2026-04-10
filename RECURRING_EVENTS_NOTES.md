# Recurring events MVP notes

## 1) Submission form structure

Keep the existing event form and add a compact recurrence block:

- `recurrence_type` (required select)
  - `none` (one-time event)
  - `weekly`
  - `monthly`
- `event_date`
  - still required for one-time
  - hidden/optional for recurring
- `event_time`
  - optional for one-time
  - required for recurring
- `recurrence_start_date` (required for recurring)
- `recurrence_end_date` (optional for recurring)
- `recurrence_weekday` (required only for weekly; 0-6, Sunday=0)
- `recurrence_day_of_month` (required only for monthly; 1-31)

UI behavior:

- When `recurrence_type = none`: show regular date field, hide recurring controls.
- When weekly/monthly: hide one-time date field, show recurring controls and mode-specific field.
- Keep validation strict but simple:
  - no end-date before start-date
  - no submission without recurring time/start date/mode-specific values

## 2) Event data model suggestion

Use one table (`events`) with minimal additive fields:

- `recurrence_type text not null default 'none'` with check:
  - `recurrence_type in ('none', 'weekly', 'monthly')`
- `recurrence_start_date date null`
- `recurrence_end_date date null`
- `recurrence_weekday smallint null` (0..6)
- `recurrence_day_of_month smallint null` (1..31)

Keep existing columns:

- `event_date`, `event_time`, `status`, geo fields, etc.

MVP interpretation:

- one-time row: `recurrence_type='none'`, regular `event_date`.
- recurring row: master template + recurrence columns. `event_date` can be null.

## 3) Logic for generating upcoming occurrences

Implementation strategy (frontend MVP):

- Load approved rows from Supabase as before.
- Expand each row into upcoming occurrences for discovery.
- No extra occurrence table needed yet.

Rules:

- Horizon limit: next ~120 days.
- Safety cap: max 64 generated occurrences per recurring event.
- Only future occurrences are included in discovery/list/map.
- Generated occurrence IDs are deterministic:
  - `<master_id>::<YYYY-MM-DD>`
- Each generated occurrence keeps:
  - `parent_event_id` (master id)
  - `event_date` (occurrence date)
  - `is_recurring_occurrence = true`

Weekly:

- Start from max(today, recurrence_start_date)
- Pick configured weekday and step by +7 days until horizon/end date

Monthly:

- Start from max(today, recurrence_start_date)
- Generate by month on configured day-of-month
- If a month does not have that day (e.g. 31), skip month

Fallback behavior:

- Invalid recurrence payload returns no occurrences (safe failure).
- Non-recurring stays one event occurrence.

## 4) Notes for admin moderation/editing

Admin should moderate the master row, not each generated occurrence:

- status approve/reject remains on master event row.
- Generated occurrences inherit visibility from master status.

Editing guidance:

- If date/time/location/genre/title changes: update master, all future occurrences reflect it automatically.
- If recurrence pattern changes (weekly -> monthly, weekday/day-of-month change):
  - update master recurrence fields only.
  - discovery auto-regenerates occurrence series.
- If recurring event should stop:
  - set `recurrence_end_date`, or reject event.

MVP caveats to document:

- No exception dates yet (e.g. “skip one week”).
- No per-occurrence overrides yet.
- Timezone handling uses existing local app behavior.
