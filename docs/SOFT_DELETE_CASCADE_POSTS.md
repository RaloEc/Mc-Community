# Eliminación en Cascada de Posts del Foro (Soft Delete)

## Problema Identificado

Cuando se eliminaba un post/comentario del foro, las respuestas a ese post **no se eliminaban**, causando:
- ❌ Contadores incorrectos de respuestas
- ❌ Respuestas huérfanas visibles sin su comentario padre
- ❌ Inconsistencia en los datos mostrados

### Ejemplo del Problema

```
Post Principal (ID: 123)
├── Respuesta 1 (ID: 456) ← Se elimina este
│   ├── Respuesta 1.1 (ID: 789) ← Quedaba visible sin padre
│   └── Respuesta 1.2 (ID: 012) ← Quedaba visible sin padre
└── Respuesta 2 (ID: 345)
```

## Solución Implementada

Se implementó **eliminación en cascada con soft delete** que:
- ✅ Marca como eliminado el post principal
- ✅ Marca como eliminadas **todas sus respuestas recursivamente**
- ✅ Mantiene la integridad referencial
- ✅ Permite restaurar todo el árbol de respuestas

### Cómo Funciona

```
Post Principal (ID: 123)
├── Respuesta 1 (ID: 456) ← Se elimina este
│   ├── Respuesta 1.1 (ID: 789) ← Se elimina automáticamente
│   └── Respuesta 1.2 (ID: 012) ← Se elimina automáticamente
└── Respuesta 2 (ID: 345) ← No se toca
```

## Archivos Modificados

### 1. Función SQL de Base de Datos
**Archivo:** `supabase/migrations/20251012000002_soft_delete_cascade_posts.sql`

Se crearon dos funciones:

#### a) `soft_delete_post_cascade(p_post_id, p_deleted_by)`
Elimina un post y todas sus respuestas recursivamente.

**Parámetros:**
- `p_post_id` (UUID): ID del post a eliminar
- `p_deleted_by` (UUID): ID del usuario que elimina

**Retorna:**
```json
{
  "success": true,
  "message": "Post y respuestas eliminados correctamente",
  "affected_count": 5,
  "deleted_at": "2025-10-12T20:30:00Z"
}
```

**Lógica:**
1. Verifica que el post existe
2. Marca como eliminado el post principal:
   - `deleted = true`
   - `deleted_at = NOW()`
   - `deleted_by = usuario_id`
3. Usa una **CTE recursiva** para encontrar todas las respuestas
4. Marca como eliminadas todas las respuestas encontradas
5. Retorna el número total de posts afectados

#### b) `restore_post_cascade(p_post_id)`
Restaura un post y todas sus respuestas recursivamente.

**Parámetros:**
- `p_post_id` (UUID): ID del post a restaurar

**Retorna:**
```json
{
  "success": true,
  "message": "Post y respuestas restaurados correctamente",
  "affected_count": 5
}
```

**Lógica:**
1. Verifica que el post existe
2. Restaura el post principal:
   - `deleted = false`
   - `deleted_at = NULL`
   - `deleted_by = NULL`
3. Usa una **CTE recursiva** para encontrar todas las respuestas
4. Restaura todas las respuestas encontradas
5. Retorna el número total de posts restaurados

---

### 2. Endpoint API Actualizado
**Archivo:** `src/app/api/foro/hilo/[id]/post/[postId]/route.ts`

#### Cambios en el método DELETE

**ANTES (Delete físico):**
```typescript
const { error } = await supabase
  .from('foro_posts')
  .delete()
  .eq('id', postId);
```

**DESPUÉS (Soft delete con cascada):**
```typescript
const { data: resultado, error } = await serviceSupabase.rpc('soft_delete_post_cascade', {
  p_post_id: postId,
  p_deleted_by: session.user.id
});
```

#### Validaciones Agregadas

1. **Verificar si ya está eliminado:**
```typescript
if (post.deleted) {
  return NextResponse.json({ 
    error: 'Esta respuesta ya ha sido eliminada.' 
  }, { status: 400 });
}
```

