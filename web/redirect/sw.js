// Önmagát leiratkoztató service worker: a régi PWA telepítések ezt kapják frissítésként,
// eldobják a gyorsítótárat, és a lapok az új címre töltődnek újra.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate('https://matecska.apasupa.com/'));
  })());
});
