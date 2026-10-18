const CACHE = 'adminprascell-v9';
const ASSETS = ['/', '/index.html', '/models.html', '/services.html', '/guides.html', '/orders.html', '/members.html', '/chat.html', '/stock.html', '/warranties.html', '/styles.css?v=13', '/app.js?v=9', '/admin-shell.js?v=1', '/stock.js?v=1', '/warranties.js?v=1', '/images/prascelllogo.avif?v=2', '/images/prascelltag.avif?v=2', '/images/backgroundheaderprascell.avif?v=1'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener('fetch', (event) => { if (event.request.method === 'GET') event.respondWith(fetch(event.request).catch(() => caches.match(event.request))); });
