-- =====================================================
-- PASO 5: Verificar que deleted_at funciona correctamente
-- =====================================================

-- Ver todos los hilos (incluyendo eliminados)
SELECT 
  id,
  titulo,
  autor_id,
  created_at,
  deleted_at,
  CASE 
    WHEN deleted_at IS NULL THEN '✅ Activo'
    ELSE '❌ Eliminado'
  END as estado
FROM foro_hilos
ORDER BY created_at DESC
LIMIT 10;

-- Contar hilos activos vs eliminados
SELECT 
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as hilos_activos,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as hilos_eliminados,
  COUNT(*) as total
FROM foro_hilos;

-- Probar la función RPC manualmente
SELECT * FROM get_hilos_recientes_moderacion(20, 0, NULL, 'created_at', 'DESC');
