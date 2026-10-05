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
