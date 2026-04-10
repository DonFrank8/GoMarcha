# VIBEON Frontend Implementation Guidance (Step 10)

This document is the final implementation and hardening guide for the current mobile-first redesign (Steps 1-9), with concrete conventions for ongoing frontend work.

## 1) Architecture and state conventions

- Keep `state.selectedEventId` as the single source of truth for selection.
- Keep `setViewMode(...)` as the single entry-point for list/map mode changes.
- Keep filter synchronization one-way per action:
  - write into sidebar controls first,
  - then sync hero/sheet controls,
  - then call `applyFilters()`.
- Avoid introducing local component-level duplicated state for selected event, view mode, or active sort.

## 2) Rendering pipeline (required order)

When filters/state change, maintain this order (already used in `applyFilters()`):

1. compute `state.filteredEvents`
2. validate `selectedEventId` still exists
3. render list
4. render markers
5. render featured
6. refresh sheet sort controls + metadata
7. update status + location + URL

This order prevents UI mismatch between list, map, and bottom sheet.

## 3) Motion and interaction system

Current motion system combines:
- micro press/tap states (`.is-pressing`, `.is-burst`, `.is-snapping`)
- map/list view transition classes:
  - `is-transitioning`
  - `is-transitioning-to-map`
  - `is-transitioning-to-list`
- staggered list card entrance via `--card-index`

Rules:
- always use subtle, short transitions for high-frequency interactions.
- avoid adding long-running animations on core interaction surfaces.
- keep all added motion compatible with reduced-motion mode.

## 4) Reduced motion contract

If adding any new animation:
- include a fallback under `@media (prefers-reduced-motion: reduce)`.
- neutralize transform/filter-heavy effects.
- keep interactions usable without visual animation.

## 5) Performance guardrails

- Do not run full list+map rerenders per keystroke without debounce.
- Use existing debounce/throttle helpers for:
  - filter input bursts
  - map move/viewport events
  - recenter/flyTo flows
- Prefer targeted DOM updates over full subtree re-render where possible.

## 6) Empty/loading/error UX patterns

### Empty states
- List empty state must include at least:
  - reset filters action
  - submit event action
- Map sheet empty state should include:
  - reset filters
  - expand/focus filter/search action

### Loading states
- Keep shimmer/skeleton subtle and non-blocking.
- Avoid hard layout shifts when toggling loading.

### Error states
- Keep previous successful content visible when possible.
- show retry affordance near action area.

## 7) Accessibility and input ergonomics

- All actionable controls: touch targets >= 44px effective size.
- Keep keyboard focus behavior for map sheet:
  - focus in search -> sheet to full
- Preserve meaningful labels and `aria-pressed` where toggle-like behavior exists.

## 8) Styling guidelines for future additions

- Reuse design tokens (`--motion-*`, colors, radii, glow vars).
- Keep gradients/noise layers additive and low-opacity.
- Avoid introducing new one-off color constants if equivalent token exists.
- For CTA hierarchy:
  - primary action: stronger gradient + glow
  - secondary action: muted surface with clear border contrast

## 9) Regression checklist before merging

- List and map remain synchronized after:
  - search input changes
  - city/date changes
  - quick category changes
  - sort changes (nearby/soonest)
- Empty-state buttons perform intended actions.
- Map sheet snap states still behave correctly (peek/half/full).
- Route CTA still works from:
  - featured card
  - list card
  - details card
- Reduced motion mode does not break interaction feedback.
- `node --check app.js` passes.

## 10) Suggested next technical tasks (post Step 10)

1. Add lightweight visual regression snapshots for:
   - hero
   - list cards
   - map sheet states
2. Add integration tests for filter-sync and empty-state actions.
3. Add explicit loading/error banners in map sheet refresh flow.
4. Introduce a small UI utility module for repeated class-toggle animation patterns.
