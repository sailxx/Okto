// Okto service worker: system notifications (also on Android), focusing the open tab
// on a notification click, and offline start-up. Pages go to the network first and fall
// back to the cache; built assets (hashed names) and fonts are served from the cache.
// Other origins (Firebase) are left alone.
const CACHE = 'okto-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './manifest.webmanifest'])).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res.ok) cache.put('./', res.clone());
        return res;
      } catch {
        return (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    // Vite build output carries a content hash, so a cached copy never goes stale.
    if (hit && /-[\w-]{8}\.\w+$/.test(url.pathname)) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch {
      return hit || Response.error();
    }
  })());
});

// The live Focus notification (src/lib/liveNotify.ts) stays up: its buttons go to the open
// page without bringing it forward; with Okto closed they open it with ?live=<action>.
const LIVE = 'okto-live';
const windows = () => self.clients.matchAll({ type: 'window', includeUncontrolled: true });

self.addEventListener('notificationclick', (event) => {
  const live = event.notification.tag === LIVE;
  if (!live) event.notification.close();
  const action = live ? event.action || 'open' : '';
  event.waitUntil((async () => {
    const all = await windows();
    if (action && all.length) all[0].postMessage({ type: LIVE, action });
    if (action && action !== 'open' && all.length) return;
    if (all.length) return all[0].focus();
    return self.clients.openWindow(action ? `./?live=${encodeURIComponent(action)}#/focus` : './');
  })());
});

self.addEventListener('notificationclose', (event) => {
  if (event.notification.tag !== LIVE) return;
  event.waitUntil(windows().then((all) => all.forEach((c) => c.postMessage({ type: LIVE, action: 'dismiss' }))));
});
