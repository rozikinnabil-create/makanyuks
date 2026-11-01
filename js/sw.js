self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'Waktunya Makan!';
  const options = {
    body: data,
    icon: 'favicon.svg',
    badge: 'favicon.svg',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(
    self.registration.showNotification('Makanyuks - Pengingat Makan', options)
  );
});