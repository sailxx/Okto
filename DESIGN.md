---
name: Okto
description: A monochrome personal planner built as a precision instrument; every metric sits in a recessed display and every action is a key.
colors:
  ink: "#161616"
  casing: "#e9e9e7"
  signal-red: "#d33a3f"
  casing-soft: "#dededb"
  casing-line: "#d0d0cd"
  muted: "#5a5a57"
  key: "#f7f7f5"
  key-edge: "#bababa"
  well: "#d5d5d2"
  well-ink: "#121212"
  well-dim: "#4d4d4a"
typography:
  display:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "min(30vw, 168px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  readout:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "clamp(38px, 11vw, 60px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Golos Text, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(28px, 7.5vw, 38px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Golos Text, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Golos Text, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.12em"
  key-legend:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.1em"
rounded:
  segment: "2px"
  well: "8px"
  key: "10px"
  strip: "12px"
  fab: "14px"
  sheet: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  gutter: "16px"
components:
  key:
    backgroundColor: "{colors.key}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    height: "50px"
    padding: "0 18px"
  key-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.casing}"
    rounded: "{rounded.key}"
    height: "50px"
    width: "100%"
  key-round:
    backgroundColor: "{colors.key}"
    textColor: "{colors.ink}"
    typography: "{typography.key-legend}"
    rounded: "{rounded.key}"
    size: "52px"
  fab:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.casing}"
    rounded: "{rounded.fab}"
    size: "60px"
  display-well:
    backgroundColor: "{colors.well}"
    textColor: "{colors.well-ink}"
    rounded: "{rounded.well}"
    padding: "14px"
  field:
    backgroundColor: "{colors.well}"
    textColor: "{colors.well-ink}"
    rounded: "{rounded.well}"
    height: "48px"
    padding: "0 14px"
  chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.well}"
    height: "36px"
    padding: "0 12px 0 10px"
  chip-selected:
    backgroundColor: "{colors.key}"
    textColor: "{colors.ink}"
  tab-key:
    backgroundColor: "{colors.key}"
    textColor: "{colors.muted}"
    typography: "{typography.key-legend}"
    rounded: "{rounded.key}"
    height: "56px"
  text-key:
    textColor: "{colors.ink}"
    typography: "{typography.key-legend}"
    rounded: "{rounded.well}"
    height: "34px"
    padding: "0 12px"
  text-key-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.casing}"
---

# Design System: Okto

## Overview

**Creative North Star: "The Pocket Instrument"**

Okto is an engineering calculator in the Braun ET66 / HP-15C lineage, used as a planner and rendered in black and white. The page background is the instrument's casing. Every metric lives in a recessed display well, set in tabular JetBrains Mono with unlit "8" segments behind the live digits. Every control is a key: a rounded rectangle with a hairline top highlight and a 1px drop that sinks 1px when pressed. Prose (greetings, task titles, sheet headings) is set in Golos Text, so the instrument stays readable and never turns into a terminal costume.

It is built for Operate mode: many short visits a day, one-handed on a phone. Density is moderate and the shell never moves. There is no brand hue. The primary action is the ink colour inverted onto a key (a black key in light themes, a white key in dark themes), and state is shown with ink LED dots. Red is the only signal colour and means alarm. The only other colours are the user's own: list and counter colours on small markers and calendar events. Motion follows the instrument's own behaviour: the power-on self-test at launch, the key press, and the display tick. It is not decorative.

