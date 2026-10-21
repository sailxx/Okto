/** Channels of a CSS colour as the theme writes it: #rgb, #rrggbb or rgb()/rgba(). Unknown → black. */
export function rgbOf(color: string): [number, number, number] {
  const c = color.trim();
  const hex = c.match(/^#([\da-f]{3}|[\da-f]{6})(?:[\da-f]{2})?$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((h) => h + h).join('') : hex;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
  }
  const [r = 0, g = 0, b = 0] = c.match(/[\d.]+/g)?.map(Number) ?? [];
  return [r, g, b];
}
