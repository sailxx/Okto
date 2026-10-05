// Calendar dates are local 'YYYY-MM-DD' strings; times are 'HH:MM'.
const pad = (n: number) => String(n).padStart(2, '0');

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = (now = new Date()) => toKey(now);

export function addDays(k: string, n: number): string {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Whole days from a to b (b − a). */
export function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** 0 = Sunday … 6 = Saturday */
export const weekday = (k: string) => fromKey(k).getDay();

export function startOfWeek(k: string, weekStart: 0 | 1): string {
  return addDays(k, -((weekday(k) - weekStart + 7) % 7));
}

export const daysInMonth = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate();

export function addMonths(k: string, n: number): string {
  const [y, m] = k.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return toKey(d);
}

export const monthStart = (k: string) => `${k.slice(0, 7)}-01`;

export function toMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMin(n: number): string {
  const v = Math.max(0, Math.min(24 * 60 - 1, Math.round(n)));
  return `${pad(Math.floor(v / 60))}:${pad(v % 60)}`;
}

/** Inclusive list of day keys. */
export function range(from: string, to: string): string[] {
  const out: string[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}

export const minutesNow = (d = new Date()) => d.getHours() * 60 + d.getMinutes();

export const isKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const isHm = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
