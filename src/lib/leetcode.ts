import { addDays } from './date';
import type { Lang, List, Task } from './model';

export const LEETCODE_LIST = 'leetcode';
/** Reminder time: the evening, so the streak is kept even after a busy day. */
export const LEETCODE_TIME = '20:00';

/** [number, title, slug, difficulty, [topic ru, topic en]]: one problem a day, grouped as arrays/hash → pointers/window → lists/search/trees. */
const PROBLEMS: [number, string, string, 'Easy' | 'Medium', [ru: string, en: string]][] = [
  [1, 'Two Sum', 'two-sum', 'Easy', ['хеш-таблица', 'hash map']],
  [217, 'Contains Duplicate', 'contains-duplicate', 'Easy', ['хеш-множество', 'hash set']],
  [242, 'Valid Anagram', 'valid-anagram', 'Easy', ['подсчёт символов', 'character count']],
  [20, 'Valid Parentheses', 'valid-parentheses', 'Easy', ['стек', 'stack']],
  [49, 'Group Anagrams', 'group-anagrams', 'Medium', ['хеш-таблица', 'hash map']],
  [125, 'Valid Palindrome', 'valid-palindrome', 'Easy', ['два указателя', 'two pointers']],
  [121, 'Best Time to Buy and Sell Stock', 'best-time-to-buy-and-sell-stock', 'Easy', ['один проход', 'single pass']],
  [3, 'Longest Substring Without Repeating Characters', 'longest-substring-without-repeating-characters', 'Medium', ['скользящее окно', 'sliding window']],
  [206, 'Reverse Linked List', 'reverse-linked-list', 'Easy', ['связный список', 'linked list']],
  [21, 'Merge Two Sorted Lists', 'merge-two-sorted-lists', 'Easy', ['связный список', 'linked list']],
  [704, 'Binary Search', 'binary-search', 'Easy', ['бинарный поиск', 'binary search']],
  [226, 'Invert Binary Tree', 'invert-binary-tree', 'Easy', ['рекурсия по дереву', 'tree recursion']],
  [104, 'Maximum Depth of Binary Tree', 'maximum-depth-of-binary-tree', 'Easy', ['рекурсия по дереву', 'tree recursion']],
];

export const leetcodeTasks = (tasks: Task[]) => tasks.filter((t) => t.listId === LEETCODE_LIST).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

/** The problem to do now: the earliest one not finished yet (a missed day stays on top until it is done). */
export const currentProblem = (tasks: Task[]): Task | null => tasks.find((t) => !t.done) ?? null;

/** The problem link stored on the first line of a plan task's note; '' when there is none. */
export function problemUrl(task: Task): string {
  const m = task.note.match(/^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/?/);
  return m ? m[0] : '';
}

const LEVEL = { Easy: ['Лёгкая', 'Easy'], Medium: ['Средняя', 'Medium'] } as const;

export const taskId = (n: number | 'review') => `lc-${n}`;

/** A two-week plan starting at `start`: one problem a day at 20:00 with a reminder, and a review day at the end. */
export function leetcodePlan(start: string, lang: Lang): { list: Partial<List>; tasks: Partial<Task>[] } {
  const ru = lang === 'ru';
  const base = { listId: LEETCODE_LIST, start: LEETCODE_TIME, duration: 30, reminder: 0 };
  const tasks: Partial<Task>[] = PROBLEMS.map(([n, title, slug, level, topic], i) => ({
    ...base, id: taskId(n), title: `#${n} ${title}`, date: addDays(start, i),
    note: `https://leetcode.com/problems/${slug}/\n${LEVEL[level][ru ? 0 : 1]} · ${topic[ru ? 0 : 1]}`,
  }));
  tasks.push({
    ...base, id: taskId('review'), date: addDays(start, PROBLEMS.length),
    title: ru ? 'LeetCode: повторить сложную задачу' : 'LeetCode: redo a hard one',
    note: ru ? 'Реши заново задачу, на которой смотрел решение.' : 'Solve again a problem you needed the solution for.',
  });
  return { list: { id: LEETCODE_LIST, name: 'LeetCode', color: '#f76b15' }, tasks };
}
