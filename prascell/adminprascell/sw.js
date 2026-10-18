const CACHE = 'adminprascell-v9';
const ASSETS = ['/', '/index.html', '/models.html', '/services.html', '/guides.html', '/orders.html', '/members.html', '/chat.html', '/styles.css?v=12', '/app.js?v=8', '/images/prascelllogo.avif?v=2', '/images/prascelltag.avif?v=2', '/images/backgroundheaderprascell.avif?v=1'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener('fetch', (event) => { if (event.request.method === 'GET') event.respondWith(fetch(event.request).catch(() => caches.match(event.request))); });
