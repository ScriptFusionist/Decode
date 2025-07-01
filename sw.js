const CACHE_NAME = 'smartdecode-v1';

// Auto-detect base path (e.g. /decode/)
const BASE_PATH = self.location.pathname.replace(/sw\.js$/, '');

// Daftar file untuk dicache
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn-icons-png.flaticon.com/512/565/565547.png'
];

// Saat pertama kali diinstall: simpan cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url).catch(err => console.warn('⚠️ Gagal cache:', url)))
      );
    })
  );
  self.skipWaiting(); // Langsung aktif tanpa tunggu close tab
});

// Saat aktif: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim(); // Ambil kendali langsung
});

// Intercept semua request GET
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;

        return fetch(event.request).then(fetchRes => {
          const clone = fetchRes.clone();

          // Cache hanya file dari origin sendiri atau CDN
          if (
            event.request.url.startsWith(self.location.origin) ||
            event.request.url.includes('cdn.jsdelivr.net') ||
            event.request.url.includes('flaticon.com')
          ) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }

          return fetchRes;
        });
      })
      .catch(() => {
        // Fallback jika offline dan file HTML
        if (event.request.destination === 'document') {
          return caches.match(BASE_PATH + 'index.html');
        }
      })
  );
});
