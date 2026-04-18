/* MediSync Service Worker — Push Notifications */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'MediSync', body: event.data.text(), url: '/' };
  }

  const title = payload.title ?? 'MediSync';
  const options = {
    body:    payload.body  ?? '',
    icon:    payload.icon  ?? '/icon-192.png',
    badge:   payload.badge ?? '/badge-72.png',
    tag:     payload.tag   ?? 'medisync',
    data:    { url: payload.url ?? '/' },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open',    title: 'Abrir' },
      { action: 'dismiss', title: 'Cerrar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