2. **Información detallada en la respuesta:**
```typescript
return NextResponse.json({ 
  message: 'Respuesta eliminada correctamente',
  success: true,
  affected_count: 5,  // Número de posts eliminados
  deleted_at: '2025-10-12T20:30:00Z'
});
```

---

## Estructura de la Tabla

### Campos de Soft Delete en `foro_posts`

```sql
CREATE TABLE foro_posts (
  id UUID PRIMARY KEY,
  hilo_id UUID NOT NULL,
  post_padre_id UUID REFERENCES foro_posts(id),  -- Para respuestas
  contenido TEXT NOT NULL,
  autor_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- Campos de soft delete
  deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES perfiles(id),
  
  -- Otros campos...
);
```

### Índices Creados

```sql
CREATE INDEX foro_posts_parent_id_idx ON foro_posts(post_padre_id);
CREATE INDEX foro_posts_deleted_idx ON foro_posts(deleted);
CREATE INDEX foro_posts_created_at_idx ON foro_posts(created_at);
```

---

## Cómo Aplicar los Cambios

### Opción 1: Supabase CLI
```cmd
supabase db push
```

### Opción 2: Supabase Dashboard
1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Copia el contenido de `supabase/migrations/20251012000002_soft_delete_cascade_posts.sql`
3. Ejecuta la consulta

### Opción 3: Script Batch (Windows)
Crea un archivo `aplicar_soft_delete_cascade.bat`:
```batch
@echo off
echo Aplicando eliminación en cascada para posts...
supabase db push --file supabase/migrations/20251012000002_soft_delete_cascade_posts.sql
echo Migración completada!
pause
```

---

## Testing

### Casos de Prueba

#### 1. Eliminar Post con Respuestas
```typescript
// Estructura antes de eliminar
Post A (id: 1)
├── Respuesta B (id: 2)
│   ├── Respuesta C (id: 3)
│   └── Respuesta D (id: 4)
└── Respuesta E (id: 5)

// Eliminar Post B
DELETE /api/foro/hilo/[id]/post/2

// Resultado esperado:
// - Post B: deleted = true
// - Post C: deleted = true (cascada)
// - Post D: deleted = true (cascada)
// - Post A: sin cambios
// - Post E: sin cambios
// affected_count: 3
```

#### 2. Restaurar Post con Respuestas
```typescript
// Restaurar Post B
await supabase.rpc('restore_post_cascade', { p_post_id: 2 })

// Resultado esperado:
// - Post B: deleted = false
// - Post C: deleted = false (cascada)
// - Post D: deleted = false (cascada)
// affected_count: 3
```

#### 3. Verificar Contadores
```typescript
// Antes de eliminar
Hilo: 5 respuestas totales

// Después de eliminar Post B (con 2 respuestas)
Hilo: 2 respuestas totales (solo A y E)

// Los contadores ahora excluyen posts eliminados
```

---

## Consultas SQL Útiles

### Ver Posts Eliminados con sus Respuestas
```sql
WITH RECURSIVE respuestas_recursivas AS (
  -- Post eliminado
  SELECT id, post_padre_id, contenido, deleted, deleted_at, 0 as nivel
  FROM foro_posts
  WHERE id = 'POST_ID_AQUI'
  
  UNION ALL
  
  -- Respuestas recursivas
  SELECT fp.id, fp.post_padre_id, fp.contenido, fp.deleted, fp.deleted_at, rr.nivel + 1
  FROM foro_posts fp
  INNER JOIN respuestas_recursivas rr ON fp.post_padre_id = rr.id
)
SELECT * FROM respuestas_recursivas
ORDER BY nivel, created_at;
```

### Contar Posts Activos vs Eliminados
```sql
SELECT 
  hilo_id,
  COUNT(*) FILTER (WHERE deleted = false) as activos,
  COUNT(*) FILTER (WHERE deleted = true) as eliminados,
  COUNT(*) as total
FROM foro_posts
GROUP BY hilo_id;
```

