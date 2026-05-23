/**
 * Med-Verify PRO PWA Service Worker
 * Implements Low-Bandwidth Rural Optimization strategies:
 * - Aggressive offline caching of core shell assets (JS, CSS, static layouts, fallback icons)
 * - Intercept-and-fallback logic to serve cached content during network dropouts
 * - Local resource buffering for slow 3G environments
 */

const CACHE_NAME = 'med-verify-pro-v1';
const OFFLINE_URL = '/offline.html';

// Assets that form the essential application shell
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/src/App.module.css',
  '/favicon.ico'
];

// Install Event: cache core assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 PWA Service Worker: Pre-caching Core Application Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clear old caches to prevent stale script loading
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 PWA Service Worker: Flushing Outdated Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: intercept requests and apply Cache-First / Network-Fallback strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API requests (handled with live force-dynamic SSR)
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset immediately for ultra-fast 3G load times
        return cachedResponse;
      }

      // Fallback to active network request
      return fetch(event.request)
        .then((networkResponse) => {
          // Check for valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clone response and cache dynamically
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Network failed (offline status) - serve offline shell page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});
