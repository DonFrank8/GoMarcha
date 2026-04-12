# MARCHA Mobile Wireframe Spec (v2)

This document defines screen-by-screen mobile wireframes with exact spacing, component sizes, and interaction states for direct frontend implementation.

Design intent: premium nightlife app feel (visual-first, fast discovery, minimal friction to navigation).

## 0. Global spec baseline

### 0.1 Target viewport
- Primary frame: **390 x 844** (iPhone 13/14 baseline)
- Secondary checks: 360 x 800, 412 x 915

### 0.2 Grid, spacing, radius
- Base spacing unit: **4 px**
- Main horizontal content padding: **16 px**
- Vertical rhythm:
  - section gap tight: 8 px
  - section gap standard: 12 px
  - section gap loose: 16 px
- Border radius:
  - chips/buttons small: 12 px
  - cards standard: 18 px
  - hero/feature surfaces: 20 px
  - fully pill controls: 999 px

### 0.3 Typography scale
- Display headline: 32/36 (700)
- Section title: 18/22 (650)
- Card title: 18/22 (650)
- Body medium: 14/20 (500)
- Body small/meta: 12/16 (500)
- Label/tags: 11/14 (600)

### 0.4 Motion baseline
- Tap feedback: 120-160 ms
- View transitions: 220-280 ms
- Sheet/drag spring: 260-320 ms easing-out
- Respect prefers-reduced-motion

---

## 1) Screen: App Open / First Impression (critical)

### 1.1 Layout map (top -> bottom)
1. **Top sticky utility bar** (56 h)
2. **Headline block** ("Events today near you")
3. **Search field** (single dominant input)
4. **Featured carousel**
5. **Quick categories rail**
6. **List/Map segmented toggle**
7. **Vibe chip row**
8. **Primary content section (list or map)** below fold
9. **Bottom nav** fixed

### 1.2 Exact spacing and dimensions
- Hero outer top padding: 12
- Utility row margin-bottom: 12
- Headline margin-top: 0, margin-bottom: 8
- Subtitle margin-bottom: 12
- Search height: 54-58
- Featured section top margin: 12
- Featured card size: **~312 x 210** (snap-scrolling)
- Category rail chip height: 34
- View toggle height: 38
- Gap between major blocks: 12

### 1.3 First 3-second clarity checklist
- User sees:
  - what: nearby events
  - why: immersive featured imagery
  - next action: tap category / list-map toggle / featured card

---

## 2) Screen: Featured Event Card (Hero Carousel)

### 2.1 Component anatomy
- Container:
  - width: 82-90% viewport
  - radius: 18
  - border: 1 px subtle neon
- Media:
  - min height: 210
  - image full-bleed cover
- Gradient overlay:
  - top transparent -> bottom 90% dark
- Content anchored bottom:
  - badge (genre)
  - title (max 2 lines)
  - meta row: date/time • city
  - actions row

### 2.2 Actions
- Primary button: "List"/"Open" (min height 34)
- Secondary button: "Navigate" (min height 34)
- Interaction:
  - tap card body -> select event + open map focus
  - tap navigate -> open external navigation provider

### 2.3 States
- default
- pressed (scale 0.98)
- disabled navigate (if no destination)
- loading fallback image (genre emoji/placeholder)

---

## 3) Screen: Quick Category Rail

### 3.1 Categories
- All, House, Latino, Live Band, Beach, DJ

### 3.2 Chip spec
- Height: 34
- Horizontal padding: 12
- Radius: 999
- Font: 12/16 600
- Behavior:
  - horizontal scroll
  - single-select active category
  - active state uses neon gradient + glow

### 3.3 Interaction
- On select:
  - filter list/map/featured instantly
  - keep map viewport intact
  - animate chip state in <=160 ms

---

## 4) Screen: Discover List (default mode)

### 4.1 Layout
- Above list:
  - status panel
  - filters panel
  - result count
- List card gap: 12-16
- List panel inner padding: 12-14

### 4.2 Event Card (list variant)
- Card radius: 20-22
- Media min-height: 156
- Top gradient accent line: 3 px
- Internal layout:
  - image + overlay controls
  - title
  - location line
  - datetime line
  - chips (genre, price)
  - full-width navigate CTA

### 4.3 Event card states
- default
- hover/focus (desktop support remains)
- active selected
- favorite active
- skeleton loading

---

## 5) Screen: Map Focus Mode

### 5.1 Entry
- Triggered by:
  - View toggle "Map"
  - Bottom nav "Map"
  - Featured card open flow

### 5.2 Mobile behavior
- In narrow view:
  - list column hidden
  - map column shown
