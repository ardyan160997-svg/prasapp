const CACHE = 'prascell-public-v12';
const ASSETS = ['/', '/index.html', '/estimasi.html', '/tracking.html', '/chat.html', '/member.html', '/styles.css?v=15', '/home.css?v=5', '/home.js?v=2', '/images/icon.avif?v=2', '/images/prascelllogo.avif?v=2', '/images/prascelltag.avif?v=2', '/images/backgroundheaderprascell.avif?v=1'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener('fetch', (event) => { if (event.request.method === 'GET') event.respondWith(fetch(event.request).catch(() => caches.match(event.request))); });
