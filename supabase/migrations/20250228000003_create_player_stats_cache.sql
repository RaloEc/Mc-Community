-- Tabla para cachear estadísticas precalculadas de jugadores
-- Evita cálculos agregados costosos en cada request

CREATE TABLE IF NOT EXISTS player_stats_cache (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puuid TEXT NOT NULL UNIQUE,
  total_games INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  winrate INT DEFAULT 0,
  avg_kda DECIMAL(5,2) DEFAULT 0,
  avg_damage INT DEFAULT 0,
  avg_gold INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(puuid)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id 
  ON player_stats_cache(user_id);

CREATE INDEX IF NOT EXISTS idx_player_stats_puuid 
  ON player_stats_cache(puuid);

-- RLS: Solo el usuario puede ver sus propias estadísticas
ALTER TABLE player_stats_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats"
  ON player_stats_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON player_stats_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON player_stats_cache FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para actualizar estadísticas en caché
CREATE OR REPLACE FUNCTION update_player_stats_cache(p_puuid TEXT)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_total_games INT;
  v_wins INT;
  v_losses INT;
  v_winrate INT;
  v_avg_kda DECIMAL;
  v_avg_damage INT;
  v_avg_gold INT;
BEGIN
  -- Obtener user_id del PUUID
  SELECT user_id INTO v_user_id
  FROM linked_accounts_riot
  WHERE puuid = p_puuid
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Calcular estadísticas
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE win = true),
    COUNT(*) FILTER (WHERE win = false),
    ROUND(100.0 * COUNT(*) FILTER (WHERE win = true) / NULLIF(COUNT(*), 0))::INT,
    ROUND(AVG(kda)::NUMERIC, 2),
    ROUND(AVG(total_damage_dealt))::INT,
    ROUND(AVG(gold_earned))::INT
  INTO 
    v_total_games,
    v_wins,
    v_losses,
    v_winrate,
    v_avg_kda,
    v_avg_damage,
    v_avg_gold
  FROM match_participants
  WHERE puuid = p_puuid;

  -- Insertar o actualizar caché
  INSERT INTO player_stats_cache (
    user_id,
    puuid,
    total_games,
    wins,
    losses,
    winrate,
    avg_kda,
    avg_damage,
    avg_gold,
    updated_at
  ) VALUES (
    v_user_id,
    p_puuid,
    COALESCE(v_total_games, 0),
    COALESCE(v_wins, 0),
    COALESCE(v_losses, 0),
    COALESCE(v_winrate, 0),
    COALESCE(v_avg_kda, 0),
    COALESCE(v_avg_damage, 0),
    COALESCE(v_avg_gold, 0),
    NOW()
  )
  ON CONFLICT (puuid) DO UPDATE SET
    total_games = EXCLUDED.total_games,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    winrate = EXCLUDED.winrate,
    avg_kda = EXCLUDED.avg_kda,
    avg_damage = EXCLUDED.avg_damage,
    avg_gold = EXCLUDED.avg_gold,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar caché cuando se inserta una partida
CREATE OR REPLACE FUNCTION trigger_update_player_stats_on_match_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_player_stats_cache(NEW.puuid);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_player_stats_on_match_insert ON match_participants;

CREATE TRIGGER trigger_update_player_stats_on_match_insert
AFTER INSERT ON match_participants
FOR EACH ROW
EXECUTE FUNCTION trigger_update_player_stats_on_match_insert();
