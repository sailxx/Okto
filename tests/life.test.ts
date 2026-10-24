import { describe, expect, it } from 'vitest';
import { byCategory, habitStreak, monthTotals, ratio } from '../src/lib/life';
import { newHabit, newHealthDay, newMoney, normData, normSettings } from '../src/lib/model';

describe('habitStreak', () => {
  it('counts back from today', () => expect(habitStreak({ doneDates: ['2026-10-22', '2026-10-23', '2026-10-24'] }, '2026-10-24')).toBe(3));
  it('keeps the streak while today is still open', () => expect(habitStreak({ doneDates: ['2026-10-22', '2026-10-23'] }, '2026-10-24')).toBe(2));
  it('breaks after a missed day', () => expect(habitStreak({ doneDates: ['2026-10-21', '2026-10-22'] }, '2026-10-24')).toBe(0));
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
    expect(normSettings({ dashboard: [{ type: 'finance' }, { type: 'habits' }, { type: 'health' }] }, 'ru').dashboard.map((b) => b.type)).toEqual(['finance', 'habits', 'health']);
  });
});
