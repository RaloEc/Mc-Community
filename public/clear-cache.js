// Script para limpiar la caché del navegador
(function() {
  function clearBrowserCache() {
    try {
      // Limpiar localStorage
      localStorage.clear();
      console.log('✅ localStorage limpiado correctamente');
      
      // Limpiar sessionStorage
      sessionStorage.clear();
      console.log('✅ sessionStorage limpiado correctamente');
      
      // Intentar limpiar caché de aplicación
      if (window.caches) {
        caches.keys().then(function(names) {
          for (let name of names) {
            caches.delete(name);
          }
          console.log('✅ Cache API limpiada correctamente');
        });
      }
      
      // Mostrar mensaje de éxito
      document.getElementById('status').textContent = 'Caché limpiada correctamente. Redirigiendo...';
      document.getElementById('status').className = 'success';
      
      // Redirigir después de 2 segundos
      setTimeout(function() {
        window.location.href = '/login';
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
