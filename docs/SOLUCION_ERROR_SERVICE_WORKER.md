# Solución Error de Service Worker en Desarrollo

## Problema

Al recargar la página en desarrollo aparecen estos errores en consola:

```
workbox-4754cb34.js:1 Uncaught (in promise) bad-precaching-response: 
bad-precaching-response :: [{"url":"http://localhost:3000/_next/app-build-manifest.json","status":404}]

Uncaught (in promise) TypeError: Failed to update a ServiceWorker for scope 
('http://localhost:3000/') with script ('Unknown'): Not found
```

## Causa

El PWA (Progressive Web App) está **deshabilitado en desarrollo** según `next.config.js` línea 3:
```javascript
disable: process.env.NODE_ENV === 'development',
```

Sin embargo, hay un **Service Worker viejo registrado** de una sesión anterior que está intentando actualizar archivos que ya no existen o han cambiado.

## Soluciones

### Opción 1: Usar la Página de Limpieza (Recomendado)

1. Navega a: `http://localhost:3000/clear-cache.html`
2. Haz clic en el botón "Limpiar Caché"
3. Espera a que se complete la limpieza
4. La página se recargará automáticamente

Esta opción limpia:
- ✅ Service Workers registrados
- ✅ Cachés de Workbox/PWA
- ✅ localStorage
- ✅ sessionStorage
- ✅ Cookies

### Opción 2: Limpieza Manual desde DevTools

1. Abre las **DevTools** (F12)
2. Ve a la pestaña **Application** (o Aplicación)
3. En el menú lateral:
   - **Service Workers** → Click en "Unregister" en cada uno
   - **Cache Storage** → Click derecho → "Delete" en cada caché
   - **Local Storage** → Click derecho → "Clear"
   - **Session Storage** → Click derecho → "Clear"
4. Recarga la página con **Ctrl+Shift+R** (o **Cmd+Shift+R** en Mac)

### Opción 3: Recarga Forzada

La forma más rápida (pero menos completa):

**Windows/Linux:**
```
Ctrl + Shift + R
```

**Mac:**
```
Cmd + Shift + R
```

Esto fuerza una recarga completa ignorando el caché del navegador.

### Opción 4: Limpiar Desde Consola del Navegador

1. Abre la consola (F12 → Console)
2. Pega y ejecuta este código:

```javascript
// Desregistrar Service Workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    registration.unregister();
    console.log('SW desregistrado:', registration.scope);
  });
});

// Limpiar cachés
caches.keys().then(cacheNames => {
  cacheNames.forEach(cacheName => {
    caches.delete(cacheName);
    console.log('Caché eliminado:', cacheName);
  });
});

// Limpiar storage
localStorage.clear();
sessionStorage.clear();

console.log('✅ Limpieza completada. Recarga la página.');
```

3. Recarga la página con **Ctrl+Shift+R**

## Prevención

### Para Desarrollo

El PWA ya está deshabilitado en desarrollo, pero si sigues teniendo problemas:

1. **Verifica que estés en modo desarrollo:**
   ```cmd
   npm run dev
   ```

2. **Limpia el caché regularmente** si trabajas con PWA:
   - Visita `/clear-cache.html` periódicamente
   - O usa la extensión "Clear Cache" de Chrome

3. **Desactiva Service Workers en DevTools:**
   - DevTools → Application → Service Workers
   - Marca "Bypass for network"
   - Marca "Update on reload"

### Para Producción

Si el problema ocurre en producción:

1. **Verifica la configuración de PWA** en `next.config.js`
2. **Asegúrate de que los archivos estáticos existan:**
   ```cmd
   npm run build
   ```
3. **Revisa los logs del servidor** para errores 404

## Archivos Relacionados

- **Configuración PWA:** `next.config.js` (líneas 1-150)
- **Script de limpieza:** `public/clear-cache.js`
- **Página de limpieza:** `public/clear-cache.html`
- **Script adicional:** `public/clear-sw.js`

## Verificación

Después de aplicar la solución, verifica que:

1. ✅ No hay errores de Service Worker en consola
2. ✅ La página carga correctamente
3. ✅ No hay errores 404 en la pestaña Network

Para verificar Service Workers activos:
1. DevTools → Application → Service Workers
2. Debería mostrar "No service workers registered" en desarrollo

## Notas Técnicas

### ¿Por qué pasa esto?

- **Service Workers persisten** entre sesiones del navegador
- Cuando cambias código o actualizas dependencias, los archivos que el SW intenta cachear pueden cambiar de nombre o ubicación
- El SW viejo intenta actualizar su caché con archivos que ya no existen → Error 404

### ¿Es normal en desarrollo?

Sí, es común cuando:
- Cambias entre ramas de git
- Actualizas Next.js o dependencias
- Cambias la configuración de PWA
- Limpias el directorio `.next`

### ¿Afecta a producción?

No, si:
- El PWA está correctamente configurado
- Los archivos se generan correctamente en el build
- La estrategia de caché es apropiada

## Comandos Útiles

```cmd
# Limpiar build de Next.js
rmdir /s /q .next

# Reinstalar dependencias
rmdir /s /q node_modules
npm install

# Rebuild completo
npm run build

# Iniciar en desarrollo limpio
npm run dev
```

## Recursos Adicionales

- [Next.js PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)

---

**Última actualización:** 12 de Octubre, 2025  
**Versión:** 1.0.0
