// Service Worker per gestire le notifiche push
// Questo file viene registrato dal browser e gestisce le notifiche anche quando l'app è chiusa

// Installazione del service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installato');
  self.skipWaiting(); // Attiva immediatamente il nuovo service worker
});

// Attivazione del service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker attivato');
  event.waitUntil(self.clients.claim()); // Diventa il controller attivo
});

// Gestione delle notifiche push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body || 'Nuovo aggiornamento disponibilità',
    icon: data.icon || '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'view', title: '👁️ Visualizza' },
      { action: 'close', title: '✖️ Chiudi' },
    ],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Assistenza Anziani', options)
  );
});

// Gestione del click sulla notifica
self.addEventListener('notificationclick', (event) => {
  console.log('Notifica cliccata:', event.notification);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se c'è già una finestra aperta, portala in primo piano
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Altrimenti apri una nuova finestra
      return clients.openWindow(urlToOpen);
    })
  );
});
