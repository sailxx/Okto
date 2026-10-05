// Optional cloud sync through Firebase (free Spark plan). Without VITE_FIREBASE_* the app stays local-only.
import { initialMerge } from './merge';
import type { Collection } from './model';
import { store } from './store.svelte';

export type SyncState = 'off' | 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};
export const syncEnabled = Boolean(config.apiKey && config.projectId);

const COLLECTIONS: Collection[] = ['tasks', 'lists', 'sessions', 'counters', 'settings'];
// Firestore rejects `undefined` values.
const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v));

class Sync {
  state = $state<SyncState>(syncEnabled ? 'signed-out' : 'off');
  user = $state<{ name: string; email: string } | null>(null);
  private fb: any = null;
  private stops: (() => void)[] = [];
  private pending = 0;

  async start() {
    if (!syncEnabled || this.fb) return;
    try {
      const [{ initializeApp }, auth, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
      const app = initializeApp(config);
      const db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
      this.fb = { auth: auth.getAuth(app), authMod: auth, db, fs };
      auth.onAuthStateChanged(this.fb.auth, (u: any) => {
        if (u) { this.user = { name: u.displayName || '', email: u.email || '' }; this.connect(u.uid); }
        else { this.user = null; this.disconnect(); this.state = 'signed-out'; }
      });
      window.addEventListener('online', () => { if (this.user) this.state = 'synced'; });
      window.addEventListener('offline', () => { if (this.user) this.state = 'offline'; });
    } catch (e) {
      console.error(e);
      this.state = 'error';
    }
  }

  async signIn() {
    if (!this.fb) await this.start();
    if (!this.fb) return;
    const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = this.fb.authMod;
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(this.fb.auth, provider); }
    catch (e: any) {
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') await signInWithRedirect(this.fb.auth, provider);
      else if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') { console.error(e); store.toast(store.t('syncError')); }
    }
  }

  async signOut() {
    if (this.fb) await this.fb.authMod.signOut(this.fb.auth);
  }

  private disconnect() { this.stops.forEach((s) => s()); this.stops = []; }

  private async connect(uid: string) {
    this.disconnect();
    this.state = navigator.onLine ? 'syncing' : 'offline';
    const { db, fs } = this.fb;
    const col = (c: Collection) => fs.collection(db, 'users', uid, c);
    try {
      // 1. Initial merge: newer record wins, local-only and newer local records are uploaded.
      const local = store.snapshot();
      for (const c of COLLECTIONS) {
        const snap = await fs.getDocs(col(c));
        const remote: Record<string, any> = {};
        snap.forEach((d: any) => { remote[d.id] = { ...d.data(), id: d.id }; });
        const mine: Record<string, any> = c === 'settings' ? { main: local.settings } : local[c];
        const { merged, upload, drop } = initialMerge(mine, remote);
        store.applyRemote(c, Object.values(merged));
        if (c !== 'settings' && drop.length) store.dropLocal(c, drop);
        for (let i = 0; i < upload.length; i += 400) {
          const batch = fs.writeBatch(db);
          upload.slice(i, i + 400).forEach((r: any) => batch.set(fs.doc(col(c), r.id), clean(r)));
          await batch.commit();
        }
      }
      // 2. Live updates from other devices.
      for (const c of COLLECTIONS) {
        this.stops.push(fs.onSnapshot(col(c), { includeMetadataChanges: true }, (snap: any) => {
          const changed = snap.docChanges().filter((ch: any) => ch.type !== 'removed' && !ch.doc.metadata.hasPendingWrites)
            .map((ch: any) => ({ ...ch.doc.data(), id: ch.doc.id }));
          if (changed.length) store.applyRemote(c, changed);
          if (this.pending === 0) this.state = snap.metadata.fromCache && !navigator.onLine ? 'offline' : 'synced';
        }, (e: unknown) => { console.error(e); this.state = 'error'; }));
      }
      // 3. Local edits go up.
      this.stops.push(store.onChange((c, rec) => {
        this.pending += 1;
        fs.setDoc(fs.doc(col(c), rec.id), clean(rec))
          .catch((e: unknown) => { console.error(e); this.state = 'error'; })
          .finally(() => { this.pending -= 1; });
      }));
      this.state = navigator.onLine ? 'synced' : 'offline';
    } catch (e) {
      console.error(e);
      this.state = navigator.onLine ? 'error' : 'offline';
    }
  }
}

export const sync = new Sync();
