# Okto 2.0 Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Okto 1.0 (vanilla counter + Pomodoro) into a 4-section planner — Home dashboard, Tasks, Apple-style Calendar, Focus — with optional free Firebase sync.

**Architecture:** Vite + Svelte 5 SPA with hash routing. One reactive store (`store.svelte.ts`) owns all data, persists to `localStorage` (`okto-v3`) and forwards record changes to an optional Firebase sync module. Pure logic (dates, recurrence, stats, calendar layout, migration, merge) lives in framework-free TS modules covered by Vitest.

**Tech Stack:** Vite 6, Svelte 5 (runes), TypeScript, Vitest, Firebase JS SDK v11 (Auth + Firestore, dynamically imported), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-05-okto-planner-design.md`

## Global Constraints

- Free only: GitHub Pages hosting, Firebase Spark plan; no paid services, no Cloud Functions.
- Design code of Okto 1.0: Inter / Inter Display (local woff), tokens `--bg --ink --muted --soft --line --accent --red`, 7 themes (system, light, dark, paper, mint, midnight, oled), circles 2px border, pill capsules, `.sheet` dialogs, uppercase muted labels, red accent only in Pomodoro.
- Languages RU + EN for every string; dates via `Intl`; week starts Monday (ru) / Sunday (en).
- App works fully without Firebase config and without sign-in.
- Legacy `okto-v2` / `okto-counter-v1` data migrated, legacy keys left intact.
- Dates stored as local `YYYY-MM-DD`, times as `HH:MM`, timestamps as epoch ms.
- Mobile < 900px: bottom tab bar + FAB; desktop ≥ 900px: left sidebar.

## Review Focus

- Monthly repeat on the 31st in a 30-day month / February → falls on last day of month (test in Task 2).
- Midnight rollover while the app is open: "today" stats, streak and Pomodoro today counter must use the current date at render time, not load time (Task 5 tests pass `today` explicitly; store recomputes per tick).
- Overlapping timed tasks in the calendar must not draw on top of each other (Task 6 tests).
- Two devices editing the same task: newer `updatedAt` wins; a deleted record must not resurrect (Task 4 tests).
- Corrupted / partial localStorage JSON must not crash startup (Task 3 tests).

## File Structure

```
index.html                 Vite entry (pre-paint theme script kept)
vite.config.ts             base './', svelte plugin, vitest config
public/                    assets/, manifest.webmanifest, sw.js, .nojekyll (copied verbatim)
src/main.ts                mounts App
src/App.svelte             shell: nav, routing, sheets, toast, ticker
src/styles/base.css        tokens, themes, primitives from Okto 1.0 style.css
src/lib/date.ts            date helpers
src/lib/model.ts           types, constants, normalizers, factories
src/lib/recurrence.ts      occursOn / occurrences / isDoneOn / instancesInRange
src/lib/migrate.ts         legacy → v3
src/lib/merge.ts           record merge for sync
src/lib/stats.ts           dashboard metrics
src/lib/layout.ts          calendar overlap layout
src/lib/i18n.ts            RU/EN dictionary + t()
src/lib/alerts.ts          chime, buzz, notify
src/lib/store.svelte.ts    app state, actions, persistence
src/lib/sync.ts            Firebase auth + Firestore sync
src/lib/router.svelte.ts   hash routing
src/components/*.svelte    Nav, Sheet, Toast, TaskRow, TaskEditor, Settings, Icon
src/screens/*.svelte       Home, Tasks, Calendar, Focus
tests/*.test.ts            Vitest
```

---

### Task 1: Scaffold Vite + Svelte + Vitest, port styles

**Files:** Create `package.json`, `vite.config.ts`, `tsconfig.json`, `svelte.config.js`, `src/main.ts`, `src/App.svelte` (placeholder), `src/styles/base.css`; move `assets/ manifest.webmanifest sw.js .nojekyll` → `public/`; delete `app.js style.css` (logic re-homed in later tasks); modify `.github/workflows/deploy.yml`, `.gitignore`.

- [ ] Step 1: `npm init`, install `svelte @sveltejs/vite-plugin-svelte vite typescript vitest svelte-check @tsconfig/svelte`, `firebase`.
- [ ] Step 2: `vite.config.ts` with `base: './'`, svelte plugin, `test: { include: ['tests/**/*.test.ts'] }`.
- [ ] Step 3: Port Okto 1.0 `style.css` into `src/styles/base.css` (fonts, tokens, themes, primitives `.icon-btn .circle .tag .seg .sheet .switch .field .solid-btn .line-btn .toast .label`).
- [ ] Step 4: Deploy workflow: add `actions/setup-node@v4` (node 22), `npm ci`, `npm test`, `npm run build`, upload `dist`; pass `VITE_FIREBASE_*` from repo secrets.
- [ ] Step 5: `npm run build` succeeds; `npm test` runs (no tests yet → passWithNoTests). Commit.

