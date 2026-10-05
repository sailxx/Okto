import { isHm, isKey } from './date';

/* ================= Types ================= */
export type Lang = 'ru' | 'en';
export type Theme = 'system' | 'light' | 'dark' | 'paper' | 'mint' | 'midnight' | 'oled';
export type Freq = 'day' | 'weekday' | 'week' | 'month';
export type PomoPreset = 'classic' | 'short' | 'deep' | 'custom';
export type Phase = 'work' | 'short' | 'long';
export type BlockType = 'tasks' | 'focus' | 'streak' | 'next' | 'counter';
export type Collection = 'tasks' | 'lists' | 'sessions' | 'counters' | 'settings';

export interface Repeat { freq: Freq; interval: number; until: string | null }
export interface Subtask { id: string; title: string; done: boolean }

export interface Task {
  id: string;
  title: string;
  note: string;
  listId: string;
  priority: 0 | 1 | 2 | 3;
  date: string | null;
  start: string | null;
  duration: number;
  subtasks: Subtask[];
  repeat: Repeat | null;
  reminder: number | null;
  done: boolean;
  doneAt: number | null;
  doneDates: string[];
  skipDates: string[];
  focusMinutes: number;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export interface List { id: string; name: string; color: string; order: number; updatedAt: number; deleted: boolean }
export interface Session { id: string; start: number; minutes: number; taskId: string | null; updatedAt: number; deleted: boolean }
export interface Counter {
  id: string; name: string; target: number; step: number; count: number; color: string;
  history: number[]; daily: Record<string, number>; order: number; updatedAt: number; deleted: boolean;
}
export interface PomoCfg { work: number; short: number; long: number; every: number }
export interface Block { type: BlockType; counterId?: string }
export interface Settings {
  id: 'main';
  lang: Lang; theme: Theme; notify: boolean; sound: boolean; vibrate: boolean;
  /** Profile: shown on Home. Empty greeting = greet by time of day. */
  name: string; greeting: string; onboarded: boolean;
  pomo: { preset: PomoPreset; custom: PomoCfg; autoStart: boolean };
  dashboard: Block[];
  hiddenLists: string[];
  updatedAt: number;
}
export interface Data {
  tasks: Record<string, Task>;
  lists: Record<string, List>;
  sessions: Record<string, Session>;
  counters: Record<string, Counter>;
  settings: Settings;
}
/** Per-device state, never synced. */
export interface Device {
  focusMode: 'counter' | 'pomodoro';
  activeCounter: string | null;
  locked: boolean;
  stopwatch: { elapsed: number; startedAt: number | null };
  pomo: { phase: Phase; round: number; remaining: number | null; endsAt: number | null };
  focusTask: string | null;
  calView: 'day' | 'week' | 'month' | null;
  taskFilter: string;
}

/* ================= Constants ================= */
export const COLORS = ['#0090ff', '#30a46c', '#12a594', '#8e4ec6', '#e93d82', '#e5484d', '#f76b15', '#ffb224', '#6b6e76'];
export const THEMES: Record<Theme, [string, string]> = {
  system: ['#fafafa', '#0e0e10'],
  light: ['#fafafa', '#e4e5e8'],
  dark: ['#0e0e10', '#2a2b30'],
  paper: ['#f4efe6', '#2a251d'],
  mint: ['#edf5f0', '#13241a'],
  midnight: ['#0f1522', '#e8edf7'],
  oled: ['#000000', '#ffffff'],
};
export const POMO: Record<Exclude<PomoPreset, 'custom'>, PomoCfg> = {
  classic: { work: 25, short: 5, long: 15, every: 4 },
  short: { work: 15, short: 3, long: 10, every: 4 },
  deep: { work: 50, short: 10, long: 30, every: 2 },
};
export const STEPS = [1, 5, 10];
export const PRIORITY_COLORS = ['var(--ink)', '#0090ff', '#f76b15', '#e5484d'];
export const REMINDERS = [0, 5, 15, 30, 60, 1440];
export const DURATIONS = [15, 30, 45, 60, 90, 120, 180];
export const DEFAULT_DASHBOARD: Block[] = [{ type: 'tasks' }, { type: 'focus' }, { type: 'streak' }, { type: 'next' }];

/* ================= Validators ================= */
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number, def = '') => (typeof v === 'string' ? v.slice(0, max) : def);
const int = (v: unknown, min: number, max: number, def: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? Math.round(v) : def;
const ts = (v: unknown, def = 0) => int(v, 0, Number.MAX_SAFE_INTEGER, def);
const keys = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter(isKey))] : []);
const id = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 40) : uid());

