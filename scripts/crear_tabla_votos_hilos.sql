-- Crear tabla para rastrear votos de hilos
CREATE TABLE IF NOT EXISTS public.foro_votos_hilos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hilo_id UUID NOT NULL REFERENCES public.foro_hilos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    valor SMALLINT NOT NULL CHECK (valor IN (-1, 1)),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hilo_id, usuario_id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_foro_votos_hilos_hilo_id ON public.foro_votos_hilos(hilo_id);
CREATE INDEX IF NOT EXISTS idx_foro_votos_hilos_usuario_id ON public.foro_votos_hilos(usuario_id);

-- Función para actualizar el contador de votos
CREATE OR REPLACE FUNCTION actualizar_contador_votos_hilo()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.foro_hilos
        SET votos_conteo = COALESCE((
            SELECT SUM(valor) 
            FROM public.foro_votos_hilos 
            WHERE hilo_id = OLD.hilo_id
        ), 0)
        WHERE id = OLD.hilo_id;
    ELSE
        UPDATE public.foro_hilos
        SET votos_conteo = COALESCE((
            SELECT SUM(valor) 
            FROM public.foro_votos_hilos 
            WHERE hilo_id = NEW.hilo_id
        ), 0)
        WHERE id = NEW.hilo_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para mantener el contador actualizado
DROP TRIGGER IF EXISTS trg_actualizar_contador_votos_hilos ON public.foro_votos_hilos;
CREATE TRIGGER trg_actualizar_contador_votos_hilos
AFTER INSERT OR UPDATE OR DELETE ON public.foro_votos_hilos
FOR EACH ROW EXECUTE FUNCTION actualizar_contador_votos_hilo();

-- Políticas de seguridad RLS
ALTER TABLE public.foro_votos_hilos ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir a los usuarios ver sus propios votos
CREATE POLICY "Permitir ver votos propios"
ON public.foro_votos_hilos
FOR SELECT
USING (auth.uid() = usuario_id);

-- Políticas para permitir a los usuarios crear/actualizar/eliminar sus propios votos
CREATE POLICY "Permitir gestionar votos propios"
ON public.foro_votos_hilos
FOR ALL
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- Asegurarse de que la columna votos_conteo existe en foro_hilos
ALTER TABLE public.foro_hilos 
ADD COLUMN IF NOT EXISTS votos_conteo INTEGER NOT NULL DEFAULT 0;
