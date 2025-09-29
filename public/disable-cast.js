// Deshabilitar la API de Google Cast
window.chrome = window.chrome || {};
window.chrome.cast = window.chrome.cast || {};
window.chrome.cast.isAvailable = false;

// Evitar que se cargue el script de Google Cast
Object.defineProperty(window, '__onGCastApiAvailable', {
  value: function() { return false; },
  writable: false,
  configurable: false
});