/* ================= Factories / normalizers ================= */
export function newTask(p: Partial<Task> | Record<string, unknown> = {}): Task {
  const r = p as Record<string, any>;
  const now = Date.now();
  const repeat = isObj(r.repeat) && ['day', 'weekday', 'week', 'month'].includes(r.repeat.freq)
    ? { freq: r.repeat.freq as Freq, interval: int(r.repeat.interval, 1, 99, 1), until: isKey(r.repeat.until) ? r.repeat.until : null }
    : null;
  return {
    id: id(r.id),
    title: str(r.title, 200),
    note: str(r.note, 4000),
    listId: str(r.listId, 40),
    priority: int(r.priority, 0, 3, 0) as Task['priority'],
    date: r.date === null ? null : isKey(r.date) ? r.date : null,
    start: isHm(r.start) ? r.start : null,
    duration: int(r.duration, 5, 24 * 60, 30),
    subtasks: Array.isArray(r.subtasks)
      ? r.subtasks.filter(isObj).slice(0, 50).map((s) => ({ id: id(s.id), title: str(s.title, 200), done: s.done === true }))
      : [],
    repeat,
    reminder: r.reminder === null || r.reminder === undefined ? null : int(r.reminder, 0, 10080, 0),
    done: r.done === true,
    doneAt: r.doneAt == null ? null : ts(r.doneAt, now),
    doneDates: keys(r.doneDates),
    skipDates: keys(r.skipDates),
    focusMinutes: int(r.focusMinutes, 0, 1e7, 0),
    createdAt: ts(r.createdAt, now),
    updatedAt: ts(r.updatedAt, now),
    deleted: r.deleted === true,
  };
}

export function newList(p: Partial<List> | Record<string, unknown> = {}): List {
  const r = p as Record<string, any>;
  return {
    id: id(r.id), name: str(r.name, 40), color: COLORS.includes(r.color) ? r.color : COLORS[0],
    order: int(r.order, 0, 1e6, 0), updatedAt: ts(r.updatedAt, Date.now()), deleted: r.deleted === true,
  };
}

export function newSession(p: Partial<Session> | Record<string, unknown> = {}): Session {
  const r = p as Record<string, any>;
  return {
    id: id(r.id), start: ts(r.start, Date.now()), minutes: int(r.minutes, 0, 1440, 0),
    taskId: typeof r.taskId === 'string' ? r.taskId : null, updatedAt: ts(r.updatedAt, Date.now()), deleted: r.deleted === true,
  };
}

export function newCounter(p: Partial<Counter> | Record<string, unknown> = {}): Counter {
  const r = p as Record<string, any>;
  const daily: Record<string, number> = {};
  if (isObj(r.daily)) for (const [k, v] of Object.entries(r.daily)) if (isKey(k) && typeof v === 'number' && v >= 0) daily[k] = Math.round(v);
  return {
    id: id(r.id), name: str(r.name, 24), target: int(r.target, 1, 999999, 75), step: STEPS.includes(r.step) ? r.step : 1,
    count: int(r.count, 0, Number.MAX_SAFE_INTEGER, 0), color: COLORS.includes(r.color) ? r.color : COLORS[0],
    history: Array.isArray(r.history) ? r.history.filter((v: unknown) => typeof v === 'number' && v >= 0).slice(-50) : [],
    daily, order: int(r.order, 0, 1e6, 0), updatedAt: ts(r.updatedAt, Date.now()), deleted: r.deleted === true,
  };
}

const normPomoCfg = (c: any, def: PomoCfg): PomoCfg => ({
  work: int(c?.work, 1, 180, def.work), short: int(c?.short, 1, 60, def.short),
  long: int(c?.long, 1, 90, def.long), every: int(c?.every, 2, 12, def.every),
});

export function defaultSettings(lang: Lang): Settings {
  return {
    id: 'main', lang, theme: 'system', notify: false, sound: true, vibrate: true,
    name: '', greeting: '', onboarded: false,
    pomo: { preset: 'classic', custom: { ...POMO.classic }, autoStart: true },
    dashboard: DEFAULT_DASHBOARD.map((b) => ({ ...b })), hiddenLists: [], updatedAt: 0,
  };
}

