const CACHE = 'tablegate-unified-v9-20260801';
const CORE = [
  './tablegate.html', './manifest.webmanifest',
  './css/tablegate/shell/tokens.css', './css/tablegate/shell/app.css',
  './css/tablegate/shell/components.css', './css/tablegate/shell/responsive.css',
  './css/tablegate/shell/workspaces.css',
  './js/tablegate/shell/config.js', './js/tablegate/shell/profile-template.js',
  './js/tablegate/shell/utils.js', './js/tablegate/shell/demo-data.js',
  './js/tablegate/shell/api.js', './js/tablegate/shell/state.js',
  './js/tablegate/shell/views.js', './js/tablegate/shell/workspaces.js',
  './js/tablegate/shell/workspace-templates.js', './js/tablegate/shell/app.js',
  './json/tablegate/knowledge-pack/catalog.json',
  './json/admins/lifesimulator/universal-spec-v9.json',
  './assets/images/tablegate/icons/tablegate-icon-192.png',
  './assets/images/tablegate/icons/tablegate-icon-512.png',
  './assets/images/tablegate/icons/favicon.ico'
];

self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())
));

self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())
));

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./tablegate.html') : Response.error())));
});
