-- Función para incrementar las vistas de un hilo de forma atómica
CREATE OR REPLACE FUNCTION incrementar_vistas_hilo(hilo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE foro_hilos
  SET vistas = COALESCE(vistas, 0) + 1
  WHERE id = hilo_id;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION incrementar_vistas_hilo(UUID) IS 'Incrementa el contador de vistas de un hilo de forma atómica';
