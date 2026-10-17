// The live notification of Focus (like a media player's): what is running, how much is left,
// what comes next and a progress line, with two buttons. Pure: liveNotify.ts posts it.
import type { DICT } from './i18n';
import type { Device, Phase, PomoCfg } from './model';

type T = (typeof DICT)['ru'];
export type LiveKind = 'pomodoro' | 'timer' | 'stopwatch' | 'counter';
/** `kind:verb`, so a button still means the same after Okto restarts. */
export type LiveAction = `${LiveKind}:${'pause' | 'resume' | 'skip' | 'add' | 'reset' | 'plus' | 'minus'}`;
export interface LiveView {
  kind: LiveKind;
  title: string;
  body: string;
  /** Android shows it in the header: "in 2 min" for an end, "12 min ago" for a start. */
  timestamp?: number;
  actions: { action: LiveAction; title: string }[];
  /** Stays the same while the user has nothing new to see: a dismissed notification waits for it to change. */
  sticky: string;
}
export interface LiveCounter { name: string; count: number; target: number; step: number }
type LiveDevice = Pick<Device, 'focusMode' | 'pomo' | 'timer' | 'stopwatch'>;

const WIDTH = 20;
const DONE = '━', TODO = '─';

export function mmss(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

const segment = (len: number, fill: number) => {
  const done = Math.round(len * Math.min(1, Math.max(0, fill)));
  return DONE.repeat(done) + TODO.repeat(len - done);
};

/** The whole Pomodoro cycle as segments sized by length: passed ones heavy, the current one filling up. */
export function pomoBar(cfg: PomoCfg, phase: Phase, round: number, left: number) {
  const phases: Phase[] = [];
  for (let i = 1; i <= cfg.every; i++) phases.push('work', i === cfg.every ? 'long' : 'short');
  const total = phases.reduce((sum, p) => sum + cfg[p], 0);
  const current = Math.min(phases.length - 1, 2 * (Math.max(1, round) - 1) + (phase === 'work' ? 0 : 1));
  return phases.map((p, i) => {
    const len = Math.max(1, Math.round((cfg[p] * WIDTH) / total));
    return segment(len, i < current ? 1 : i > current ? 0 : 1 - left / (cfg[p] * 60000));
  }).join(' ');
}

export const lineBar = (fill: number) => segment(WIDTH, fill);

const leftMin = (ms: number) => (ms < 60000 ? 0 : Math.round(ms / 60000));

/** The active Focus mode when it has something going on, otherwise anything still running. */
export function liveView(d: LiveDevice, cfg: PomoCfg, counter: LiveCounter | null, now: number, t: T): LiveView | null {
  const busy: Record<Exclude<LiveKind, 'counter'>, boolean> = {
    pomodoro: Boolean(d.pomo.endsAt) || d.pomo.remaining !== null,
    timer: Boolean(d.timer.endsAt) || d.timer.remaining !== null,
    stopwatch: Boolean(d.stopwatch.startedAt) || d.stopwatch.elapsed > 0,
  };
  const running = { pomodoro: Boolean(d.pomo.endsAt), timer: Boolean(d.timer.endsAt), stopwatch: Boolean(d.stopwatch.startedAt) };
  let kind: LiveKind | null = null;
  if (d.focusMode === 'counter') kind = counter ? 'counter' : null;
  else if (busy[d.focusMode]) kind = d.focusMode;
  kind ??= (['pomodoro', 'timer', 'stopwatch'] as const).find((k) => running[k]) ?? null;
  if (!kind) return null;

  const toggle = (k: LiveKind, on: boolean) => ({ action: `${k}:${on ? 'pause' : 'resume'}` as LiveAction, title: on ? t.pause : t.resume });

  if (kind === 'pomodoro') {
    const p = d.pomo, on = running.pomodoro;
    const phaseMs = cfg[p.phase] * 60000;
    const left = p.endsAt ? Math.max(0, p.endsAt - now) : p.remaining ?? phaseMs;
    const next: Phase = p.phase === 'work' ? (p.round % cfg.every === 0 ? 'long' : 'short') : 'work';
    const nextLine = t.next(t.phase[next], cfg[next]);
    return {
      kind,
      title: `${t.phase[p.phase]} · ${on ? t.liveLeft(leftMin(left)) : t.livePaused}`,
      body: `${on ? nextLine : `${mmss(left)} · ${nextLine}`}\n${pomoBar(cfg, p.phase, p.round, left)}`,
      timestamp: on ? p.endsAt! : undefined,
      actions: [toggle(kind, on), { action: 'pomodoro:skip', title: t.liveSkip }],
      sticky: `${kind}|${p.phase}|${p.round}|${on}`,
    };
  }
  if (kind === 'timer') {
    const tm = d.timer, on = running.timer;
    const left = tm.endsAt ? Math.max(0, tm.endsAt - now) : tm.remaining ?? tm.duration;
    const total = Math.max(tm.duration, left);
    const dur = tm.duration % 60000 ? mmss(tm.duration) : t.durMin(tm.duration / 60000);
    return {
      kind,
      title: `${t.modeTimer} · ${on ? t.liveLeft(leftMin(left)) : t.livePaused}`,
      body: `${on ? t.timerFor(dur) : `${mmss(left)} · ${t.timerFor(dur)}`}\n${lineBar(1 - left / total)}`,
      timestamp: on ? tm.endsAt! : undefined,
      actions: [toggle(kind, on), { action: 'timer:add', title: t.addMinute }],
      sticky: `${kind}|${on}`,
    };
  }
  if (kind === 'stopwatch') {
    const sw = d.stopwatch, on = running.stopwatch;
    const elapsed = sw.elapsed + (sw.startedAt ? Math.max(0, now - sw.startedAt) : 0);
    const laps = sw.laps.length ? ` · ${t.laps(sw.laps.length)}` : '';
    return {
      kind,
      title: on ? t.modeStopwatch : `${t.modeStopwatch} · ${t.livePaused}`,
      body: (on ? t.durMin(Math.floor(elapsed / 60000)) : mmss(elapsed)) + laps,
      timestamp: on ? sw.startedAt! - sw.elapsed : undefined,
      actions: [toggle(kind, on), { action: 'stopwatch:reset', title: t.liveReset }],
      sticky: `${kind}|${on}`,
    };
  }
  const c = counter!;
  return {
    kind,
    title: `${c.name || t.counter} · ${c.count}`,
    body: `${t.of(String(c.count), String(c.target))}\n${lineBar(c.target ? c.count / c.target : 0)}`,
    actions: [{ action: 'counter:plus', title: `+${c.step}` }, { action: 'counter:minus', title: `−${c.step}` }],
    sticky: kind,
  };
}
