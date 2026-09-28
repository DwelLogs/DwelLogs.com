/* DwelLogs service worker.

   Why this exists: the app's data lives entirely in localStorage, but until
   now the app itself could not start without a network round trip. A home
   maintenance app gets opened in basements, garages and crawl spaces -- the
   exact places with no signal, holding the exact data already on the phone.

   STAMP is written by build_app.py from a hash of index.html + api.js. It is
   not edited by hand. Everything cached is namespaced under it, so a deploy
   makes a new cache and the old one is deleted on activate.

   Navigations are NETWORK-FIRST with a short timeout, deliberately. Cache-first
   would be a few hundred milliseconds faster on repeat opens, and it is the
   usual advice -- but it also means a bad deploy pins a broken app on somebody
   else's phone with no way to reach them. Mid-test that is not a trade worth
   making. The network is tried first, a slow or absent one falls back to cache
   immediately, and offline still works completely. Revisit once the update
   path has been proven in the field.  */

const STAMP = 'f91389817e';
const CACHE = 'dwellogs-' + STAMP;
const SHELL = ['./', 'index.html', 'api.js?v=' + STAMP, 'manifest.webmanifest',
               'icon-192.png', 'icon-512.png'];
const NAV_TIMEOUT = 2500;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    /* One bad URL must not fail the whole install and leave the app with no
       worker at all, so each is added on its own and a miss is survivable. */
    await Promise.all(SHELL.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('dwellogs-') && k !== CACHE)
                          .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function fromNetworkFirst(req) {
  return new Promise(resolve => {
    let settled = false;
    const done = r => { if (!settled) { settled = true; resolve(r); } };
    const timer = setTimeout(async () => {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) done(hit);
    }, NAV_TIMEOUT);
    fetch(req).then(async res => {
      clearTimeout(timer);
      if (res && res.ok) {
        const c = await caches.open(CACHE);
        c.put(req, res.clone()).catch(() => {});
      }
      done(res);
    }).catch(async () => {
      clearTimeout(timer);
      const hit = await caches.match(req, { ignoreSearch: true })
               || await caches.match('index.html');
      done(hit || Response.error());
    });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') { e.respondWith(fromNetworkFirst(req)); return; }

  /* Assets carry the stamp in their URL, so a cache hit is always the right
     one for this build. Revalidating in the background keeps an unstamped
     asset from going stale forever. */
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    const net = fetch(req).then(async res => {
      if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()).catch(() => {}); }
      return res;
    }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'WIPE') {
    caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
      .then(() => self.registration.unregister());
  }
});
