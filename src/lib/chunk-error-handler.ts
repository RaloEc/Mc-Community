/**
 * Manejador global de errores de carga de chunks
 * Detecta y maneja ChunkLoadError automáticamente
 */

let isReloading = false;
let reloadAttempts = 0;
const MAX_RELOAD_ATTEMPTS = 3;
const RELOAD_DELAY = 1000;

/**
 * Verifica si un error es un ChunkLoadError
 */
export function isChunkLoadError(error: any): boolean {
  if (!error) return false;
  
  const errorString = error.toString();
  const errorMessage = error.message || '';
  const errorName = error.name || '';
  
  return (
    errorName === 'ChunkLoadError' ||
    errorString.includes('Loading chunk') ||
    errorString.includes('ChunkLoadError') ||
    errorMessage.includes('Loading chunk') ||
    errorMessage.includes('ChunkLoadError')
  );
}

/**
 * Maneja un ChunkLoadError recargando la página
 */
export function handleChunkLoadError(error: any): void {
  if (!isChunkLoadError(error)) {
    return;
  }

  // Evitar múltiples recargas simultáneas
  if (isReloading) {
    console.log('[ChunkErrorHandler] Ya hay una recarga en progreso');
    return;
  }

  // Limitar el número de intentos de recarga
  if (reloadAttempts >= MAX_RELOAD_ATTEMPTS) {
    console.error('[ChunkErrorHandler] Máximo de intentos de recarga alcanzado');
    alert('Ha ocurrido un error al cargar la aplicación. Por favor, recarga la página manualmente.');
    return;
  }

  isReloading = true;
  reloadAttempts++;

  console.log(`[ChunkErrorHandler] ChunkLoadError detectado. Recargando en ${RELOAD_DELAY}ms... (Intento ${reloadAttempts}/${MAX_RELOAD_ATTEMPTS})`);

  // Esperar un momento antes de recargar
  setTimeout(() => {
    window.location.reload();
  }, RELOAD_DELAY);
}

/**
 * Inicializa el manejador global de errores
 */
export function initChunkErrorHandler(): void {
  // Solo en el navegador
  if (typeof window === 'undefined') {
    return;
  }

  // Manejador de errores no capturados
  window.addEventListener('error', (event) => {
    handleChunkLoadError(event.error);
  });

  // Manejador de promesas rechazadas no capturadas
  window.addEventListener('unhandledrejection', (event) => {
    handleChunkLoadError(event.reason);
  });

  // Resetear el contador de intentos después de una carga exitosa
  window.addEventListener('load', () => {
    setTimeout(() => {
      reloadAttempts = 0;
      isReloading = false;
    }, 5000);
  });

  console.log('[ChunkErrorHandler] Manejador de errores de chunks inicializado');
}

/**
 * Wrapper para funciones async que maneja ChunkLoadError
 */
export function withChunkErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (isChunkLoadError(error)) {
        handleChunkLoadError(error);
        // Retornar una promesa que nunca se resuelve para evitar propagación
        return new Promise(() => {});
      }
      throw error;
    }
  }) as T;
}
