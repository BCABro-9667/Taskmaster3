// A robust, production-ready service worker for a Next.js PWA.

const CACHE_NAME = 'taskmaster-cache-v2'; // Updated version
const PRECACHE_ASSETS = [
    '/',
    '/manifest.json',
    '/logo.png',
    '/logo192.png',
    '/logo512.png',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching pre-cache assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                // Force the new service worker to become active immediately.
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', (event) => {
    // This event is fired when the service worker is activated.
    // It's a good place to clean up old caches.
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Tell the active service worker to take control of the page immediately.
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Don't intercept API calls or Next.js internal requests for hot-reloading.
    if (request.url.includes('/api/') || request.url.includes('/_next/')) {
        return;
    }

    // For navigation requests (e.g., loading a page), use a network-first strategy.
    // This ensures users always get the latest HTML page.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // If the network request is successful, cache it for offline use.
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // If the network fails, serve the cached version of the root page.
                    return caches.match('/');
                })
        );
        return;
    }
    
    // For all other requests (CSS, JS, images), use a cache-first strategy.
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            // If the resource is in the cache, return it.
            if (cachedResponse) {
                return cachedResponse;
            }

            // If it's not in the cache, fetch it from the network.
            return fetch(request).then((networkResponse) => {
                // Cache the newly fetched resource for future use.
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // If both cache and network fail, you can provide a generic fallback.
                // This is optional and depends on your app's needs.
            });
        })
    );
});

// Listen for the 'sync' event to handle background synchronization.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-changes') {
    console.log('Service Worker: Received sync event');
    // Notify the client (the open app window) to start the sync process.
    // This is a reliable way to trigger the sync logic in your main app code.
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_OFFLINE_DATA' });
        });
      })
    );
  }
});
