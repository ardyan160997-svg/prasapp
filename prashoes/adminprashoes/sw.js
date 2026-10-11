self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = data.title || 'Prashoes Admin';
  const options = {
    body: data.body || 'Ada notifikasi baru.',
    icon: '/images/pwa-icon-192.png',
    badge: '/images/pwa-icon-192.png',
    tag: data.tag || 'prashoes-admin',
    data: { url: data.url || '/' },
    requireInteraction: true,
  };
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(clientsList.map((client) => client.postMessage({ type: 'prashoes-admin-refresh', payload: data })));
    await self.registration.showNotification(title, options);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        client.navigate(targetUrl);
        return;
      }
    }
    await clients.openWindow(targetUrl);
  })());
});
