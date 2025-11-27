-- Tabla para cachear las últimas 5 partidas de cada usuario
-- Permite mostrar partidas instantáneamente sin esperar a la BD

CREATE TABLE IF NOT EXISTS match_history_cache (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puuid TEXT NOT NULL,
  match_id TEXT NOT NULL,
  match_data JSONB NOT NULL, -- Datos completos de la partida (match_participants + matches)
  rank_position INT NOT NULL, -- 1-5 (posición en el ranking de recientes)
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
  
  UNIQUE(user_id, puuid, rank_position)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_match_cache_user_puuid 
  ON match_history_cache(user_id, puuid);

CREATE INDEX IF NOT EXISTS idx_match_cache_expires 
  ON match_history_cache(expires_at);

-- RLS: Solo el usuario puede ver su propio caché
ALTER TABLE match_history_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own match cache"
  ON match_history_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own match cache"
  ON match_history_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own match cache"
  ON match_history_cache FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para limpiar caché expirado
CREATE OR REPLACE FUNCTION cleanup_expired_match_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM match_history_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
