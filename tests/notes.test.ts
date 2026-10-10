import { describe, expect, it } from 'vitest';
import { MAX_ATTACHMENTS, defaultData, newNote, normData } from '../src/lib/model';

describe('notes', () => {
  it('fills defaults', () => {
    const n = newNote({ title: 'a' });
    expect(n).toMatchObject({ title: 'a', body: '', color: null, pinned: false, attachments: [], deleted: false });
  });
  it('rejects unknown colours and keeps valid ones', () => {
    expect(newNote({ color: 'red' }).color).toBeNull();
    expect(newNote({ color: '#0090ff' }).color).toBe('#0090ff');
  });
  it('cleans and caps attachments', () => {
    const many = Array.from({ length: MAX_ATTACHMENTS + 3 }, (_, i) => ({ id: `f${i}`, name: 'p.jpg', type: 'image/jpeg', size: 1, addedAt: 1 }));
    expect(newNote({ attachments: many }).attachments).toHaveLength(MAX_ATTACHMENTS);
    expect(newNote({ attachments: [null, 'x'] as unknown[] } as Record<string, unknown>).attachments).toHaveLength(0);
  });
  it('data saved before notes existed loads with an empty set', () => {
    expect(normData({ tasks: {} }, 'ru').notes).toEqual({});
    expect(defaultData('en').notes).toEqual({});
  });
});
