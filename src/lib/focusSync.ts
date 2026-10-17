// Pomodoro, timer and stopwatch shared through the account (users/{uid}/live/focus),
// so the Android widget and every open Okto show and drive the same clocks.
import type { Device, PomoCfg } from './model';

export interface LiveFocus {
  pomo: Device['pomo'];
  timer: Device['timer'];
  stopwatch: { elapsed: number; startedAt: number | null };
  /** Minutes of the current Pomodoro preset: the widget has no access to settings logic. */
  cfg: PomoCfg;
  updatedAt: number;
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? Math.round(v) : null;
const at = (v: unknown) => (v == null ? null : num(v, 0, Number.MAX_SAFE_INTEGER));

export function toLive(d: Device, cfg: PomoCfg): LiveFocus {
  return {
    pomo: { ...d.pomo },
    timer: { ...d.timer },
    stopwatch: { elapsed: d.stopwatch.elapsed, startedAt: d.stopwatch.startedAt },
    cfg: { ...cfg },
    updatedAt: d.liveAt,
  };
}

/** The part of the device a remote record changes; null when the record is broken or not newer. */
export function fromLive(d: Device, raw: unknown): Partial<Device> | null {
  if (!isObj(raw) || !isObj(raw.pomo) || !isObj(raw.timer) || !isObj(raw.stopwatch)) return null;
  const updatedAt = num(raw.updatedAt, 0, Number.MAX_SAFE_INTEGER);
  if (updatedAt === null || updatedAt <= d.liveAt) return null;
  const { pomo: p, timer: t, stopwatch: s } = raw;
  if (!['work', 'short', 'long'].includes(p.phase)) return null;
  const elapsed = num(s.elapsed, 0, Number.MAX_SAFE_INTEGER) ?? 0;
  const startedAt = at(s.startedAt);
  // Laps stay on the device; a stopwatch reset elsewhere clears them too.
  const laps = elapsed === 0 && startedAt === null ? [] : d.stopwatch.laps.filter((l) => l <= elapsed || startedAt !== null);
  return {
    pomo: { phase: p.phase, round: num(p.round, 1, 12) ?? 1, remaining: at(p.remaining), endsAt: at(p.endsAt) },
    timer: { duration: num(t.duration, 1000, 24 * 3600000) ?? d.timer.duration, remaining: at(t.remaining), endsAt: at(t.endsAt) },
    stopwatch: { elapsed, startedAt, laps },
    liveAt: updatedAt,
  };
}

/** One session per finished focus phase, whoever notices the end first: the id comes from the phase itself. */
export const pomoSessionId = (endsAt: number) => `pomo-${endsAt}`;
