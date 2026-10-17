import { describe, it, expect } from 'vitest';
import { liveView, pomoBar } from '../src/lib/live';
import { defaultDevice, POMO } from '../src/lib/model';
import { DICT } from '../src/lib/i18n';

const t = DICT.ru;
const now = 1_000_000_000;
const dev = (patch: object = {}) => ({ ...defaultDevice(), ...patch });

describe('live notification', () => {
  it('nothing going on — no notification', () => {
    expect(liveView(dev(), POMO.classic, null, now, t)).toBeNull();
  });
  it('running Pomodoro: time left, next phase, end time and buttons', () => {
    const v = liveView(dev({ focusMode: 'pomodoro', pomo: { phase: 'work', round: 1, remaining: null, endsAt: now + 120_000 } }), POMO.classic, null, now, t)!;
    expect(v.title).toBe('Фокус · осталось 2 мин');
    expect(v.body.split('\n')[0]).toBe('Дальше: перерыв 5 мин');
    expect(v.timestamp).toBe(now + 120_000);
    expect(v.actions.map((a) => a.action)).toEqual(['pomodoro:pause', 'pomodoro:skip']);
  });
  it('paused timer offers to resume and shows what is left', () => {
    const v = liveView(dev({ focusMode: 'timer', timer: { duration: 600_000, endsAt: null, remaining: 90_000 } }), POMO.classic, null, now, t)!;
    expect(v.title).toBe('Таймер · на паузе');
    expect(v.body.startsWith('01:30')).toBe(true);
    expect(v.actions[0].action).toBe('timer:resume');
  });
  it('a running timer shows from another Focus mode', () => {
    const v = liveView(dev({ focusMode: 'stopwatch', timer: { duration: 60_000, endsAt: now + 30_000, remaining: null } }), POMO.classic, null, now, t)!;
    expect(v.kind).toBe('timer');
  });
  it('counter only when given', () => {
    const d = dev({ focusMode: 'counter' });
    expect(liveView(d, POMO.classic, null, now, t)).toBeNull();
    const v = liveView(d, POMO.classic, { name: '', count: 12, target: 33, step: 1 }, now, t)!;
    expect(v.title).toBe('Счётчик · 12');
    expect(v.actions.map((a) => a.title)).toEqual(['+1', '−1']);
  });
  it('Pomodoro bar: one segment per phase, passed ones full', () => {
    const bar = pomoBar(POMO.classic, 'short', 1, 0);
    const parts = bar.split(' ');
    expect(parts).toHaveLength(8);
    expect(parts[0]).toMatch(/^━+$/);
    expect(parts[2]).toMatch(/^─+$/);
  });
});
