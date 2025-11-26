-- Agregar summoner_id a match_participants
ALTER TABLE public.match_participants
  ADD COLUMN IF NOT EXISTS summoner_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS summoner_level INTEGER;

-- Crear tabla para almacenar snapshots de ranking por partida
CREATE TABLE IF NOT EXISTS match_participant_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id VARCHAR(255) NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
  puuid VARCHAR(255) NOT NULL,
  summoner_id VARCHAR(255) NOT NULL,
  queue_type VARCHAR(50) DEFAULT 'RANKED_SOLO_5x5',
  tier VARCHAR(50),
  rank VARCHAR(50),
  league_points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_match_participant_ranks_match_id ON match_participant_ranks(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participant_ranks_puuid ON match_participant_ranks(puuid);
CREATE INDEX IF NOT EXISTS idx_match_participant_ranks_summoner_id ON match_participant_ranks(summoner_id);
CREATE INDEX IF NOT EXISTS idx_match_participant_ranks_tier ON match_participant_ranks(tier);

-- Habilitar RLS
ALTER TABLE match_participant_ranks ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública
CREATE POLICY "Allow public read match_participant_ranks" ON match_participant_ranks
  FOR SELECT
  USING (true);

-- Política para service role insert/update
CREATE POLICY "Allow service role insert match_participant_ranks" ON match_participant_ranks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role update match_participant_ranks" ON match_participant_ranks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE match_participant_ranks IS 'Snapshots de rango competitivo por jugador en cada partida';
COMMENT ON COLUMN match_participant_ranks.queue_type IS 'Tipo de cola (RANKED_SOLO_5x5, RANKED_FLEX_SR, etc.)';
COMMENT ON COLUMN match_participant_ranks.tier IS 'División (IRON, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)';
COMMENT ON COLUMN match_participant_ranks.rank IS 'Rango dentro de la división (I, II, III, IV)';