- map min-height:
  - 340 (small phones)
  - 380+ (standard)

### 5.3 Map interaction
- Pin tap -> sync selected event
- Selected marker uses active glow/pulse
- Event details block remains accessible below map

---

## 6) Screen: Event Details Pane (selected event)

### 6.1 Layout
- Media hero at top (min 184-210)
- Title + badges
- Immediate navigation CTA (full width on mobile)
- Info cards:
  - location/address
  - price
- Description card

### 6.2 CTA rule
- "Start route" must be visible without extra interactions after selecting event

---

## 7) Global Mobile Bottom Navigation

### 7.1 Structure
- Fixed bottom bar, height 66 (+ safe-area)
- 3 items:
  - Discover
  - Map
  - Submit

### 7.2 Interaction model
- Discover: set view mode list and scroll to discover
- Map: set view mode map and scroll to map
- Submit: open submission modal

### 7.3 Active state
- Active item text tint: high-contrast white
- Inactive: muted blue/gray

---

## 8) Modal: Submit Event

### 8.1 Desktop/mobile consistency
- Keep current flow and moderation-safe behavior
- Mobile:
  - full-width dialog with safe margins
  - sticky close button
  - large touch targets (>= 44 h)

### 8.2 Form UX
- preserve current validation and upload constraints
- message states:
  - success
  - error
  - uploading/saving

---

## 9) Interaction state matrix (implementation checklist)

### 9.1 View mode
- `list`: sidebar/list visible, map hidden on small viewport
- `map`: map visible, sidebar/list hidden on small viewport
- Keep toggle + bottom nav state in sync

### 9.2 Selection
- selected event id updates:
  - list card active style
  - map marker active style
  - details panel content

### 9.3 Filtering
- text query
- city/date
- genre chips
- quick category keyword filter
- all filters affect:
  - list
  - map markers
  - featured carousel source

---

## 10) Handoff tokens (frontend-ready)

Use these implementation constants:

```txt
containerPaddingX = 16
sectionGap = 12
cardRadius = 18
chipHeight = 34
buttonHeightPrimary = 42
buttonHeightSecondary = 34
topBarHeight = 56
bottomNavHeight = 66
featuredCardMinHeight = 210
eventCardMediaMinHeight = 156
detailsMediaMinHeight = 184 (small) / 210 (default)
```

---

## 11) QA acceptance checklist

- [ ] First screen communicates value in <=3 seconds
- [ ] Featured cards are swipeable and tappable
- [ ] Quick category tap filters results immediately
- [ ] List/Map toggle works and syncs with bottom nav
- [ ] Event selection syncs list, map, and details
- [ ] Navigation CTA works from featured/list/details
- [ ] UI remains usable at 360 px width
- [ ] No regression in submit/moderation flows
- [ ] Motion remains subtle and performant
- [ ] Reduced-motion preference respected

---

## 12) Bottom-sheet Map/List Hybrid (v2 core)

This section is the required interaction model for native-like map discovery.

### 12.1 Screen composition
- Map is always present as background layer (full canvas).
- Event list is rendered inside a draggable bottom sheet.
- Bottom sheet has 3 stable states:
  - **peek**
  - **half**
  - **full**

### 12.2 Sheet geometry (390x844 baseline)
- Safe top inset assumed: 47
- Safe bottom inset assumed: 34
- Header handle area: 28 h
- Sheet corner radius (top-left/top-right): 22
- Snap points from top:
  - `fullTop = safeTop + 12` -> **59 px**
  - `halfTop = viewportH * 0.46` -> **388 px**
  - `peekTop = viewportH - (cardPeekH + bottomNavH + safeBottom + 10)`
- Recommended peek card height:
  - `cardPeekH = 132`
- With baseline values:
  - `peekTop = 844 - (132 + 66 + 34 + 10) = 602`

Implementation token:

```txt
sheetSnapTop.full = 59
sheetSnapTop.half = 388
sheetSnapTop.peek = 602
sheetCornerRadiusTop = 22
sheetHandleAreaH = 28
peekCardH = 132
```

### 12.3 Drag/gesture behavior
- Vertical drag is active on:
  - handle zone
  - sheet header
  - empty area above list
- While list content is scrollable:
  - drag-to-collapse only when list scrollTop == 0
- Release decision rules:
  - Velocity threshold: **0.55 px/ms**
  - Distance threshold: **56 px**
  - If velocity exceeds threshold -> move in velocity direction to next snap
  - Else snap to nearest state by distance

Pseudo rules:

```txt
if abs(velocityY) > 0.55:
  snap = velocityY > 0 ? nextLowerState : nextHigherState
else if abs(deltaY) > 56:
  snap = deltaY > 0 ? nextLowerState : nextHigherState
else:
  snap = nearestState(currentTop)
```

