/* DwelLogs service worker.

   Why this exists: the app's data lives entirely in localStorage, but until
   now the app itself could not start without a network round trip. A home
   maintenance app gets opened in basements, garages and crawl spaces -- the
   exact places with no signal, holding the exact data already on the phone.

   STAMP is written by build_app.py from a hash of index.html + api.js. It is
   not edited by hand. Everything cached is namespaced under it, so a deploy
   makes a new cache and the old one is deleted on activate.

   Navigations are CACHE-FIRST (1 Oct). They were network-first with a 2.5 s
   wait, so a bad deploy could never pin a broken app on somebody's phone --
   and the price was a blank screen on every open after an update while the
   new page came down over rural signal (Randi, after v0.4.0). Now the page on
   the phone opens at once, the app asks for an update itself and shows
   "Getting the new version" when there is one, and the safety net is where
   it belongs: releases pass the flow suite first, an install that cannot
   fetch the whole new page and code fails and leaves the working version in
   place, and /app/?fresh=1 still clears a stuck phone. */

const STAMP = '0b2013df62';
const CACHE = 'dwellogs-' + STAMP;
const SHELL = ['./', 'index.html', 'api.js?v=' + STAMP, 'manifest.webmanifest',
               'icon-192.png', 'icon-512.png'];
const CORE = ['index.html', 'api.js?v=' + STAMP];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    /* `reload` skips the browser's HTTP cache. Pages sets max-age=600, so
       within ten minutes of a deploy a plain fetch could hand this NEW worker
       the OLD index.html, and it would serve that from cache for good.
       The page and its code must both arrive or the install fails, and the
       version already on the phone keeps running. Icons are allowed to miss. */
    await c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));
    await Promise.all(SHELL.filter(u => !CORE.includes(u))
      .map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
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

/* The page as this worker shipped it, at once. Only a phone that has never
   cached it (the very first open) waits for the network. An invite link
   carries a query and is still the same page. */
async function fromCacheFirst(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match('index.html') || await c.match(req, { ignoreSearch: true });
  if (hit) return hit;
  try { return await fetch(req); }
  catch (e) { return (await caches.match('index.html')) || Response.error(); }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') { e.respondWith(fromCacheFirst(req)); return; }

  /* Assets carry the stamp in their URL, so a cache hit is always the right
     one for this build -- which was true of the comment and false of the code:
     `ignoreSearch` threw the stamp away before matching, so api.js?v=NEW
     happily matched the cached api.js?v=OLD. The first launch after every
     deploy therefore ran the new index.html against the PREVIOUS api.js, and
     only came right on the launch after that. Reproduced with two builds and a
     real worker before believing it.

     That is the exact failure build_app.py exists to prevent, arriving through
     the cache instead of through a hand-kept number. Matched exactly now, so a
     new stamp is a miss and goes to the network. Navigations keep ignoreSearch
     on purpose -- an invite link carries a query and is still the same page. */
  e.respondWith((async () => {
    const hit = await caches.match(req);
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
