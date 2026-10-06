import { describe, expect, it } from 'vitest';
import { defaultDevice, normDevice } from '../src/lib/model';

describe('normDevice: stopwatch and timer', () => {
  it('accepts the new focus modes and falls back to counter', () => {
    expect(normDevice({ focusMode: 'stopwatch' }).focusMode).toBe('stopwatch');
    expect(normDevice({ focusMode: 'timer' }).focusMode).toBe('timer');
    expect(normDevice({ focusMode: 'nope' }).focusMode).toBe('counter');
  });
  it('keeps valid laps and drops junk', () => {
    expect(normDevice({ stopwatch: { elapsed: 5000, laps: [1000, -1, 'x', 3000] } }).stopwatch.laps).toEqual([1000, 3000]);
  });
  it('defaults the timer to 5 minutes and rejects silly durations', () => {
    expect(defaultDevice().timer).toEqual({ duration: 300000, endsAt: null, remaining: null });
    expect(normDevice({ timer: { duration: 10 } }).timer.duration).toBe(300000);
    expect(normDevice({ timer: { duration: 90000, remaining: 4000 } }).timer).toEqual({ duration: 90000, endsAt: null, remaining: 4000 });
  });
  it('reads old saves without laps or timer', () => {
    const d = normDevice({ stopwatch: { elapsed: 1200, startedAt: null } });
    expect(d.stopwatch.laps).toEqual([]);
    expect(d.timer.duration).toBe(300000);
  });
});
