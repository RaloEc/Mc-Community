-- Crear tabla foro_votos_hilos si no existe
CREATE TABLE IF NOT EXISTS public.foro_votos_hilos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hilo_id uuid NOT NULL REFERENCES public.foro_hilos(id) ON DELETE CASCADE,
    usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    valor smallint NOT NULL CHECK (valor IN (-1, 1)),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(hilo_id, usuario_id)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_foro_votos_hilo_id ON public.foro_votos_hilos(hilo_id);
CREATE INDEX IF NOT EXISTS idx_foro_votos_usuario_id ON public.foro_votos_hilos(usuario_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_foro_votos_updated_at ON public.foro_votos_hilos;
CREATE TRIGGER update_foro_votos_updated_at
BEFORE UPDATE ON public.foro_votos_hilos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Políticas RLS
ALTER TABLE public.foro_votos_hilos ENABLE ROW LEVEL SECURITY;

-- Permitir a los usuarios autenticados ver sus propios votos y los de otros
CREATE POLICY "Permitir ver votos" 
ON public.foro_votos_hilos 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Permitir a los usuarios autenticados insertar sus propios votos
CREATE POLICY "Permitir insertar propios votos" 
ON public.foro_votos_hilos 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = usuario_id);

-- Permitir a los usuarios autenticados actualizar sus propios votos
CREATE POLICY "Permitir actualizar propios votos" 
ON public.foro_votos_hilos 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- Permitir a los usuarios autenticados eliminar sus propios votos
CREATE POLICY "Permitir eliminar propios votos" 
ON public.foro_votos_hilos 
FOR DELETE 
TO authenticated 
USING (auth.uid() = usuario_id);

-- Comentarios para documentación
COMMENT ON TABLE public.foro_votos_hilos IS 'Almacena los votos de los usuarios en los hilos del foro';
COMMENT ON COLUMN public.foro_votos_hilos.valor IS '1 para voto positivo, -1 para voto negativo';

-- Función para obtener el total de votos de un hilo
CREATE OR REPLACE FUNCTION public.obtener_total_votos_hilo(hilo_id_param uuid)
RETURNS integer AS $$
DECLARE
    total_votos integer;
BEGIN
    SELECT COALESCE(SUM(valor), 0) INTO total_votos
    FROM public.foro_votos_hilos
    WHERE hilo_id = hilo_id_param;
    
    RETURN total_votos;
END;
$$ LANGUAGE plpgsql STABLE;
