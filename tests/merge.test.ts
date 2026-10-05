import { describe, it, expect } from 'vitest';
import { initialMerge, mergeRecords } from '../src/lib/merge';

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

describe('initialMerge', () => {
  it('drops untouched local defaults when the cloud already has data', () => {
    const { merged, upload, drop } = initialMerge({ c1: r('c1', 0), mine: r('mine', 7) }, { c9: r('c9', 3) });
    expect(Object.keys(merged).sort()).toEqual(['c9', 'mine']);
    expect(upload.map((x) => x.id)).toEqual(['mine']);
    expect(drop).toEqual(['c1']);
  });
  it('uploads untouched defaults into an empty cloud', () => {
    const { upload, drop } = initialMerge({ c1: r('c1', 0) }, {});
    expect(upload.map((x) => x.id)).toEqual(['c1']);
    expect(drop).toEqual([]);
  });
  it('keeps a default that also exists remotely', () => {
    const { merged, drop } = initialMerge({ personal: r('personal', 0) }, { personal: r('personal', 0), x: r('x', 1) });
    expect(merged.personal).toBeDefined();
    expect(drop).toEqual([]);
  });
});
