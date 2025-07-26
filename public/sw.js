
const CACHE_NAME = 'taskmaster-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  // Next.js build files will be added dynamically if using a build tool plugin,
  // but for a simple SW, we rely on caching them as they are requested.
];

// Install event: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // We don't cache all assets initially to avoid including build-specific hashes.
        // Instead, we cache them on the fly.
        // return cache.addAll(ASSETS_TO_CACHE);
        return Promise.resolve();
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


// Fetch event: serve assets from cache or network
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For API calls, use a network-first strategy to always get fresh data if online.
  // The stale-while-revalidate logic is handled in the client with react-query.
  // The offline mutations are handled by the background sync logic.
  if (event.request.url.includes('/api/')) {
    // For now, let API requests pass through. Offline handling is in libs.
    return; 
  }

  // For all other requests (static assets), use a cache-first strategy.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request)
        .then((response) => {
          // If the resource is in the cache, return it.
          if (response) {
            return response;
          }
          
          // Otherwise, fetch it from the network.
          return fetch(event.request).then((networkResponse) => {
            // Cache the new resource for future use.
            // We clone the response because it's a one-time-use stream.
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // If both cache and network fail (e.g., offline and not cached),
          // you could return a fallback page, but for assets, failing is often okay.
        });
    })
  );
});


// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-changes') {
    console.log('Background sync event triggered!');
    // The syncOfflineChanges function needs to be imported and called here.
    // However, since service workers cannot directly import ES modules from the app,
    // the offline-sync logic will be triggered from the app when it comes online.
    // This 'sync' event serves as a more robust trigger for browsers that support it.
    
    // The client-side code in `offline-sync.ts` already handles the sync logic
    // when the app is loaded or comes back online. This event provides an additional
    // trigger for that process. We can notify the client.
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_OFFLINE_DATA' });
        });
      })
    );
  }
});
