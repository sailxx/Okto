import { describe, it, expect } from 'vitest';
import { mergeRecords } from '../src/lib/merge';

const r = (id: string, updatedAt: number, extra = {}) => ({ id, updatedAt, ...extra });

describe('mergeRecords', () => {
  it('newer wins on each side', () => {
    const { merged, upload } = mergeRecords({ a: r('a', 5, { v: 'L' }), b: r('b', 1, { v: 'L' }) }, { a: r('a', 3, { v: 'R' }), b: r('b', 9, { v: 'R' }) });
    expect(merged.a).toMatchObject({ v: 'L' });
    expect(merged.b).toMatchObject({ v: 'R' });
    expect(upload.map((x) => x.id)).toEqual(['a']);
  });
  it('local-only records are uploaded, remote-only are kept', () => {
    const { merged, upload } = mergeRecords({ a: r('a', 1) }, { b: r('b', 1) });
    expect(Object.keys(merged).sort()).toEqual(['a', 'b']);
    expect(upload.map((x) => x.id)).toEqual(['a']);
  });
  it('a newer deletion is not resurrected by an older edit', () => {
    const { merged } = mergeRecords({ a: r('a', 2, { deleted: false }) }, { a: r('a', 5, { deleted: true }) });
    expect(merged.a).toMatchObject({ deleted: true });
  });
  it('equal timestamps keep remote and upload nothing', () => {
    const { merged, upload } = mergeRecords({ a: r('a', 4, { v: 'L' }) }, { a: r('a', 4, { v: 'R' }) });
    expect(merged.a).toMatchObject({ v: 'R' });
    expect(upload).toEqual([]);
  });
});
