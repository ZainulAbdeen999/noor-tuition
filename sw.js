/* NoorEdu service worker - network-first (always get latest, cache for offline) */
const CACHE = 'nooredu-v4';
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './logo-192.png',
    './logo-512.png',
    './logo.svg',
    './logo-full.svg',
    './logo-mask-512.png'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE)
            .then(c => c.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return;

    e.respondWith(
        fetch(e.request)
            .then(net => {
                const copy = net.clone();
                if (net.ok && net.type === 'basic') {
                    caches.open(CACHE).then(c => c.put(e.request, copy));
                }
                return net;
            })
            .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
});