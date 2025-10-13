# Implementación de PWA en Minecraft Community

## 📱 Resumen

Se ha implementado exitosamente la funcionalidad de Progressive Web App (PWA) en el proyecto. Esto permite que la aplicación sea instalable en dispositivos móviles y de escritorio, funcione offline y ofrezca una experiencia similar a una aplicación nativa.

## ✅ Componentes Implementados

### 1. Configuración de next-pwa

**Archivo:** `next.config.js`

- Se agregó `next-pwa` como wrapper de la configuración de Next.js
- Configurado para deshabilitarse en desarrollo (`disable: process.env.NODE_ENV === 'development'`)
- Estrategias de caché configuradas para diferentes tipos de recursos:
  - **CacheFirst**: Fuentes, audio, video (recursos estáticos que no cambian)
  - **StaleWhileRevalidate**: Imágenes, CSS, JS (recursos que pueden actualizarse)
  - **NetworkFirst**: Datos JSON, rutas de la aplicación (contenido dinámico)

### 2. Manifest.json

**Archivo:** `public/manifest.json`

Configuración de la PWA:
- **name**: "Minecraft Community"
- **short_name**: "MC Community"
- **display**: "standalone" (se muestra como app independiente)
- **theme_color**: "#3b82f6" (azul)
- **background_color**: "#0a0a0a" (negro oscuro)
- **Iconos**: 8 tamaños diferentes (72x72 hasta 512x512)
- **Shortcuts**: Accesos directos al Foro y Noticias

### 3. Iconos de la Aplicación

**Ubicación:** `public/icons/`

Iconos generados en los siguientes tamaños:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512
- apple-touch-icon.png (180x180)

**Nota:** Los iconos actuales son placeholders con las letras "MC". Reemplázalos con el logo oficial de la aplicación.

### 4. Metadata en Layout

**Archivo:** `src/app/layout.tsx`

Se agregaron metadatos para PWA:
- Referencia al manifest.json
- Configuración de Apple Web App
- Open Graph y Twitter Cards
- Referencias a iconos
- Configuración de viewport

### 5. Componentes de PWA

#### PWAManager
**Archivo:** `src/components/pwa/PWAManager.tsx`

Componente principal que:
- Registra el Service Worker en producción
- Coordina los componentes de instalación y actualización

#### InstallPWA
**Archivo:** `src/components/pwa/InstallPWA.tsx`

Maneja la instalación de la PWA:
- Muestra un banner de instalación después de 30 segundos
- Permite al usuario instalar la app con un clic
- Guarda la preferencia si el usuario rechaza la instalación
- Se oculta automáticamente si la app ya está instalada

#### PWAUpdatePrompt
**Archivo:** `src/components/pwa/PWAUpdatePrompt.tsx`

Maneja las actualizaciones:
- Detecta cuando hay una nueva versión disponible
- Muestra un banner para actualizar
- Verifica actualizaciones cada 60 minutos
- Recarga la página después de actualizar

### 6. Scripts de Generación de Iconos

**Archivos:**
- `scripts/generate-icons.js` (SVG placeholders)
- `scripts/create-placeholder-icons.js` (PNG usando canvas)

Scripts para generar iconos placeholder. Ejecutar con:
```bash
node scripts/create-placeholder-icons.js
```

### 7. .gitignore

Se agregaron las siguientes líneas para ignorar archivos generados por PWA:
```
**/public/sw.js
**/public/workbox-*.js
**/public/worker-*.js
**/public/sw.js.map
**/public/workbox-*.js.map
**/public/worker-*.js.map
```

## 🚀 Cómo Funciona

### En Desarrollo
- PWA está **deshabilitada** para evitar problemas con hot reload
- No se genera Service Worker
- La aplicación funciona normalmente como SPA

### En Producción
1. Al hacer build, `next-pwa` genera automáticamente:
   - `public/sw.js` (Service Worker)
   - `public/workbox-*.js` (Librerías de Workbox)

2. Al cargar la aplicación:
   - Se registra el Service Worker
   - Se cachean recursos según las estrategias configuradas
   - Se muestra el banner de instalación (después de 30s)