### Task 2: Dates and recurrence

**Files:** Create `src/lib/date.ts`, `src/lib/recurrence.ts`, `tests/recurrence.test.ts`

**Interfaces — Produces:**
- `date.ts`: `toKey(d: Date): string`, `fromKey(k: string): Date`, `todayKey(now?: Date): string`, `addDays(k: string, n: number): string`, `diffDays(a: string, b: string): number` (b−a), `weekday(k): number` (0=Sun), `startOfWeek(k, weekStart: 0|1): string`, `daysInMonth(y, m0): number`, `toMin('HH:MM'): number`, `fromMin(n): string`, `range(from, to): string[]`
- `recurrence.ts`: `occursOn(task: Task, key: string): boolean`, `occurrences(task, from, to): string[]`, `isDoneOn(task, key): boolean`, `instancesInRange(tasks: Task[], from, to): Instance[]` where `Instance = { task: Task; date: string }`

- [ ] Step 1: Write tests:

```ts
import { describe, it, expect } from 'vitest';
import { occursOn, occurrences, isDoneOn } from '../src/lib/recurrence';
import { newTask } from '../src/lib/model';

const t = (p = {}) => newTask({ title: 'x', date: '2026-10-05', ...p });

describe('recurrence', () => {
  it('one-off occurs only on its date', () => {
    expect(occursOn(t(), '2026-10-05')).toBe(true);
    expect(occursOn(t(), '2026-10-06')).toBe(false);
  });
  it('undated never occurs', () => expect(occursOn(t({ date: null }), '2026-10-05')).toBe(false));
  it('daily with interval 2', () => {
    const task = t({ repeat: { freq: 'day', interval: 2, until: null } });
    expect(occurrences(task, '2026-10-04', '2026-10-10')).toEqual(['2026-10-05', '2026-10-07', '2026-10-09']);
  });
  it('weekday skips weekends', () => {
    const task = t({ repeat: { freq: 'weekday', interval: 1, until: null } }); // 2026-10-05 is Monday
    expect(occurrences(task, '2026-10-05', '2026-10-12')).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-12']);
  });
  it('weekly', () => {
    const task = t({ repeat: { freq: 'week', interval: 1, until: null } });
    expect(occurrences(task, '2026-10-01', '2026-10-31')).toEqual(['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
  });
  it('monthly on the 31st clamps to month end', () => {
    const task = t({ date: '2026-01-31', repeat: { freq: 'month', interval: 1, until: null } });
    expect(occurrences(task, '2026-01-01', '2026-04-30')).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });
  it('until is inclusive and skipDates are excluded', () => {
    const task = t({ repeat: { freq: 'day', interval: 1, until: '2026-10-08' }, skipDates: ['2026-10-06'] });
    expect(occurrences(task, '2026-10-01', '2026-10-31')).toEqual(['2026-10-05', '2026-10-07', '2026-10-08']);
  });
  it('done state per occurrence', () => {
    const task = t({ repeat: { freq: 'day', interval: 1, until: null }, doneDates: ['2026-10-06'] });
    expect(isDoneOn(task, '2026-10-06')).toBe(true);
    expect(isDoneOn(task, '2026-10-07')).toBe(false);
    expect(isDoneOn(t({ done: true }), '2026-10-05')).toBe(true);
  });
  it('deleted never occurs', () => expect(occursOn(t({ deleted: true }), '2026-10-05')).toBe(false));
});
```

