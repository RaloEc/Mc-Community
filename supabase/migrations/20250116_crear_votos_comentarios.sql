-- Crear tabla para votos de comentarios de noticias
CREATE TABLE IF NOT EXISTS public.comentario_votos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comentario_id UUID NOT NULL REFERENCES public.comentarios(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    valor_voto SMALLINT NOT NULL CHECK (valor_voto IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comentario_id, usuario_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_comentario_votos_comentario_id ON public.comentario_votos(comentario_id);
CREATE INDEX IF NOT EXISTS idx_comentario_votos_usuario_id ON public.comentario_votos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentario_votos_comentario_usuario ON public.comentario_votos(comentario_id, usuario_id);

-- Agregar columna de votos totales a comentarios si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comentarios' 
        AND column_name = 'votos_totales'
    ) THEN
        ALTER TABLE public.comentarios ADD COLUMN votos_totales INTEGER DEFAULT 0;
    END IF;
END $$;

-- Función para actualizar el contador de votos en comentarios
CREATE OR REPLACE FUNCTION actualizar_votos_comentario()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular el total de votos para el comentario
    UPDATE public.comentarios
    SET votos_totales = (
        SELECT COALESCE(SUM(valor_voto), 0)
        FROM public.comentario_votos
        WHERE comentario_id = COALESCE(NEW.comentario_id, OLD.comentario_id)
    )
    WHERE id = COALESCE(NEW.comentario_id, OLD.comentario_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar votos al insertar, actualizar o eliminar
DROP TRIGGER IF EXISTS trigger_actualizar_votos_comentario ON public.comentario_votos;
CREATE TRIGGER trigger_actualizar_votos_comentario
    AFTER INSERT OR UPDATE OR DELETE ON public.comentario_votos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_votos_comentario();

-- Políticas RLS para comentario_votos
ALTER TABLE public.comentario_votos ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver los votos
DROP POLICY IF EXISTS "Cualquiera puede ver votos de comentarios" ON public.comentario_votos;
CREATE POLICY "Cualquiera puede ver votos de comentarios"
    ON public.comentario_votos
    FOR SELECT
    USING (true);

-- Política: Solo usuarios autenticados pueden insertar votos
DROP POLICY IF EXISTS "Usuarios autenticados pueden votar comentarios" ON public.comentario_votos;
CREATE POLICY "Usuarios autenticados pueden votar comentarios"
    ON public.comentario_votos
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- Política: Solo el autor del voto puede actualizarlo
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus votos en comentarios" ON public.comentario_votos;
CREATE POLICY "Usuarios pueden actualizar sus votos en comentarios"
    ON public.comentario_votos
    FOR UPDATE
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Política: Solo el autor del voto puede eliminarlo
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus votos en comentarios" ON public.comentario_votos;
CREATE POLICY "Usuarios pueden eliminar sus votos en comentarios"
    ON public.comentario_votos
    FOR DELETE
    USING (auth.uid() = usuario_id);

-- Habilitar Realtime para la tabla de votos
ALTER PUBLICATION supabase_realtime ADD TABLE public.comentario_votos;

-- Calcular votos iniciales para comentarios existentes
UPDATE public.comentarios
SET votos_totales = (
    SELECT COALESCE(SUM(valor_voto), 0)
    FROM public.comentario_votos
    WHERE comentario_id = comentarios.id
);

-- Comentarios
COMMENT ON TABLE public.comentario_votos IS 'Almacena los votos de los usuarios en comentarios de noticias';
COMMENT ON COLUMN public.comentario_votos.valor_voto IS 'Valor del voto: -1 (negativo) o 1 (positivo)';
COMMENT ON COLUMN public.comentarios.votos_totales IS 'Suma total de votos del comentario (calculado automáticamente)';
