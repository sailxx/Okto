import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newTask } from '../src/lib/model';
import { localDateTimeValue, scheduledTrayReminders } from '../src/lib/trayReminders';

const today = '2026-11-27';
const at = (value: string) => new Date(value).getTime();
const labels = { reminder: 'Reminder', deadline: 'Task is due' };

describe('Windows tray reminders', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${today}T09:00`));
  });
  afterEach(() => vi.useRealTimers());

  it('keeps the scheduled time and deadline as separate reminders', () => {
    const deadlineAt = at(`${today}T14:00`);
    const task = newTask({ title: 'Send report', date: today, start: '10:00', reminder: 5, deadlineAt });
    const items = scheduledTrayReminders([task], today, 'en', labels);
    expect(items.map(({ dueAt, title }) => [dueAt, title])).toEqual([
      [at(`${today}T09:55`), labels.reminder], [deadlineAt, labels.deadline],
    ]);
    expect(localDateTimeValue(task.deadlineAt)).toBe(`${today}T14:00`);
    expect(localDateTimeValue(newTask({ ...task, deadlineAt: undefined }).deadlineAt)).toBe('');
  });

  it('deduplicates a deadline and planned time at the same minute and ignores completed tasks', () => {
    const deadlineAt = at(`${today}T10:00`);
    const task = newTask({ title: 'Call', date: today, start: '10:00', reminder: 0, deadlineAt });
    expect(scheduledTrayReminders([task], today, 'en', labels)).toMatchObject([{ dueAt: deadlineAt, title: labels.deadline }]);
    expect(scheduledTrayReminders([{ ...task, done: true }], today, 'en', labels)).toEqual([]);
  });

  it('ignores finished occurrences and old reminders while retaining later occurrences', () => {
    const task = newTask({
      title: 'Repeat', date: today, start: '09:00', reminder: 0, deadlineAt: at(`${today}T11:00`),
      repeat: { freq: 'day', interval: 1, until: '2026-11-29', days: [] }, doneDates: [today],
    });
    const old = newTask({ title: 'Old', date: today, start: '08:44', reminder: 0 });
    expect(scheduledTrayReminders([task, old], today, 'en', labels).map((item) => item.dueAt)).toEqual([
      at('2026-11-28T09:00'), at('2026-11-29T09:00'),
    ]);
  });
});
