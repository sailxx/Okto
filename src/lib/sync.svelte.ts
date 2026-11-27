// Optional cloud sync through Firebase (free Spark plan). Without VITE_FIREBASE_* the app stays local-only.
import { initialMerge } from './merge';
import type { Collection } from './model';
import { store } from './store.svelte';
import { androidCall, isBundledAndroid } from './android';

export type SyncState = 'off' | 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};
export const syncEnabled = Boolean(config.apiKey && config.projectId);

const COLLECTIONS: Collection[] = ['settings', 'tasks', 'lists', 'sessions', 'counters', 'notes', 'habits', 'health', 'money'];
// Firestore rejects `undefined` values.
const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v));

class Sync {
  state = $state<SyncState>(syncEnabled ? 'signed-out' : 'off');
  user = $state<{ name: string; email: string } | null>(null);
  private fb: any = null;
  private stops: (() => void)[] = [];
  private pending = 0;
  private starting: Promise<void> | null = null;

  async start() {
    if (!syncEnabled || this.fb) return;
    this.starting ??= this.initialize().finally(() => { this.starting = null; });
    await this.starting;
  }

  private async initialize() {
    try {
      const [{ initializeApp }, auth, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
      const app = initializeApp(config);
      const db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
      const authInstance = isBundledAndroid
        ? auth.initializeAuth(app, { persistence: [auth.indexedDBLocalPersistence, auth.browserLocalPersistence] })
        : auth.getAuth(app);
      this.fb = { auth: authInstance, authMod: auth, db, fs };
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
    if (isBundledAndroid) {
      try {
        const token = await androidCall<string | null>({ type: 'signIn' });
        const { GoogleAuthProvider, signInWithCredential } = this.fb.authMod;
        if (token) await signInWithCredential(this.fb.auth, GoogleAuthProvider.credential(token));
      } catch (e) { console.error(e); store.toast(store.t('syncError')); }
      return;
    }
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
    if (isBundledAndroid) await androidCall({ type: 'signOut' });
  }

  async completeTraySignIn(idToken: string) {
    try {
      await this.start();
      if (!this.fb) throw new Error('Okto cloud sync is unavailable');
      const { GoogleAuthProvider, signInWithCredential } = this.fb.authMod;
      await signInWithCredential(this.fb.auth, GoogleAuthProvider.credential(idToken));
      return 'ok';
    } catch (error) {
      store.toast(store.t('syncError'));
      const code = (error as { code?: unknown } | null)?.code;
      return typeof code === 'string' && /^auth\/[a-z0-9-]{1,64}$/.test(code) ? code : 'auth/unknown';
    }
  }

  private disconnect() { this.stops.forEach((s) => s()); this.stops = []; }

  private async connect(uid: string) {
    this.disconnect();
    this.state = navigator.onLine ? 'syncing' : 'offline';
    const { db, fs } = this.fb;
    const col = (c: Collection) => fs.collection(db, 'users', uid, c);
    let initializing = true;
    const queued = new Map<string, { c: Collection; rec: any }>();
    this.stops.push(store.onChange((c, rec) => {
      if (c === 'settings' && isBundledAndroid && store.device.androidSettingsOwner !== uid) return;
      if (initializing) { queued.set(`${c}/${rec.id}`, { c, rec }); return; }
      this.pending += 1;
      fs.setDoc(fs.doc(col(c), rec.id), clean(rec))
        .catch((e: unknown) => { console.error(e); this.state = 'error'; })
        .finally(() => { this.pending -= 1; });
    }));
    try {
      // 1. Initial merge: newer record wins, local-only and newer local records are uploaded.
      for (const c of COLLECTIONS) {
        const snap = await fs.getDocs(col(c));
        if (this.fb.auth && this.fb.auth.currentUser?.uid !== uid) return;
        const remote: Record<string, any> = {};
        snap.forEach((d: any) => { remote[d.id] = { ...d.data(), id: d.id }; });
        // First Android sign-in restores the account's settings before the fresh install can upload its defaults.
        if (c === 'settings' && isBundledAndroid && store.device.androidSettingsOwner !== uid) {
          if (!remote.main && snap.metadata.fromCache) continue;
          store.restoreAccountSettings(remote.main, uid);
          if (remote.main) continue;
        }
        const local = store.snapshot();
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
          if (c === 'settings' && isBundledAndroid && store.device.androidSettingsOwner !== uid) {
            const settings = changed.find((rec: any) => rec.id === 'main');
            if (settings || !snap.metadata.fromCache) store.restoreAccountSettings(settings, uid);
          } else if (changed.length) store.applyRemote(c, changed);
          if (this.pending === 0) this.state = snap.metadata.fromCache && !navigator.onLine ? 'offline' : 'synced';
        }, (e: unknown) => { console.error(e); this.state = 'error'; }));
      }
      // Replay edits made during reads and initial uploads, after the older batches.
      while (queued.size) {
        const changes = [...queued.values()];
        queued.clear();
        const current = store.snapshot();
        const replay = changes.filter(({ c, rec }) => {
          const latest = c === 'settings' ? current.settings : current[c][rec.id];
          return latest?.updatedAt === rec.updatedAt;
        });
        for (let i = 0; i < replay.length; i += 400) {
          const batch = fs.writeBatch(db);
          replay.slice(i, i + 400).forEach(({ c, rec }) => batch.set(fs.doc(col(c), rec.id), clean(rec)));
          await batch.commit();
        }
      }
      initializing = false;
      // 4. Pomodoro, timer and stopwatch: one record shared with the Android widget, newer wins.
      const liveRef = fs.doc(db, 'users', uid, 'live', 'focus');
      let liveTimer: ReturnType<typeof setTimeout> | undefined;
      const pushLive = () => {
        clearTimeout(liveTimer);
        liveTimer = setTimeout(() => {
          fs.setDoc(liveRef, clean(store.liveDoc())).catch((e: unknown) => console.error(e));
        }, 250);
      };
      const first = await fs.getDoc(liveRef).catch(() => null);
      if (!(first?.exists() && store.applyLive(first.data())) && store.device.liveAt > (first?.data()?.updatedAt ?? 0)) pushLive();
      this.stops.push(fs.onSnapshot(liveRef, (snap: any) => {
        if (snap.exists() && !snap.metadata.hasPendingWrites) store.applyLive(snap.data());
      }, (e: unknown) => console.error(e)));
      this.stops.push(store.onLive(pushLive));
      this.stops.push(() => clearTimeout(liveTimer));
      this.state = navigator.onLine ? 'synced' : 'offline';
    } catch (e) {
      this.disconnect();
      console.error(e);
      this.state = navigator.onLine ? 'error' : 'offline';
    }
  }
}

export const sync = new Sync();
