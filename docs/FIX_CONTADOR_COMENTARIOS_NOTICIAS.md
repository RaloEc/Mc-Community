# Corrección: Contador de Comentarios en Tarjetas de Noticias

## Problema Identificado

Las tarjetas de noticias en la página principal (`/`) y en la página de noticias (`/noticias`) mostraban el contador de comentarios **incluyendo los comentarios eliminados** (soft-deleted).

### Causa Raíz

Las funciones SQL que cuentan comentarios de noticias no estaban filtrando por el campo `deleted`:

1. **`contar_comentarios_por_noticia(uuid[])`** - Usaba el campo incorrecto `eliminado = false` en lugar de `deleted = false`
2. **`contar_comentarios_por_noticia(text[])`** - Usaba el campo incorrecto `deleted_at IS NULL` en lugar de `deleted = false`
3. **`contar_comentarios_por_noticia_uuid(uuid[])`** - No filtraba comentarios eliminados
4. **`obtener_contador_comentarios_uuid(uuid)`** - No filtraba comentarios eliminados

### Estructura de Datos

La tabla `comentarios` tiene los siguientes campos para soft-delete:
- `deleted` (BOOLEAN) - Indica si el comentario está eliminado
- `deleted_at` (TIMESTAMPTZ) - Fecha de eliminación
- `deleted_by` (UUID) - Usuario que eliminó el comentario

Los comentarios de noticias se relacionan mediante la tabla intermedia `noticias_comentarios`:
- `noticia_id` (UUID) - ID de la noticia
- `comentario_id` (UUID) - ID del comentario

## Solución Implementada

Se creó una migración SQL que actualiza las tres funciones para:

1. Hacer JOIN con la tabla `comentarios` para acceder al campo `deleted`
2. Filtrar comentarios donde `deleted IS NULL OR deleted = false`
3. Mantener la misma estructura de retorno y rendimiento

### Archivos Modificados

- **Creado**: `supabase/migrations/20251012000000_fix_contar_comentarios_noticias_deleted.sql`
- **Creado**: `ejecutar_fix_contador_comentarios_noticias_simple.bat`

### Funciones Corregidas

#### 1. `contar_comentarios_por_noticia(uuid[])`

Esta función se usa en el API de noticias para obtener contadores en lote.

**Antes:**
```sql
SELECT 
  noticia_id,
  COUNT(*) as total_comentarios
FROM 
  public.comentarios
WHERE 
  noticia_id = ANY(noticia_ids)
  AND eliminado = false  -- ❌ Campo incorrecto
GROUP BY 
  noticia_id;
```

**Después:**
```sql
SELECT 
  nc.noticia_id,
  COUNT(*) as total_comentarios
FROM 
  public.noticias_comentarios nc
INNER JOIN 
  public.comentarios c ON nc.comentario_id = c.id
WHERE 
  nc.noticia_id = ANY(noticia_ids)
  AND (c.deleted IS NULL OR c.deleted = false)  -- ✅ Campo correcto
GROUP BY 
  nc.noticia_id;
```

#### 2. `contar_comentarios_por_noticia(text[])`

Esta versión alternativa usa `content_type` y `content_id` para un sistema más genérico.

**Antes:**
```sql
SELECT 
  content_id::text as noticia_id,
  COUNT(*)::bigint as total_comentarios
FROM 
  comentarios
WHERE 
  content_type = 'noticia'
  AND content_id = ANY(noticia_ids)
  AND deleted_at IS NULL  -- ❌ Campo incorrecto
GROUP BY 
  content_id;
```

**Después:**
```sql
SELECT 
  content_id::text as noticia_id,
  COUNT(*)::bigint as total_comentarios
FROM 
  comentarios
WHERE 
  content_type = 'noticia'
  AND content_id = ANY(noticia_ids)
  AND (deleted IS NULL OR deleted = false)  -- ✅ Campo correcto
GROUP BY 
  content_id;
```

#### 3. `contar_comentarios_por_noticia_uuid(uuid[])`

**Antes:**
```sql
SELECT 
  c.noticia_id,
  COUNT(c.id)::BIGINT as total_comentarios
FROM 
  noticias_comentarios c
WHERE 
  c.noticia_id = ANY(noticia_ids)  -- ❌ Sin filtro de deleted
GROUP BY 
  c.noticia_id;
```

**Después:**
```sql
SELECT 
  nc.noticia_id,
  COUNT(c.id)::BIGINT as total_comentarios
FROM 
  noticias_comentarios nc
INNER JOIN 
  comentarios c ON nc.comentario_id = c.id
WHERE 
  nc.noticia_id = ANY(noticia_ids)
  AND (c.deleted IS NULL OR c.deleted = false)  -- ✅ Filtro agregado
GROUP BY 
  nc.noticia_id;
```

#### 4. `obtener_contador_comentarios_uuid(uuid)`

**Antes:**
```sql
SELECT COUNT(*) INTO total 
FROM noticias_comentarios 
WHERE noticia_id = noticia_id_param;  -- ❌ Sin filtro de deleted
```

**Después:**
```sql
SELECT COUNT(*) INTO total 
FROM noticias_comentarios nc
INNER JOIN comentarios c ON nc.comentario_id = c.id
WHERE nc.noticia_id = noticia_id_param
AND (c.deleted IS NULL OR c.deleted = false);  -- ✅ Filtro agregado
```

## Cómo Aplicar la Corrección

### Opción 1: Usando Supabase CLI (Recomendado)

```cmd
ejecutar_fix_contador_comentarios_noticias_simple.bat
```

### Opción 2: Manual desde Supabase Dashboard

1. Ir a SQL Editor en Supabase Dashboard
2. Copiar el contenido de `supabase/migrations/20251012000000_fix_contar_comentarios_noticias_deleted.sql`
3. Ejecutar el script

### Opción 3: Usando supabase CLI directamente

```cmd
supabase db push
```

## Verificación

Después de aplicar la corrección, verifica que:

1. ✅ Los contadores de comentarios en la página principal (`/`) no incluyen comentarios eliminados
2. ✅ Los contadores de comentarios en la página de noticias (`/noticias`) no incluyen comentarios eliminados
3. ✅ Los contadores se actualizan correctamente cuando se elimina un comentario

### Prueba Manual

1. Ve a una noticia que tenga comentarios
2. Anota el número de comentarios mostrado en la tarjeta
3. Elimina un comentario (soft-delete)
4. Recarga la página
5. El contador debe haber disminuido en 1

## Impacto

- ✅ **Páginas afectadas**: `/` (home), `/noticias`
- ✅ **Componentes afectados**: `NoticiaCard`, `NoticiasDestacadas`
- ✅ **Sin cambios en código frontend**: La corrección es solo en el backend
- ✅ **Sin impacto en rendimiento**: Se mantiene la misma eficiencia con JOINs optimizados

## Notas Técnicas

- La corrección usa `(c.deleted IS NULL OR c.deleted = false)` en lugar de solo `c.deleted = false` para manejar casos donde el campo pueda ser NULL en datos antiguos
- Se mantiene el uso de `INNER JOIN` para asegurar que solo se cuenten comentarios que existen en ambas tablas
- Las funciones mantienen `SECURITY DEFINER` para permitir acceso desde el frontend sin permisos especiales

## Relacionado

- Ver también: `docs/CORRECCION_SOFT_DELETE_COMENTARIOS.md`
- Migración relacionada: `20250904000000_soft_delete_comentarios.sql`
- Corrección similar para foro: `20251009000000_fix_comentarios_count_deleted.sql`
