// Script para limpiar la caché del navegador
(function() {
  function clearBrowserCache() {
    try {
      const statusEl = document.getElementById('status');
      statusEl.textContent = 'Limpiando caché...';
      statusEl.className = '';
      
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
      
      statusEl.textContent = '✅ Caché limpiada exitosamente. Redirigiendo...';
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
