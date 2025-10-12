-- =====================================================
-- PASO 9: Debug - Ver por qué no aparecen hilos
-- =====================================================

-- 1. Ver todos los hilos (incluyendo eliminados)
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

-- 2. Contar hilos activos vs eliminados
SELECT 
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as hilos_activos,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as hilos_eliminados,
  COUNT(*) as total
FROM foro_hilos;

-- 3. Probar la función RPC manualmente
SELECT * FROM get_hilos_recientes_moderacion(20, 0, NULL, 'created_at', 'DESC');

-- 4. Ver si hay problema con las políticas RLS
-- Ejecutar como usuario autenticado
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "e339f62b-d7d6-4414-9873-b207d1bf6b2d", "role": "authenticated"}';

SELECT * FROM get_hilos_recientes_moderacion(20, 0, NULL, 'created_at', 'DESC');

-- Resetear role
RESET role;
