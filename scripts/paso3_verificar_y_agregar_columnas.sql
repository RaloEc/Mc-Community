-- =====================================================
-- PASO 3: Verificar y agregar columnas faltantes
-- Ejecuta este script para agregar las columnas necesarias
-- =====================================================

-- Verificar columnas existentes en foro_hilos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'foro_hilos' 
ORDER BY ordinal_position;

-- Verificar columnas existentes en foro_posts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'foro_posts' 
ORDER BY ordinal_position;

-- Agregar columna deleted_at a foro_hilos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'foro_hilos' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE foro_hilos ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
        COMMENT ON COLUMN foro_hilos.deleted_at IS 'Fecha de eliminación lógica (soft delete)';
    END IF;
END $$;

-- Agregar columna deleted_at a foro_posts si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'foro_posts' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE foro_posts ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
        COMMENT ON COLUMN foro_posts.deleted_at IS 'Fecha de eliminación lógica (soft delete)';
    END IF;
END $$;

-- Agregar columna parent_id a foro_posts si no existe (para respuestas anidadas)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'foro_posts' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE foro_posts ADD COLUMN parent_id UUID DEFAULT NULL;
        COMMENT ON COLUMN foro_posts.parent_id IS 'ID del comentario padre (para respuestas anidadas)';
        
        -- Agregar foreign key
        ALTER TABLE foro_posts 
        ADD CONSTRAINT foro_posts_parent_id_fkey 
        FOREIGN KEY (parent_id) REFERENCES foro_posts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Verificar que las columnas se agregaron correctamente
SELECT 
    'foro_hilos' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'foro_hilos' 
  AND column_name IN ('deleted_at')

UNION ALL

SELECT 
    'foro_posts' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'foro_posts' 
  AND column_name IN ('deleted_at', 'parent_id')
ORDER BY tabla, column_name;
