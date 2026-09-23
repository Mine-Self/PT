const CACHE_NAME = 'proj-manager-cache-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (evt) => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((resp) => resp || fetch(evt.request).catch(() => caches.match('./index.html')))
  );
});

// Show a notification requested by the page (works even if the tab is backgrounded,
// as long as the browser keeps the service worker alive; not guaranteed once the
// app/browser is fully closed on Android — this is a platform limitation, not ours).
self.addEventListener('message', (evt) => {
  if (evt.data && evt.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = evt.data;
    self.registration.showNotification(title, options);
  }
});

self.addEventListener('notificationclick', (evt) => {
  evt.notification.close();
  evt.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});
