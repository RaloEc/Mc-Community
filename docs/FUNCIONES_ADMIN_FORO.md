# Funciones de Administración del Foro

Este documento describe las 8 funciones principales para el panel de administración del foro.

## Índice
1. [buscar_contenido_foro](#1-buscar_contenido_foro)
2. [get_actividad_diaria_foro](#2-get_actividad_diaria_foro)
3. [get_estadisticas_generales_foro](#3-get_estadisticas_generales_foro)
4. [get_usuarios_mas_activos_foro](#4-get_usuarios_mas_activos_foro)
5. [get_hilos_populares](#5-get_hilos_populares)
6. [get_estadisticas_por_categoria](#6-get_estadisticas_por_categoria)
7. [get_hilos_recientes_moderacion](#7-get_hilos_recientes_moderacion)
8. [get_comentarios_recientes_moderacion](#8-get_comentarios_recientes_moderacion)

---

## 1. buscar_contenido_foro

**Descripción:** Busca contenido en hilos y comentarios del foro.

**Parámetros:**
- `termino_busqueda` (TEXT): Término a buscar
- `orden_direccion` (TEXT): 'ASC' o 'DESC' (default: 'DESC')
- `limite` (INT): Número de resultados (default: 50)
- `offset_val` (INT): Offset para paginación (default: 0)

**Campos de búsqueda:**
- Título del hilo
- Contenido del hilo
- Contenido de comentarios
- Nombre de usuario (autor)

**Retorna:**
```typescript
{
  id: UUID,
  tipo: 'hilo' | 'comentario',
  titulo: string | null,
  contenido: string,
  slug: string | null,
  autor_id: UUID,
  autor_username: string,
  autor_avatar_url: string,
  categoria_id: UUID,
  categoria_nombre: string,
  hilo_id: UUID | null,
  hilo_titulo: string | null,
  vistas: number,
  votos_conteo: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

**Ejemplo de uso:**
```sql
-- Buscar "minecraft" ordenado por más recientes
SELECT * FROM buscar_contenido_foro('minecraft', 'DESC', 20, 0);

-- Buscar "tutorial" ordenado por más antiguos
SELECT * FROM buscar_contenido_foro('tutorial', 'ASC', 10, 0);
```

---

## 2. get_actividad_diaria_foro

**Descripción:** Obtiene métricas de actividad diaria del foro.

**Parámetros:**
- `dias` (INT): Rango de días a consultar (default: 30)
  - 7 días: última semana
  - 30 días: último mes
  - 90 días: últimos 3 meses
  - 180 días: últimos 6 meses
  - 365 días: último año

**Métricas incluidas:**
- Hilos nuevos por día
- Comentarios nuevos por día
- Usuarios activos por día
- Total de vistas por día
- Total de votos por día

**Retorna:**
```typescript
{
  fecha: date,
  hilos_nuevos: number,
  comentarios_nuevos: number,
  usuarios_activos: number,
  total_vistas: number,
  total_votos: number
}
```

**Ejemplo de uso:**
```sql
-- Actividad de la última semana
SELECT * FROM get_actividad_diaria_foro(7);

-- Actividad del último mes
SELECT * FROM get_actividad_diaria_foro(30);

-- Actividad del último año
SELECT * FROM get_actividad_diaria_foro(365);
```

---

## 3. get_estadisticas_generales_foro

**Descripción:** Retorna estadísticas generales del foro.

**Parámetros:** Ninguno

**Estadísticas incluidas:**
- Total de hilos
- Total de comentarios
- Total de usuarios activos
- Total de vistas
- Total de categorías activas
- Promedio de comentarios por hilo
- Promedio de hilos por usuario
- Hilo más votado (id, título, votos)
- Hilo menos votado (id, título, votos)
- Hilo más visto (id, título, vistas)

**Retorna:**
```typescript
{
  total_hilos: number,
  total_comentarios: number,
  total_usuarios: number,
  total_vistas: number,
  total_categorias: number,
  promedio_comentarios_por_hilo: number,
  promedio_hilos_por_usuario: number,
  hilo_mas_votado_id: UUID,
  hilo_mas_votado_titulo: string,
  hilo_mas_votado_votos: number,
  hilo_menos_votado_id: UUID,
  hilo_menos_votado_titulo: string,
  hilo_menos_votado_votos: number,
  hilo_mas_visto_id: UUID,
  hilo_mas_visto_titulo: string,
  hilo_mas_visto_vistas: number
}
```

**Ejemplo de uso:**
```sql
SELECT * FROM get_estadisticas_generales_foro();
```

---

## 4. get_usuarios_mas_activos_foro

**Descripción:** Lista usuarios más activos del foro.

**Parámetros:**
- `limite` (INT): Número de usuarios a retornar (default: 20)
- `offset_val` (INT): Offset para paginación (default: 0)

**Criterios de actividad:**
- Usuario es considerado activo si tuvo actividad en el último mes
- Actividad incluye: crear hilos, comentar, recibir votos
- Ordenado por total de interacciones (hilos + comentarios)

**Métricas incluidas:**
- Hilos creados (último mes)
- Comentarios creados (último mes)
- Total de votos recibidos (histórico)
- Última actividad
- Estado activo/inactivo

**Información del perfil:**
- Nombre de usuario
- Avatar
- Rol
- Fecha de creación de cuenta

**Retorna:**
```typescript
{
  usuario_id: UUID,
  username: string,
  avatar_url: string,
  role: string,
  created_at: timestamp,
  hilos_creados: number,
  comentarios_creados: number,
  total_votos_recibidos: number,
  ultima_actividad: timestamp,
  es_activo: boolean
}
```

**Ejemplo de uso:**
```sql
-- Top 10 usuarios más activos
SELECT * FROM get_usuarios_mas_activos_foro(10, 0);

-- Siguiente página (usuarios 11-20)
SELECT * FROM get_usuarios_mas_activos_foro(10, 10);
```

---

## 5. get_hilos_populares

**Descripción:** Obtiene hilos más populares según puntuación.

**Parámetros:**
- `limite` (INT): Número de hilos (default: 10)
- `periodo_dias` (INT): Período en días (default: 30, 0 = todos)

**Fórmula de popularidad:**
```
puntuacion = (vistas * 0.1) + (comentarios * 2) + (votos * 5)
```

**Retorna:**
```typescript
{
  id: UUID,
  titulo: string,
  slug: string,
  autor_id: UUID,
  autor_username: string,
  autor_avatar_url: string,
  categoria_id: UUID,
  categoria_nombre: string,
  vistas: number,
  comentarios_count: number,
  votos_conteo: number,
  created_at: timestamp,
  puntuacion_popularidad: number
}
```

**Ejemplo de uso:**
```sql
-- Top 10 hilos populares del último mes
SELECT * FROM get_hilos_populares(10, 30);

-- Top 20 hilos populares de todos los tiempos
SELECT * FROM get_hilos_populares(20, 0);
```

---

## 6. get_estadisticas_por_categoria

**Descripción:** Estadísticas detalladas por categoría.

**Parámetros:** Ninguno

**Métricas por categoría:**
- Total de hilos
- Total de comentarios
- Total de vistas
- Hilos activos en la última semana
- Fecha del último hilo

**Retorna:**
```typescript
{
  id: UUID,
  nombre: string,
  slug: string,
  descripcion: string,
  color: string,
  icono: string,
  parent_id: UUID | null,
  nivel: number,
  es_activa: boolean,
  total_hilos: number,
  total_comentarios: number,
  total_vistas: number,
  hilos_activos_semana: number,
  ultimo_hilo_fecha: timestamp
}
```

**Ejemplo de uso:**
```sql
SELECT * FROM get_estadisticas_por_categoria();
```

---

## 7. get_hilos_recientes_moderacion

**Descripción:** Hilos recientes para moderación con filtros avanzados.

**Parámetros:**
- `limite` (INT): Número de hilos (default: 20)
- `offset_val` (INT): Offset para paginación (default: 0)
- `filtro_categoria` (UUID): Filtrar por categoría (default: NULL)
- `orden_campo` (TEXT): Campo de ordenamiento (default: 'created_at')
- `orden_direccion` (TEXT): 'ASC' o 'DESC' (default: 'DESC')

**Retorna:**
```typescript
{
  id: UUID,
  titulo: string,
  slug: string,
  contenido: string,
  autor_id: UUID,
  autor_username: string,
  autor_avatar_url: string,
  autor_rol: string,
  categoria_id: UUID,
  categoria_nombre: string,
  categoria_color: string,
  vistas: number,
  votos_conteo: number,
  comentarios_count: number,
  created_at: timestamp,
  updated_at: timestamp,
  es_fijado: boolean,
  es_cerrado: boolean,
  etiquetas: JSON
}
```

**Ejemplo de uso:**
```sql
-- Hilos recientes sin filtro
SELECT * FROM get_hilos_recientes_moderacion(20, 0, NULL, 'created_at', 'DESC');

-- Hilos de una categoría específica
SELECT * FROM get_hilos_recientes_moderacion(20, 0, 'uuid-categoria', 'created_at', 'DESC');
```

---

## 8. get_comentarios_recientes_moderacion

**Descripción:** Comentarios recientes para moderación.

**Parámetros:**
- `limite` (INT): Número de comentarios (default: 50)
- `offset_val` (INT): Offset para paginación (default: 0)

**Retorna:**
```typescript
{
  id: UUID,
  contenido: string,
  autor_id: UUID,
  autor_username: string,
  autor_avatar_url: string,
  autor_rol: string,
  hilo_id: UUID,
  hilo_titulo: string,
  hilo_slug: string,
  parent_id: UUID | null,
  votos_conteo: number,
  created_at: timestamp,
  updated_at: timestamp,
  editado: boolean
}
```

**Ejemplo de uso:**
```sql
-- Últimos 50 comentarios
SELECT * FROM get_comentarios_recientes_moderacion(50, 0);

-- Siguiente página
SELECT * FROM get_comentarios_recientes_moderacion(50, 50);
```

---

## Optimización y Rendimiento

### Índices recomendados

Para optimizar el rendimiento de estas funciones, se recomienda tener los siguientes índices:

```sql
-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_foro_hilos_titulo_lower ON foro_hilos (LOWER(titulo));
CREATE INDEX IF NOT EXISTS idx_foro_hilos_contenido_lower ON foro_hilos (LOWER(contenido));
CREATE INDEX IF NOT EXISTS idx_foro_posts_contenido_lower ON foro_posts (LOWER(contenido));

-- Índices para fechas
CREATE INDEX IF NOT EXISTS idx_foro_hilos_created_at ON foro_hilos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foro_posts_created_at ON foro_posts (created_at DESC);

-- Índices para relaciones
CREATE INDEX IF NOT EXISTS idx_foro_hilos_autor_id ON foro_hilos (autor_id);
CREATE INDEX IF NOT EXISTS idx_foro_posts_autor_id ON foro_posts (autor_id);
CREATE INDEX IF NOT EXISTS idx_foro_posts_hilo_id ON foro_posts (hilo_id);

-- Índices para estadísticas
CREATE INDEX IF NOT EXISTS idx_foro_hilos_votos ON foro_hilos (votos_conteo DESC);
CREATE INDEX IF NOT EXISTS idx_foro_hilos_vistas ON foro_hilos (vistas DESC);
```

### Consideraciones de caché

- Las funciones están marcadas como `SECURITY DEFINER` para ejecutarse con privilegios elevados
- Se recomienda implementar caché en el frontend para las estadísticas generales (TTL: 5-10 minutos)
- La búsqueda debe implementar debouncing en el frontend (300-500ms)
- Las estadísticas diarias pueden cachearse por 1 hora

### Paginación

Todas las funciones que soportan paginación utilizan el patrón `LIMIT/OFFSET`:

```typescript
// Ejemplo en TypeScript
const page = 1;
const pageSize = 20;
const offset = (page - 1) * pageSize;

const { data } = await supabase.rpc('get_usuarios_mas_activos_foro', {
  limite: pageSize,
  offset_val: offset
});
```

---

## Permisos

Todas las funciones tienen permisos otorgados para usuarios autenticados:

```sql
GRANT EXECUTE ON FUNCTION [nombre_funcion] TO authenticated;
```

Para uso en el panel de administración, se recomienda verificar el rol del usuario en el frontend antes de mostrar datos sensibles.

---

## Archivos relacionados

- **Migración:** `supabase/migrations/20250103_funciones_admin_foro_completas.sql`
- **Funciones existentes:** `supabase/migrations/20250103_solo_funciones.sql`
- **Script de prueba:** `scripts/test_funciones_admin_foro.sql`

---

## Próximos pasos

1. Ejecutar la migración en Supabase
2. Probar las funciones con el script de prueba
3. Implementar los endpoints de API en Next.js
4. Crear componentes de UI para el panel de administración
5. Implementar caché en el frontend
6. Añadir índices de optimización si es necesario
