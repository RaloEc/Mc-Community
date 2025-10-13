// Script para limpiar Service Workers y caché
(function() {
  'use strict';

  console.log('🧹 Iniciando limpieza de Service Workers y caché...');

  let swUnregistered = false;
  let cachesCleared = false;

  // Desregistrar todos los Service Workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      if (registrations.length === 0) {
        console.log('✅ No hay Service Workers registrados');
        swUnregistered = true;
      } else {
        console.log(`🔍 Encontrados ${registrations.length} Service Worker(s)`);
        
        const unregisterPromises = registrations.map(function(registration) {
          return registration.unregister().then(function(success) {
            if (success) {
              console.log('✅ Service Worker desregistrado:', registration.scope);
            } else {
              console.log('❌ No se pudo desregistrar:', registration.scope);
            }
            return success;
          });
        });

        Promise.all(unregisterPromises).then(function() {
          swUnregistered = true;
          console.log('✅ Todos los Service Workers han sido desregistrados');
          checkAndReload();
        });
      }
    }).catch(function(error) {
      console.error('❌ Error al obtener registros:', error);
      swUnregistered = true;
      checkAndReload();
    });
  } else {
    swUnregistered = true;
  }

  // Limpiar todos los cachés
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      if (cacheNames.length === 0) {
        console.log('✅ No hay cachés para limpiar');
        cachesCleared = true;
        checkAndReload();
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
      cachesCleared = true;
      console.log('✅ Todos los cachés han sido eliminados');
      checkAndReload();
    }).catch(function(error) {
      console.error('❌ Error al limpiar cachés:', error);
      cachesCleared = true;
      checkAndReload();
    });
  } else {
    cachesCleared = true;
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

  // Función para verificar si todo está listo y recargar
  function checkAndReload() {
    if (swUnregistered && cachesCleared) {
      console.log('✨ Limpieza completada!');
      console.log('🔄 Recargando página en 2 segundos...');
      
      // Mostrar alerta al usuario
      setTimeout(function() {
        alert('Limpieza completada. La página se recargará ahora.');
        // Forzar recarga completa sin caché
        window.location.reload(true);
      }, 2000);
    }
  }
})();
