const CACHE = 'tablegate-frontend-recovery-v9-20260801-1';
const REQUIRED_SHELL = [
  './tablegate.html',
  './manifest.webmanifest',
  './css/tablegate/shell/tokens.css',
  './css/tablegate/shell/app.css',
  './css/tablegate/shell/components.css',
  './css/tablegate/shell/responsive.css',
  './css/tablegate/shell/workspaces.css',
  './js/tablegate/shell/tablegate-shell.bundle.js',
  './assets/images/tablegate/icons/tablegate-icon-192.png',
  './assets/images/tablegate/icons/tablegate-icon-512.png',
  './assets/images/tablegate/icons/favicon.ico'
];

self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE)
    .then(cache => cache.addAll(REQUIRED_SHELL))
    .then(() => self.skipWaiting())
));

self.addEventListener('activate', event => event.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('tablegate-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));

function shouldUseNetworkFirst(request, url) {
  return request.mode === 'navigate' || /\.(?:html?|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/service-worker.js');
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('./tablegate.html');
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(shouldUseNetworkFirst(event.request, url) ? networkFirst(event.request) : cacheFirst(event.request));
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'CLEAR_TABLEGATE_CACHES') return;
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('tablegate-')).map(key => caches.delete(key))))
      .then(() => self.skipWaiting())
  );
});
