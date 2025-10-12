-- =====================================================
-- PASO 8: Crear políticas RLS para UPDATE en foro_posts
-- =====================================================

-- Eliminar políticas existentes si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios comentarios" ON foro_posts;
DROP POLICY IF EXISTS "Admins pueden actualizar cualquier comentario" ON foro_posts;

-- Política 1: Usuarios pueden actualizar sus propios comentarios
CREATE POLICY "Usuarios pueden actualizar sus propios comentarios"
ON foro_posts
FOR UPDATE
TO authenticated
USING (autor_id = auth.uid())
WITH CHECK (autor_id = auth.uid());

-- Política 2: Admins pueden actualizar cualquier comentario (incluyendo soft delete)
CREATE POLICY "Admins pueden actualizar cualquier comentario"
ON foro_posts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Verificar que las políticas se crearon correctamente
SELECT 
  policyname,
  cmd,
  roles,
  CASE 
    WHEN policyname LIKE '%Admin%' THEN '✅ Política de admin'
    WHEN policyname LIKE '%propios%' THEN '✅ Política de usuario'
    ELSE '❓ Otra política'
  END as tipo
FROM pg_policies
WHERE tablename = 'foro_posts' AND cmd = 'UPDATE'
ORDER BY policyname;
