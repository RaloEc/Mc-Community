-- =====================================================
-- PASO 12: Crear hilos de prueba para moderación
-- =====================================================

-- Obtener tu user_id y una categoría válida
-- Reemplaza estos valores con los tuyos:
DO $$
DECLARE
  v_user_id UUID := 'e339f62b-d7d6-4414-9873-b207d1bf6b2d'; -- Tu user_id
  v_categoria_id UUID;
BEGIN
  -- Obtener la primera categoría disponible
  SELECT id INTO v_categoria_id FROM foro_categorias LIMIT 1;
  
  -- Crear 3 hilos de prueba
  INSERT INTO foro_hilos (titulo, slug, contenido, autor_id, categoria_id)
  VALUES 
    (
      'Hilo de prueba 1 - Moderación',
      'hilo-prueba-1-moderacion-' || floor(random() * 1000000)::text,
      '<p>Este es un hilo de prueba para el panel de moderación.</p>',
      v_user_id,
      v_categoria_id
    ),
    (
      'Hilo de prueba 2 - Moderación',
      'hilo-prueba-2-moderacion-' || floor(random() * 1000000)::text,
      '<p>Segundo hilo de prueba para verificar que la moderación funciona.</p>',
      v_user_id,
      v_categoria_id
    ),
    (
      'Hilo de prueba 3 - Moderación',
      'hilo-prueba-3-moderacion-' || floor(random() * 1000000)::text,
      '<p>Tercer hilo de prueba con contenido de ejemplo.</p>',
      v_user_id,
      v_categoria_id
    );
    
  RAISE NOTICE '✅ Se crearon 3 hilos de prueba correctamente';
END $$;

-- Verificar que se crearon
SELECT 
  id,
  titulo,
  created_at,
  deleted_at
FROM foro_hilos
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 5;
