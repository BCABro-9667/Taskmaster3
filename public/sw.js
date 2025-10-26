const CACHE_NAME = 'taskmaster-cache-v2';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  // Next.js static assets - remove leading slash
  'next/static/css/app/layout.css', 
  'next/static/chunks/webpack.js',
  'next/static/chunks/main-app.js',
  'next/static/chunks/app/layout.js',
  'next/static/chunks/app/page.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Passion+One:wght@400;700;900&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2',
  'https://fonts.gstatic.com/s/passionone/v15/Q-gJrXjG53Xj1jKwxZ3iUi9a_MekG00.woff2',
];

// URLs that should use Network First strategy (for API calls)
const NETWORK_FIRST_URLS = [
  '/api/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching pre-cache assets');
        return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        self.skipWaiting();
      })
      .catch(error => {
        console.error("Service Worker: Pre-caching failed:", error);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Strategy: Stale-While-Revalidate for navigations and specified assets
  if (PRECACHE_ASSETS.includes(url.pathname) || event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponsePromise = fetch(event.request).then((networkResponse) => {
            if(networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(error => {
              console.log('Fetch failed; returning offline page instead.', error);
              return caches.match('/');
          });
          return cachedResponse || fetchedResponsePromise;
        });
      })
    );
    return;
  }
  
  // Strategy: Network First for API requests (to get fresh data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          const cacheableResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cacheableResponse));
        }
        return networkResponse;
      }).catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
    );
    return;
  }

  // Strategy: Cache First for other requests
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
                const cacheableResponse = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, cacheableResponse));
            }
            return networkResponse;
        });
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-changes') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_OFFLINE_DATA' });
        });
      })
    );
  }
});