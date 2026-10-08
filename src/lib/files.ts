// Task attachments live in IndexedDB on this device: they work offline and never leave it.
// Tasks carry only a description of each file (model.Attachment), so cloud sync stays small.
const DB = 'okto-files', STORE = 'files';
/** Unreferenced files are kept this long: covers «Undo» and an editor still open in another tab. */
const GRACE = 24 * 3600 * 1000;

interface Rec { blob: Blob; addedAt: number }

let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbp.catch(() => { dbp = null; });
  }
  return dbp;
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

export async function putFile(id: string, blob: Blob) {
  await run('readwrite', (s) => { s.put({ blob, addedAt: Date.now() } satisfies Rec, id); });
  // Ask the browser not to evict our data under storage pressure.
  navigator.storage?.persist?.().catch(() => {});
}

export async function getFile(id: string): Promise<Blob | null> {
  try { return ((await run<Rec | undefined>('readonly', (s) => s.get(id))) as Rec | undefined)?.blob ?? null; }
  catch { return null; }
}

export async function deleteFiles(ids: string[]) {
  if (!ids.length) return;
  await run('readwrite', (s) => { ids.forEach((id) => s.delete(id)); }).catch(() => {});
}

/** Drop files that no task points to any more. */
export async function gcFiles(keep: Set<string>, now = Date.now()) {
  try {
    await run('readwrite', (s) => {
      const req = s.openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (!c) return;
        const rec = c.value as Rec;
        if (!keep.has(c.key as string) && now - (rec?.addedAt ?? 0) > GRACE) c.delete();
        c.continue();
      };
    });
  } catch { /* storage unavailable */ }
}

export const isImage = (type: string) => /^image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml|heic|heif)$/i.test(type);

/** Save a file to the device's Downloads. */
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
