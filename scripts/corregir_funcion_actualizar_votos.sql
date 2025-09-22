-- Corregir la función para usar el nombre correcto de la columna (valor_voto en lugar de valor)
CREATE OR REPLACE FUNCTION actualizar_contador_votos_hilo()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.foro_hilos
        SET votos_conteo = COALESCE((
            SELECT SUM(valor_voto) 
            FROM public.foro_votos_hilos 
            WHERE hilo_id = OLD.hilo_id
        ), 0)
        WHERE id = OLD.hilo_id;
    ELSE
        UPDATE public.foro_hilos
        SET votos_conteo = COALESCE((
            SELECT SUM(valor_voto) 
            FROM public.foro_votos_hilos 
            WHERE hilo_id = NEW.hilo_id
        ), 0)
        WHERE id = NEW.hilo_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Verificar la función actualizar_votos_conteo
CREATE OR REPLACE FUNCTION actualizar_votos_conteo()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.foro_hilos
        SET votos_conteo = COALESCE((
            SELECT SUM(valor_voto) 
            FROM public.foro_votos_hilos 
            WHERE hilo_id = OLD.hilo_id
        ), 0)
        WHERE id = OLD.hilo_id;
    ELSE
        UPDATE public.foro_hilos
        SET votos_conteo = COALESCE((
            SELECT SUM(valor_voto) 
            FROM public.foro_votos_hilos 
            WHERE hilo_id = NEW.hilo_id
        ), 0)
        WHERE id = NEW.hilo_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
