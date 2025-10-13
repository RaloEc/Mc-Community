// Script para limpiar la caché del navegador
(function() {
  async function clearBrowserCache() {
    try {
      const statusEl = document.getElementById('status');
      statusEl.textContent = 'Limpiando caché...';
      statusEl.className = '';
      
      // Limpiar Service Workers
      console.log('Limpiando Service Workers...');
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          if (registrations.length > 0) {
            for (let registration of registrations) {
              await registration.unregister();
              console.log('✅ Service Worker desregistrado:', registration.scope);
            }
          } else {
            console.log('✅ No hay Service Workers registrados');
          }
        } catch (e) {
          console.error('Error limpiando Service Workers:', e);
        }
      }
      
      // Limpiar cachés de Workbox/PWA
      console.log('Limpiando cachés...');
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          if (cacheNames.length > 0) {
            await Promise.all(
              cacheNames.map(cacheName => {
                console.log('🗑️ Eliminando caché:', cacheName);
                return caches.delete(cacheName);
              })
            );
            console.log('✅ Todos los cachés eliminados');
          } else {
            console.log('✅ No hay cachés para limpiar');
          }
        } catch (e) {
          console.error('Error limpiando cachés:', e);
        }
      }
      
      // Limpiar localStorage
      console.log('Limpiando localStorage...');
      try {
        localStorage.clear();
        console.log('✅ localStorage limpiado');
      } catch (e) {
        console.error('Error limpiando localStorage:', e);
      }
      
      // Limpiar sessionStorage
      console.log('Limpiando sessionStorage...');
      try {
        sessionStorage.clear();
        console.log('✅ sessionStorage limpiado');
      } catch (e) {
        console.error('Error limpiando sessionStorage:', e);
      }
      
      // Limpiar cookies (especialmente las de Supabase)
      console.log('Limpiando cookies...');
      try {
        const cookies = document.cookie.split(";");
        
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          
          // Limpiar la cookie en diferentes paths y dominios
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
          
          console.log('Limpiando cookie:', name);
        }
        console.log('✅ Cookies limpiadas');
      } catch (e) {
        console.error('Error limpiando cookies:', e);
      }
      
      statusEl.textContent = '✅ Caché y Service Workers limpiados exitosamente. Redirigiendo...';
      statusEl.className = 'success';
      
      // Redirigir después de 2 segundos
      setTimeout(function() {
        window.location.href = '/?cache_cleared=true';
      }, 2000);
      
    } catch (error) {
      console.error('Error al limpiar caché:', error);
      document.getElementById('status').textContent = 'Error al limpiar caché: ' + error.message;
      document.getElementById('status').className = 'error';
    }
  }

  // Ejecutar cuando se cargue la página
  window.onload = function() {
    document.getElementById('clearButton').addEventListener('click', clearBrowserCache);
  };
})();
