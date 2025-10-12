-- =====================================================
-- PASO 6: Verificar políticas RLS para foro_hilos
-- =====================================================

-- Ver políticas actuales de foro_hilos
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'foro_hilos'
ORDER BY policyname;

-- Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'foro_hilos';

-- Si necesitas crear/actualizar políticas para permitir UPDATE de deleted_at
-- Descomenta y ejecuta estas líneas:

/*
-- Política para permitir a usuarios autenticados actualizar deleted_at (soft delete)
CREATE POLICY "Usuarios autenticados pueden soft-delete sus propios hilos"
ON foro_hilos
FOR UPDATE
TO authenticated
USING (autor_id = auth.uid())
WITH CHECK (autor_id = auth.uid());

-- Política para permitir a admins actualizar cualquier hilo
CREATE POLICY "Admins pueden soft-delete cualquier hilo"
ON foro_hilos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
*/
