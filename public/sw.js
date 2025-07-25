
const CACHE_NAME = 'taskmaster-cache-v1';
const OFFLINE_URL = '/offline.html'; // A page to show when offline. We will need to create this.

const urlsToCache = [
  '/',
  '/dashboard',
  '/assignees',
  '/task-progress',
  '/profile',
  '/login',
  '/manifest.json',
  '/logo.png',
  // We can add more specific assets here if needed, e.g., CSS, JS files
  // Next.js build files are dynamically named, so caching them requires a more advanced strategy,
  // usually handled by libraries like `workbox-webpack-plugin`. For this, we'll keep it simple
  // and focus on page routes and key assets.
];

// Install the service worker and cache key assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Failed to cache urls:', error);
        });
      })
  );
  self.skipWaiting();
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});


// Serve cached content when offline
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          console.log('Fetch failed; returning offline page instead.', error);
          const cache = await caches.open(CACHE_NAME);
          // If the offline page isn't cached, this will fail. A real-world app needs an offline.html file.
          // For now, we will return a generic response.
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) return cachedResponse;
          
          return new Response('<h1>You are offline</h1><p>Please check your internet connection.</p>', {
            headers: { 'Content-Type': 'text/html' }
          });
        }
      })()
    );
  } else if (event.request.url.includes('/api/')) { // Example: handle API requests separately
     event.respondWith(
        fetch(event.request).catch(() => {
            return new Response(JSON.stringify({ error: 'Offline: Could not connect to API.' }), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});


// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-offline-changes') {
    console.log('Service Worker: Firing sync event');
    event.waitUntil(self.clients.get(event.clientId).then(client => {
      if(client) {
         client.postMessage({ type: 'SYNC_REQUEST' });
      }
    }));
  }
});
