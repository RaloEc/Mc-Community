-- Crear tabla para votos de posts/comentarios del foro
CREATE TABLE IF NOT EXISTS public.foro_votos_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.foro_posts(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    valor_voto SMALLINT NOT NULL CHECK (valor_voto IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, usuario_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_foro_votos_posts_post_id ON public.foro_votos_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_foro_votos_posts_usuario_id ON public.foro_votos_posts(usuario_id);
CREATE INDEX IF NOT EXISTS idx_foro_votos_posts_post_usuario ON public.foro_votos_posts(post_id, usuario_id);

-- Agregar columna de votos totales a foro_posts si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'foro_posts' 
        AND column_name = 'votos_totales'
    ) THEN
        ALTER TABLE public.foro_posts ADD COLUMN votos_totales INTEGER DEFAULT 0;
    END IF;
END $$;

-- Función para actualizar el contador de votos en foro_posts
CREATE OR REPLACE FUNCTION actualizar_votos_post()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular el total de votos para el post
    UPDATE public.foro_posts
    SET votos_totales = (
        SELECT COALESCE(SUM(valor_voto), 0)
        FROM public.foro_votos_posts
        WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar votos al insertar, actualizar o eliminar
DROP TRIGGER IF EXISTS trigger_actualizar_votos_post ON public.foro_votos_posts;
CREATE TRIGGER trigger_actualizar_votos_post
    AFTER INSERT OR UPDATE OR DELETE ON public.foro_votos_posts
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_votos_post();

-- Políticas RLS para foro_votos_posts
ALTER TABLE public.foro_votos_posts ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver los votos
DROP POLICY IF EXISTS "Cualquiera puede ver votos de posts" ON public.foro_votos_posts;
CREATE POLICY "Cualquiera puede ver votos de posts"
    ON public.foro_votos_posts
    FOR SELECT
    USING (true);

-- Política: Solo usuarios autenticados pueden insertar votos
DROP POLICY IF EXISTS "Usuarios autenticados pueden votar posts" ON public.foro_votos_posts;
CREATE POLICY "Usuarios autenticados pueden votar posts"
    ON public.foro_votos_posts
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- Política: Solo el autor del voto puede actualizarlo
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus votos" ON public.foro_votos_posts;
CREATE POLICY "Usuarios pueden actualizar sus votos"
    ON public.foro_votos_posts
    FOR UPDATE
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Política: Solo el autor del voto puede eliminarlo
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus votos" ON public.foro_votos_posts;
CREATE POLICY "Usuarios pueden eliminar sus votos"
    ON public.foro_votos_posts
    FOR DELETE
    USING (auth.uid() = usuario_id);

-- Habilitar Realtime para la tabla de votos
ALTER PUBLICATION supabase_realtime ADD TABLE public.foro_votos_posts;

-- Calcular votos iniciales para posts existentes
UPDATE public.foro_posts
SET votos_totales = (
    SELECT COALESCE(SUM(valor_voto), 0)
    FROM public.foro_votos_posts
    WHERE post_id = foro_posts.id
);

-- Comentarios
COMMENT ON TABLE public.foro_votos_posts IS 'Almacena los votos de los usuarios en posts/comentarios del foro';
COMMENT ON COLUMN public.foro_votos_posts.valor_voto IS 'Valor del voto: -1 (negativo) o 1 (positivo)';
COMMENT ON COLUMN public.foro_posts.votos_totales IS 'Suma total de votos del post (calculado automáticamente)';
