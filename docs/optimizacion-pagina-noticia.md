# Optimización de la Página de Lectura de Noticias

## Resumen de Implementación

Se ha implementado una optimización completa de la página de lectura de noticias siguiendo un enfoque similar al aplicado anteriormente al foro y a la página principal de noticias. Esta optimización se centra en mejorar el rendimiento, la experiencia de usuario y la eficiencia en la carga de datos.

## Componentes Principales Creados

1. **Hooks Personalizados:**
   - `useNoticia.ts`: Hook para gestionar la carga y caché de una noticia individual
   - `useNoticiaComentarios.ts`: Hook para gestionar la carga y caché de comentarios con paginación infinita

2. **Componentes Optimizados:**
   - `NoticiaImagen.tsx`: Componente memoizado para la imagen de la noticia con carga optimizada
   - `NoticiaContenido.tsx`: Componente memoizado para el contenido HTML de la noticia
   - `NoticiaAutor.tsx`: Componente memoizado para la información del autor
   - `NoticiaCabecera.tsx`: Componente memoizado para la cabecera de la noticia
   - `NoticiaCategorias.tsx`: Componente memoizado para las categorías relacionadas
   - `NoticiasRelacionadas.tsx`: Componente memoizado para las noticias relacionadas
   - `NoticiaComentariosOptimizado.tsx`: Componente memoizado para los comentarios con carga diferida
   - `NoticiaLoading.tsx`: Componentes para estados de carga y error

3. **Página Optimizada:**
   - `page.optimized.tsx`: Versión optimizada de la página de detalle de noticia

4. **Optimización de Base de Datos:**
   - `20250928210000_contar_comentarios_por_noticia.sql`: Función RPC para contar comentarios por noticia de forma eficiente

## Características Implementadas

### 1. Gestión de Caché con React Query
- Configuración de tiempos de caché optimizados (5 minutos para noticias recientes, más tiempo para antiguas)
- Implementación de `useQuery` para la noticia principal y noticias relacionadas
- Implementación de `useInfiniteQuery` para comentarios con paginación infinita

### 2. Componentes Optimizados
- Uso de `React.memo` en todos los componentes para evitar re-renderizados innecesarios
- Separación de la UI en componentes pequeños y específicos para mejor mantenimiento
- Implementación de funciones de comparación personalizadas para determinar cuándo re-renderizar

### 3. Carga Optimizada de Imágenes
- Uso de `loading="lazy"` para la carga diferida de imágenes en el contenido
- Priorización de carga para la imagen destacada con `priority={true}`
- Implementación de placeholders durante la carga y fallbacks para imágenes que fallan

### 4. Paginación Infinita para Comentarios
- Implementación de `useInfiniteQuery` para cargar comentarios por páginas
- Uso de `react-intersection-observer` para detectar cuándo cargar más contenido
- Mantenimiento del estado entre navegaciones

### 5. Detección de Visibilidad de Página
- Uso del API `visibilitychange` para detectar cuando la pestaña vuelve a estar activa
- Revalidación condicional de datos solo si han pasado más de 5 minutos desde la última actualización

### 6. Optimización de Base de Datos
- Creación de función RPC `contar_comentarios_por_noticia` para obtener conteos por lotes
- Archivo de migración SQL para implementar la función en Supabase

## Beneficios

1. **Mejor Experiencia de Usuario:**
   - Carga más rápida de la página y contenido
   - Transiciones suaves entre estados de carga
   - Mantenimiento del estado al cambiar de pestaña

2. **Reducción de Carga en el Servidor:**
   - Menos peticiones gracias a la caché optimizada
   - Carga por lotes de datos relacionados
   - Paginación eficiente de comentarios

3. **Mejor Rendimiento:**
   - Reducción de re-renderizados innecesarios
   - Carga diferida de contenido no crítico
   - Optimización de imágenes y recursos multimedia

4. **Mejor Mantenibilidad:**
   - Código modular y reutilizable
   - Separación clara de responsabilidades
   - Tipado fuerte con TypeScript

## Cómo Usar la Versión Optimizada

Para utilizar la versión optimizada, renombrar el archivo `src/app/noticias/[id]/page.optimized.tsx` a `src/app/noticias/[id]/page.tsx`, o actualizar las rutas en Next.js para usar la versión optimizada.

## Posibles Mejoras Futuras

1. Implementación de SSR (Server-Side Rendering) para la carga inicial
2. Prefetching de noticias relacionadas al hacer hover
3. Implementación de un modo offline para noticias ya visitadas
4. Optimización adicional de imágenes con formatos modernos (WebP, AVIF)
5. Implementación de métricas de rendimiento para monitoreo
