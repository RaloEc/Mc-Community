# Implementación de Borrado Suave para Comentarios

## Resumen

Se ha implementado un sistema de borrado suave (soft delete) para los comentarios tanto en noticias como en hilos del foro. Esta implementación permite:

1. Marcar comentarios como eliminados sin borrarlos físicamente
2. Mantener la estructura de respuestas intacta (los comentarios hijos no se eliminan)
3. Mostrar "[Comentario eliminado]" en lugar del contenido original para usuarios normales
4. Permitir que autores y moderadores vean el contenido original de comentarios eliminados
5. Restaurar comentarios eliminados (solo para moderadores)

## Cambios Realizados

### Base de Datos

1. **Nuevos campos en tablas**:
   - `deleted` (boolean): Indica si el comentario está eliminado
   - `deleted_at` (timestamptz): Fecha y hora de eliminación
   - `deleted_by` (uuid): ID del usuario que eliminó el comentario

2. **Modificación de relaciones**:
   - Eliminación de restricción `ON DELETE CASCADE` en `comentario_padre_id` y `post_padre_id`
   - Reemplazo por `ON DELETE NO ACTION` para mantener integridad referencial

3. **Índices**:
   - Índices en `parent_id`, `deleted` y `created_at` para mejorar rendimiento

4. **Vistas**:
   - `comentarios_public`: Muestra contenido original o "[Comentario eliminado]" según permisos
   - `foro_posts_public`: Similar para posts del foro

5. **Políticas RLS**:
   - SELECT: Todos pueden leer, pero el contenido se filtra según permisos
   - INSERT: Solo usuarios autenticados
   - UPDATE: Solo autor o moderadores
   - DELETE: Solo administradores (borrado físico)

### API

1. **Endpoint de borrado**:
   - Modificado para realizar borrado suave en lugar de borrado físico
   - Actualiza campos `deleted`, `deleted_at` y `deleted_by`

2. **Endpoint de restauración**:
   - Nuevo endpoint para restaurar comentarios eliminados
   - Solo accesible para moderadores y administradores

3. **Endpoint de respuesta**:
   - Actualizado para incluir información de borrado en los metadatos de citas

### Frontend

1. **CommentCard**:
   - Modificado para mostrar "[Comentario eliminado]" cuando `comment.deleted` es true
   - Mantiene la estructura visual de comentarios y respuestas

2. **Tipos**:
   - Actualizada la interfaz `Comment` para incluir campos de borrado suave

## Pruebas

Se ha creado un script SQL para verificar la implementación:
- Creación de comentarios de prueba
- Aplicación de borrado suave
- Verificación de que los comentarios hijos permanecen intactos
- Prueba de la vista para verificar el enmascaramiento de contenido
- Prueba de restauración de comentarios

## Próximos Pasos

1. Implementar interfaz de moderación para restaurar comentarios eliminados
2. Añadir estadísticas de comentarios eliminados en el panel de administración
3. Considerar la implementación de borrado físico programado para comentarios muy antiguos
