// TNSVT Service Worker - PWA + Offline fallback
// v41: multi-trading-accounts (max 3 per user, soft-delete)
const CACHE_NAME = 'tnsvt-v42';
const RUNTIME_CACHE = 'tnsvt-runtime-v42';

// No precacheamos nada que pueda 404. En debug mode Symfony sirve
// assets/ directamente, en prod los compila con hash. El runtime cache
// los agarra cuando el usuario navega.
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
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
  // Compatibilidad con firebase-messaging-sw.js que delega al SW principal
  if (event.data && event.data.type === 'fcm-background' && self.firebaseMessaging) {
    self.firebaseMessaging.onBackgroundMessage(event.data.payload);
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

// Handle FCM background messages (delegate to Firebase Messaging via postMessage desde firebase-messaging-sw.js)
self.addEventListener('push', (event) => {
  // Si firebase-messaging-sw.js está activo y manejó el push, no hacer nada.
  // Si NO hay firebase-messaging-sw.js o falla, mostrar notificación genérica.
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { notification: { title: 'T.N.S.V.T', body: event.data.text() } };
  }
  const notif = payload.notification || {};
  const title = notif.title || 'T.N.S.V.T';
  const body = notif.body || '';
  const data = payload.data || {};
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/', ...data },
      tag: data.tag || 'tnsvt-push',
      renotify: true,
      vibrate: [200, 100, 200],
    })
  );
});

// Click en la notificación nativa → abre la URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});