-- Optimización de índices para historial de partidas
-- Mejora significativa en performance de queries

-- Índice compuesto para getMatchHistory
-- Búsqueda rápida por PUUID + ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_match_participants_puuid_created_desc
  ON match_participants(puuid, created_at DESC)
  INCLUDE (champion_id, win, kda, summoner_id);

-- Índice para getPlayerStats
-- Búsqueda rápida por PUUID + filtro de victoria
CREATE INDEX IF NOT EXISTS idx_match_participants_puuid_win
  ON match_participants(puuid, win)
  INCLUDE (kda, total_damage_dealt, gold_earned);

-- Índice para JOIN rápido con match_participant_ranks
CREATE INDEX IF NOT EXISTS idx_match_participant_ranks_match_summoner
  ON match_participant_ranks(match_id, summoner_id)
  INCLUDE (tier, rank, league_points, wins, losses);

-- Índice para búsqueda de partidas por cola
CREATE INDEX IF NOT EXISTS idx_matches_queue_id
  ON matches(queue_id)
  INCLUDE (game_creation, game_duration);

-- Analizar tablas para optimizar query planner de PostgreSQL
ANALYZE match_participants;
ANALYZE match_participant_ranks;
ANALYZE matches;