- [ ] Step 2: Run `npx vitest run tests/recurrence.test.ts` → FAIL (modules missing).
- [ ] Step 3: Implement `date.ts`, `recurrence.ts` (and the `newTask` factory from Task 3's `model.ts` — create `model.ts` now with types + `newTask`).
- [ ] Step 4: Run → PASS. Commit.

### Task 3: Model normalization and legacy migration

**Files:** Modify `src/lib/model.ts`; create `src/lib/migrate.ts`, `tests/migrate.test.ts`

**Interfaces — Produces:**
- `model.ts`: types `Task, List, Session, Counter, Settings, Block, Data, Device`; consts `COLORS, THEMES, POMO, PRIORITY_COLORS`; `uid()`, `newTask(p)`, `newList(p)`, `newCounter(p)`, `newSession(p)`, `defaultSettings(lang)`, `defaultData(lang)`, `defaultDevice()`, `normData(raw, lang): Data`, `normDevice(raw): Device`
- `migrate.ts`: `migrateLegacy(v2: unknown, v1: unknown, lang): { data: Data; device: Device } | null`

- [ ] Step 1: Tests:

```ts
import { describe, it, expect } from 'vitest';
import { migrateLegacy } from '../src/lib/migrate';
import { normData } from '../src/lib/model';

describe('migrate', () => {
  it('returns null when nothing to migrate', () => expect(migrateLegacy(null, null, 'ru')).toBeNull());
  it('moves v2 presets, theme and pomodoro settings', () => {
    const v2 = { lang: 'en', theme: 'mint', mode: 'pomodoro', active: 'a',
      presets: [{ id: 'a', name: 'Push', target: 45, step: 5, count: 12, color: '#e93d82' }],
      pomo: { preset: 'deep', custom: { work: 40, short: 5, long: 20, every: 3 }, autoStart: false } };
    const r = migrateLegacy(v2, null, 'ru')!;
    const c = Object.values(r.data.counters)[0];
    expect(c).toMatchObject({ id: 'a', name: 'Push', target: 45, step: 5, count: 12, color: '#e93d82' });
    expect(r.data.settings).toMatchObject({ lang: 'en', theme: 'mint' });
    expect(r.data.settings.pomo).toMatchObject({ preset: 'deep', autoStart: false, custom: { work: 40, short: 5, long: 20, every: 3 } });
    expect(r.device).toMatchObject({ focusMode: 'pomodoro', activeCounter: 'a' });
  });
  it('moves v1 single counter', () => {
    const r = migrateLegacy(null, { count: 7, target: 20, theme: 'dark', name: 'Вода' }, 'ru')!;
    expect(Object.values(r.data.counters)[0]).toMatchObject({ count: 7, target: 20, name: 'Вода' });
    expect(r.data.settings.theme).toBe('dark');
  });
});

describe('normData', () => {
  it('survives garbage', () => {
    const d = normData({ tasks: { x: { title: 5, priority: 9 } }, settings: 'nope' }, 'ru');
    expect(d.tasks.x.title).toBe('');
    expect(d.tasks.x.priority).toBe(0);
    expect(d.settings.theme).toBe('system');
    expect(Object.keys(d.lists).length).toBeGreaterThan(0);
    expect(Object.keys(d.counters).length).toBe(1);
  });
});
```

- [ ] Step 2: Run → FAIL. Step 3: implement. Step 4: Run → PASS. Commit.

### Task 4: Sync merge

**Files:** Create `src/lib/merge.ts`, `tests/merge.test.ts`

**Interfaces — Produces:** `mergeRecords<T extends { id: string; updatedAt: number }>(local: Record<string, T>, remote: Record<string, T>): { merged: Record<string, T>; upload: T[] }`

- [ ] Step 1: Tests:

```ts
import { describe, it, expect } from 'vitest';
import { mergeRecords } from '../src/lib/merge';

const r = (id: string, updatedAt: number, extra = {}) => ({ id, updatedAt, ...extra });

describe('mergeRecords', () => {
  it('newer wins on each side', () => {
    const { merged, upload } = mergeRecords({ a: r('a', 5, { v: 'L' }), b: r('b', 1, { v: 'L' }) }, { a: r('a', 3, { v: 'R' }), b: r('b', 9, { v: 'R' }) });
    expect(merged.a).toMatchObject({ v: 'L' });
    expect(merged.b).toMatchObject({ v: 'R' });
    expect(upload.map((x) => x.id)).toEqual(['a']);
  });
  it('local-only records are uploaded, remote-only are kept', () => {
    const { merged, upload } = mergeRecords({ a: r('a', 1) }, { b: r('b', 1) });
    expect(Object.keys(merged).sort()).toEqual(['a', 'b']);
    expect(upload.map((x) => x.id)).toEqual(['a']);
  });
  it('a newer deletion is not resurrected by an older edit', () => {
    const { merged } = mergeRecords({ a: r('a', 2, { deleted: false }) }, { a: r('a', 5, { deleted: true }) });
    expect(merged.a).toMatchObject({ deleted: true });
  });
  it('equal timestamps keep remote and upload nothing', () => {
    const { merged, upload } = mergeRecords({ a: r('a', 4, { v: 'L' }) }, { a: r('a', 4, { v: 'R' }) });
    expect(merged.a).toMatchObject({ v: 'R' });
    expect(upload).toEqual([]);
  });
});
```

- [ ] Steps 2–4: FAIL → implement → PASS. Commit.

### Task 5: Dashboard stats

**Files:** Create `src/lib/stats.ts`, `tests/stats.test.ts`

**Interfaces — Produces:**
- `dayTasks(tasks: Task[], key): Instance[]`
- `dayTaskStats(tasks, key): { done: number; total: number }`
- `overdue(tasks, today): Task[]` (one-off, undone, date < today)
- `dayFocus(sessions: Session[], key): { minutes: number; count: number }`
- `isActiveDay(tasks, sessions, key): boolean`
- `streak(tasks, sessions, today): number`
- `nextUp(tasks, now: Date): Instance | null` (timed, undone, starts ≥ now−duration, within 7 days)
- `lastDays(n, today): string[]` (oldest first)

- [ ] Step 1: Tests:

```ts
import { describe, it, expect } from 'vitest';
import { dayTaskStats, dayFocus, streak, nextUp, overdue } from '../src/lib/stats';
import { newTask, newSession } from '../src/lib/model';

const at = (k: string, hm = '12:00') => new Date(`${k}T${hm}:00`).getTime();

describe('stats', () => {
  it('counts tasks of the day including repeating occurrences', () => {
    const tasks = [
      newTask({ date: '2026-10-05', done: true, doneAt: at('2026-10-05') }),
      newTask({ date: '2026-10-05' }),
      newTask({ date: '2026-10-01', repeat: { freq: 'day', interval: 1, until: null }, doneDates: ['2026-10-05'] }),
      newTask({ date: '2026-10-06' }),
    ];
    expect(dayTaskStats(tasks, '2026-10-05')).toEqual({ done: 2, total: 3 });
  });
  it('focus minutes per day', () => {
    const s = [newSession({ start: at('2026-10-05'), minutes: 25 }), newSession({ start: at('2026-10-05', '15:00'), minutes: 50 }), newSession({ start: at('2026-10-04'), minutes: 25 })];
    expect(dayFocus(s, '2026-10-05')).toEqual({ minutes: 75, count: 2 });
  });
  it('streak counts consecutive active days and tolerates an empty today', () => {
    const tasks = [newTask({ date: '2026-10-03', done: true, doneAt: at('2026-10-03') })];
    const sessions = [newSession({ start: at('2026-10-04'), minutes: 25 })];
    expect(streak(tasks, sessions, '2026-10-05')).toBe(2);
    expect(streak(tasks, sessions, '2026-10-06')).toBe(0);
  });
  it('nextUp picks the nearest timed undone task', () => {
    const now = new Date('2026-10-05T10:00:00');
    const a = newTask({ title: 'a', date: '2026-10-05', start: '15:00' });
    const b = newTask({ title: 'b', date: '2026-10-05', start: '11:00' });
    const c = newTask({ title: 'c', date: '2026-10-05', start: '09:00' });
    expect(nextUp([a, b, c], now)?.task.title).toBe('b');
  });
  it('overdue only lists past undone one-off tasks', () => {
    const tasks = [newTask({ date: '2026-10-01' }), newTask({ date: '2026-10-01', done: true }), newTask({ date: '2026-10-05' })];
    expect(overdue(tasks, '2026-10-05').length).toBe(1);
  });
});
```

- [ ] Steps 2–4: FAIL → implement → PASS. Commit.

### Task 6: Calendar overlap layout

**Files:** Create `src/lib/layout.ts`, `tests/layout.test.ts`

**Interfaces — Produces:** `layoutDay(items: { id: string; start: number; end: number }[]): Record<string, { col: number; cols: number }>`

- [ ] Step 1: Tests:

```ts
import { describe, it, expect } from 'vitest';
import { layoutDay } from '../src/lib/layout';

describe('layoutDay', () => {
  it('non-overlapping items use full width', () => {
    expect(layoutDay([{ id: 'a', start: 60, end: 120 }, { id: 'b', start: 120, end: 180 }])).toEqual({ a: { col: 0, cols: 1 }, b: { col: 0, cols: 1 } });
  });
  it('overlapping items split into columns', () => {
    const r = layoutDay([{ id: 'a', start: 60, end: 180 }, { id: 'b', start: 90, end: 150 }, { id: 'c', start: 160, end: 200 }]);
    expect(r.a).toEqual({ col: 0, cols: 2 });
    expect(r.b).toEqual({ col: 1, cols: 2 });
    expect(r.c).toEqual({ col: 1, cols: 2 });
  });
});
```

- [ ] Steps 2–4: FAIL → implement (sort by start, cluster while overlapping, greedy column reuse) → PASS. Commit.

### Task 7: i18n, alerts, store, router

**Files:** Create `src/lib/i18n.ts`, `src/lib/alerts.ts`, `src/lib/store.svelte.ts`, `src/lib/router.svelte.ts`

**Interfaces — Produces:**
- `i18n.ts`: `DICT.ru / DICT.en`, `tr(lang, key, ...args)`; `plural(n, one, few, many)`; `fmtDay(lang, key, opts)`.
- `store.svelte.ts`: `export const store` with `data: Data`, `device: Device`, `now: Date` (ticked every second); getters `t(key, ...args)`, `lang`, `weekStart`; actions `saveTask(task)`, `deleteTask(id)`, `toggleDone(task, date)`, `moveTask(task, date, start, scope)`, `saveList`, `deleteList`, `saveCounter`, `deleteCounter`, `addSession`, `updateSettings(patch)`, `setDevice(patch)`, `toast(text, action?)`, `applyRemote(collection, records)`; persistence debounced 150 ms to `okto-v3` (`{data, device}`); `onChange(cb)` hook used by sync.
- `router.svelte.ts`: `route` state (`'home'|'tasks'|'calendar'|'focus'`), `go(r)`.

- [ ] Step 1: Implement; type-check with `npx svelte-check`. Commit.

### Task 8: App shell, navigation, settings, toast

**Files:** `src/App.svelte`, `src/components/{Nav,Sheet,Toast,Icon,Settings}.svelte`

- [ ] Step 1: Shell: mobile header (brand, lang, settings) + bottom tab bar + FAB; desktop sidebar ≥ 900px. Theme/mode applied to `<html>`; Focus+pomodoro mode sets `data-mode='pomodoro'`.
- [ ] Step 2: Settings sheet ports Okto 1.0 settings + Account group (sync status, sign-in/out) + Lists management link.
- [ ] Step 3: Verify in browser at 375px and 1280px; all 7 themes. Commit.

### Task 9: Focus screen (port)

**Files:** `src/screens/Focus.svelte`

- [ ] Port counter + Pomodoro UI and behavior from Okto 1.0 `app.js` (tap zone, long press reset, undo, step, lock, stopwatch, wake lock, Pomodoro presets/phases/auto-start, keyboard Space/Enter/Z, fit display). Counter writes `daily[today]`. Completed work phase → `addSession({ minutes, taskId: device.focusTask })` and task `focusMinutes += minutes`. Linked task pill above timer with ✕.
- [ ] Verify in browser: count, reset+undo, Pomodoro skip ends phase, session recorded. Commit.

### Task 10: Tasks screen and editor

**Files:** `src/screens/Tasks.svelte`, `src/components/{TaskRow,TaskEditor,ListEditor}.svelte`

- [ ] Filters Today (with overdue group) / Upcoming (14 days grouped) / All / No date / Done, list capsules + «+ Список».
- [ ] TaskRow: priority-colored checkbox, title, time, meta line, swipe-left actions on touch, undo toast.
- [ ] TaskEditor sheet: title, note, date, time+duration, repeat, reminder, list, priority, subtasks, delete/save, ▶ focus. Scope prompt for repeating edits.
- [ ] Verify create/edit/complete/undo/delete; repeating complete marks only that day. Commit.

### Task 11: Calendar

**Files:** `src/screens/Calendar.svelte`, `src/components/{MonthGrid,TimeGrid,MiniMonth}.svelte`

- [ ] Header, seg Day/Week/Month, today/prev/next; mobile defaults Month, desktop Week; mobile week = 3 days.
- [ ] TimeGrid: hours, all-day row, blocks via `layoutDay`, now line, click empty → new task at that 15-min slot, drag to move, bottom-edge drag to resize (15-min snap), touch drag after long press; repeating move → scope prompt.
- [ ] MonthGrid: dots (mobile) / lines with «ещё N» (desktop); selecting a day shows the day list below (mobile).
- [ ] Desktop sidebar: MiniMonth + list visibility checkboxes (`settings.hiddenLists`).
- [ ] Verify new task appears in calendar immediately; drag/resize persist. Commit.

### Task 12: Home dashboard

**Files:** `src/screens/Home.svelte`, `src/components/StatSheet.svelte`

- [ ] Greeting + date + «Изменить»; blocks tasks/focus/streak/next/counter from `settings.dashboard`; edit mode with wiggle, remove, drag reorder, add sheet; tap → detail sheet with 7-day bars + 30-day total, or navigation.
- [ ] Verify add/remove/reorder persists. Commit.

### Task 13: Firebase sync + reminders

**Files:** `src/lib/sync.ts`, `.env.example`, `firestore.rules`; modify `App.svelte`

- [ ] `sync.ts`: `syncEnabled` (config present), `syncState` (`'off'|'signed-out'|'syncing'|'synced'|'offline'|'error'`), `signIn()`, `signOut()`, `start()`. Dynamic import of firebase; `initializeFirestore` with `persistentLocalCache`; on sign-in: get all docs per collection → `mergeRecords` → apply merged locally, batch upload `upload`; then `onSnapshot` per collection → `store.applyRemote`; `store.onChange` → `setDoc`.
- [ ] `firestore.rules`: `match /users/{uid}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == uid; }`.
- [ ] Reminders: every 30 s, today's timed instances with `reminder != null`; fire once when `now ≥ start − reminder` and `now < start + duration`; fired keys in `localStorage['okto-fired']`.
- [ ] Verify app runs with no env; with env, sign-in button appears. Commit.

### Task 14: README, manifest, service worker, deploy

- [ ] README rewritten for Okto 2.0 incl. Firebase setup (create project, enable Google sign-in, Firestore, paste config into GitHub secrets / `.env.local`, add authorized domain `sailxx.github.io`, publish rules).
- [ ] Manifest name/description updated. Full `npm test && npm run build`. Commit.
