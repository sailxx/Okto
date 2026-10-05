import { addDays, fromKey, toKey, toMin } from './date';
import type { Session, Task } from './model';
import { instancesInRange, isDoneOn, type Instance } from './recurrence';

export const dayTasks = (tasks: Task[], key: string): Instance[] => instancesInRange(tasks, key, key);

export function dayTaskStats(tasks: Task[], key: string) {
  const list = dayTasks(tasks, key);
  return { done: list.filter((i) => isDoneOn(i.task, i.date)).length, total: list.length };
}

export const overdue = (tasks: Task[], today: string) =>
  tasks.filter((t) => !t.deleted && !t.repeat && !t.done && t.date !== null && t.date < today);

export function dayFocus(sessions: Session[], key: string) {
  let minutes = 0, count = 0;
  for (const s of sessions) if (!s.deleted && toKey(new Date(s.start)) === key) { minutes += s.minutes; count += 1; }
  return { minutes, count };
}

/** Days on which at least one task was completed or one focus finished. */
export function activeDays(tasks: Task[], sessions: Session[]): Set<string> {
  const days = new Set<string>();
  for (const t of tasks) {
    if (t.deleted) continue;
    if (t.repeat) t.doneDates.forEach((d) => days.add(d));
    else if (t.done && t.doneAt) days.add(toKey(new Date(t.doneAt)));
  }
  for (const s of sessions) if (!s.deleted) days.add(toKey(new Date(s.start)));
  return days;
}

export const isActiveDay = (tasks: Task[], sessions: Session[], key: string) => activeDays(tasks, sessions).has(key);

/** Consecutive active days ending today; an empty today does not break the streak yet. */
export function streak(tasks: Task[], sessions: Session[], today: string): number {
  const days = activeDays(tasks, sessions);
  let k = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(k)) { n += 1; k = addDays(k, -1); }
  return n;
}

/** Nearest timed, undone occurrence that has not ended yet, within a week. */
export function nextUp(tasks: Task[], now: Date): Instance | null {
  const today = toKey(now);
  const nowMs = now.getTime();
  const end = (i: Instance) => fromKey(i.date).getTime() + (toMin(i.task.start!) + i.task.duration) * 60000;
  const begin = (i: Instance) => fromKey(i.date).getTime() + toMin(i.task.start!) * 60000;
  const list = instancesInRange(tasks.filter((t) => t.start), today, addDays(today, 7))
    .filter((i) => !isDoneOn(i.task, i.date) && end(i) > nowMs)
    .sort((a, b) => begin(a) - begin(b));
  return list[0] ?? null;
}

/** n day keys ending with today, oldest first. */
export const lastDays = (n: number, today: string) => Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));

/** Tasks completed on a given day (for 7-day charts). */
export function doneOnDay(tasks: Task[], key: string): number {
  let n = 0;
  for (const t of tasks) {
    if (t.deleted) continue;
    if (t.repeat) { if (t.doneDates.includes(key)) n += 1; }
    else if (t.done && t.doneAt && toKey(new Date(t.doneAt)) === key) n += 1;
  }
  return n;
}