The system rejects the soft-card productivity app, hacker neon / terminal styling, and (by the owner's decision) a yellow/ochre brand accent. Depth comes from physical metaphor (raised keys, sunken wells), not from floating cards.

**Key Characteristics:**
- Casing ground, raised keys, recessed display wells: three material layers, each with its own tokens.
- JetBrains Mono for every numeral and every silk-screen legend; Golos Text for every sentence.
- Monochrome: the primary key is the ink inverted (`--primary: var(--ink)`, `--on-primary: var(--bg)`), and red is reserved for alarms.
- Ghost "8" segments behind live numerals; power-on self-test on every launch (about 1.1 s, skipped under reduced motion).
- Seven themes re-tint the casing, keys and well without changing the structure; Light and Dark are pure neutral greys.

### Open opportunities (finish review ceiling, not defects)
- Mono uppercase legends are used broadly (key legends, tabs, link buttons, hints). Future surfaces should not add more mono chrome; reserve it for real legends.
- Tasks and Calendar carry few instrument devices compared with Home and Focus.
- The desktop first view is half empty; the four-column well grid leaves the right side unused at large widths.

## Colors

A neutral grey casing palette with no brand hue. The ink inverts to form the primary key, and red is the single alarm signal.

### Primary
- **Ink Key** (`ink`, exposed as `--primary`, with `--on-primary` = casing): the primary key face. Used on the full-width solid key, the FAB, the desktop "new" key, the big calculator key, and the active `text-key`. Ink also supplies the power LED (unlit = key edge), the active-tab and active-nav LED dots, the mode LED, the focus ring (`--accent` = ink in every mode), the caret, the focused-field ring, the checked switch track (85% ink), and selection (ink at 18%).

### Tertiary
- **Signal Red** (`signal-red`): the alarm colour, for overdue times and labels, the calendar now-line, the over-capacity bar, delete keys and swipe actions, and sync errors. It does not tint Pomodoro mode and is never decorative.

### Neutral
- **Casing** (`casing`): page ground; the instrument body; the legend colour on the primary key.
- **Casing Soft** (`casing-soft`): tab bar and sidebar panel, segmented strips, and hover fill on flat keys.
- **Casing Line** (`casing-line`): hairlines, row dividers, and outlines on unselected chips.
- **Muted** (`muted`): secondary text and legends on the casing.
- **Key Face** (`key`) / **Key Edge** (`key-edge`): the raised key surface and its 1px drop edge. The edge also forms the 2px hard drop under the primary key. The top highlight is translucent white (`--key-hi`, 90% on light).
- **Display Well** (`well`), **Well Ink** (`well-ink`), **Well Dim** (`well-dim`): the recessed display, its live digits and lit progress segments, and its legends plus the day-capacity bar. Ghost segments use translucent well ink (`--well-ghost`, 6-8%).

### User data colours
List and counter-tag colours chosen by the user (`--c`) are the only hues besides red. They appear only as 6-9px square markers (chip LEDs, list dots, month-grid dots) and as tinted calendar event fills (16-18% mix) with 55% outlines. They never colour keys, wells, or Home progress segments.

### Per-theme values
All themes share one set of token names (`--bg --ink --muted --line --soft --key --key-ink --key-edge --well --well-ink --well-dim --red`). `--primary`/`--accent` resolve to `--ink` and `--on-primary`/`--on-accent` to `--bg` in every theme. "System" follows the OS between Light and Dark. Themes not listed under red inherit the Light value.

| Token | Light | Dark | Paper | Mint | Midnight | OLED |
|---|---|---|---|---|---|---|
| bg (casing) | #e9e9e7 | #141414 | #e9e2d1 | #e1eae3 | #0f141d | #000 |
| ink (= primary) | #161616 | #ededed | #2a251b | #14241a | #e2e7f0 | #f4f4f4 |
| muted | #5a5a57 | #8e8e8e | #645a49 | #4a5f52 | #8590a6 | #8d8d8d |
| line | #d0d0cd | #2a2a2a | #d6ccb6 | #c9d8cd | #212a39 | #1d1d1d |
| soft | #dededb | #1d1d1d | #dfd6c2 | #d6e2d9 | #161d29 | #0d0d0d |
| key | #f7f7f5 | #262626 | #f6f0e1 | #f1f6f2 | #1b2331 | #111 |
| key-edge | #bababa | #070707 | #c2b69c | #b2c4b6 | #060a10 | #000 |
| well | #d5d5d2 | #0a0a0a | #2b2820 | #cbd9c4 | #070a0f | #000 |
| well-ink | #121212 | #f2f2f2 | #f1e6c8 | #142313 | #dfe7f5 | #fff |
| well-dim | #4d4d4a | #8a8a8a | #a69b80 | #415539 | #7a879c | #8d8d8d |
| red | #d33a3f | #ef5a5f | (light) | (light) | #f0646a | #ff5a5f |

Paper is the only light theme with a dark display well (a backlit LCD look on a cream body). Mint keeps its pale green LCD well, and Paper, Mint and Midnight keep their casing tints. Light, Dark and OLED are hue-free.

### Named Rules
**The One Inverted Key Rule.** Each view has at most one ink-faced primary key (FAB on phone, "new" key in the desktop sidebar, the big calculator key, or the sheet's full-width primary key). Elsewhere, ink shows state only as an LED dot, caret, focus ring or selection.

**The No Brand Hue Rule.** The system has no accent colour. Never add one (yellow, ochre, blue or otherwise) to keys, LEDs, wells or charts. Hierarchy comes from ink inversion, weight and recess.

**The Alarm Rule.** Red means time pressure or loss: overdue, now, over capacity, delete, error. Never use it for emphasis, decoration, or mode identity.

**The Theme Contract Rule.** New surfaces may only use the shared theme tokens. Never hard-code a hex in a component, so all seven themes keep working.

## Typography

**Display Font:** JetBrains Mono (with ui-monospace, Cascadia Mono, Consolas)
**Body Font:** Golos Text (with system-ui, Segoe UI, Roboto)
**Label/Mono Font:** JetBrains Mono

**Character:** The mono is the instrument's display and its printed legends. Golos is the human voice in between. Both are self-hosted via @fontsource (Latin + Cyrillic). Golos ships at 400/500/600/700, JetBrains Mono at 400/500/700.

### Hierarchy
- **Display** (700, `min(30vw, 168px)`, line-height 1, -0.04em, tabular, right-aligned): the Focus counter and timer, inside a well. In Pomodoro mode it shrinks to `min(24vw, 150px)`.
- **Readout** (700, `clamp(38px, 11vw, 60px)`, 0.95; wide wells use `clamp(44px, 13vw, 72px)`): the value in each Home display well.
- **Headline** (Golos 700, `clamp(28px, 7.5vw, 38px)`, 1.1, -0.03em): the page title, one per screen. The Focus item name uses the same voice at `clamp(26px, 7vw, 34px)`.
- **Title** (Golos 700, 22px, -0.02em): sheet headings.
- **Body** (Golos 400-500, 16px; task titles 16.5px/500/1.35): all prose, task titles, settings rows.
- **Label** (Mono 500, 11px, 0.12em, uppercase): silk-screen legends above fields and inside wells.
- **Key legend** (Mono 500, 10-12px, 0.1em, uppercase): text printed on tab keys, segmented strips, text keys. Secondary readings (dates, times, counts) use Mono 12-13px with tabular figures and no uppercase.

### Named Rules
**The Numerals Are Mono Rule.** Every number a user reads (time, count, date, task number, duration) is set in JetBrains Mono with tabular figures. Sentences never are.

**The Legend Is Printed Rule.** Uppercase letter-spaced mono is a legend printed on the casing or a key. It names the thing under or beside it, and it is never a headline or a decorative kicker.

## Layout

One centred column per screen: `min(100% - 32px, 560px)` by default and `820px` for wide screens (Home, Tasks). Calendar is full width. On phones the shell has a sticky top casing row (wordmark with power LED, clock, actions), a fixed bottom key-row tab bar (4 keys, 56px tall, 6px gaps, 72px band), and an ink FAB 20px above the tab bar. At 900px and up, the tab bar and FAB give way to a 236px sticky sidebar key column on the soft casing: wordmark, clock, nav keys with keyboard hints, the ink "new" key, and a footer.

Home arranges display wells in a 2-column grid (10px gap) on phones and 4 columns (14px gap) on desktop. Wide wells span 2 columns. Focus fills the viewport height: heading, then a flexible tap zone holding the display well, then the key row. Spacing rhythm runs 4 / 8 / 14 / 20 px, with a 16px page gutter. Sheets are centred dialogs (max 460px) and become bottom sheets at 560px and below.

While Pomodoro runs, the shell chrome and everything on Focus except the instrument dim to 30-35% opacity, and the chrome restores on hover.

## Elevation & Depth

Depth is physical rather than atmospheric. There are exactly three planes: casing (flat), keys (raised by a highlight and a 1px edge), and wells (sunk by inset shadow). Floating shadows are used only for things that actually float: sheets, the toast, and the FAB. In a monochrome system this tonal layering does the work a hue used to do.

### Shadow Vocabulary
- **Key raised** (`box-shadow: inset 0 1px 0 var(--key-hi), 0 1px 0 var(--key-edge), 0 2px 3px -1px rgb(0 0 0 / 22%)`): every key at rest, selected chips, active segment, mode thumb.
- **Key pressed** (`box-shadow: inset 0 1px 2px rgb(0 0 0 / 18%)` with `transform: translateY(1px)`): `:active`, latched (`aria-pressed`), and current-tab states.
- **Well recess** (`box-shadow: inset 0 2px 3px var(--well-edge), inset 0 0 0 1px var(--well-edge), 0 1px 0 var(--key-hi)`): display wells, inputs, switch tracks.
- **Primary key drop** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 35%), 0 2px 0 var(--key-edge), 0 10px 22px -8px rgb(0 0 0 / 45%)`): FAB only (the sidebar key omits the ambient part). The 2px hard drop is the key's own travel, not a decorative offset shadow.
- **Sheet lift** (`box-shadow: inset 0 1px 0 var(--key-hi), 0 0 0 1px var(--line), 0 30px 60px -20px rgb(0 0 0 / 45%)`): dialogs.

### Named Rules
**The Three Planes Rule.** Every element is casing, key, or well. If it is pressable it is a key, and if it shows a reading it is a well. Nothing sits on an in-between "card" plane.

## Shapes

Shapes are softened rectangles throughout and nothing is pill-shaped. Keys have a 10px radius, wells and fields 8px, segmented strips 12px, the FAB 14px, and sheets 16px (18px top corners as a bottom sheet). LEDs are the only circles (5-9px dots). List-colour markers and chip LEDs are 6-8px squares with a 2px radius, and progress segments are 1-1.5px-radius bars with 2-3px gaps, like LCD segments.

## Components

### Buttons (keys)
- **Shape:** rounded rectangle (10px).
- **Primary:** an ink face with a casing-colour legend (black/white in light themes, inverted in dark themes), Golos 600 16px, 50px tall, full width in sheets. The FAB is the 60px square variant with a 2px key-edge drop.
- **Secondary:** a key-face colour with ink text, 50px tall, 18px side padding. The danger variant swaps only the legend colour to red.
- **Calculator keys:** 52px squares (46px on short or narrow screens) carrying mono 600 15px legends. The big start/pause key is 76px wide and ink-faced. Latched keys invert to an ink face.
- **Hover / Focus / Active:** hover tints the face 10% toward ink, and the primary key brightens by 6%. The focus ring is a 2px ink outline offset by 3px. Active sinks 1px over 90ms with the instrument ease `cubic-bezier(.16, 1, .3, 1)`.
- **Text key / link:** a flat 34px mono-uppercase text key that fills soft on hover and inverts to ink when it is the active toggle. Link buttons are mono uppercase with a hairline underline.

### Chips
- **Style:** 36px with an 8px radius, a 1px line outline, and a transparent fill. A 7px square "LED" sits at 55% opacity: ink for Pomodoro presets, the user's colour for counter tags. It is followed by a Golos 500 14px name and an optional mono count.
- **State:** selected chips become a raised key face, and their LED lights fully with a 3px halo. Chips scroll horizontally without a scrollbar.

### Cards / Containers (display wells)
- **Corner Style:** 8px.
- **Background:** well tint with well-ink digits and well-dim legends.
- **Shadow Strategy:** well recess (see Elevation).
- **Internal Padding:** 14px on Home wells; 18px 18px 14px for the Focus block.
- **Structure:** a legend row (label left, secondary reading right), then a readout pinned to the bottom. Progress appears as discrete LCD segments (20 on Home, 24 on Focus) in ghost tint, lit in well ink. The Tasks well adds a 2px day-capacity line in well dim, which turns red over capacity.

### Inputs / Fields
- **Style:** inputs are small display wells: 48px tall, well background, inset recess, mono 500 17px text, an ink caret, and well-dim placeholders. Each has a mono uppercase legend above it.
- **Focus:** the inset 1px edge becomes a 2px ink inset ring.
- **Switch:** an 8px-radius well track with a 22px key-faced slider. When checked, the track fills 85% ink.

### Navigation
- **Phone:** a bottom key row of four keys on the soft panel, each with a 21px stroke icon over a 10px mono uppercase legend. The current tab is pressed in (sunk 1px, inset shadow, ink legend) with a 5px ink LED in its top-right corner.
- **Desktop:** a sidebar key column. Links are flat (Golos 500 15px, muted), get a translucent key face on hover, and turn into a raised key with a 6px ink LED when current. Mono keyboard hints sit on the right.
- **Mode switch:** a recessed two-way strip with a sliding raised thumb (260ms). The selected mode shows an ink LED dot. Counter and Pomodoro look the same apart from the readout size.

### Digits with power-on self-test (signature)
Every reading is rendered with the Digits component: a ghost layer that replaces each digit with "8" in `--well-ghost`, with the live value layered on top. On every launch the boot sequence runs `off` (90ms) → `test` (all segments lit) → `settle` → `on` at about 1.15s. During `settle` each digit resolves from 8 to its value 70ms after the previous one, and wells stagger by 90ms. Meanwhile the power LED lights from key edge to ink, Home progress segments flash `well-dim`, and the screen content rises 6px into place. Under `prefers-reduced-motion` it jumps straight to `on`. Focus adds a 140ms tick dim on count, and when paused the live digits blink with `steps(1)` at 1.1s.

### Sheets and Toast
Sheets sit on the casing colour with a 16px radius, a 20px pad, and a title row ruled off by a hairline. They enter with a 260ms slide-up of 18px. The toast is a one-line display well (mono 13px) with an optional uppercase action in well ink, underlined. It sits at the top on desktop and above the FAB on phones.

## Do's and Don'ts

### Do:
- **Do** put every reading inside a display well and render its numerals through the Digits component, so they get ghost segments and the power-on test.
- **Do** make every pressable control a key: raised shadow at rest, a 1px sink on press with the `cubic-bezier(.16, 1, .3, 1)` ease over 90ms.
- **Do** keep one ink-faced primary key per view and show state with ink LED dots (5-9px) rather than fills.
- **Do** separate data series by value, segment and recess (well ink vs well dim vs ghost) before reaching for a hue.
- **Do** set every number in JetBrains Mono with tabular figures and every sentence in Golos Text.
- **Do** define new colours as theme tokens in all seven themes, and check Paper, where the well is dark on a light body.
- **Do** keep entry motion at about one second and reduce it to nothing under `prefers-reduced-motion`.

### Don't:
- **Don't** introduce a brand or accent hue (yellow, ochre, blue) on keys, LEDs, wells, focus rings or charts.
- **Don't** introduce soft floating cards, glassmorphism, or ambient-shadow tiles. Readings are recessed, not lifted.
- **Don't** use green-on-black, scanlines, glow, or a terminal prompt aesthetic. This is a calculator, not a console.
- **Don't** use red for emphasis, branding, decoration, or to mark a mode. It means overdue, now, over capacity, delete, or error.
- **Don't** let user list/counter colours go beyond small markers and calendar event tints.
- **Don't** use uppercase mono for headlines, section intros, or kickers. Legends name a control or reading and nothing else.
- **Don't** use pill shapes or circular buttons. Circles are reserved for LEDs.
- **Don't** hard-code hex values in components. They break the theme contract.