3. Cuando el usuario instala:
   - La app se agrega a la pantalla de inicio
   - Se abre en modo standalone (sin barra del navegador)
   - Funciona offline con recursos cacheados

4. Cuando hay actualizaciones:
   - Se detecta automáticamente la nueva versión
   - Se muestra un banner para actualizar
   - Al actualizar, se recarga con la nueva versión

## 📋 Comandos Útiles

### Desarrollo
```bash
npm run dev
```
PWA deshabilitada, desarrollo normal.

### Producción Local
```bash
npm run build
npm start
```
PWA habilitada, puedes probar la instalación.

### Generar Iconos
```bash
node scripts/create-placeholder-icons.js
```

## 🔧 Personalización

### Cambiar Colores
Edita `public/manifest.json`:
```json
{
  "theme_color": "#tu-color",
  "background_color": "#tu-color"
}
```

### Cambiar Iconos
1. Crea iconos en los tamaños requeridos
2. Colócalos en `public/icons/`
3. Nombra los archivos: `icon-{tamaño}.png`

### Modificar Estrategias de Caché
Edita `next.config.js` en la sección `runtimeCaching`:
```javascript
{
  urlPattern: /tu-patron/,
  handler: 'CacheFirst', // o 'NetworkFirst', 'StaleWhileRevalidate'
  options: {
    cacheName: 'tu-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 24 * 60 * 60
    }
  }
}
```

### Cambiar Tiempo del Banner de Instalación
Edita `src/components/pwa/InstallPWA.tsx`:
```javascript
setTimeout(() => {
  setShowInstallPrompt(true);
}, 30000); // Cambiar 30000 (30 segundos)
```

## 🧪 Probar la PWA

### Chrome DevTools
1. Abre DevTools (F12)
2. Ve a la pestaña "Application"
3. En "Service Workers" verás el SW registrado
4. En "Manifest" verás la configuración
5. En "Storage" verás los caches

### Lighthouse
1. Abre DevTools (F12)
2. Ve a la pestaña "Lighthouse"
3. Selecciona "Progressive Web App"
4. Haz clic en "Generate report"

### Probar Instalación
1. Ejecuta `npm run build && npm start`
2. Abre en Chrome: http://localhost:3000
3. Espera 30 segundos o ve a menú → "Instalar aplicación"
4. Instala y prueba

### Probar Offline
1. Instala la aplicación
2. Abre DevTools → Network
3. Selecciona "Offline"
4. Navega por la app (recursos cacheados funcionarán)

## ⚠️ Notas Importantes

1. **Service Worker solo funciona en HTTPS** (excepto localhost)
2. **Los cambios en el SW pueden tardar en aplicarse** - usa "Update on reload" en DevTools durante desarrollo
3. **Limpia el caché del navegador** si tienes problemas con versiones antiguas
4. **Los iconos actuales son placeholders** - reemplázalos con los oficiales
5. **PWA está deshabilitada en desarrollo** - usa producción para probar

## 🐛 Solución de Problemas

### El Service Worker no se registra
- Verifica que estés en producción (`NODE_ENV=production`)
- Asegúrate de estar en HTTPS o localhost
- Revisa la consola del navegador

### Los iconos no se muestran
- Verifica que existan en `public/icons/`
- Revisa las rutas en `manifest.json`
- Limpia el caché del navegador

### La instalación no aparece
- Espera 30 segundos o más
- Verifica que no hayas rechazado antes (limpia localStorage)
- Asegúrate de que no esté ya instalada

### Cambios no se reflejan
- Limpia el caché del Service Worker en DevTools
- Usa "Update on reload" en DevTools → Application → Service Workers
- Haz un hard refresh (Ctrl+Shift+R)

## 📚 Referencias

- [Next PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

## ✨ Próximos Pasos

1. **Reemplazar iconos placeholder** con el logo oficial
2. **Agregar screenshots** en `public/screenshots/` para mejor presentación en tiendas
3. **Configurar notificaciones push** si es necesario
4. **Optimizar estrategias de caché** según el uso real
5. **Agregar página offline personalizada**
6. **Implementar sincronización en segundo plano** para contenido

---

**Fecha de implementación:** Octubre 2025
**Versión:** 1.0.0
**Estado:** ✅ Completado y funcional
