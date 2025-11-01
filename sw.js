const CACHE_NAME = 'wheel-app-cache-v3';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Install
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }))
        )
    );
    self.clients.claim();
});

// Fetch
self.addEventListener('fetch', event => {
    // For navigation requests (typing URL or refresh)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('/index.html') // serve cached index.html
                .then(cached => cached || fetch('/index.html'))
                .catch(() => caches.match('/index.html')) // fallback when offline
        );
        return;
    }

    // For other requests (CSS, JS, images)
    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request))
    );
});
