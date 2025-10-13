'use client';

import { useEffect } from 'react';
import InstallPWA from './InstallPWA';
import PWAUpdatePrompt from './PWAUpdatePrompt';

export default function PWAManager() {
  useEffect(() => {
    // Registrar el Service Worker solo en producción
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Limpiar Service Workers antiguos antes de registrar uno nuevo
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          // Si hay un SW esperando, activarlo inmediatamente
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // No cachear el SW, siempre buscar actualizaciones
        })
        .then((registration) => {
          console.log('Service Worker registrado con éxito:', registration.scope);
          
          // Verificar actualizaciones cada 60 segundos
          setInterval(() => {
            registration.update();
          }, 60000);
          
          // Verificar actualizaciones al cargar
          registration.update();

          // Manejar actualizaciones del Service Worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Hay una nueva versión disponible
                  console.log('Nueva versión del Service Worker disponible');
                  // Forzar la activación inmediata
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Error al registrar el Service Worker:', error);
        });

      // Escuchar cuando el Service Worker toma control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker actualizado, recargando página...');
        // Recargar la página para usar la nueva versión
        window.location.reload();
      });

      // Manejar errores de carga de chunks
      window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('ChunkLoadError')) {
          console.error('Error de carga de chunk detectado, limpiando caché...');
          
          // Limpiar el caché del Service Worker
          if ('caches' in window) {
            caches.keys().then((cacheNames) => {
              Promise.all(
                cacheNames.map((cacheName) => {
                  if (cacheName.includes('static-js-assets') || cacheName.includes('next-')) {
                    console.log('Limpiando caché:', cacheName);
                    return caches.delete(cacheName);
                  }
                })
              ).then(() => {
                console.log('Caché limpiado, recargando página...');
                // Recargar la página después de limpiar el caché
                window.location.reload();
              });
            });
          }
        }
      });
    }
  }, []);

  return (
    <>
      <InstallPWA />
      <PWAUpdatePrompt />
    </>
  );
}
