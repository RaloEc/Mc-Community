-- Agregar columna votos_conteo a la tabla foro_hilos si no existe
ALTER TABLE public.foro_hilos 
ADD COLUMN IF NOT EXISTS votos_conteo integer NOT NULL DEFAULT 0;

-- Crear función para incrementar votos
CREATE OR REPLACE FUNCTION public.incrementar_votos(
    p_hilo_id uuid,
    p_incremento integer
) RETURNS void AS $$
BEGIN
    UPDATE public.foro_hilos 
    SET votos_conteo = COALESCE(votos_conteo, 0) + p_incremento
    WHERE id = p_hilo_id;
END;
$$ LANGUAGE plpgsql;
