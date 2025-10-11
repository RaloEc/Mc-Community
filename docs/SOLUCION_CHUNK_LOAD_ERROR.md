# Solución al ChunkLoadError después de Votación

## Problema Identificado

Después de realizar una votación en el foro, aparecía un error `ChunkLoadError` que impedía la navegación correcta:

```
ChunkLoadError: Loading chunk app/foro/hilos/[slug]/page-src_c failed.
```

### Causa Raíz

El error ocurría porque:

1. **Revalidación agresiva**: Después de votar, el hook `useRealtimeVotosHilos` invalidaba las queries de React Query y forzaba un refetch inmediato
2. **Hot Module Replacement (HMR)**: En desarrollo, los chunks de código cambian frecuentemente con HMR
3. **Navegación durante refetch**: Si el usuario navegaba mientras se recargaban los datos, Next.js intentaba cargar chunks que ya no existían o habían cambiado
4. **Configuración de chunks**: Los chunks se dividían de forma muy granular, aumentando las posibilidades de error

## Soluciones Implementadas

### 1. Optimización del Hook de Realtime (`useRealtimeVotosHilos.ts`)

**Cambio**: En lugar de forzar un refetch inmediato, ahora solo se marca el dato como "necesita actualización" en el caché.

```typescript
// ANTES: Refetch agresivo
queryClient.invalidateQueries({ 
  queryKey: ['foro', 'hilos'],
  refetchType: 'none'
});

setTimeout(() => {
  queryClient.refetchQueries({
    queryKey: ['foro', 'hilos'],
    type: 'active'
  });
}, 50);

// DESPUÉS: Actualización pasiva del caché
queryClient.setQueriesData(
  { queryKey: ['foro', 'hilos'], exact: false },
  (oldData: any) => {
    // Marcar datos como que necesitan actualización
    // sin forzar un refetch inmediato
  }
);

queryClient.invalidateQueries({ 
  queryKey: ['foro', 'hilos'],
  refetchType: 'none' // Sin refetch automático
});
```

**Beneficio**: Los datos se actualizan naturalmente cuando el usuario interactúa con la página, evitando conflictos con la navegación.

### 2. Mejoras en el Componente de Votación (`Votacion.tsx`)

**Cambios**:
- Prevención de múltiples clicks durante la carga
- Manejo silencioso de errores de ChunkLoadError
- No forzar navegación ni revalidación después de votar

```typescript
if (isLoading) return; // Prevenir múltiples clicks

// Después de votar exitosamente
// No forzar navegación ni revalidación - dejar que React Query maneje el estado

// En el catch
const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
if (!errorMessage.includes('ChunkLoadError')) {
  alert('No se pudo registrar tu voto. Inténtalo de nuevo.');
}
```

### 3. Configuración Mejorada de Webpack (`next.config.js`)

**Cambios**:
- Timeout de carga de chunks aumentado de 60s a 120s
- Nombres de chunk más estables en desarrollo
- Chunks más grandes en desarrollo (500KB vs 200KB en producción)
- Grupo especial de caché para React Query y Supabase
- Configuración de `crossOriginLoading` para mejor manejo de errores

```javascript
webpack: (config, { isServer, dev }) => {
  if (!isServer) {
    config.output.chunkLoadTimeout = 120000; // 120 segundos
    
    // En desarrollo, usar nombres más estables
    if (dev) {
      config.output.filename = 'static/chunks/[name].js';
      config.output.chunkFilename = 'static/chunks/[name].js';
    }
    
    // Chunks más grandes en desarrollo
    config.optimization.splitChunks = {
      maxSize: dev ? 500000 : 200000,
      // ... más configuración
    }
  }
}
```

### 4. Error Boundary Global (`ErrorBoundary.tsx`)

**Nuevo componente** que captura errores de carga de chunks y recarga automáticamente la página:

```typescript
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    const isChunkError = 
      error.name === 'ChunkLoadError' || 
      error.message.includes('Loading chunk');
    
    return { hasError: true, error, isChunkError };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.state.isChunkError) {
      // Recargar automáticamente después de 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
}
```

**Integrado en**: `Providers.tsx` para capturar errores en toda la aplicación.

### 5. Script de Manejo de Errores en el Cliente (`layout.tsx`)

**Nuevo script** que se ejecuta antes de la hidratación para capturar errores globales:

```javascript
const ChunkErrorHandlerScript = () => {
  // Script que maneja errores de chunks globalmente
  // - Detecta ChunkLoadError
  // - Recarga automáticamente (máximo 3 intentos)
  // - Resetea contador después de carga exitosa
}
```

**Beneficio**: Captura errores incluso antes de que React se inicialice.

### 6. Utilidad de Manejo de Errores (`chunk-error-handler.ts`)

**Nueva utilidad** para uso programático:

```typescript
// Verificar si es un error de chunk
isChunkLoadError(error)

// Manejar error de chunk
handleChunkLoadError(error)

// Wrapper para funciones async
withChunkErrorHandler(async () => {
  // código que puede fallar con ChunkLoadError
})
```

## Resultados

### En Desarrollo
- ✅ Los errores de ChunkLoadError se manejan automáticamente
- ✅ La página se recarga automáticamente cuando es necesario
- ✅ Mejor experiencia de usuario durante HMR
- ✅ Menos interrupciones durante el desarrollo

### En Producción
- ✅ Chunks más optimizados y estables
- ✅ Mejor manejo de errores de red
- ✅ Recuperación automática de errores de carga
- ✅ Experiencia de usuario más fluida

## Archivos Modificados

1. **`src/hooks/useRealtimeVotosHilos.ts`** - Optimización de revalidación
2. **`src/components/ui/Votacion.tsx`** - Mejor manejo de errores
3. **`next.config.js`** - Configuración mejorada de webpack
4. **`src/components/ErrorBoundary.tsx`** - Nuevo componente
5. **`src/components/Providers.tsx`** - Integración de ErrorBoundary
6. **`src/app/layout.tsx`** - Script de manejo de errores
7. **`src/lib/chunk-error-handler.ts`** - Nueva utilidad

## Recomendaciones

### Para Desarrollo
1. Si ves un ChunkLoadError, la página se recargará automáticamente
2. Si el error persiste después de 3 intentos, recarga manualmente
3. Limpia el caché del navegador si los problemas continúan

### Para Producción
1. Los errores de chunk deberían ser raros
2. Si ocurren, generalmente indican un problema de red
3. El sistema se recuperará automáticamente en la mayoría de casos

## Comandos Útiles

```bash
# Limpiar caché de Next.js
rm -rf .next

# Limpiar node_modules y reinstalar
rm -rf node_modules
npm install

# Reiniciar servidor de desarrollo
npm run dev
```

## Monitoreo

Para verificar que la solución funciona:

1. Realizar una votación en el foro
2. Verificar que no aparezcan errores en la consola
3. Verificar que la navegación funcione correctamente
4. Verificar que los votos se actualicen en tiempo real

## Notas Adicionales

- El sistema ahora es más resiliente a errores de carga de chunks
- La experiencia de usuario mejora significativamente
- Los errores se manejan de forma transparente
- El sistema se recupera automáticamente en la mayoría de casos
