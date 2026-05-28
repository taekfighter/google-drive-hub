/* =====================================================
   SERVICE WORKER — Game Hub
   Caches static assets on install; serves from cache
   on repeat visits so CSS/JS loads instantly.
   Network-first for HTML so auth/kick/lockdown always
   reflects the live server state.
===================================================== */
const CACHE  = 'gamehub-v2';
const STATIC = [
  'styles.css',
  'hub.min.js',
  'personal.min.js',
  'logo.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network-first for HTML and Firebase
  if (e.request.destination === 'document' || url.hostname.includes('firebase')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Cache-first for static assets (CSS, JS, images, fonts)
  if (['style','script','image','font'].includes(e.request.destination)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  e.respondWith(fetch(e.request));
});
