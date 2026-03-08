const CACHE_NAME = 'vocab-cache-v2';
const API_CACHE_NAME = 'vocab-api-cache-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or non-HTTP/HTTPS schemes (e.g., chrome-extension)
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle Google Script API requests differently to avoid CORS/Cache-Put crashes
  if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Fire and forget cache update. Don't let it crash the main response.
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(API_CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(err => console.warn('PWA Cache put failed for API:', err));
          }
          return response;
        })
        .catch(err => {
          console.warn('Network fetch failed for API, falling back to cache', err);
          return caches.match(event.request);
        })
    );
    return;
  }

  // Network First, fallback to cache for HTML/navigation (SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache First, fallback to network for static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Found in cache
        }
        return fetch(event.request).then(
          response => {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(err => console.warn('PWA Cache put failed for static asset:', err));
            
            return response;
          }
        );
      })
  );
});
