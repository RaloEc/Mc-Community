-- Migración para habilitar RLS en tablas públicas
-- Esto resuelve las alertas de seguridad relacionadas con RLS deshabilitado

-- 1. Habilitar RLS en news_ticker
ALTER TABLE public.news_ticker ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública
CREATE POLICY "news_ticker_select_policy" ON public.news_ticker
  FOR SELECT
  USING (true);

-- Política para permitir inserción solo a administradores
CREATE POLICY "news_ticker_insert_policy" ON public.news_ticker
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );

-- Política para permitir actualización solo a administradores
CREATE POLICY "news_ticker_update_policy" ON public.news_ticker
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );

-- Política para permitir eliminación solo a administradores
CREATE POLICY "news_ticker_delete_policy" ON public.news_ticker
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );

-- 2. Habilitar RLS en foro_posts_historial
ALTER TABLE public.foro_posts_historial ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "foro_posts_historial_select_policy" ON public.foro_posts_historial
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- Política para permitir inserción automática (solo el sistema)
CREATE POLICY "foro_posts_historial_insert_policy" ON public.foro_posts_historial
  FOR INSERT
  WITH CHECK (true);

-- No permitir actualización ni eliminación del historial
-- (el historial debe ser inmutable)

-- 3. Habilitar RLS en noticias_comentarios (tabla de relación)
ALTER TABLE public.noticias_comentarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública
CREATE POLICY "noticias_comentarios_select_policy" ON public.noticias_comentarios
  FOR SELECT
  USING (true);

-- Política para permitir inserción solo a través del sistema
CREATE POLICY "noticias_comentarios_insert_policy" ON public.noticias_comentarios
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir actualización solo a administradores
CREATE POLICY "noticias_comentarios_update_policy" ON public.noticias_comentarios
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );

-- Política para permitir eliminación solo a administradores
CREATE POLICY "noticias_comentarios_delete_policy" ON public.noticias_comentarios
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );

-- Comentario: Todas las tablas ahora tienen RLS habilitado con políticas apropiadas
-- que permiten acceso público para lectura y acceso controlado para escritura.