### Encontrar Posts Huérfanos (sin padre)
```sql
SELECT p.*
FROM foro_posts p
WHERE p.post_padre_id IS NOT NULL
  AND p.deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM foro_posts padre
    WHERE padre.id = p.post_padre_id
      AND padre.deleted = false
  );
```

---

## Impacto en la Aplicación

### Páginas Afectadas

✅ **Página de Hilo** (`/foro/hilos/[slug]`)
- Los contadores ahora son correctos
- No se muestran respuestas huérfanas
- Al eliminar un comentario, se eliminan todas sus respuestas

✅ **API de Posts** (`/api/foro/hilo/[id]/post/[postId]`)
- DELETE ahora usa soft delete con cascada
- Retorna información detallada de la eliminación

✅ **Contadores de Respuestas**
- Todas las consultas filtran `deleted = false` o `deleted_at IS NULL`
- Los contadores reflejan solo contenido activo

### Componentes Afectados

- `ForoPosts.tsx` - Muestra posts activos
- `PostCard.tsx` - Maneja eliminación de posts
- `useForoPosts.ts` - Hook para gestionar posts

---

## Consideraciones de Rendimiento

### Índices Optimizados
Los índices en `post_padre_id` y `deleted` aseguran que las consultas recursivas sean eficientes.

### CTE Recursiva
La función usa una CTE (Common Table Expression) recursiva que es eficiente para árboles de respuestas de profundidad moderada (< 100 niveles).

### Límites Recomendados
- **Profundidad máxima de respuestas:** 10 niveles
- **Respuestas por post:** Sin límite técnico, pero se recomienda < 1000 para mejor UX

---

## Restauración de Posts

### Desde la Consola de Supabase
```sql
SELECT restore_post_cascade('POST_ID_AQUI');
```

### Desde la API (Crear endpoint si es necesario)
```typescript
// POST /api/admin/foro/post/[postId]/restore
const { data, error } = await supabase.rpc('restore_post_cascade', {
  p_post_id: postId
});
```

---

## Migración de Datos Existentes

Si tienes posts eliminados con el método anterior (DELETE físico), no hay nada que migrar ya que esos posts ya no existen en la base de datos.

Para posts futuros, todos usarán el nuevo sistema de soft delete con cascada.

---

## Próximos Pasos

1. ✅ **Implementar endpoint de restauración** en el panel de administración
2. ✅ **Agregar indicador visual** de posts eliminados para moderadores
3. ✅ **Crear dashboard** para ver posts eliminados recientemente
4. ✅ **Implementar purga automática** de posts eliminados después de X días

---

## Notas Técnicas

### ¿Por qué Soft Delete?
- **Recuperación:** Permite restaurar contenido eliminado por error
- **Auditoría:** Mantiene registro de quién eliminó qué y cuándo
- **Integridad:** Preserva la estructura de datos para análisis

### ¿Por qué Cascada?
- **Consistencia:** Evita respuestas huérfanas
- **UX:** Los usuarios no ven respuestas sin contexto
- **Contadores:** Los números son precisos

### Alternativas Consideradas
1. **DELETE físico con ON DELETE CASCADE:** Pérdida permanente de datos
2. **Soft delete sin cascada:** Respuestas huérfanas
3. **Marcar solo el padre:** Respuestas visibles sin contexto

La solución implementada (soft delete con cascada) es la mejor para este caso de uso.

---

## Archivos Relacionados

### Migraciones
- `20250904000000_soft_delete_comentarios.sql` - Implementación inicial de soft delete
- `20251012000001_fix_contar_respuestas_deleted.sql` - Corrección de contadores
- `20251012000002_soft_delete_cascade_posts.sql` - **Esta migración**

### Documentación
- `docs/CORRECCION_CONTADORES_RESPUESTAS.md` - Corrección de contadores
- `docs/RESUMEN_SISTEMA_MODERACION.md` - Sistema de moderación general
- `docs/SOFT_DELETE_CASCADE_POSTS.md` - **Este documento**

---

**Fecha de implementación:** 12 de Octubre, 2025  
**Versión:** 1.0.0  
**Autor:** Sistema de eliminación en cascada
