import { describe, it, expect } from 'vitest';
import { migrateLegacy } from '../src/lib/migrate';
import { normData } from '../src/lib/model';

describe('migrate', () => {
  it('returns null when nothing to migrate', () => expect(migrateLegacy(null, null, 'ru')).toBeNull());
  it('moves v2 presets, theme and pomodoro settings', () => {
    const v2 = { lang: 'en', theme: 'mint', mode: 'pomodoro', active: 'a',
      presets: [{ id: 'a', name: 'Push', target: 45, step: 5, count: 12, color: '#e93d82' }],
      pomo: { preset: 'deep', custom: { work: 40, short: 5, long: 20, every: 3 }, autoStart: false } };
    const r = migrateLegacy(v2, null, 'ru')!;
    const c = Object.values(r.data.counters)[0];
    expect(c).toMatchObject({ id: 'a', name: 'Push', target: 45, step: 5, count: 12, color: '#e93d82' });
    expect(r.data.settings).toMatchObject({ lang: 'en', theme: 'mint' });
    expect(r.data.settings.pomo).toMatchObject({ preset: 'deep', autoStart: false, custom: { work: 40, short: 5, long: 20, every: 3 } });
    expect(r.device).toMatchObject({ focusMode: 'pomodoro', activeCounter: 'a' });
  });
  it('moves v1 single counter', () => {
    const r = migrateLegacy(null, { count: 7, target: 20, theme: 'dark', name: 'Вода' }, 'ru')!;
    expect(Object.values(r.data.counters)[0]).toMatchObject({ count: 7, target: 20, name: 'Вода' });
    expect(r.data.settings.theme).toBe('dark');
  });
});

describe('normData', () => {
  it('survives garbage', () => {
    const d = normData({ tasks: { x: { title: 5, priority: 9 } }, settings: 'nope' }, 'ru');
    expect(d.tasks.x.title).toBe('');
    expect(d.tasks.x.priority).toBe(0);
    expect(d.settings.theme).toBe('system');
    expect(Object.keys(d.lists).length).toBeGreaterThan(0);
    expect(Object.keys(d.counters).length).toBe(1);
  });
  it('survives non-object input', () => {
    expect(normData('{{broken', 'en').settings.lang).toBe('en');
    expect(normData(null, 'ru').tasks).toEqual({});
  });
});
