// TNSVT Service Worker - PWA + Offline fallback
// v32: aggressive cache cleanup + skipWaiting + clients.claim para forzar update
const CACHE_NAME = 'tnsvt-v34';
const RUNTIME_CACHE = 'tnsvt-runtime-v32';

// IMPORTANTE: NO incluir app-XYZ.js ni api-XYZ.js aqui porque cambian de hash.
// Se cachean via runtime cache cuando el usuario los pide.
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/styles/app.css',
  '/api.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // Borrar TODAS las caches viejas, no solo las que no coinciden con CACHE_NAME.
  // Asi eliminamos bundles viejos app-oWqx8PY.js, app-LwQSa33.js, etc.
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => cacheNames.filter((name) => !currentCaches.includes(name)))
      .then((cachesToDelete) => Promise.all(cachesToDelete.map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

// Listener de mensaje para que la pagina pueda forzar SKIP_WAITING + reload
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.clients.claim())
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API: network-first, fallback to cache (sin cachear errores)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response(
              JSON.stringify({ error: 'offline', message: 'Sin conexion' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Static assets: cache-first PERO con bypass de cache cuando hay query
  // especial ?v=2.0 (cache-bust forzado). Esto evita servir bundles viejos.
  const isCacheBust = url.searchParams.has('v') || /\?v=/.test(url.search);
  if (isCacheBust) {
    event.respondWith(fetch(request));
    return;
  }

  // Para assets estaticos normales (sin ?v=), usar cache-first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return response;
      }).catch(() => {
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
});

// Handle FCM background messages (delegate to Firebase Messaging)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'fcm-background') {
    if (self.firebaseMessaging) {
      self.firebaseMessaging.onBackgroundMessage(event.data.payload);
    }
  }
});