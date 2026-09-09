/* NoorEdu service worker — app-shell cache for offline use & installability */
const CACHE = 'nooredu-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './logo-192.png',
    './logo-512.png',
    './logo.svg',
    './logo-full.svg',
    './vendor/css/bootstrap.min.css',
    './vendor/css/bootstrap-icons.min.css',
    './vendor/fonts/bootstrap-icons.woff2',
    './vendor/js/bootstrap.bundle.min.js',
    './vendor/js/chart.umd.min.js',
    './vendor/js/sweetalert2.all.min.js'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(net => {
                const copy = net.clone();
                if (net.ok && (net.type === 'basic' || net.type === 'cors')) {
                    caches.open(CACHE).then(c => c.put(e.request, copy));
                }
                return net;
            }).catch(() => caches.match('./index.html'));
        })
    );
});