-- =====================================================
-- CORRECCIÓN: Relación entre foro_posts y perfiles
-- =====================================================
-- Problema: La restricción foro_posts_autor_id_fkey apunta a auth.users
-- pero la aplicación necesita la relación con perfiles
-- =====================================================

-- Eliminar la restricción que apunta a auth.users
ALTER TABLE public.foro_posts 
DROP CONSTRAINT IF EXISTS foro_posts_autor_id_fkey;

-- Crear la restricción correcta que apunta a perfiles
ALTER TABLE public.foro_posts
ADD CONSTRAINT foro_posts_autor_id_fkey 
FOREIGN KEY (autor_id) 
REFERENCES public.perfiles(id) 
ON DELETE CASCADE;

-- Verificar que el índice existe
CREATE INDEX IF NOT EXISTS idx_foro_posts_autor_id 
ON public.foro_posts(autor_id);

-- Comentario
COMMENT ON CONSTRAINT foro_posts_autor_id_fkey ON public.foro_posts 
IS 'Relación entre posts del foro y perfiles de usuario';
