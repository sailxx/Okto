// LeetCode progress of a public profile. LeetCode's own API blocks browsers (CORS), so this reads a public
// mirror that only ever sees the username. Cached per user for an hour.
export interface LeetStats {
  solved: number; total: number;
  easy: number; medium: number; hard: number;
  totalEasy: number; totalMedium: number; totalHard: number;
  /** Submissions per day, by date key. */
  counts: Map<string, number>;
}

const TTL = 60 * 60 * 1000;
const cacheKey = (user: string) => `okto.lc.${user.toLowerCase()}`;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);

/** A LeetCode username: letters, digits, `_`, `-`, up to 40 characters. Accepts a profile link. Returns '' for anything else. */
export function cleanLeetUser(raw: string): string {
  const v = raw.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/i, '').replace(/\/.*$/, '');
  return /^[\w-]{1,40}$/.test(v) ? v : '';
}

export function parseLeetStats(json: any): LeetStats {
  const counts = new Map<string, number>();
  const cal = json?.submissionCalendar;
  if (cal && typeof cal === 'object') {
    for (const [ts, n] of Object.entries(cal)) {
      const sec = Number(ts);
      if (!Number.isFinite(sec) || !(Number(n) > 0)) continue;
      const key = new Date(sec * 1000).toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + Number(n));
    }
  }
  return {
    solved: num(json?.totalSolved), total: num(json?.totalQuestions),
    easy: num(json?.easySolved), medium: num(json?.mediumSolved), hard: num(json?.hardSolved),
    totalEasy: num(json?.totalEasy), totalMedium: num(json?.totalMedium), totalHard: num(json?.totalHard),
    counts,
  };
}

const pack = (d: LeetStats) => ({ ...d, counts: [...d.counts] });
const unpack = (r: any): LeetStats => ({ ...r, counts: new Map<string, number>(r.counts) });

function read(user: string): { at: number; data: LeetStats } | null {
  try {
    const raw = JSON.parse(localStorage.getItem(cacheKey(user)) ?? 'null');
    if (!raw || typeof raw.at !== 'number' || !Array.isArray(raw.data?.counts)) return null;
    return { at: raw.at, data: unpack(raw.data) };
  } catch { return null; }
}

/** Throws on network errors or an unknown user; falls back to the cache when it is fresh. */
export async function loadLeetStats(user: string, force = false): Promise<LeetStats> {
  const cached = read(user);
  if (cached && !force && Date.now() - cached.at < TTL) return cached.data;
  try {
    const res = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${encodeURIComponent(user)}`);
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    if (typeof json?.totalSolved !== 'number') throw new Error('no user');
    const data = parseLeetStats(json);
    try { localStorage.setItem(cacheKey(user), JSON.stringify({ at: Date.now(), data: pack(data) })); } catch { /* storage unavailable */ }
    return data;
  } catch (e) {
    if (cached) return cached.data;
    throw e;
  }
}
