-- Función para actualizar el contador de votos en foro_hilos
CREATE OR REPLACE FUNCTION actualizar_contador_votos_hilo()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el contador de votos del hilo
  UPDATE foro_hilos
  SET votos_conteo = (
    SELECT COALESCE(SUM(valor_voto), 0)
    FROM foro_votos_hilos
    WHERE hilo_id = COALESCE(NEW.hilo_id, OLD.hilo_id)
  )
  WHERE id = COALESCE(NEW.hilo_id, OLD.hilo_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT y UPDATE
CREATE TRIGGER trigger_actualizar_votos_hilo_insert_update
AFTER INSERT OR UPDATE ON foro_votos_hilos
FOR EACH ROW
EXECUTE FUNCTION actualizar_contador_votos_hilo();

-- Trigger para DELETE
CREATE TRIGGER trigger_actualizar_votos_hilo_delete
AFTER DELETE ON foro_votos_hilos
FOR EACH ROW
EXECUTE FUNCTION actualizar_contador_votos_hilo();

-- Actualizar todos los contadores existentes
UPDATE foro_hilos h
SET votos_conteo = (
  SELECT COALESCE(SUM(valor_voto), 0)
  FROM foro_votos_hilos v
  WHERE v.hilo_id = h.id
);
