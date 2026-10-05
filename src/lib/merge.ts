/** Record-level last-write-wins merge. Ties go to the remote copy. */
export function mergeRecords<T extends { id: string; updatedAt: number }>(
  local: Record<string, T>,
  remote: Record<string, T>,
): { merged: Record<string, T>; upload: T[] } {
  const merged: Record<string, T> = { ...remote };
  const upload: T[] = [];
  for (const [id, l] of Object.entries(local)) {
    const r = remote[id];
    if (!r || l.updatedAt > r.updatedAt) { merged[id] = l; upload.push(l); }
  }
  return { merged, upload };
}
