import { describe, expect, it } from 'vitest';
import { currentProblem, leetcodePlan, leetcodeTasks, problemUrl } from '../src/lib/leetcode';
import { newTask, normSettings } from '../src/lib/model';
import { streak } from '../src/lib/stats';

const plan = (start = '2026-10-23') => leetcodePlan(start, 'ru').tasks.map((t) => newTask(t));

describe('leetcode plan', () => {
  it('schedules one task a day at 20:00 with a reminder, plus a review day', () => {
    const tasks = plan();
    expect(tasks).toHaveLength(14);
    expect(tasks[0].date).toBe('2026-10-23');
    expect(tasks[13].date).toBe('2026-11-05');
    expect(new Set(tasks.map((t) => t.date)).size).toBe(14);
    expect(tasks.every((t) => t.start === '20:00' && t.reminder === 0 && t.listId === 'leetcode')).toBe(true);
    expect(new Set(tasks.map((t) => t.id)).size).toBe(14);
  });

  it('writes the plan in the interface language', () => {
    const ru = leetcodePlan('2026-10-23', 'ru').tasks, en = leetcodePlan('2026-10-23', 'en').tasks;
    expect(ru[0].note).toBe('https://leetcode.com/problems/two-sum/\nЛёгкая · хеш-таблица');
    expect(en[0].note).toBe('https://leetcode.com/problems/two-sum/\nEasy · hash map');
    expect(ru[4].note).toContain('Средняя');
    expect(ru[13].title).toBe('LeetCode: повторить сложную задачу');
    expect(en[13].title).toBe('LeetCode: redo a hard one');
  });

  it('keeps a problem link on the first line of the note', () => {
    const [two] = plan();
    expect(problemUrl(two)).toBe('https://leetcode.com/problems/two-sum/');
    expect(problemUrl(plan()[13])).toBe('');
  });

  it('picks the earliest unfinished problem and builds a streak from finished ones', () => {
    const tasks = plan();
    expect(currentProblem(leetcodeTasks(tasks))?.id).toBe(tasks[0].id);
    const day = (s: string) => new Date(`${s}T12:00:00`).getTime();
    tasks[0] = newTask({ ...tasks[0], done: true, doneAt: day('2026-10-23') });
    tasks[1] = newTask({ ...tasks[1], done: true, doneAt: day('2026-10-24') });
    expect(currentProblem(leetcodeTasks(tasks))?.id).toBe(tasks[2].id);
    expect(streak(leetcodeTasks(tasks), [], '2026-10-24')).toBe(2);
    expect(streak(leetcodeTasks(tasks), [], '2026-10-26')).toBe(0);
  });

  it('keeps the card in the saved dashboard', () => {
    const { dashboard } = normSettings({ dashboard: [{ type: 'leetcode', pw: 2, ph: 2 }, { type: 'nope' }] }, 'ru');
    expect(dashboard).toEqual([{ type: 'leetcode', pw: 2, ph: 2 }]);
  });
});
