-- Tabla de caché de rangos por jugador para evitar consultas redundantes a Riot API

CREATE TABLE IF NOT EXISTS public.player_rank_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puuid VARCHAR(255) NOT NULL,
  queue_type VARCHAR(50) NOT NULL,
  tier VARCHAR(50),
  rank VARCHAR(50),
  league_points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  summoner_level INTEGER,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: una entrada por puuid + queue_type
  UNIQUE(puuid, queue_type)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_player_rank_cache_puuid ON player_rank_cache(puuid);
CREATE INDEX IF NOT EXISTS idx_player_rank_cache_queue_type ON player_rank_cache(queue_type);
CREATE INDEX IF NOT EXISTS idx_player_rank_cache_last_synced ON player_rank_cache(last_synced_at);

-- Habilitar RLS
ALTER TABLE public.player_rank_cache ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública
CREATE POLICY "Allow public read player_rank_cache" ON player_rank_cache
  FOR SELECT USING (true);

-- Política de escritura para service role
CREATE POLICY "Allow service role write player_rank_cache" ON player_rank_cache
  FOR ALL USING (true) WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE public.player_rank_cache IS 'Caché de rangos por jugador para reducir llamadas a Riot API';
COMMENT ON COLUMN public.player_rank_cache.puuid IS 'PUUID del jugador';
COMMENT ON COLUMN public.player_rank_cache.queue_type IS 'Tipo de cola (RANKED_SOLO_5x5, RANKED_FLEX_SR)';
COMMENT ON COLUMN public.player_rank_cache.last_synced_at IS 'Última vez que se sincronizó desde Riot API';

-- Función para obtener o crear entrada en caché
CREATE OR REPLACE FUNCTION get_or_create_player_rank_cache(
  p_puuid VARCHAR(255),
  p_queue_type VARCHAR(50)
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Intentar obtener la entrada existente
  SELECT id INTO v_id
  FROM player_rank_cache
  WHERE puuid = p_puuid AND queue_type = p_queue_type;
  
  -- Si no existe, crear una nueva
  IF v_id IS NULL THEN
    INSERT INTO player_rank_cache (puuid, queue_type)
    VALUES (p_puuid, p_queue_type)
    ON CONFLICT (puuid, queue_type) DO UPDATE
    SET updated_at = NOW()
    RETURNING id INTO v_id;
  END IF;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el caché está vigente
CREATE OR REPLACE FUNCTION is_player_rank_cache_fresh(
  p_puuid VARCHAR(255),
  p_queue_type VARCHAR(50),
  p_ttl_hours INTEGER DEFAULT 12
)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_synced TIMESTAMPTZ;
BEGIN
  SELECT last_synced_at INTO v_last_synced
  FROM player_rank_cache
  WHERE puuid = p_puuid AND queue_type = p_queue_type;
  
  -- Si no existe o está vencido, retorna false
  IF v_last_synced IS NULL OR v_last_synced < NOW() - (p_ttl_hours || ' hours')::INTERVAL THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_player_rank_cache IS 'Obtiene o crea una entrada de caché para un jugador y cola';
COMMENT ON FUNCTION is_player_rank_cache_fresh IS 'Verifica si el caché de un jugador está vigente (dentro del TTL)';
