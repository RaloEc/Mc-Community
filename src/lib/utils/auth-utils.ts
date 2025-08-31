'use client'

/**
 * Guarda la URL actual para redireccionar después del login
 */
export function saveCurrentUrlForRedirect(): void {
  try {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      // No guardar rutas de autenticación
      if (!currentPath.startsWith('/login') && 
          !currentPath.startsWith('/register') && 
          !currentPath.startsWith('/auth/')) {
        localStorage.setItem('auth_redirect_url', currentPath)
      }
    }
  } catch (error) {
    console.error('Error al guardar URL para redirección:', error)
  }
}

/**
 * Obtiene la URL guardada para redirección o devuelve la ruta por defecto
 */
export function getRedirectUrl(defaultUrl: string = '/'): string {
  try {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('auth_redirect_url')
      if (savedUrl) {
        // Limpiar la URL guardada después de usarla
        localStorage.removeItem('auth_redirect_url')
        return savedUrl
      }
    }
  } catch (error) {
    console.error('Error al obtener URL para redirección:', error)
  }
  return defaultUrl
}
