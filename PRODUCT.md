# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person — the owner (sailxx) — using Okto as a personal work planner and assistant. Opens it many times a day on an Android phone and on a desktop browser: to see what is next, add and check off tasks, plan the week in the calendar, run Pomodoro focus sessions, and tap‑count reps or habits.

## Product Purpose

A personal planner that combines a task tracker, a calendar linked to tasks, Pomodoro focus and a one‑tap counter, with a home screen of productivity stats. Success: the owner plans and runs the working day from Okto on both phone and computer, with data in sync.

## Positioning

Grew out of the Okto one‑tap counter + Pomodoro: focus time is recorded against tasks, counters and focus feed the same daily stats, and the whole thing is free — no subscription, no ads, no trackers.

## Operating Context

- Sections: Home (stat blocks the user adds, removes and reorders), Tasks, Calendar (day / week / month, tasks appear on it), Focus (counter + Pomodoro).
- Phone: bottom tab bar, used one‑handed in short bursts. Desktop: sidebar, calendar full‑width.
- Opened many times per day; an entry animation plays on every launch and must stay short (about one second) and never block work.
- Future: Android APK (Capacitor) with a home‑screen widget; data via Firebase.

## Capabilities and Constraints

- Tasks: lists with colours, date, time + duration, repeat (day / weekday / week / month, interval, until), reminders, priority, subtasks, focus minutes.
- Calendar: drag to move, drag edge to resize, scope prompt for repeating tasks.
- Focus: counter tags with goals and steps, Pomodoro presets, stopwatch, wake lock.
- Seven user‑selectable themes must remain: System, Light, Dark, Paper, Mint, Midnight, OLED.
- Languages: Russian and English.
- Fully free stack: GitHub Pages, Firebase Spark plan; works local‑only without sign‑in.
- Stack in place: Vite + Svelte 5 + TypeScript.

## Brand Commitments

Name "Okto". No visual element of the 1.0 identity is binding (owner confirmed the wordmark, ring logo and Inter may all change).

## Evidence on Hand

No testimonials, users or metrics — must not be fabricated. Legacy screenshots in `public/assets/screens/` show Okto 1.0.

## Product Principles

- Speed over ceremony: any action is one or two taps; nothing waits on the network.
- One source of truth: a task lives once and appears everywhere it is relevant.
- Calm by default: the planner is opened all day; motion and colour serve orientation, not decoration.
- Own your data: local first, optional sync, no tracking.

## Accessibility & Inclusion

Respect `prefers-reduced-motion` (entry animation and wiggle reduce to a fade or nothing). Keyboard use on desktop; touch targets on phone.
