/**
 * Med-Verify PRO - Active Self-Destruct Service Worker
 * Purges all cached application shells, offline assets, and unregisters itself
 * to ensure that all clients force-reload fresh production code from Vercel.
 */

self.addEventListener('install', (event) => {
  console.log('🧹 PWA Service Worker: Self-Destruct Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('🧹 Flushing Cache database:', key);
          return caches.delete(key);
        })
      );
    })
    .then(() => {
      console.log('🧹 Unregistering Service Worker...');
      return self.registration.unregister();
    })
    .then(() => {
      console.log('🧹 Purge successful. Relaying reload to active clients.');
      return self.clients.matchAll();
    })
    .then((clients) => {
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    })
  );
});
