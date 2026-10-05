import { daysInMonth, diffDays, range, weekday } from './date';
import type { Task } from './model';

export interface Instance { task: Task; date: string }

export function occursOn(task: Task, key: string): boolean {
  if (task.deleted || !task.date || key < task.date) return false;
  const r = task.repeat;
  if (!r) return key === task.date;
  if (r.until && key > r.until) return false;
  if (task.skipDates.includes(key)) return false;
  switch (r.freq) {
    case 'day': return diffDays(task.date, key) % r.interval === 0;
    case 'weekday': { const w = weekday(key); return w !== 0 && w !== 6; }
    case 'week': return diffDays(task.date, key) % (7 * r.interval) === 0;
    case 'month': {
      const [sy, sm, sd] = task.date.split('-').map(Number);
      const [y, m, d] = key.split('-').map(Number);
      const months = (y - sy) * 12 + (m - sm);
      if (months % r.interval !== 0) return false;
      return d === Math.min(sd, daysInMonth(y, m - 1));
    }
  }
}

export function occurrences(task: Task, from: string, to: string): string[] {
  if (!task.date || task.deleted) return [];
  if (!task.repeat) return task.date >= from && task.date <= to ? [task.date] : [];
  const start = from < task.date ? task.date : from;
  const end = task.repeat.until && task.repeat.until < to ? task.repeat.until : to;
  if (start > end) return [];
  return range(start, end).filter((k) => occursOn(task, k));
}

export const isDoneOn = (task: Task, key: string) => (task.repeat ? task.doneDates.includes(key) : task.done);

export function instancesInRange(tasks: Task[], from: string, to: string): Instance[] {
  const out: Instance[] = [];
  for (const task of tasks) for (const date of occurrences(task, from, to)) out.push({ task, date });
  return out;
}
