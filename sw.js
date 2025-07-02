const CACHE_NAME = 'smartdecode-VERSION_PLACEHOLDER';

const urlsToCache = [
  './',
  './index.html?v=VERSION_PLACEHOLDER',
  './manifest.json?v=VERSION_PLACEHOLDER',
  './icons/icon-192.png?v=VERSION_PLACEHOLDER',
  './icons/icon-512.png?v=VERSION_PLACEHOLDER',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn-icons-png.flaticon.com/512/565/565547.png'
];

// Install Service Worker dan cache file
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(urlsToCache.map(url => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// Aktivasi: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Cache first, fallback ke network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        const clone = response.clone();
        if (
          event.request.url.startsWith(self.location.origin) ||
          event.request.url.includes('cdn.jsdelivr.net') ||
          event.request.url.includes('flaticon.com')
        ) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    }).catch(() => {
      if (event.request.destination === 'document') {
        return caches.match('./index.html?v=VERSION_PLACEHOLDER');
      }
    })
  );
});
