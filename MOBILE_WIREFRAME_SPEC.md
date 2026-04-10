# VIBEON Mobile Wireframe Spec (v1)

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

## 12) Suggested next iteration (v2 wireframe)

If you want the next level app feel, implement:
- draggable bottom sheet map/list hybrid (peek/half/full)
- "Search this area" sticky map CTA
- lightweight haptic bridge for key actions on supported devices
- image prefetch for top 3 featured cards

