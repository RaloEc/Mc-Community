-- Tabla para cachear maestría de campeones
-- Evita llamadas repetidas a Riot API
CREATE TABLE IF NOT EXISTS champion_mastery_cache (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puuid TEXT NOT NULL,
  champion_id INTEGER NOT NULL,
  mastery_level INTEGER NOT NULL,
  mastery_points BIGINT NOT NULL,
  last_play_time BIGINT,
  rank_position INTEGER, -- Posición en el ranking (1, 2, 3, etc)
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes'),
  
  UNIQUE(user_id, puuid, champion_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_champion_mastery_user_puuid 
  ON champion_mastery_cache(user_id, puuid);

CREATE INDEX IF NOT EXISTS idx_champion_mastery_expires 
  ON champion_mastery_cache(expires_at);

-- RLS: Solo el usuario puede ver su propia maestría
ALTER TABLE champion_mastery_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mastery cache"
  ON champion_mastery_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mastery cache"
  ON champion_mastery_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mastery cache"
  ON champion_mastery_cache FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para limpiar caché expirado
CREATE OR REPLACE FUNCTION cleanup_expired_mastery_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM champion_mastery_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