export function normSettings(raw: unknown, lang: Lang): Settings {
  const d = defaultSettings(lang);
  if (!isObj(raw)) return d;
  const p = isObj(raw.pomo) ? raw.pomo : {};
  const dashboard = Array.isArray(raw.dashboard)
    ? raw.dashboard.filter((b: any) => isObj(b) && ['tasks', 'focus', 'streak', 'next', 'counter'].includes(b.type) && (b.type !== 'counter' || typeof b.counterId === 'string'))
      .map((b: any) => (b.type === 'counter' ? { type: 'counter' as const, counterId: b.counterId } : { type: b.type as BlockType }))
    : d.dashboard;
  return {
    id: 'main',
    lang: raw.lang === 'ru' || raw.lang === 'en' ? raw.lang : d.lang,
    theme: raw.theme in THEMES ? raw.theme : d.theme,
    notify: raw.notify === true, sound: raw.sound !== false, vibrate: raw.vibrate !== false,
    name: str(raw.name, 40).trim(), greeting: str(raw.greeting, 80).trim(), onboarded: raw.onboarded === true,
    pomo: {
      preset: ['classic', 'short', 'deep', 'custom'].includes(p.preset) ? p.preset : 'classic',
      custom: normPomoCfg(p.custom, POMO.classic),
      autoStart: p.autoStart !== false,
    },
    dashboard,
    hiddenLists: Array.isArray(raw.hiddenLists) ? raw.hiddenLists.filter((x: unknown) => typeof x === 'string') : [],
    updatedAt: ts(raw.updatedAt, 0),
  };
}

export function defaultLists(lang: Lang): List[] {
  return [
    newList({ id: 'personal', name: lang === 'ru' ? 'Личное' : 'Personal', color: '#0090ff', order: 0, updatedAt: 0 }),
    newList({ id: 'work', name: lang === 'ru' ? 'Работа' : 'Work', color: '#8e4ec6', order: 1, updatedAt: 0 }),
  ];
}

const byId = <T extends { id: string }>(arr: T[]) => Object.fromEntries(arr.map((x) => [x.id, x]));

function normMap<T extends { id: string }>(raw: unknown, make: (r: any) => T): Record<string, T> {
  if (!isObj(raw)) return {};
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(raw)) if (isObj(v)) { const r = make({ ...v, id: k }); out[r.id] = r; }
  return out;
}

export function defaultData(lang: Lang): Data {
  return {
    tasks: {}, lists: byId(defaultLists(lang)), sessions: {},
    counters: byId([newCounter({ updatedAt: 0 })]), settings: defaultSettings(lang),
  };
}

export function normData(raw: unknown, lang: Lang): Data {
  const r = isObj(raw) ? raw : {};
  const d: Data = {
    tasks: normMap(r.tasks, newTask),
    lists: normMap(r.lists, newList),
    sessions: normMap(r.sessions, newSession),
    counters: normMap(r.counters, newCounter),
    settings: normSettings(r.settings, lang),
  };
  if (!Object.values(d.lists).some((l) => !l.deleted)) Object.assign(d.lists, byId(defaultLists(d.settings.lang)));
  if (!Object.values(d.counters).some((c) => !c.deleted)) { const c = newCounter({ updatedAt: 0 }); d.counters[c.id] = c; }
  return d;
}

export function defaultDevice(): Device {
  return {
    focusMode: 'counter', activeCounter: null, locked: false,
    stopwatch: { elapsed: 0, startedAt: null },
    pomo: { phase: 'work', round: 1, remaining: null, endsAt: null },
    focusTask: null, calView: null, taskFilter: 'today',
  };
}

export function normDevice(raw: unknown): Device {
  const d = defaultDevice();
  if (!isObj(raw)) return d;
  const p = isObj(raw.pomo) ? raw.pomo : {};
  return {
    focusMode: raw.focusMode === 'pomodoro' ? 'pomodoro' : 'counter',
    activeCounter: typeof raw.activeCounter === 'string' ? raw.activeCounter : null,
    locked: raw.locked === true,
    stopwatch: { elapsed: ts(raw.stopwatch?.elapsed, 0), startedAt: raw.stopwatch?.startedAt ? ts(raw.stopwatch.startedAt) : null },
    pomo: {
      phase: ['work', 'short', 'long'].includes(p.phase) ? p.phase : 'work',
      round: int(p.round, 1, 12, 1),
      remaining: p.remaining == null ? null : ts(p.remaining),
      endsAt: p.endsAt == null ? null : ts(p.endsAt),
    },
    focusTask: typeof raw.focusTask === 'string' ? raw.focusTask : null,
    calView: ['day', 'week', 'month'].includes(raw.calView) ? raw.calView : null,
    taskFilter: typeof raw.taskFilter === 'string' ? raw.taskFilter : 'today',
  };
}

export const live = <T extends { deleted: boolean }>(m: Record<string, T>) => Object.values(m).filter((x) => !x.deleted);
