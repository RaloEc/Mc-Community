-- =====================================================
-- Script para agregar columnas de soft delete
-- =====================================================
-- Este script agrega las columnas necesarias para el borrado suave
-- de comentarios y posts del foro.
--
-- INSTRUCCIONES:
-- 1. Abre el SQL Editor en tu dashboard de Supabase
-- 2. Copia y pega este script completo
-- 3. Ejecuta el script
-- =====================================================

-- Verificar si las columnas ya existen en comentarios
DO $$ 
BEGIN
    -- Agregar columna deleted si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'deleted'
    ) THEN
        ALTER TABLE comentarios ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Columna deleted agregada a comentarios';
    ELSE
        RAISE NOTICE 'Columna deleted ya existe en comentarios';
    END IF;

    -- Agregar columna deleted_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE comentarios ADD COLUMN deleted_at TIMESTAMPTZ;
        RAISE NOTICE 'Columna deleted_at agregada a comentarios';
    ELSE
        RAISE NOTICE 'Columna deleted_at ya existe en comentarios';
    END IF;

    -- Agregar columna deleted_by si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'deleted_by'
    ) THEN
        ALTER TABLE comentarios ADD COLUMN deleted_by UUID REFERENCES perfiles(id);
        RAISE NOTICE 'Columna deleted_by agregada a comentarios';
    ELSE
        RAISE NOTICE 'Columna deleted_by ya existe en comentarios';
    END IF;
END $$;

-- Verificar si las columnas ya existen en foro_posts
DO $$ 
BEGIN
    -- Agregar columna deleted si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'foro_posts' AND column_name = 'deleted'
    ) THEN
        ALTER TABLE foro_posts ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Columna deleted agregada a foro_posts';
    ELSE
        RAISE NOTICE 'Columna deleted ya existe en foro_posts';
    END IF;

    -- Agregar columna deleted_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'foro_posts' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE foro_posts ADD COLUMN deleted_at TIMESTAMPTZ;
        RAISE NOTICE 'Columna deleted_at agregada a foro_posts';
    ELSE
        RAISE NOTICE 'Columna deleted_at ya existe en foro_posts';
    END IF;

    -- Agregar columna deleted_by si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'foro_posts' AND column_name = 'deleted_by'
    ) THEN
        ALTER TABLE foro_posts ADD COLUMN deleted_by UUID REFERENCES perfiles(id);
        RAISE NOTICE 'Columna deleted_by agregada a foro_posts';
    ELSE
        RAISE NOTICE 'Columna deleted_by ya existe en foro_posts';
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS comentarios_deleted_idx ON comentarios(deleted);
CREATE INDEX IF NOT EXISTS comentarios_deleted_at_idx ON comentarios(deleted_at);
CREATE INDEX IF NOT EXISTS foro_posts_deleted_idx ON foro_posts(deleted);
CREATE INDEX IF NOT EXISTS foro_posts_deleted_at_idx ON foro_posts(deleted_at);

-- Verificar que las columnas se agregaron correctamente
SELECT 
    'comentarios' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'comentarios' 
  AND column_name IN ('deleted', 'deleted_at', 'deleted_by')

UNION ALL

SELECT 
    'foro_posts' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'foro_posts' 
  AND column_name IN ('deleted', 'deleted_at', 'deleted_by')
ORDER BY tabla, column_name;
