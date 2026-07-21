// TNSVT Service Worker - PWA + Offline fallback
// v4.24: bump + network-first ciego a TODO el path (la baseURL es ahora
// la misma origin si server.url está vacío, o un baseURL configurable
// desde el cliente). Mantener timeout 1.5s para respuestas rápidas offline.
const CACHE_NAME = 'tnsvt-v61';
const RUNTIME_CACHE = 'tnsvt-runtime-v61';
const LEGACY_CACHE_HINTS = ['tnsvt-v57', 'tnsvt-v58', 'tnsvt-v59', 'tnsvt-v60',
  'tnsvt-runtime-v57', 'tnsvt-runtime-v58', 'tnsvt-runtime-v59', 'tnsvt-runtime-v60'];
// Rutas GET que admiten timeout-then-cache (lecturas offline)
const TIMEOUT_CACHE_PATHS = ['/api/notifications', '/api/chat', '/api/sync/snapshot'];
const RUNTIME_TTL_MS = 30 * 60 * 1000;

// Config files que CAMBIAN en cada recompilación — NO cachear nunca.
// Siempre network-first para que el navegador reciba los hashes correctos.
const NETWORK_FIRST_PATHS = [
  '/assets/importmap.json',
  '/assets/entrypoint.app.json',
  '/assets/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // Borrar TODAS las caches viejas (incluyendo legacy hints)
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => cacheNames.filter((name) => !currentCaches.includes(name) || LEGACY_CACHE_HINTS.includes(name)))
      .then((cachesToDelete) => Promise.all(cachesToDelete.map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

// Listener de mensaje para que la pagina pueda forzar limpieza
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
  if (event.data && event.data.type === 'fcm-background' && self.firebaseMessaging) {
    self.firebaseMessaging.onBackgroundMessage(event.data.payload);
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin
  if (url.origin !== self.location.origin) return;
  // Skip non-GET
  if (request.method !== 'GET') return;

  const path = url.pathname;
  const isHTML = request.headers.get('accept')?.includes('text/html');

  // ── Network-first con timeout 1.5s para rutas offline-friendly ──
  function networkFirst(timeoutMs) {
    const ms = (typeof timeoutMs === 'number' && timeoutMs > 0) ? timeoutMs : 4000;
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) => setTimeout(() => reject(new Error('sw-timeout')), ms))
      ]).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
        }
        return response;
      }).catch(() => caches.match(request).then((r) => r || new Response(
        JSON.stringify({ error: 'offline', message: 'Sin conexion' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )))
    );
  }

  function cacheFirst() {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        }).catch(() => {
          if (isHTML) return caches.match('/');
        });
      })
    );
  }

  // ── API: network-first con timeout corto en rutas offline-friendly ──
  if (path.startsWith('/api/')) {
    const useTimeout = TIMEOUT_CACHE_PATHS.some((p) => path.startsWith(p));
    networkFirst(useTimeout ? 1500 : 4000);
    return;
  }

  // ── Assets con ?v= (cache-bust explicito): bypass cache ──
  if (url.searchParams.has('v') || /\?v=/.test(url.search)) {
    event.respondWith(fetch(request));
    return;
  }

  // ── Config files que cambian (importmap, entrypoint): network-first ──
  if (NETWORK_FIRST_PATHS.some((p) => path === p || path.endsWith(p))) {
    networkFirst();
    return;
  }

  // ── HTML pages: network-first (para recibir siempre el importmap correcto) ──
  if (isHTML) { networkFirst(); return; }

  // ── Everything else (hashed JS, CSS, fonts, icons): cache-first ──
  cacheFirst();
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