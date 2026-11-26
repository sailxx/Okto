import { describe, it, expect } from 'vitest';
import { normSettings, defaultSettings, blockSize } from '../src/lib/model';

describe('profile settings', () => {
  it('defaults to no name, auto greeting, not onboarded', () => {
    expect(defaultSettings('ru')).toMatchObject({ name: '', greeting: '', onboarded: false });
  });
  it('keeps a trimmed name and greeting within limits', () => {
    const s = normSettings({ name: 'Влад', greeting: 'Привет', onboarded: true }, 'ru');
    expect(s).toMatchObject({ name: 'Влад', greeting: 'Привет', onboarded: true });
    expect(normSettings({ name: 'x'.repeat(100) }, 'ru').name.length).toBe(40);
    expect(normSettings({ name: 5, greeting: null }, 'ru')).toMatchObject({ name: '', greeting: '' });
  });
});

describe('hidden sections', () => {
  it('shows every section by default', () => {
    expect(defaultSettings('ru').hiddenSections).toEqual([]);
  });
  it('keeps only calls and focus, without duplicates', () => {
    expect(normSettings({ hiddenSections: ['focus', 'tasks', 'calls', 'focus', 7] }, 'ru').hiddenSections).toEqual(['calls', 'focus']);
    expect(normSettings({ hiddenSections: 'calls' }, 'ru').hiddenSections).toEqual([]);
  });
});

describe('default home layout', () => {
  const previous = ['score', 'focus', 'finance', 'tasks', 'productivity', 'goal', 'streak', 'next', 'habits', 'health']
    .map((type) => ({ type }));

  it('uses four full-width widgets on every grid', () => {
    const { dashboard } = defaultSettings('en');
    expect(dashboard.map((b) => b.type)).toEqual(['score', 'tasks', 'focus', 'habits']);
    for (const cols of [2, 4, 6]) {
      expect(dashboard.every((b) => Math.min(blockSize(b, cols).w, cols) === cols)).toBe(true);
    }
  });

  it('updates the previous default and preserves a customized layout', () => {
    expect(normSettings({ dashboard: previous }, 'en').dashboard).toEqual(defaultSettings('en').dashboard);
    const customized = previous.map((block, i) => i === 0 ? { ...block, tint: 'none' } : block);
    expect(normSettings({ dashboard: customized }, 'en').dashboard).toEqual(customized);
  });
});

describe('home block sizes per device', () => {
  it('phone uses its own size, desktop keeps w/h', () => {
    const b = { type: 'tasks' as const, w: 6, h: 4, pw: 1, ph: 1 };
    expect(blockSize(b, 6)).toEqual({ w: 6, h: 4 });
    expect(blockSize(b, 2)).toEqual({ w: 1, h: 1 });
  });
  it('phone falls back to w/h when it has no size of its own', () => {
    expect(blockSize({ type: 'focus', w: 2, h: 3 }, 2)).toEqual({ w: 2, h: 3 });
  });
  it('clamps phone sizes on load', () => {
    const [b] = normSettings({ dashboard: [{ type: 'focus', pw: 5, ph: 9 }] }, 'ru').dashboard;
    expect(b).toMatchObject({ pw: 1, ph: 2 });
  });
});
