-- Migración para implementar borrado suave en comentarios
-- Añadir campos de borrado suave a la tabla comentarios
ALTER TABLE comentarios
ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN deleted_by UUID REFERENCES perfiles(id);

-- Añadir campos de borrado suave a la tabla foro_posts
ALTER TABLE foro_posts
ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN deleted_by UUID REFERENCES perfiles(id);

-- Eliminar la restricción ON DELETE CASCADE si existe
-- Primero, identificar el nombre de la restricción
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'comentarios'::regclass
    AND confrelid = 'comentarios'::regclass
    AND contype = 'f'
    AND confdeltype = 'c'; -- 'c' significa CASCADE
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE comentarios DROP CONSTRAINT ' || constraint_name;
        EXECUTE 'ALTER TABLE comentarios ADD CONSTRAINT comentarios_parent_id_fkey FOREIGN KEY (comentario_padre_id) REFERENCES comentarios(id) ON DELETE NO ACTION';
    END IF;
END $$;

-- Hacer lo mismo para foro_posts
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'foro_posts'::regclass
    AND confrelid = 'foro_posts'::regclass
    AND contype = 'f'
    AND confdeltype = 'c'; -- 'c' significa CASCADE
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE foro_posts DROP CONSTRAINT ' || constraint_name;
        EXECUTE 'ALTER TABLE foro_posts ADD CONSTRAINT foro_posts_parent_id_fkey FOREIGN KEY (post_padre_id) REFERENCES foro_posts(id) ON DELETE NO ACTION';
    END IF;
END $$;

-- Crear índices recomendados para comentarios
CREATE INDEX IF NOT EXISTS comentarios_parent_id_idx ON comentarios(comentario_padre_id);
CREATE INDEX IF NOT EXISTS comentarios_deleted_idx ON comentarios(deleted);
CREATE INDEX IF NOT EXISTS comentarios_created_at_idx ON comentarios(created_at);

-- Crear índices recomendados para foro_posts
CREATE INDEX IF NOT EXISTS foro_posts_parent_id_idx ON foro_posts(post_padre_id);
CREATE INDEX IF NOT EXISTS foro_posts_deleted_idx ON foro_posts(deleted);
CREATE INDEX IF NOT EXISTS foro_posts_created_at_idx ON foro_posts(created_at);

-- Crear vista para comentarios públicos
CREATE OR REPLACE VIEW comentarios_public AS
SELECT 
    c.*,
    CASE 
        WHEN c.deleted AND auth.uid() != c.usuario_id AND NOT EXISTS (
            SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        ) THEN '[Comentario eliminado]'
        ELSE c.contenido
    END AS display_content
FROM comentarios c;

-- Crear vista para posts públicos del foro
CREATE OR REPLACE VIEW foro_posts_public AS
SELECT 
    p.*,
    CASE 
        WHEN p.deleted AND auth.uid() != p.autor_id AND NOT EXISTS (
            SELECT 1 FROM perfiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'
        ) THEN '[Comentario eliminado]'
        ELSE p.contenido
    END AS display_content
FROM foro_posts p;

-- Configurar políticas RLS para comentarios
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: todos pueden leer comentarios no eliminados
CREATE POLICY comentarios_select_policy ON comentarios
    FOR SELECT
    USING (true);

-- Política para INSERT: usuarios autenticados pueden crear
CREATE POLICY comentarios_insert_policy ON comentarios
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE: sólo autor o moderadores pueden actualizar
CREATE POLICY comentarios_update_policy ON comentarios
    FOR UPDATE
    USING (
        auth.uid() = usuario_id OR 
        EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator'))
    );

-- Política para DELETE: deshabilitar para usuarios normales
CREATE POLICY comentarios_delete_policy ON comentarios
    FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );

-- Configurar políticas RLS para foro_posts
ALTER TABLE foro_posts ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: todos pueden leer posts no eliminados
CREATE POLICY foro_posts_select_policy ON foro_posts
    FOR SELECT
    USING (true);

-- Política para INSERT: usuarios autenticados pueden crear
CREATE POLICY foro_posts_insert_policy ON foro_posts
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE: sólo autor o moderadores pueden actualizar
CREATE POLICY foro_posts_update_policy ON foro_posts
    FOR UPDATE
    USING (
        auth.uid() = autor_id OR 
        EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator'))
    );

-- Política para DELETE: deshabilitar para usuarios normales
CREATE POLICY foro_posts_delete_policy ON foro_posts
    FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );
