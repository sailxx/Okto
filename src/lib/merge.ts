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

/**
 * First merge after sign-in. Records never edited on this device (updatedAt 0 — the
 * starter counter, default lists) are not pushed into a cloud that already has data,
 * so a new device does not add an empty "Counter" everywhere. `drop` lists them for removal.
 */
export function initialMerge<T extends { id: string; updatedAt: number }>(
  local: Record<string, T>,
  remote: Record<string, T>,
): { merged: Record<string, T>; upload: T[]; drop: string[] } {
  const cloudHasData = Object.keys(remote).length > 0;
  const drop = cloudHasData ? Object.values(local).filter((l) => l.updatedAt === 0 && !remote[l.id]).map((l) => l.id) : [];
  const kept = Object.fromEntries(Object.entries(local).filter(([id]) => !drop.includes(id)));
  return { ...mergeRecords(kept, remote), drop };
}
