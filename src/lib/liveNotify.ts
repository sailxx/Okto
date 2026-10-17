// Posts the live Focus notification (live.ts) through the service worker and runs its buttons.
// Phones only: on a desktop every update would pop up again.
import { liveView, type LiveAction, type LiveView } from './live';
import { inAndroidApp, notifyGranted } from './alerts';
import { router } from './router.svelte';
import { store } from './store.svelte';
import { DICT } from './i18n';

const TAG = 'okto-live';
const supported = 'serviceWorker' in navigator && (inAndroidApp || matchMedia('(pointer: coarse)').matches);
let shown = '';
let current: LiveView | null = null;
let dismissed = '';
let queue = Promise.resolve();

/** Called on every tick: posts only when the text changes. The counter shows up once Okto goes to the background. */
export function liveSync(hidden: boolean) {
  if (!supported) return;
  let view: LiveView | null = null;
  if (store.device.notify && notifyGranted()) {
    const c = hidden && router.route === 'focus' && store.device.focusMode === 'counter' ? store.activeCounter() : null;
    view = liveView(store.device, store.pomoCfg(), c && { name: c.name, count: c.count, target: c.target, step: c.step }, Date.now(), DICT[store.lang]);
  }
  if (view && view.sticky === dismissed) view = null;
  else dismissed = '';
  current = view;
  const key = view ? JSON.stringify(view) : '';
  if (key === shown) return;
  shown = key;
  queue = queue.then(() => post(view)).catch(() => {});
}

async function post(view: LiveView | null) {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  if (!view) { for (const n of await reg.getNotifications({ tag: TAG })) n.close(); return; }
  const opts: NotificationOptions & { actions: LiveView['actions']; timestamp?: number; renotify: boolean } = {
    body: view.body, tag: TAG, icon: './assets/icon-192.png', badge: './assets/icon-192.png',
    silent: true, renotify: false, requireInteraction: true, timestamp: view.timestamp, actions: view.actions,
  };
  await reg.showNotification(view.title, opts);
}

function run(action: string) {
  if (action === 'open') { router.go('focus'); return; }
  if (action === 'dismiss') { dismissed = current?.sticky ?? ''; shown = ''; return; }
  switch (action as LiveAction) {
    case 'pomodoro:pause': store.pomoPause(); break;
    case 'pomodoro:resume': store.pomoStart(); break;
    // From the notification the next phase starts at once: otherwise the notification would just vanish.
    case 'pomodoro:skip': store.pomoAdvance(false); store.pomoStart(); break;
    case 'timer:pause': store.timerPause(); break;
    case 'timer:resume': store.timerStart(); break;
    case 'timer:add': store.timerAdd(60000); break;
    case 'stopwatch:pause': if (store.device.stopwatch.startedAt) store.swToggle(); break;
    case 'stopwatch:resume': if (!store.device.stopwatch.startedAt) store.swToggle(); break;
    case 'stopwatch:reset': store.swReset(); break;
    case 'counter:plus': store.counterStep(1); break;
    case 'counter:minus': store.counterStep(-1); break;
  }
}

if (supported) {
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.type === TAG) run(String(e.data.action)); });
  navigator.serviceWorker.startMessages();
  // A button pressed while Okto was closed: the service worker opens it with ?live=<action>.
  const url = new URL(location.href);
  const action = url.searchParams.get('live');
  if (action) {
    url.searchParams.delete('live');
    history.replaceState(null, '', url);
    queueMicrotask(() => run(action));
  }
}
