import { describe, expect, it } from 'vitest';
import { cleanLogin, parseContributions } from '../src/lib/github';
import { normSettings } from '../src/lib/model';

describe('github', () => {
  it('cleans a login from a handle or profile link', () => {
    expect(cleanLogin(' @sailxx ')).toBe('sailxx');
    expect(cleanLogin('https://github.com/sailxx/Okto')).toBe('sailxx');
    expect(cleanLogin('-bad')).toBe('');
    expect(cleanLogin('a b')).toBe('');
    expect(cleanLogin('')).toBe('');
  });
  it('keeps only days with contributions', () => {
    const r = parseContributions({ contributions: [{ date: '2026-10-01', count: 3 }, { date: '2026-10-02', count: 0 }, { date: 'x', count: 5 }] });
    expect([...r.counts]).toEqual([['2026-10-01', 3]]);
    expect(r.total).toBe(3);
    expect(parseContributions(null).total).toBe(0);
  });
  it('stores a valid login in settings and drops junk', () => {
    expect(normSettings({ github: 'sailxx' }, 'ru').github).toBe('sailxx');
    expect(normSettings({ github: 'a/b' }, 'ru').github).toBe('');
  });
});
