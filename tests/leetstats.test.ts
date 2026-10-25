import { describe, expect, it } from 'vitest';
import { cleanLeetUser, parseLeetStats } from '../src/lib/leetstats';

describe('cleanLeetUser', () => {
  it('accepts names and profile links', () => {
    expect(cleanLeetUser('lee215')).toBe('lee215');
    expect(cleanLeetUser('@lee_215')).toBe('lee_215');
    expect(cleanLeetUser('https://leetcode.com/u/lee215/')).toBe('lee215');
  });
  it('rejects junk', () => {
    expect(cleanLeetUser('a b')).toBe('');
    expect(cleanLeetUser('')).toBe('');
  });
});

describe('parseLeetStats', () => {
  it('turns the submission calendar into day counts', () => {
    const d = parseLeetStats({ totalSolved: 10, easySolved: 6, mediumSolved: 3, hardSolved: 1, totalQuestions: 3000, submissionCalendar: { '1761436800': 3, '1761523200': 0, bad: 2 } });
    expect(d.solved).toBe(10);
    expect(d.counts.get('2025-10-26')).toBe(3);
    expect(d.counts.size).toBe(1);
  });
});
