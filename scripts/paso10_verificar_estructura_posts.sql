-- =====================================================
-- PASO 10: Verificar estructura de foro_posts
-- =====================================================

-- Ver columnas de foro_posts
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'foro_posts'
ORDER BY ordinal_position;

-- Ver si existe la columna deleted_at
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'foro_posts' 
  AND column_name = 'deleted_at'
) as tiene_deleted_at;
