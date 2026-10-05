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
