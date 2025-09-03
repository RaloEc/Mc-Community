-- Script para verificar la implementación del borrado suave de comentarios
-- Este script realiza pruebas en un entorno de desarrollo o pruebas, no ejecutar en producción

-- 1. Crear comentarios de prueba
INSERT INTO comentarios (contenido, usuario_id, tipo_entidad, entidad_id)
VALUES 
('Comentario de prueba 1 - Padre', '00000000-0000-0000-0000-000000000001', 'noticia', 1)
RETURNING id;

-- Guardar el ID del comentario padre (reemplazar con el ID real devuelto)
\set comentario_padre_id 'ID_DEVUELTO_ARRIBA'

-- Crear respuesta al comentario padre
INSERT INTO comentarios (contenido, usuario_id, tipo_entidad, entidad_id, comentario_padre_id)
VALUES 
('Comentario de prueba 2 - Respuesta', '00000000-0000-0000-0000-000000000002', 'noticia', 1, :'comentario_padre_id')
RETURNING id;

-- 2. Verificar que los comentarios se crearon correctamente
SELECT id, contenido, usuario_id, comentario_padre_id, deleted, deleted_at, deleted_by
FROM comentarios
WHERE id = :'comentario_padre_id' OR comentario_padre_id = :'comentario_padre_id';

-- 3. Aplicar borrado suave al comentario padre
UPDATE comentarios
SET deleted = true,
    deleted_at = NOW(),
    deleted_by = '00000000-0000-0000-0000-000000000001'
WHERE id = :'comentario_padre_id';

-- 4. Verificar que el comentario padre está marcado como eliminado pero sigue existiendo
SELECT id, contenido, usuario_id, comentario_padre_id, deleted, deleted_at, deleted_by
FROM comentarios
WHERE id = :'comentario_padre_id';

-- 5. Verificar que la respuesta sigue existiendo y no está marcada como eliminada
SELECT id, contenido, usuario_id, comentario_padre_id, deleted, deleted_at, deleted_by
FROM comentarios
WHERE comentario_padre_id = :'comentario_padre_id';

-- 6. Probar la vista comentarios_public para verificar el enmascaramiento de contenido
-- Para un usuario normal (no autor ni admin)
SELECT 
    c.id, 
    c.deleted,
    c.contenido AS contenido_original,
    CASE 
        WHEN c.deleted AND '00000000-0000-0000-0000-000000000003' != c.usuario_id AND NOT EXISTS (
            SELECT 1 FROM perfiles p WHERE p.id = '00000000-0000-0000-0000-000000000003' AND p.role = 'admin'
        ) THEN '[Comentario eliminado]'
        ELSE c.contenido
    END AS contenido_mostrado
FROM comentarios c
WHERE id = :'comentario_padre_id';

-- 7. Probar la restauración de un comentario eliminado
UPDATE comentarios
SET deleted = false,
    deleted_at = NULL,
    deleted_by = NULL
WHERE id = :'comentario_padre_id';

-- 8. Verificar que el comentario ha sido restaurado
SELECT id, contenido, usuario_id, comentario_padre_id, deleted, deleted_at, deleted_by
FROM comentarios
WHERE id = :'comentario_padre_id';

-- 9. Limpiar datos de prueba (comentar esta sección si se desea mantener los datos para más pruebas)
-- DELETE FROM comentarios WHERE id = :'comentario_padre_id' OR comentario_padre_id = :'comentario_padre_id';
