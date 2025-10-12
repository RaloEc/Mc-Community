-- =====================================================
-- PASO 11: Restaurar hilos eliminados (para pruebas)
-- =====================================================

-- Ver hilos eliminados
SELECT 
  id,
  titulo,
  autor_id,
  created_at,
  deleted_at
FROM foro_hilos
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- OPCIÓN A: Restaurar TODOS los hilos eliminados
-- Descomenta esta línea si quieres restaurar todos:
-- UPDATE foro_hilos SET deleted_at = NULL WHERE deleted_at IS NOT NULL;

-- OPCIÓN B: Restaurar solo los últimos 5 hilos eliminados
-- Descomenta estas líneas si quieres restaurar solo algunos:
/*
UPDATE foro_hilos 
SET deleted_at = NULL 
WHERE id IN (
  SELECT id 
  FROM foro_hilos 
  WHERE deleted_at IS NOT NULL 
  ORDER BY deleted_at DESC 
  LIMIT 5
);
*/

-- Verificar cuántos hilos quedaron activos después de restaurar
SELECT 
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as hilos_activos,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as hilos_eliminados,
  COUNT(*) as total
FROM foro_hilos;
