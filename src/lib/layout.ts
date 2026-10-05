export interface Span { id: string; start: number; end: number }

/** Side-by-side columns for overlapping calendar blocks (Apple Calendar style). */
export function layoutDay(items: Span[]): Record<string, { col: number; cols: number }> {
  const out: Record<string, { col: number; cols: number }> = {};
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  let cluster: Span[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => { for (const s of cluster) out[s.id].cols = colEnds.length; cluster = []; colEnds = []; };

  for (const s of sorted) {
    if (s.start >= clusterEnd) { flush(); clusterEnd = -Infinity; }
    let col = colEnds.findIndex((e) => e <= s.start);
    if (col === -1) { col = colEnds.length; colEnds.push(s.end); } else colEnds[col] = s.end;
    out[s.id] = { col, cols: 1 };
    cluster.push(s);
    clusterEnd = Math.max(clusterEnd, s.end);
  }
  flush();
  return out;
}
