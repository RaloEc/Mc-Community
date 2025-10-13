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
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado con éxito:', registration.scope);
          
          // Verificar actualizaciones al cargar
          registration.update();
        })
        .catch((error) => {
          console.error('Error al registrar el Service Worker:', error);
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
