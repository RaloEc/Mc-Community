-- Función para limpiar cachés viejos (más de 30 días sin sincronizar)

CREATE OR REPLACE FUNCTION cleanup_stale_player_rank_cache(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM player_rank_cache
  WHERE last_synced_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_stale_player_rank_cache IS 'Elimina entradas de caché que no se han sincronizado en X días (default 30)';
