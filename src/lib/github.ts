// GitHub contributions for a public profile. GitHub's own API needs a token, so this reads a public mirror
// (github-contributions-api.jogruber.de), which only ever sees the username. Cached per user for an hour.
export interface Contributions { counts: Map<string, number>; total: number }

const TTL = 60 * 60 * 1000;
const cacheKey = (user: string) => `okto.gh.${user.toLowerCase()}`;

/** A GitHub login: letters, digits and single hyphens, up to 39 characters. Returns '' for anything else. */
export function cleanLogin(raw: string): string {
  const v = raw.trim().replace(/^@/, '').replace(/^https?:\/\/github\.com\//i, '').replace(/\/.*$/, '');
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(v) ? v : '';
}

export function parseContributions(json: any): Contributions {
  const list: any[] = Array.isArray(json?.contributions) ? json.contributions : [];
  const counts = new Map<string, number>();
  let total = 0;
  for (const c of list) {
    if (typeof c?.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(c.date) || !(c.count > 0)) continue;
    counts.set(c.date, c.count); total += c.count;
  }
  return { counts, total };
}

function read(user: string): { at: number; data: Contributions } | null {
  try {
    const raw = JSON.parse(localStorage.getItem(cacheKey(user)) ?? 'null');
    if (!raw || typeof raw.at !== 'number' || !Array.isArray(raw.days)) return null;
    return { at: raw.at, data: parseContributions({ contributions: raw.days.map(([date, count]: [string, number]) => ({ date, count })) }) };
  } catch { return null; }
}

/** Throws on network errors or an unknown user; falls back to the cache when it is fresh. */
export async function loadContributions(user: string, force = false): Promise<Contributions> {
  const cached = read(user);
  if (cached && !force && Date.now() - cached.at < TTL) return cached.data;
  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`);
    if (!res.ok) throw new Error(String(res.status));
    const data = parseContributions(await res.json());
    try { localStorage.setItem(cacheKey(user), JSON.stringify({ at: Date.now(), days: [...data.counts] })); } catch { /* storage unavailable */ }
    return data;
  } catch (e) {
    if (cached) return cached.data;
    throw e;
  }
}
