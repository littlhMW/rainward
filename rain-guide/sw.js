// Retire Rainward v1's guide-only offline cache. Real maps use upstream data online.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('rainward-')) await caches.delete(key);
  await self.clients.claim();
  await self.registration.unregister();
})()));
