import { describe, expect, it } from 'vitest';
import { newTask, normLink } from '../src/lib/model';

describe('normLink', () => {
  it('keeps http(s) links', () => {
    expect(normLink('https://meet.google.com/abc-defg-hij')).toBe('https://meet.google.com/abc-defg-hij');
    expect(normLink('http://example.com/x')).toBe('http://example.com/x');
  });
  it('adds https:// to a bare host', () => {
    expect(normLink('zoom.us/j/123')).toBe('https://zoom.us/j/123');
  });
  it('drops anything that could run script or is not a link', () => {
    expect(normLink('javascript:alert(1)')).toBe('');
    expect(normLink('data:text/html,hi')).toBe('');
    expect(normLink('   ')).toBe('');
    expect(normLink(42)).toBe('');
  });
});

describe('calls', () => {
  it('defaults to a plain task and normalises the link', () => {
    expect(newTask({}).kind).toBe('task');
    const c = newTask({ kind: 'call', link: 'javascript:alert(1)' });
    expect(c.kind).toBe('call');
    expect(c.link).toBe('');
  });
});
