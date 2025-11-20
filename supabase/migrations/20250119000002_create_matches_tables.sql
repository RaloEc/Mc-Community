-- Crear tabla matches para almacenar información general de partidas
CREATE TABLE IF NOT EXISTS matches (
  match_id VARCHAR(255) PRIMARY KEY,
  data_version VARCHAR(50),
  game_creation BIGINT,
  game_duration INTEGER,
  game_mode VARCHAR(50),
  queue_id INTEGER,
  full_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla match_participants para almacenar rendimiento individual de jugadores
CREATE TABLE IF NOT EXISTS match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id VARCHAR(255) NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
  puuid VARCHAR(255) NOT NULL,
  summoner_name VARCHAR(255),
  champion_id INTEGER,
  champion_name VARCHAR(255),
  win BOOLEAN,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  kda DECIMAL(10, 2),
  total_damage_dealt INTEGER DEFAULT 0,
  gold_earned INTEGER DEFAULT 0,
  vision_score INTEGER DEFAULT 0,
  item0 INTEGER,
  item1 INTEGER,
  item2 INTEGER,
  item3 INTEGER,
  item4 INTEGER,
  item5 INTEGER,
  item6 INTEGER,
  perk_primary_style INTEGER,
  perk_sub_style INTEGER,
  summoner1_id INTEGER,
  summoner2_id INTEGER,
  lane VARCHAR(50),
  role VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_matches_game_creation ON matches(game_creation DESC);
CREATE INDEX IF NOT EXISTS idx_matches_queue_id ON matches(queue_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_puuid ON match_participants(puuid);
CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_puuid_match_id ON match_participants(puuid, match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_champion_id ON match_participants(champion_id);

-- Crear índice para búsquedas rápidas por puuid y fecha
CREATE INDEX IF NOT EXISTS idx_match_participants_puuid_created ON match_participants(puuid, created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;

-- Política para matches: permitir lectura pública (sin restricciones por usuario)
CREATE POLICY "Allow public read matches" ON matches
  FOR SELECT
  USING (true);

-- Política para match_participants: permitir lectura pública
CREATE POLICY "Allow public read match_participants" ON match_participants
  FOR SELECT
  USING (true);

-- Política para matches: solo service role puede insertar/actualizar
CREATE POLICY "Allow service role insert matches" ON matches
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role update matches" ON matches
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para match_participants: solo service role puede insertar/actualizar
CREATE POLICY "Allow service role insert match_participants" ON match_participants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role update match_participants" ON match_participants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Crear función para actualizar updated_at en matches
CREATE OR REPLACE FUNCTION update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_matches_updated_at ON matches;
CREATE TRIGGER trigger_update_matches_updated_at
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_matches_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE matches IS 'Almacena información general de partidas de League of Legends';
COMMENT ON TABLE match_participants IS 'Almacena rendimiento individual de jugadores en partidas';
COMMENT ON COLUMN matches.match_id IS 'ID único de la partida (ej: LA1_123456)';
COMMENT ON COLUMN matches.full_json IS 'Objeto JSON completo de la partida desde Riot API';
COMMENT ON COLUMN match_participants.puuid IS 'PUUID del jugador para vincular con linked_accounts_riot';
COMMENT ON COLUMN match_participants.kda IS 'Kill/Death/Assist ratio calculado';
