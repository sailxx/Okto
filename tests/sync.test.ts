import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

// Exercise connect itself; only Firebase transport and UI state wrappers are replaced.
async function createSync(store: unknown, isBundledAndroid = false) {
  let source = readFileSync(new URL('../src/lib/sync.svelte.ts', import.meta.url), 'utf8');
  const ts = await import('typescript');
  source = source.replace(/^import .*;\n/gm, '').replace(/const config = \{[\s\S]*?\n\};/, 'const config = {};')
    .replace('export const syncEnabled = Boolean(config.apiKey && config.projectId);', 'const syncEnabled = true;')
    .replace('export const sync = new Sync();', 'return new Sync();');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace(/export \{\};?/, '');
  const { initialMerge } = await import('../src/lib/merge');
  return new Function('store', 'initialMerge', '$state', 'navigator', 'isBundledAndroid', js)(store, initialMerge, (x: unknown) => x, { onLine: true }, isBundledAndroid);
}

it('uploads edits made during initial reads and commits after older initial batches', async () => {
  let listener: ((c: string, r: any) => void) | undefined;
  let local: Record<string, any> = { id: 'n', updatedAt: 1, text: 'old' };
  const cloud = new Map<string, any>();
  let reads = 0, commits = 0;
  const edit = (stamp: number) => {
    local = { ...local, updatedAt: stamp, text: `edit${stamp}` };
    listener?.('notes', { ...local });
  };
  const snapshot = () => Object.fromEntries(['tasks','lists','sessions','counters','notes','habits','health','money','settings'].map(c => [c, c === 'settings' ? { id: 'main', updatedAt: 0 } : c === 'notes' ? { n: {...local} } : {}]));
  const store = {
    snapshot, onChange: (fn: typeof listener) => { listener = fn; return () => { listener = undefined; }; },
    applyRemote: (_c: string, records: any[]) => { for (const r of records) if (r.id === 'n' && r.updatedAt > local.updatedAt) local = r; },
    dropLocal: vi.fn(), device: { liveAt: 0 }, liveDoc: () => ({}), applyLive: () => false,
    onLive: () => () => {},
  };
  const fs = {
    collection: (_db: any, _u: string, _uid: string, c: string) => c,
    doc: (...args: string[]) => args.join('/'),
    getDocs: async () => { if (++reads === 1) edit(2); return { forEach: () => {} }; },
    writeBatch: () => {
      const writes: [string, any][] = [];
      return { set: (ref: string, rec: any) => writes.push([ref, rec]), commit: async () => {
        if (++commits === 1) edit(3);
        for (const [key, rec] of writes) cloud.set(key,rec);
        if (writes.some(([,r]) => r.updatedAt === 3)) edit(4);
      } };
    },
    setDoc: async (key: string, rec: any) => { cloud.set(key,rec); },
    onSnapshot: () => () => {}, getDoc: async () => ({ exists: () => false, data: () => ({}) }),
  };
  const sync = await createSync(store);
  sync.fb = { db: {}, fs };
  await sync.connect('u');
  expect(sync.state).toBe('synced');
  expect(cloud.get('notes/n')).toMatchObject({ updatedAt: 4, text: 'edit4' });
  edit(5);
  await Promise.resolve();
  expect(cloud.get('notes/n').updatedAt).toBe(5);
});

it('restores account appearance on first Android sign-in even if onboarding was just dismissed', async () => {
  const account = { id: 'main', updatedAt: 1, theme: 'dark', dashboard: [{ type: 'github' }], hiddenSections: ['calls'] };
  const local = { id: 'main', updatedAt: 10, theme: 'system', onboarded: true };
  const store = {
    snapshot: () => ({ settings: local, tasks: {}, lists: {}, sessions: {}, counters: {}, notes: {}, habits: {}, health: {}, money: {} }),
    onChange: () => () => {}, applyRemote: vi.fn(), dropLocal: vi.fn(), device: { androidSettingsOwner: null, liveAt: 0 },
    restoreAccountSettings: vi.fn(), onLive: () => () => {},
  };
  const writeBatch = vi.fn();
  const getDocs = vi.fn(async (collection: string) => ({
    metadata: { fromCache: false },
    forEach: (read: (doc: { id: string; data: () => typeof account }) => void) => {
      if (collection === 'settings') read({ id: 'main', data: () => account });
    },
  }));
  const sync = await createSync(store, true);
  sync.fb = { db: {}, fs: {
    collection: (_db: unknown, _users: string, _uid: string, collection: string) => collection,
    doc: () => '', getDocs, writeBatch, onSnapshot: () => () => {}, getDoc: async () => ({ exists: () => false }),
  } };
  await sync.connect('existing-user');
  expect(getDocs.mock.calls[0]).toEqual(['settings']);
  expect(store.restoreAccountSettings).toHaveBeenCalledWith(account, 'existing-user');
  expect(writeBatch).not.toHaveBeenCalled();
});
