import { describe, it, expect } from 'vitest';
import { normSettings, defaultSettings } from '../src/lib/model';

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
