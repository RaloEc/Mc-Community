// Script para limpiar Service Workers y caché
(function() {
  'use strict';

  console.log('🧹 Iniciando limpieza de Service Workers y caché...');

  // Desregistrar todos los Service Workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      if (registrations.length === 0) {
        console.log('✅ No hay Service Workers registrados');
      } else {
        console.log(`🔍 Encontrados ${registrations.length} Service Worker(s)`);
        
        for (let registration of registrations) {
          registration.unregister().then(function(success) {
            if (success) {
              console.log('✅ Service Worker desregistrado:', registration.scope);
            } else {
              console.log('❌ No se pudo desregistrar:', registration.scope);
            }
          });
        }
      }
    }).catch(function(error) {
      console.error('❌ Error al obtener registros:', error);
    });
  }

  // Limpiar todos los cachés
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      if (cacheNames.length === 0) {
        console.log('✅ No hay cachés para limpiar');
      } else {
        console.log(`🔍 Encontrados ${cacheNames.length} caché(s)`);
        
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('🗑️ Eliminando caché:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }
    }).then(function() {
      console.log('✅ Todos los cachés han sido eliminados');
      console.log('🔄 Por favor, recarga la página (Ctrl+Shift+R o Cmd+Shift+R)');
    }).catch(function(error) {
      console.error('❌ Error al limpiar cachés:', error);
    });
  }

  // Limpiar localStorage relacionado con PWA
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('workbox') || key.includes('pwa') || key.includes('sw'))) {
        keysToRemove.push(key);
      }
    }
    
    if (keysToRemove.length > 0) {
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Eliminado de localStorage:', key);
      });
      console.log(`✅ ${keysToRemove.length} item(s) eliminado(s) de localStorage`);
    } else {
      console.log('✅ No hay items de PWA en localStorage');
    }
  } catch (error) {
    console.error('❌ Error al limpiar localStorage:', error);
  }

  console.log('✨ Limpieza completada!');
})();
