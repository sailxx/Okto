import { describe, expect, it } from 'vitest';
import { MAX_ATTACHMENTS, newTask } from '../src/lib/model';

describe('task attachments', () => {
  it('defaults to none for tasks saved before attachments existed', () => {
    expect(newTask({ title: 'old' }).attachments).toEqual([]);
  });
  it('keeps a valid description', () => {
    const a = { id: 'f1', name: 'scan.pdf', type: 'application/pdf', size: 1234, addedAt: 5 };
    expect(newTask({ attachments: [a] }).attachments).toEqual([a]);
  });
  it('cleans up junk from storage or the cloud', () => {
    const t = newTask({ attachments: [null, 'x', { name: 42, size: -1 }] as unknown[] } as Record<string, unknown>);
    expect(t.attachments).toHaveLength(1);
    expect(t.attachments[0]).toMatchObject({ name: 'file', type: '', size: 0 });
    expect(t.attachments[0].id).toBeTruthy();
  });
  it('caps the number of files', () => {
    const many = Array.from({ length: MAX_ATTACHMENTS + 5 }, (_, i) => ({ id: `f${i}`, name: `${i}.jpg`, type: 'image/jpeg', size: 1, addedAt: 1 }));
    expect(newTask({ attachments: many }).attachments).toHaveLength(MAX_ATTACHMENTS);
  });
});
