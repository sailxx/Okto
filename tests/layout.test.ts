import { describe, it, expect } from 'vitest';
import { layoutDay } from '../src/lib/layout';

describe('layoutDay', () => {
  it('non-overlapping items use full width', () => {
    expect(layoutDay([{ id: 'a', start: 60, end: 120 }, { id: 'b', start: 120, end: 180 }])).toEqual({ a: { col: 0, cols: 1 }, b: { col: 0, cols: 1 } });
  });
  it('overlapping items split into columns', () => {
    const r = layoutDay([{ id: 'a', start: 60, end: 180 }, { id: 'b', start: 90, end: 150 }, { id: 'c', start: 160, end: 200 }]);
    expect(r.a).toEqual({ col: 0, cols: 2 });
    expect(r.b).toEqual({ col: 1, cols: 2 });
    expect(r.c).toEqual({ col: 1, cols: 2 });
  });
  it('three-way overlap gives three columns', () => {
    const r = layoutDay([{ id: 'a', start: 0, end: 60 }, { id: 'b', start: 10, end: 60 }, { id: 'c', start: 20, end: 60 }]);
    expect([r.a.col, r.b.col, r.c.col]).toEqual([0, 1, 2]);
    expect(r.c.cols).toBe(3);
  });
});
