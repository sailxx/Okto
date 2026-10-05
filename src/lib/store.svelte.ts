import { addDays, toKey, toMin, fromKey } from './date';
import { DICT, weekStartOf, type Key } from './i18n';
import { migrateLegacy } from './migrate';
import {
  defaultData, defaultDevice, defaultLists, live, newCounter, newList, newSession, newTask, normData, normDevice, normSettings, POMO,
  type Collection, type Counter, type Data, type Device, type Lang, type List, type Settings, type Task,
} from './model';
import { isDoneOn, occursOn } from './recurrence';
import { buzz, chime, systemNotify } from './alerts';

const KEY = 'okto-v3';
const NORMALIZE = { tasks: newTask, lists: newList, sessions: newSession, counters: newCounter };
const browserLang: Lang = (navigator.language || 'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en';

export type Scope = 'one' | 'future' | 'all';
type Listener = (coll: Collection, rec: { id: string }) => void;

export interface Editor { task: Task; occurrence: string | null; isNew: boolean }
export interface Toast { text: string; action?: () => void; label?: string; id: number }

function readStorage(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function loadInitial(): { data: Data; device: Device; storageOk: boolean } {
  let storageOk = true;
  try { localStorage.setItem('okto-probe', '1'); localStorage.removeItem('okto-probe'); } catch { storageOk = false; }
  const saved = readStorage(KEY) as { data?: unknown; device?: unknown } | null;
  if (saved && typeof saved === 'object') {
    return { data: normData(saved.data, browserLang), device: normDevice(saved.device), storageOk };
  }
  const migrated = migrateLegacy(readStorage('okto-v2'), readStorage('okto-counter-v1'), browserLang);
  if (migrated) return { ...migrated, storageOk };
  return { data: defaultData(browserLang), device: defaultDevice(), storageOk };
}

class Store {
  data = $state<Data>(defaultData(browserLang));
  device = $state<Device>(defaultDevice());
  now = $state(new Date());
  toastMsg = $state<Toast | null>(null);
  editor = $state<Editor | null>(null);
  storageOk = true;
  private listeners: Listener[] = [];
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const init = loadInitial();
    this.data = init.data;
    this.device = init.device;
    this.storageOk = init.storageOk;
    const counters = this.counters;
    if (!this.device.activeCounter || !counters.some((c) => c.id === this.device.activeCounter)) this.device.activeCounter = counters[0]?.id ?? null;
    window.addEventListener('pagehide', () => this.flush());
  }

  /* ---------- derived ---------- */
  lang = $derived(this.data.settings.lang);
  today = $derived(toKey(this.now));
  weekStart = $derived(weekStartOf(this.data.settings.lang));
  tasks = $derived(live(this.data.tasks));
  // Untouched default lists follow the interface language.
  lists = $derived(live(this.data.lists).sort((a, b) => a.order - b.order).map((l) => {
    const def = l.updatedAt === 0 ? defaultLists(this.data.settings.lang).find((d) => d.id === l.id) : undefined;
    return def ? { ...l, name: def.name } : l;
  }));
  sessions = $derived(live(this.data.sessions));
  counters = $derived(live(this.data.counters).sort((a, b) => a.order - b.order));

  t<K extends Key>(key: K) { return DICT[this.data.settings.lang][key]; }

  listOf(task: Task): List | undefined { return this.lists.find((l) => l.id === task.listId) ?? this.lists[0]; }
  colorOf(task: Task) { return this.listOf(task)?.color ?? '#0090ff'; }

  /* ---------- persistence ---------- */
  onChange(fn: Listener) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter((l) => l !== fn); }; }

  private schedule() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flush(), 150);
  }

  flush() {
    clearTimeout(this.saveTimer);
    if (!this.storageOk) return;
    try { localStorage.setItem(KEY, JSON.stringify({ v: 3, data: $state.snapshot(this.data), device: $state.snapshot(this.device) })); } catch { /* quota */ }
  }

  private commit<C extends Exclude<Collection, 'settings'>>(coll: C, rec: Data[C][string]) {
    rec.updatedAt = Math.max(Date.now(), rec.updatedAt + 1);
    (this.data[coll] as Record<string, typeof rec>)[rec.id] = rec;
    this.schedule();
    const snap = $state.snapshot(rec) as { id: string };
    this.listeners.forEach((l) => l(coll, snap));
  }

  /** Apply records that arrived from the cloud; newer wins, nothing is echoed back. */
  applyRemote(coll: Collection, records: unknown[]) {
    if (coll === 'settings') {
      const incoming = normSettings(records[0], this.data.settings.lang);
      if (incoming.updatedAt > this.data.settings.updatedAt) this.data.settings = incoming;
    } else {
      const make = NORMALIZE[coll] as (r: unknown) => { id: string; updatedAt: number };
      const target = this.data[coll] as Record<string, { updatedAt: number }>;
      for (const raw of records) {
        const rec = make(raw);
        if (!target[rec.id] || rec.updatedAt > target[rec.id].updatedAt) target[rec.id] = rec;
      }
      this.ensureBasics();
    }
    this.schedule();
  }

  /** Remove never-edited local records that the cloud does not know (see initialMerge). */
  dropLocal(coll: Exclude<Collection, 'settings'>, ids: string[]) {
    const target = this.data[coll] as Record<string, unknown>;
    for (const id of ids) delete target[id];
    this.ensureBasics();
    this.schedule();
  }

  /** The app always needs one list and one counter to work with. */
  private ensureBasics() {
    if (!live(this.data.lists).length) for (const l of defaultLists(this.data.settings.lang)) this.data.lists[l.id] = { ...l, deleted: false };
    if (!live(this.data.counters).length) { const c = newCounter({ updatedAt: 0 }); this.data.counters[c.id] = c; }
    if (!live(this.data.counters).some((c) => c.id === this.device.activeCounter)) this.device.activeCounter = this.counters[0]?.id ?? null;
  }

  /** Full snapshot for the initial cloud merge. */
  snapshot() { return $state.snapshot(this.data) as Data; }

  /* ---------- toast ---------- */
  toast(text: string, action?: () => void, label?: string) {
    this.toastMsg = { text, action, label, id: Date.now() };
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMsg = null; }, action ? 4000 : 2400);
  }

  /* ---------- settings / device ---------- */
  updateSettings(patch: Partial<Settings>) {
    Object.assign(this.data.settings, patch, { updatedAt: Math.max(Date.now(), this.data.settings.updatedAt + 1) });
    this.schedule();
    const snap = $state.snapshot(this.data.settings);
    this.listeners.forEach((l) => l('settings', snap));
  }
  setDevice(patch: Partial<Device>) { Object.assign(this.device, patch); this.schedule(); }

  /* ---------- tasks ---------- */
  openNewTask(p: Partial<Task> = {}) {
    const listId = this.device.taskFilter.startsWith('list:') ? this.device.taskFilter.slice(5) : this.lists[0]?.id ?? '';
    const date = p.date !== undefined ? p.date : this.device.taskFilter === 'nodate' ? null : this.today;
    this.editor = { task: newTask({ listId, ...p, date }), occurrence: null, isNew: true };
  }
  openTask(task: Task, occurrence: string | null = null) {
    this.editor = { task: $state.snapshot(task) as Task, occurrence: occurrence ?? task.date, isNew: false };
  }

  saveTask(task: Task) { this.commit('tasks', newTask($state.snapshot(task))); }

  /** Edit one occurrence / future occurrences / the whole series of a task. */
  editTask(original: Task, occurrence: string | null, patch: Partial<Task>, scope: Scope) {
    const cur = this.data.tasks[original.id];
    if (!cur) return;
    if (!cur.repeat || scope === 'all' || occurrence === null) {
      const next = { ...$state.snapshot(cur), ...patch } as Task;
      if (cur.repeat && occurrence && patch.date && patch.date !== occurrence) {
        // Shift the whole series by the same amount as the edited occurrence.
        next.date = addDays(cur.date!, Math.round((fromKey(patch.date).getTime() - fromKey(occurrence).getTime()) / 86400000));
      }
      this.commit('tasks', newTask(next));
      return;
    }
    if (scope === 'one') {
      const copy = newTask({
        ...$state.snapshot(cur), ...patch, id: undefined, repeat: null, doneDates: [], skipDates: [],
        date: patch.date !== undefined ? patch.date : occurrence,
        done: cur.doneDates.includes(occurrence), doneAt: cur.doneDates.includes(occurrence) ? Date.now() : null,
        createdAt: Date.now(),
      });
      this.commit('tasks', newTask({ ...$state.snapshot(cur), skipDates: [...cur.skipDates, occurrence] }));
      this.commit('tasks', copy);
      return;
    }
    // future
    if (occurrence === cur.date) { this.editTask(original, occurrence, patch, 'all'); return; }
    const tail = newTask({
      ...$state.snapshot(cur), ...patch, id: undefined,
      date: patch.date !== undefined ? patch.date : occurrence,
      doneDates: cur.doneDates.filter((d) => d >= occurrence), skipDates: cur.skipDates.filter((d) => d >= occurrence),
      createdAt: Date.now(),
    });
    this.commit('tasks', newTask({ ...$state.snapshot(cur), repeat: { ...cur.repeat, until: addDays(occurrence, -1) } }));
    this.commit('tasks', tail);
  }

  deleteTask(task: Task, occurrence: string | null = null, scope: Scope = 'all') {
    const cur = this.data.tasks[task.id];
    if (!cur) return;
    const before = $state.snapshot(cur) as Task;
    if (cur.repeat && occurrence && scope === 'one') {
      this.commit('tasks', newTask({ ...before, skipDates: [...cur.skipDates, occurrence] }));
    } else if (cur.repeat && occurrence && scope === 'future' && occurrence !== cur.date) {
      this.commit('tasks', newTask({ ...before, repeat: { ...cur.repeat, until: addDays(occurrence, -1) } }));
    } else {
      this.commit('tasks', newTask({ ...before, deleted: true }));
    }
    this.toast(this.t('taskDeleted'), () => this.commit('tasks', newTask({ ...before })), this.t('undoAction'));
  }

  toggleDone(task: Task, date: string | null) {
    const cur = this.data.tasks[task.id];
    if (!cur) return;
    const snap = $state.snapshot(cur) as Task;
    let nowDone: boolean;
    if (cur.repeat && date) {
      nowDone = !cur.doneDates.includes(date);
      snap.doneDates = nowDone ? [...cur.doneDates, date] : cur.doneDates.filter((d) => d !== date);
    } else {
      nowDone = !cur.done;
      snap.done = nowDone;
      snap.doneAt = nowDone ? Date.now() : null;
    }
    this.commit('tasks', newTask(snap));
    if (nowDone) {
      buzz(12);
      this.toast(this.t('taskDone'), () => this.toggleDone(task, date), this.t('undoAction'));
    }
  }

  toggleSubtask(task: Task, subId: string) {
    const cur = this.data.tasks[task.id];
    if (!cur) return;
    const snap = $state.snapshot(cur) as Task;
    snap.subtasks = snap.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
    this.commit('tasks', newTask(snap));
  }

  /* ---------- lists ---------- */
  saveList(list: Partial<List>) {
    const order = list.order ?? (this.lists.length ? Math.max(...this.lists.map((l) => l.order)) + 1 : 0);
    this.commit('lists', newList({ ...list, order }));
  }
  deleteList(id: string) {
    const l = this.data.lists[id];
    if (!l || this.lists.length <= 1) return;
    this.commit('lists', newList({ ...$state.snapshot(l), deleted: true }));
    const fallback = this.lists.find((x) => x.id !== id)!.id;
    for (const t of this.tasks.filter((x) => x.listId === id)) this.commit('tasks', newTask({ ...$state.snapshot(t), listId: fallback }));
    if (this.device.taskFilter === `list:${id}`) this.setDevice({ taskFilter: 'today' });
  }

  /* ---------- counters ---------- */
  activeCounter(): Counter { return this.counters.find((c) => c.id === this.device.activeCounter) ?? this.counters[0]; }
  saveCounter(c: Partial<Counter>) {
    const order = c.order ?? (this.counters.length ? Math.max(...this.counters.map((x) => x.order)) + 1 : 0);
    const rec = newCounter({ ...c, order });
    if (c.count !== undefined) rec.daily = { ...rec.daily, [this.today]: rec.count };
    this.commit('counters', rec);
    return rec;
  }
  deleteCounter(id: string) {
    const c = this.data.counters[id];
    if (!c || this.counters.length <= 1) return;
    this.commit('counters', newCounter({ ...$state.snapshot(c), deleted: true }));
    if (this.device.activeCounter === id) this.setDevice({ activeCounter: this.counters[0].id });
    this.updateSettings({ dashboard: this.data.settings.dashboard.filter((b) => b.counterId !== id) });
  }

  /* ---------- sessions ---------- */
  addSession(minutes: number, taskId: string | null) {
    this.commit('sessions', newSession({ start: Date.now() - minutes * 60000, minutes, taskId }));
    const t = taskId ? this.data.tasks[taskId] : null;
    if (t && !t.deleted) this.commit('tasks', newTask({ ...$state.snapshot(t), focusMinutes: t.focusMinutes + minutes }));
  }

  /* ---------- pomodoro engine (runs app-wide) ---------- */
  pomoCfg() { const p = this.data.settings.pomo; return p.preset === 'custom' ? p.custom : POMO[p.preset]; }
  phaseMs(phase = this.device.pomo.phase) { return this.pomoCfg()[phase] * 60000; }
  pomoRunning() { return Boolean(this.device.pomo.endsAt); }
  pomoLeft() { const p = this.device.pomo; return p.endsAt ? p.endsAt - this.now.getTime() : p.remaining ?? this.phaseMs(); }
  pomoStart() {
    if (this.pomoRunning()) return;
    this.setDevice({ pomo: { ...this.device.pomo, endsAt: Date.now() + this.pomoLeft(), remaining: null } });
  }
  pomoPause() {
    if (!this.pomoRunning()) return;
    this.setDevice({ pomo: { ...this.device.pomo, remaining: Math.max(0, this.device.pomo.endsAt! - Date.now()), endsAt: null } });
  }
  pomoResetPhase() { this.setDevice({ pomo: { ...this.device.pomo, endsAt: null, remaining: null } }); }
  pomoAdvance(natural: boolean) {
    const p = { ...this.device.pomo };
    const cfg = this.pomoCfg();
    const finished = p.phase;
    if (finished === 'work') {
      if (natural) this.addSession(cfg.work, this.device.focusTask && this.data.tasks[this.device.focusTask] ? this.device.focusTask : null);
      p.phase = p.round % cfg.every === 0 ? 'long' : 'short';
    } else {
      p.round = finished === 'long' ? 1 : p.round + 1;
      p.phase = 'work';
    }
    p.remaining = null;
    p.endsAt = natural && this.data.settings.pomo.autoStart ? Date.now() + this.phaseMs(p.phase) : null;
    this.setDevice({ pomo: p });
    if (natural) {
      if (finished === 'work') this.alert(this.t('workDoneTitle'), this.t('workDoneBody')(cfg[p.phase]));
      else this.alert(this.t('breakDoneTitle'), this.t('breakDoneBody'));
    }
  }
  pomoToday() { return this.sessions.filter((s) => toKey(new Date(s.start)) === this.today).length; }

  alert(title: string, body: string, tag = 'okto') {
    const s = this.data.settings;
    if (s.sound) chime();
    if (s.vibrate) buzz([60, 80, 60, 80, 120]);
    this.toast(`${title} · ${body}`);
    if (s.notify) systemNotify(title, body, tag);
  }

  /* ---------- ticker ---------- */
  private fired = new Set<string>(((readStorage('okto-fired') as string[] | null) ?? []).filter((k) => typeof k === 'string'));
  private lastReminderCheck = 0;

  tick() {
    this.now = new Date();
    if (this.pomoRunning() && Date.now() >= this.device.pomo.endsAt!) this.pomoAdvance(true);
    if (Date.now() - this.lastReminderCheck > 30000) { this.lastReminderCheck = Date.now(); this.checkReminders(); }
  }

  checkReminders() {
    const now = Date.now();
    const today = this.today;
    let changed = false;
    for (const t of this.tasks) {
      if (t.reminder === null || !t.start) continue;
      // An occurrence today, or tomorrow for reminders that fire a day before.
      for (const day of [today, addDays(today, 1)]) {
        if (!occursOn(t, day) || isDoneOn(t, day)) continue;
        const startMs = fromKey(day).getTime() + toMin(t.start) * 60000;
        const key = `${t.id}@${day}@${t.reminder}`;
        if (this.fired.has(key)) continue;
        if (now >= startMs - t.reminder * 60000 && now < startMs + t.duration * 60000) {
          this.fired.add(key);
          changed = true;
          this.alert(this.t('reminderTitle'), this.t('reminderBody')(t.title, t.start), key);
        }
      }
    }
    if (changed) {
      try { localStorage.setItem('okto-fired', JSON.stringify([...this.fired].slice(-300))); } catch { /* optional */ }
    }
  }
}

export const store = new Store();
