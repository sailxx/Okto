import { describe, expect, it } from 'vitest';
import { byCategory, dayScore, habitStreak, habitsOn, monthTotals, ratio } from '../src/lib/life';
import { newHabit, newHealthDay, newTask, newMoney, normData, normSettings } from '../src/lib/model';

describe('habitStreak', () => {
  const daily = (doneDates: string[]) => newTask({ kind: 'habit', date: '2026-10-01', repeat: { freq: 'day', interval: 1, until: null, days: [] }, doneDates });
  it('counts back from today', () => expect(habitStreak(daily(['2026-10-22', '2026-10-23', '2026-10-24']), '2026-10-24')).toBe(3));
  it('keeps the streak while today is still open', () => expect(habitStreak(daily(['2026-10-22', '2026-10-23']), '2026-10-24')).toBe(2));
  it('breaks after a missed day', () => expect(habitStreak(daily(['2026-10-21', '2026-10-22']), '2026-10-24')).toBe(0));
  it('skips days the habit is not scheduled on', () => {
    // 2026-10-26 is a Monday: a Mon/Wed/Fri habit done on Mon and Wed is a streak of 2 on Thursday.
    const h = newTask({ kind: 'habit', date: '2026-10-01', repeat: { freq: 'week', interval: 1, until: null, days: [1, 3, 5] }, doneDates: ['2026-10-26', '2026-10-28'] });
    expect(habitStreak(h, '2026-10-29')).toBe(2);
  });
});

describe('habitsOn', () => {
  it('lists only habits scheduled that day', () => {
    const daily = newTask({ kind: 'habit', date: '2026-10-01', repeat: { freq: 'day', interval: 1, until: null, days: [] }, doneDates: ['2026-10-29'] });
    const mon = newTask({ kind: 'habit', date: '2026-10-01', repeat: { freq: 'week', interval: 1, until: null, days: [1] } });
    expect(habitsOn([daily, mon], '2026-10-29').map((x) => x.done)).toEqual([true]);
    expect(habitsOn([daily, mon], '2026-10-26')).toHaveLength(2);
  });
});

describe('money', () => {
  const list = [
    { kind: 'expense' as const, amount: 100, date: '2026-10-02', category: 'Еда' },
    { kind: 'expense' as const, amount: 50.5, date: '2026-10-20', category: 'Еда' },
    { kind: 'expense' as const, amount: 30, date: '2026-10-21', category: 'Такси' },
    { kind: 'income' as const, amount: 1000, date: '2026-10-05', category: '' },
    { kind: 'expense' as const, amount: 999, date: '2026-09-30', category: 'Еда' },
  ];
  it('sums one month', () => expect(monthTotals(list, '2026-10-24')).toEqual({ spent: 180.5, earned: 1000 }));
  it('groups by category', () => expect(byCategory(list, '2026-10-24')).toEqual([['Еда', 150.5], ['Такси', 30]]));
  it('ratio is clamped', () => { expect(ratio(5, 0)).toBe(0); expect(ratio(12, 8)).toBe(1); });
});

describe('normalizers', () => {
  it('drops bad money', () => expect(newMoney({ amount: -5, kind: 'x', date: 'nope' }).amount).toBe(0));
  it('clamps health values', () => expect(newHealthDay({ id: '2026-10-24', water: 500, sleep: 99 })).toMatchObject({ water: 0, sleep: 0 }));
  it('keeps only date keys in a habit', () => expect(newHabit({ doneDates: ['2026-10-24', 'x'] }).doneDates).toEqual(['2026-10-24']));
  it('old data gets the new collections', () => {
    const d = normData({}, 'ru');
    expect(d.habits).toEqual({}); expect(d.health).toEqual({}); expect(d.money).toEqual({});
  });
  it('keeps the new cards in the dashboard', () => {
    expect(normSettings({ dashboard: [{ type: 'score' }, { type: 'finance' }, { type: 'habits' }, { type: 'health' }] }, 'ru').dashboard.map((b) => b.type)).toEqual(['score', 'finance', 'habits', 'health']);
  });
});

describe('dayScore', () => {
  const none = { tasksDone: 0, tasksTotal: 0, focusMin: 0, habitsDone: 0, habitsTotal: 0, water: 0, waterGoal: 8 };
  it('is 0 on an empty day', () => expect(dayScore(none)).toBe(0));
  it('averages what applies', () => expect(dayScore({ ...none, tasksDone: 2, tasksTotal: 4, focusMin: 60 })).toBe(75));
  it('is 100 when everything is done', () => expect(dayScore({ tasksDone: 3, tasksTotal: 3, focusMin: 90, habitsDone: 2, habitsTotal: 2, water: 8, waterGoal: 8 })).toBe(100));
});
