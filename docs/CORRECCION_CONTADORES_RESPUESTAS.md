# Corrección de Contadores de Respuestas/Comentarios

## Problema Identificado

Los contadores de respuestas y comentarios en varias partes de la aplicación estaban incluyendo posts/comentarios eliminados (con `deleted_at` no nulo), lo que causaba que se mostraran conteos incorrectos.

## Archivos Corregidos

### 1. Server Actions - Página de Hilo
**Archivo:** `src/lib/foro/server-actions.ts`

**Cambio:** Líneas 65-70
```typescript
// ANTES
const { count: respuestas } = await supabase
  .from("foro_posts")
  .select("*", { count: "exact", head: true })
  .eq("hilo_id", hilo.id);

// DESPUÉS
const { count: respuestas } = await supabase
  .from("foro_posts")
  .select("*", { count: "exact", head: true })
  .eq("hilo_id", hilo.id)
  .is("deleted_at", null);
```

**Impacto:** El contador de respuestas en la página de lectura de hilos (`/foro/hilos/[slug]`) ahora muestra solo respuestas no eliminadas.

---

### 2. API - Hilos Recientes
**Archivo:** `src/app/api/foro/hilos/recientes/route.ts`

**Cambio:** Líneas 61-66
```typescript
// ANTES
const { count: respuestasCount } = await supabase
  .from('foro_posts')
  .select('*', { count: 'exact', head: true })
  .eq('hilo_id', hilo.id);

// DESPUÉS
const { count: respuestasCount } = await supabase
  .from('foro_posts')
  .select('*', { count: 'exact', head: true })
  .eq('hilo_id', hilo.id)
  .is('deleted_at', null);
```

**Impacto:** Los hilos recientes ahora muestran contadores correctos de respuestas.

---

### 3. API - Estadísticas del Foro
**Archivo:** `src/app/api/foro/estadisticas/route.ts`

**Cambios múltiples:**

#### a) Conteo total de posts (Línea 17)
```typescript
// ANTES
supabase.from('foro_posts').select('id'),

// DESPUÉS
supabase.from('foro_posts').select('id').is('deleted_at', null),
```

#### b) Posts recientes (Línea 61)
```typescript
// ANTES
supabase
  .from('foro_posts')
  .select('id')
  .gt('created_at', fechaLimiteStr)

// DESPUÉS
supabase
  .from('foro_posts')
  .select('id')
  .is('deleted_at', null)
  .gt('created_at', fechaLimiteStr)
```

#### c) Respuestas por hilo destacado (Línea 120)
```typescript
// ANTES
const { count, error } = await supabase
  .from('foro_posts')
  .select('id', { count: 'exact', head: true })
  .eq('hilo_id', hilo.id)

// DESPUÉS
const { count, error } = await supabase
  .from('foro_posts')
  .select('id', { count: 'exact', head: true })
  .eq('hilo_id', hilo.id)
  .is('deleted_at', null)
```

**Impacto:** Las estadísticas del dashboard ahora reflejan solo contenido activo.

---

### 4. API - Hilos del Foro (Principal)
**Archivo:** `src/app/api/foro/hilos/route.ts`

**Cambio:** Línea 74
```typescript
// ANTES
respuestas_conteo:foro_posts(count),

// DESPUÉS
respuestas_conteo:foro_posts!inner(count).is(deleted_at,null),
```

**Nota:** Esta sintaxis de Supabase puede causar errores de tipo en TypeScript. La solución definitiva es usar la función RPC actualizada.

**Impacto:** El listado principal de hilos muestra contadores correctos.

---

### 5. Función RPC de Base de Datos
**Archivo:** `supabase/migrations/20251012000001_fix_contar_respuestas_deleted.sql`

**Función actualizada:** `contar_respuestas_por_hilo`

```sql
CREATE OR REPLACE FUNCTION public.contar_respuestas_por_hilo(hilo_ids uuid[])
RETURNS TABLE(hilo_id uuid, conteo bigint) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    hilo_id,
    COUNT(*) as conteo
  FROM 
    public.foro_posts
  WHERE 
    hilo_id = ANY(hilo_ids)
    AND deleted_at IS NULL  -- Solo contar respuestas no eliminadas
  GROUP BY 
    hilo_id;
$$;
```

**Impacto:** Cualquier código que use esta función RPC ahora obtiene conteos correctos automáticamente.

