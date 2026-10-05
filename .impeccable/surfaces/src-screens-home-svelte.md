---
version: 1
slug: "src-screens-home-svelte"
primary_target: "src/screens/Home.svelte"
related_targets: ["src/App.svelte","src/screens/Tasks.svelte","src/screens/Calendar.svelte","src/screens/Focus.svelte"]
---

# Okto app shell — surface brief

Scope: the whole Okto web app (Home, Tasks, Calendar, Focus, sheets). Mode: Operate. Lead surface: Home (stats). Audience: the owner, many short visits a day on Android and desktop. Task: see the day's state at a glance, add and close tasks, plan, focus. Constraints: 7 themes, RU/EN, entry animation every launch ≤ ~1 s, no hacker neon, no terminal costume, no toy feel, readability first.

## Direction contract

THESIS: Okto is a precision instrument in the Braun ET66 / HP-15C lineage: every metric sits in its own recessed display window and every action is a key. Refuses the soft-card productivity app and the terminal costume alike.

OWN-WORLD: Graphite or aluminium "body" ground per theme; recessed display wells (inset 1px shadow, darker well tint) holding JetBrains Mono tabular numerals with dim "ghost" 8s behind live digits; keys = rounded-rect (radius 10) with a hairline top highlight and 1px drop, ET66 ochre `=` key as the single primary action colour, HP-15C blue as the second data series; Golos Text for all prose; mono uppercase micro-labels (letter-spacing .12em) as silk-screen legends.

STORY: On launch the instrument powers on — displays light all segments, then settle to today's values. The owner reads tasks done, focus time, streak and next item in one glance, presses a key to act, and the shell never moves.

FIRST VIEWPORT: Phone: legend row "OKTO · пн 05.10" + clock; 2×N grid of display wells — TASKS 03/07 with day-capacity bar (wide), FOCUS 1:15 and STREAK 12 (half), NEXT 15:00 + title (wide); bottom key-row tab bar; ochre FAB key bottom-right. Desktop: left key column nav, wells in 4-col grid.

FORM: Engineering calculator (Braun ET66 / HP-15C), my grounded list #4, seed key 4e6f1455. Raises: catalog task numbers (Saville), day capacity (j-card), dim-all-but-timer in focus (streaming).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
