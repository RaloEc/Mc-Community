-- =====================================================
-- CORRECCIÓN: Nombre de la restricción foro_posts_autor_id_fkey
-- =====================================================
-- Problema: La restricción foro_posts_autor_id_fkey no coincide con el nombre esperado
-- Solución: Eliminar la restricción existente y crearla con el nombre correcto
-- =====================================================

-- Eliminar restricción existente si existe
ALTER TABLE public.foro_posts 
DROP CONSTRAINT IF EXISTS foro_posts_autor_id_fkey;

-- Crear la restricción con el nombre exacto que espera la aplicación
ALTER TABLE public.foro_posts
ADD CONSTRAINT foro_posts_autor_id_fkey 
FOREIGN KEY (autor_id) 
REFERENCES public.perfiles(id) 
ON DELETE CASCADE;

-- Comentario
COMMENT ON CONSTRAINT foro_posts_autor_id_fkey ON public.foro_posts 
IS 'Relación entre posts del foro y perfiles de usuario (nombre corregido)';

-- Verificar que el índice existe
CREATE INDEX IF NOT EXISTS idx_foro_posts_autor_id 
ON public.foro_posts(autor_id);