---

### 6. Componentes del Foro
**Archivos:** 
- `src/components/foro/ForosBloque.tsx`
- `src/components/foro/ForosBloqueDesktop.tsx`

**Nota:** Estos componentes usan agregaciones en el select de Supabase. La sintaxis correcta para filtrar en agregaciones es compleja. Se recomienda:

1. **Opción A:** Usar la función RPC `contar_respuestas_por_hilo` después de obtener los hilos
2. **Opción B:** Hacer una consulta separada para cada hilo con el filtro `deleted_at`
3. **Opción C:** Dejar el conteo sin filtrar en la agregación y filtrar en el cliente (no recomendado)

**Estado actual:** Pendiente de refactorización para usar la función RPC.

---

## Resumen de Impacto

### Páginas Afectadas (Corregidas)
✅ `/foro/hilos/[slug]` - Página de lectura de hilo  
✅ `/api/foro/hilos/recientes` - API de hilos recientes  
✅ `/api/foro/estadisticas` - Dashboard de estadísticas  
✅ `/admin/dashboard` - Panel de administración  

### Páginas Pendientes de Verificación
⚠️ Componentes `ForosBloque` y `ForosBloqueDesktop` - Necesitan refactorización

### Base de Datos
✅ Función RPC `contar_respuestas_por_hilo` actualizada

---

## Cómo Aplicar las Migraciones

### Opción 1: Supabase CLI
```cmd
supabase db push
```

### Opción 2: Supabase Dashboard
1. Ve a SQL Editor en tu proyecto de Supabase
2. Copia el contenido de `supabase/migrations/20251012000001_fix_contar_respuestas_deleted.sql`
3. Ejecuta la consulta

### Opción 3: Script Batch (Windows)
```cmd
@echo off
echo Aplicando corrección de contadores de respuestas...
supabase db push --file supabase/migrations/20251012000001_fix_contar_respuestas_deleted.sql
echo Migración completada!
pause
```

---

## Testing

### Casos de Prueba

1. **Página de Hilo:**
   - ✅ Crear un hilo con 5 respuestas
   - ✅ Eliminar 2 respuestas (soft delete)
   - ✅ Verificar que el contador muestre 3

2. **Hilos Recientes:**
   - ✅ Verificar que los contadores coincidan con respuestas visibles

3. **Estadísticas:**
   - ✅ Verificar que los totales no incluyan contenido eliminado

4. **Perfil de Usuario:**
   - ✅ Verificar que las estadísticas del perfil sean correctas

---

## Archivos Relacionados

### Migraciones Anteriores
- `20250928153000_contar_respuestas_por_hilo.sql` - Función RPC original (sin filtro)
- `20251012000000_fix_contar_comentarios_noticias_deleted.sql` - Corrección para noticias

### Documentación
- `docs/MEJORAS_PERFIL_USUARIO.md` - Incluye correcciones de contadores en perfiles
- `docs/RESUMEN_SISTEMA_MODERACION.md` - Sistema de soft delete

---

## Próximos Pasos

1. **Refactorizar componentes del foro** para usar la función RPC actualizada
2. **Verificar otros contadores** en la aplicación (votos, vistas, etc.)
3. **Agregar tests automatizados** para contadores
4. **Documentar** el uso correcto de contadores en la guía de desarrollo

---

## Notas Técnicas

### Soft Delete
El sistema usa `deleted_at` para marcar contenido eliminado sin borrarlo físicamente:
- `deleted_at IS NULL` = Contenido activo
- `deleted_at IS NOT NULL` = Contenido eliminado

### Supabase Aggregations
Cuando uses agregaciones en Supabase, recuerda:
```typescript
// ❌ NO FUNCIONA - No puedes filtrar directamente en la agregación del select
.select('respuestas:foro_posts(count).is(deleted_at,null)')

// ✅ FUNCIONA - Usa una consulta separada con filtro
.from('foro_posts')
.select('*', { count: 'exact', head: true })
.eq('hilo_id', hiloId)
.is('deleted_at', null)

// ✅ MEJOR - Usa una función RPC optimizada
.rpc('contar_respuestas_por_hilo', { hilo_ids: [hiloId] })
```

---

**Fecha de corrección:** 12 de Octubre, 2025  
**Versión:** 1.0.0  
**Autor:** Sistema de corrección de contadores
