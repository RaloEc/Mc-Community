-- Migración para sistema de sincronización de rangos

-- 1. Agregar columnas de control a match_participant_ranks
ALTER TABLE public.match_participant_ranks
  ADD COLUMN IF NOT EXISTS last_rank_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- Índice para buscar registros pendientes eficientemente
CREATE INDEX IF NOT EXISTS idx_match_participant_ranks_sync_pending
  ON match_participant_ranks(sync_status)
  WHERE sync_status = 'pending' OR sync_status = 'failed';

COMMENT ON COLUMN public.match_participant_ranks.last_rank_sync IS 'Última vez que se intentó sincronizar el rango desde Riot API';
COMMENT ON COLUMN public.match_participant_ranks.sync_status IS 'Estado de sincronización: pending, synced, failed, skipped';
COMMENT ON COLUMN public.match_participant_ranks.sync_error IS 'Mensaje de error si la sincronización falló';

-- 2. Crear tabla de configuración del sistema (si no existe)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (las settings no son secretas)
CREATE POLICY "Allow public read admin_settings" ON admin_settings
  FOR SELECT USING (true);

-- Política de escritura solo para admins (via service role)
CREATE POLICY "Allow service role write admin_settings" ON admin_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Insertar configuración inicial para rank sync
INSERT INTO public.admin_settings (key, value)
VALUES ('match_rank_sync', '{"enabled": false, "batch_size": 25, "delay_ms": 500, "last_run": null, "last_result": null}')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.admin_settings IS 'Configuraciones del sistema administrables desde el dashboard';

-- 3. Función para obtener registros pendientes de sincronización
CREATE OR REPLACE FUNCTION get_pending_rank_syncs(p_limit INTEGER DEFAULT 25)
RETURNS TABLE (
  id UUID,
  match_id VARCHAR,
  puuid VARCHAR,
  summoner_id VARCHAR,
  sync_status VARCHAR,
  last_rank_sync TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mpr.id,
    mpr.match_id,
    mpr.puuid,
    mpr.summoner_id,
    mpr.sync_status,
    mpr.last_rank_sync
  FROM match_participant_ranks mpr
  WHERE 
    (mpr.tier IS NULL OR mpr.rank IS NULL)
    AND (mpr.sync_status IS NULL OR mpr.sync_status IN ('pending', 'failed'))
    AND (mpr.last_rank_sync IS NULL OR mpr.last_rank_sync < NOW() - INTERVAL '12 hours')
  ORDER BY mpr.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para contar pendientes
CREATE OR REPLACE FUNCTION count_pending_rank_syncs()
RETURNS INTEGER AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO pending_count
  FROM match_participant_ranks mpr
  WHERE 
    (mpr.tier IS NULL OR mpr.rank IS NULL)
    AND (mpr.sync_status IS NULL OR mpr.sync_status IN ('pending', 'failed'))
    AND (mpr.last_rank_sync IS NULL OR mpr.last_rank_sync < NOW() - INTERVAL '12 hours');
  
  RETURN pending_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pending_rank_syncs IS 'Obtiene registros de match_participant_ranks que necesitan sincronización de rango';
COMMENT ON FUNCTION count_pending_rank_syncs IS 'Cuenta cuántos registros están pendientes de sincronización';
