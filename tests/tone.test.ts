import { describe, expect, it } from 'vitest';
import { rgbOf } from '../src/lib/tone';

describe('rgbOf', () => {
  it('reads hex', () => {
    expect(rgbOf('#ffffff')).toEqual([255, 255, 255]);
    expect(rgbOf(' #000 ')).toEqual([0, 0, 0]);
    expect(rgbOf('#f2f2f7')).toEqual([242, 242, 247]);
  });
  it('reads rgb()', () => {
    expect(rgbOf('rgb(255, 255, 255)')).toEqual([255, 255, 255]);
    expect(rgbOf('rgba(20, 20, 20, 0.5)')).toEqual([20, 20, 20]);
  });
  it('falls back to black', () => {
    expect(rgbOf('')).toEqual([0, 0, 0]);
  });
});
