import { addDays, toKey } from './date';
import type { Task } from './model';
import { isDoneOn, occurrences } from './recurrence';

type Reminder = { id: string; dueAt: number; title: string; body: string };

export function trayReminderBridge() {
  if (typeof window === 'undefined') return;
  const host = window as Window & {
    oktoNativeReminders?: boolean;
    chrome?: { webview?: { postMessage: (message: unknown) => void } };
  };
  return host.oktoNativeReminders === true ? host.chrome?.webview : undefined;
}

export function localDateTimeValue(at?: number): string {
  if (at === undefined) return '';
  const date = new Date(at);
  return `${toKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function scheduledTrayReminders(
  tasks: Task[], today: string, lang: string, labels: { reminder: string; deadline: string },
): Reminder[] {
  const from = addDays(today, -1);
  const until = addDays(today, 14);
  const earliest = Date.now() - 15 * 60_000;
  const latest = new Date(`${addDays(today, 8)}T00:00`).getTime();
  const formatter = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' });
  const items = new Map<string, Reminder>();

  for (const task of tasks) {
    if (task.deleted || !task.title) continue;
    function schedule(dueAt: number, title: string, time: string) {
      if (!(dueAt >= earliest && dueAt < latest)) return;
      const id = JSON.stringify([task.id, dueAt]);
      items.set(id, { id, dueAt, title, body: `${time} · ${task.title}` });
    }
    if (task.start && task.reminder !== null) {
      for (const day of occurrences(task, from, until)) {
        if (isDoneOn(task, day)) continue;
        const start = new Date(`${day}T${task.start}`).getTime();
        schedule(start - task.reminder * 60_000, labels.reminder, task.start);
      }
    }
    const deadline = task.deadlineAt;
    // An absolute deadline belongs to one occurrence, even for a repeating task.
    if (deadline !== undefined && !task.skipDates.includes(task.date ?? '') && !isDoneOn(task, task.date ?? today)) {
      schedule(deadline, labels.deadline, formatter.format(deadline));
    }
  }
  return [...items.values()].sort((a, b) => a.dueAt - b.dueAt).slice(0, 512);
}
