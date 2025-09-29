# Implementación de Optimización de la Página de Noticias

Este documento describe los pasos necesarios para implementar la optimización de la página de noticias en la aplicación MC-Community.

## Resumen de Cambios

Se ha implementado una optimización completa de la página de noticias siguiendo un enfoque similar al aplicado al foro, con las siguientes mejoras:

1. **Gestión de caché con React Query:**
   - Creación de un hook personalizado `useNoticias` para gestionar la carga y caché de noticias
   - Implementación de `useQuery` y `useInfiniteQuery` para optimizar las consultas
   - Configuración de tiempos de caché optimizados

2. **Componentes optimizados:**
   - Creación de `NoticiaCard` con `React.memo` para evitar re-renderizados innecesarios
   - Implementación de función de comparación personalizada para determinar cuándo re-renderizar
   - Optimización de `NoticiasDestacadas` y `SeccionCategoria` con memoización

3. **Carga optimizada de imágenes:**
   - Uso de `loading="lazy"` para la carga diferida de imágenes
   - Priorización de carga para imágenes críticas con `priority`
   - Implementación de fallbacks para imágenes que fallan en cargar

4. **Paginación infinita:**
   - Implementación de `useInfiniteQuery` para cargar noticias por páginas
   - Uso de `react-intersection-observer` para detectar cuándo cargar más contenido
   - Mantenimiento del estado entre navegaciones

5. **Detección de visibilidad de página:**
   - Uso del API `visibilitychange` para detectar cuando la pestaña vuelve a estar activa
   - Revalidación condicional de datos solo si han pasado más de 5 minutos desde la última actualización

6. **Optimización de base de datos:**
   - Creación de función RPC `contar_comentarios_por_noticia` para obtener conteos por lotes
   - Archivo de migración SQL para implementar la función en Supabase

## Pasos para la Implementación

### 1. Instalar Dependencias

Primero, instala las dependencias necesarias:

```bash
npm install
```

### 2. Ejecutar la Migración SQL

Ejecuta el script de migración para crear la función RPC en Supabase:

```bash
ejecutar_migracion_noticias.bat
```

Este script creará la función `contar_comentarios_por_noticia` en la base de datos de Supabase.

### 3. Verificar la Implementación

Una vez completados los pasos anteriores, verifica que la optimización funciona correctamente:

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Navega a la página de noticias (`/noticias`) y verifica que:
   - Las noticias se cargan correctamente
   - La navegación es fluida
   - Al hacer scroll hacia abajo, se cargan más noticias automáticamente
   - Al cambiar de pestaña y volver, no se recargan todas las noticias

## Estructura de Archivos

Los siguientes archivos han sido creados o modificados:

- `src/components/noticias/hooks/useNoticias.ts` - Hook personalizado para gestionar noticias
- `src/components/noticias/NoticiaCard.tsx` - Componente de tarjeta de noticia optimizado
- `src/components/noticias/NoticiasGrid.tsx` - Componente de cuadrícula de noticias con paginación infinita
- `src/components/noticias/NoticiasDestacadas.tsx` - Componente de noticias destacadas optimizado
- `src/components/noticias/SeccionCategoria.tsx` - Componente de sección de categoría optimizado
- `src/app/noticias/page.tsx` - Página principal de noticias optimizada
- `supabase/migrations/20250928201000_contar_comentarios_por_noticia.sql` - Migración SQL para la función RPC
- `ejecutar_migracion_noticias.bat` - Script para ejecutar la migración SQL

## Solución de Problemas

Si encuentras algún problema durante la implementación:

1. **Error en la función RPC**: Verifica que la migración SQL se haya ejecutado correctamente. Puedes ejecutar la consulta SQL manualmente en el panel de administración de Supabase.

2. **Problemas de caché**: Si los datos no se actualizan correctamente, puedes forzar una actualización con `window.location.reload()` o limpiar la caché de React Query con `queryClient.invalidateQueries(['noticias'])`.

3. **Problemas de rendimiento**: Si la página sigue teniendo problemas de rendimiento, verifica la consola del navegador para identificar posibles errores o cuellos de botella.

## Beneficios Esperados

Con esta optimización, se espera:

- **Mejor experiencia de usuario**: Navegación más fluida y rápida
- **Reducción de carga en el servidor**: Menos peticiones al servidor gracias a la caché
- **Mejor rendimiento en dispositivos móviles**: Carga diferida de imágenes y contenido
- **Mayor estabilidad**: Mantenimiento del estado entre cambios de pestaña
