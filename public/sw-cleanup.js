// Script para limpiar ServiceWorkers problemáticos
// Se ejecuta antes de que se registre cualquier SW

if ('serviceWorker' in navigator) {
  // Limpiar todos los SWs registrados
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      console.log('[SW Cleanup] Unregistering service worker:', registration.scope);
      registration.unregister().catch((err) => {
        console.error('[SW Cleanup] Error unregistering:', err);
      });
    });
  }).catch((err) => {
    console.error('[SW Cleanup] Error getting registrations:', err);
  });

  // Limpiar caché
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      console.log('[SW Cleanup] Deleting cache:', cacheName);
      caches.delete(cacheName).catch((err) => {
        console.error('[SW Cleanup] Error deleting cache:', err);
      });
    });
  }).catch((err) => {
    console.error('[SW Cleanup] Error getting caches:', err);
  });
}
