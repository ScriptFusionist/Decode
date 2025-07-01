const CACHE_NAME = 'smartdecode-v1';
const urlsToCache = [
  '/', // root
  '/index.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn-icons-png.flaticon.com/512/565/565547.png'
];

// Saat pertama kali diinstall: simpan cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting(); // langsung aktif
});

// Hapus cache lama saat activate
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

// Intercept semua request
self.addEventListener('fetch', event => {
  // Hanya tangani GET saja
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika ditemukan di cache, pakai cache
        if (response) return response;

        // Jika tidak, ambil dari internet
        return fetch(event.request)
          .then(fetchRes => {
            // Simpan salinan ke cache jika dari origin yang valid
            const clone = fetchRes.clone();
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
        // Fallback jika total offline
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});