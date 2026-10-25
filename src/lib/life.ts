import { addDays } from './date';
import type { Money, Task } from './model';
import { isDoneOn, occurrences } from './recurrence';

/** Scheduled occurrences in a row that were done, ending today (while today is still open it does not break the run). */
export function habitStreak(h: Task, today: string): number {
  const days = occurrences(h, addDays(today, -400), today).reverse();
  let n = 0;
  for (const d of days) {
    if (isDoneOn(h, d)) n++;
    else if (d !== today) break;
  }
  return n;
}

/** Habits scheduled on `day`, with whether each is done. */
export function habitsOn(habits: Task[], day: string): { habit: Task; done: boolean }[] {
  return habits.filter((h) => occurrences(h, day, day).length > 0).map((habit) => ({ habit, done: isDoneOn(habit, day) }));
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

export interface DayInput { tasksDone: number; tasksTotal: number; focusMin: number; habitsDone: number; habitsTotal: number; water: number; waterGoal: number }
/** Day score 0..100: the mean of what applies today — tasks, an hour of focus, habits, water. */
export function dayScore(d: DayInput): number {
  const parts = [ratio(d.focusMin, 60)];
  if (d.tasksTotal > 0) parts.push(ratio(d.tasksDone, d.tasksTotal));
  if (d.habitsTotal > 0) parts.push(ratio(d.habitsDone, d.habitsTotal));
  if (d.water > 0) parts.push(ratio(d.water, d.waterGoal));
  return Math.round((parts.reduce((a, n) => a + n, 0) / parts.length) * 100);
}
