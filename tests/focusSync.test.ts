import { describe, it, expect } from 'vitest';
import { defaultDevice, normDevice, POMO } from '../src/lib/model';
import { fromLive, pomoSessionId, toLive } from '../src/lib/focusSync';

const device = () => ({ ...defaultDevice(), liveAt: 100, stopwatch: { elapsed: 5000, startedAt: null, laps: [1000, 3000] } });

describe('shared clocks (live/focus)', () => {
  it('round-trips the clocks', () => {
    const d = { ...device(), timer: { duration: 600000, endsAt: 9_000_000, remaining: null } };
    const live = { ...toLive(d, POMO.classic), updatedAt: 200 };
    const patch = fromLive(device(), live)!;
    expect(patch.timer).toEqual({ duration: 600000, endsAt: 9_000_000, remaining: null });
    expect(patch.liveAt).toBe(200);
    expect(live.cfg).toEqual(POMO.classic);
  });
  it('ignores records that are not newer', () => {
    expect(fromLive(device(), { ...toLive(device(), POMO.classic), updatedAt: 100 })).toBeNull();
    expect(fromLive(device(), { ...toLive(device(), POMO.classic), updatedAt: 50 })).toBeNull();
  });
  it('rejects broken records', () => {
    expect(fromLive(device(), null)).toBeNull();
    expect(fromLive(device(), { updatedAt: 500 })).toBeNull();
    expect(fromLive(device(), { ...toLive(device(), POMO.classic), pomo: { phase: 'nap', round: 1 }, updatedAt: 500 })).toBeNull();
  });
  it('keeps laps locally and clears them on a reset elsewhere', () => {
    const run = fromLive(device(), { ...toLive(device(), POMO.classic), stopwatch: { elapsed: 5000, startedAt: 7000 }, updatedAt: 300 })!;
    expect(run.stopwatch!.laps).toEqual([1000, 3000]);
    const reset = fromLive(device(), { ...toLive(device(), POMO.classic), stopwatch: { elapsed: 0, startedAt: null }, updatedAt: 300 })!;
    expect(reset.stopwatch!.laps).toEqual([]);
  });
  it('remembers liveAt across reloads', () => {
    expect(normDevice({ liveAt: 1234 }).liveAt).toBe(1234);
    expect(normDevice({}).liveAt).toBe(0);
  });
  it('gives one session id per finished phase', () => {
    expect(pomoSessionId(1700000000000)).toBe('pomo-1700000000000');
  });
});
