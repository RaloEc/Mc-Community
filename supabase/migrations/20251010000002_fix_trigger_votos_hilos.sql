-- Eliminar triggers duplicados que pueden causar conflictos
DROP TRIGGER IF EXISTS trg_actualizar_contador_votos_hilos ON foro_votos_hilos;
DROP TRIGGER IF EXISTS trigger_actualizar_votos ON foro_votos_hilos;
DROP TRIGGER IF EXISTS trigger_actualizar_votos_hilo_delete ON foro_votos_hilos;
DROP TRIGGER IF EXISTS trigger_actualizar_votos_hilo_insert_update ON foro_votos_hilos;

-- Crear un único trigger optimizado que maneje INSERT, UPDATE y DELETE
CREATE OR REPLACE FUNCTION actualizar_votos_hilo_optimizado()
RETURNS TRIGGER AS $$
DECLARE
    v_hilo_id UUID;
BEGIN
    -- Determinar el hilo_id según la operación
    IF TG_OP = 'DELETE' THEN
        v_hilo_id := OLD.hilo_id;
    ELSE
        v_hilo_id := NEW.hilo_id;
    END IF;
    
    -- Actualizar el contador de votos
    UPDATE foro_hilos
    SET votos_conteo = (
        SELECT COALESCE(SUM(valor_voto), 0)
        FROM foro_votos_hilos
        WHERE hilo_id = v_hilo_id
    )
    WHERE id = v_hilo_id;
    
    -- Retornar el registro apropiado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger único
CREATE TRIGGER trigger_actualizar_votos_hilo_unico
    AFTER INSERT OR UPDATE OR DELETE ON foro_votos_hilos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_votos_hilo_optimizado();

-- Recalcular todos los contadores para asegurar consistencia
UPDATE foro_hilos
SET votos_conteo = (
    SELECT COALESCE(SUM(valor_voto), 0)
    FROM foro_votos_hilos
    WHERE hilo_id = foro_hilos.id
);

-- Comentario
COMMENT ON FUNCTION actualizar_votos_hilo_optimizado() IS 'Función optimizada para actualizar el contador de votos de hilos - maneja INSERT, UPDATE y DELETE';
