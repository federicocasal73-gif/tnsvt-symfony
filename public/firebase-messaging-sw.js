/**
 * Firebase Messaging Service Worker - T.N.S.V.T
 *
 * IMPORTANTE: Este archivo se ejecuta en un contexto de Service Worker,
 * sin acceso al DOM ni a window. Solo puede usar las APIs del SW.
 *
 * Se encarga de:
 * 1. Inicializar Firebase en el contexto del SW
 * 2. Recibir mensajes push cuando el tab NO esta en foco (background)
 * 3. Mostrar la notificacion nativa del sistema operativo
 *
 * La configuracion se obtiene via /api/firebase/config (cacheada por 1h).
 * Si Firebase no esta configurado, este SW no hace nada (silently).
 */

'use strict';

// SDKs de Firebase v10+ (compat para usar el importScripts)
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const SW_NAME = '[TNSVT-SW]';
let firebaseApp = null;
let messaging = null;

async function getFirebaseConfig() {
  try {
    const resp = await fetch('/api/firebase/config');
    if (!resp.ok) {
      console.warn(SW_NAME, 'Firebase no configurado (HTTP ' + resp.status + ')');
      return null;
    }
    const data = await resp.json();
    if (!data.configured) {
      console.warn(SW_NAME, 'Backend dice: Firebase no configurado:', data.error);
      return null;
    }
    return {
      apiKey: data.apiKey,
      authDomain: data.authDomain,
      projectId: data.projectId,
      storageBucket: data.storageBucket,
      messagingSenderId: data.messagingSenderId,
      appId: data.appId,
    };
  } catch (e) {
    console.error(SW_NAME, 'Error al obtener config:', e);
    return null;
  }
}

function showLocalNotification(title, body, data) {
  const notifTitle = title || 'T.N.S.V.T';
  const notifOptions = {
    body: body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data || {},
    tag: (data && data.tag) || 'tnsvt-notif',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };
  return self.registration.showNotification(notifTitle, notifOptions);
}

self.addEventListener('install', (event) => {
  console.log(SW_NAME, 'Instalado, version:', self.registration ? self.registration.scope : 'unknown');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(SW_NAME, 'Activado');
  event.waitUntil(self.clients.claim());
});

// Cuando el usuario hace click en la notificacion
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const urlToOpen = new URL(data.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

(async function initMessaging() {
  try {
    const config = await getFirebaseConfig();
    if (!config) return;
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(config);
    } else {
      firebaseApp = firebase.app();
    }
    messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log(SW_NAME, 'Background message recibido:', payload);
      const title = (payload.notification && payload.notification.title) || 'T.N.S.V.T';
      const body = (payload.notification && payload.notification.body) || (payload.data && payload.data.text) || '';
      const data = {
        url: (payload.data && payload.data.url) || '/',
        type: (payload.data && payload.data.type) || 'generic',
        ...(payload.data || {}),
      };
      return showLocalNotification(title, body, data);
    });
    console.log(SW_NAME, 'Firebase Messaging inicializado para', config.projectId);
  } catch (e) {
    console.error(SW_NAME, 'Error inicializando Firebase:', e);
  }
})();