### 12.4 State behavior and content density
- **peek**
  - show 1 primary mini-card + "X events near you" meta
  - list scrolling disabled
  - map pins fully interactive
- **half**
  - show 3-5 cards
  - list scroll enabled
  - map remains visible top ~45%
- **full**
  - near full-screen list
  - map still visible as top strip (optional 48-72 h) or hidden behind sheet
  - filter/search row sticky inside sheet

### 12.5 Sheet header structure
- drag handle centered: 36x4, radius 999
- title row:
  - left: "Events near you"
  - right: count badge
- utility row:
  - sort chip (Nearby / Soonest)
  - filter chip
  - "Map" quick toggle (returns to half state if currently full)

### 12.6 Motion spec
- Sheet spring:
  - duration target: 280 ms
  - easing: cubic-bezier(0.22, 1, 0.36, 1)
- On snap settle:
  - apply subtle backdrop blur increase in full state
  - reduce blur in peek

### 12.7 Keyboard + accessibility behavior
- When search input in sheet is focused:
  - force snap to `full`
  - keep active field 12 px above keyboard
- Esc/back action:
  - full -> half
  - half -> peek
  - peek -> exit map-focused mode (optional)
- Touch targets >=44 h
- announce state change for screen reader:
  - "Event sheet expanded"
  - "Event sheet collapsed"

---

## 13) Map/List sync rules (no ambiguity)

### 13.1 Source of truth
- `selectedEventId` is the single source of truth.
- Every view derives active state from this id.

### 13.2 Synchronization table
- Pin tapped:
  - update `selectedEventId`
  - center map with offset (to keep pin visible above sheet)
  - scroll list to matching card
  - if sheet in peek -> move to half
- List card tapped:
  - update `selectedEventId`
  - pulse selected marker
  - optionally fly map (max once per 600 ms throttled)
- Featured card tapped:
  - update `selectedEventId`
  - switch to map mode
  - set sheet to half

### 13.3 Map camera offset
- Because sheet covers lower map area, marker centering must be offset.
- For half state recommended vertical offset:
  - `mapCenterOffsetY = -120 px`
- For peek:
  - `mapCenterOffsetY = -70 px`
- For full:
  - no recenter unless explicitly requested

---

## 14) "Search this area" CTA spec

### 14.1 Trigger
- Show CTA when user pans map beyond threshold:
  - center moved > 18% viewport width OR zoom changed by >=1 level.
- Hide CTA once new results are fetched and rendered.

### 14.2 Position and style
- Floating button anchored above sheet:
  - bottom = sheetTop + 12
  - centered horizontally
- Min height 40, radius 999, high contrast neon primary style.

### 14.3 Behavior
- Tap CTA:
  1. fetch events for visible bounds
  2. keep current sheet state
  3. animate button to loading spinner
  4. on success: update count + cards + markers

---

## 15) Loading, empty, and failure states (v2)

### 15.1 Sheet loading skeleton
- Peek: one mini skeleton card
- Half: 3 skeleton cards
- Full: 6 skeleton cards + shimmering filter row

### 15.2 Empty state
- Message: "No events in this area yet"
- Secondary CTA:
  - broaden area
  - switch date
  - submit event

### 15.3 Failure state
- Inline retry banner in sheet header:
  - "Couldn't refresh events. Retry."
- Keep previous successful data visible.

---

## 16) Haptic + feedback spec (optional native bridge)

- Light haptic:
  - category selected
  - sheet snap complete
- Medium haptic:
  - navigate pressed
- Success haptic:
  - save/favorite confirmed

Fallback for web-only:
- replace haptics with subtle scale + glow pulse.

---

## 17) Engineering acceptance criteria for v2

- [ ] Bottom sheet supports stable peek/half/full states
- [ ] Dragging works without fighting list scroll
- [ ] Pin tap and list tap always stay synchronized
- [ ] `selectedEventId` is never duplicated in local component state
- [ ] "Search this area" appears/disappears at defined thresholds
- [ ] Keyboard focus forces full sheet without overlap bugs
- [ ] 60fps feel on modern mid-range devices
- [ ] Reduced-motion mode disables spring-heavy transitions
- [ ] Existing submit and moderation flows remain unchanged

---

## 18) Suggested implementation order (v2)

1. Introduce sheet state machine + snap calculations
2. Render list inside sheet + preserve existing card component
3. Add map offset centering and sync table behavior
4. Add "Search this area" CTA logic
5. Add loading/empty/error states in sheet
6. Add polish motion + optional haptic bridge

