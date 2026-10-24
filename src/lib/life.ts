import { addDays } from './date';
import type { Habit, Money } from './model';

/** Consecutive days a habit was done, ending today (or yesterday while today is still open). */
export function habitStreak(h: Pick<Habit, 'doneDates'>, today: string): number {
  const done = new Set(h.doneDates);
  let day = done.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (done.has(day)) { n++; day = addDays(day, -1); }
  return n;
}

export const monthOf = (key: string) => key.slice(0, 7);

/** Spent and earned in the month of `key`. */
export function monthTotals(list: Pick<Money, 'kind' | 'amount' | 'date'>[], key: string) {
  let spent = 0, earned = 0;
  for (const m of list) {
    if (monthOf(m.date) !== monthOf(key)) continue;
    if (m.kind === 'expense') spent += m.amount; else earned += m.amount;
  }
  return { spent: Math.round(spent * 100) / 100, earned: Math.round(earned * 100) / 100 };
}

/** Month expenses per category, largest first. */
export function byCategory(list: Pick<Money, 'kind' | 'amount' | 'date' | 'category'>[], key: string): [string, number][] {
  const acc = new Map<string, number>();
  for (const m of list) if (m.kind === 'expense' && monthOf(m.date) === monthOf(key)) acc.set(m.category, (acc.get(m.category) ?? 0) + m.amount);
  return [...acc].sort((a, b) => b[1] - a[1]);
}

/** Share of a goal reached, 0..1. */
export const ratio = (value: number, goal: number) => (goal > 0 ? Math.max(0, Math.min(1, value / goal)) : 0);

/** 12345.6 → "12 345,6" in the interface language. */
export const fmtMoney = (n: number, lang: string) => new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 2 }).format(n);
