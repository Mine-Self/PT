const CACHE_NAME = 'proj-manager-cache-v3';
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

// Clicking a notification: jump straight to the relevant task/subtask/sub-subtask.
self.addEventListener('notificationclick', (evt) => {
  evt.notification.close();
  const data = evt.notification.data || {};
  const targetUrl = data.itemId && data.projectId
    ? `./index.html?project=${encodeURIComponent(data.projectId)}&item=${encodeURIComponent(data.itemId)}`
    : './index.html';

  evt.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (data.itemId && data.projectId && 'postMessage' in client) {
            client.postMessage({ type: 'NAVIGATE', projectId: data.projectId, itemId: data.itemId });
          } else if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
