-- Optimizar índices para consultas de historial de partidas
-- Esto mejora significativamente el rendimiento del scroll infinito

-- Crear índice compuesto para búsquedas por puuid y game_creation
-- Esto permite filtrar por puuid y ordenar por game_creation eficientemente
CREATE INDEX IF NOT EXISTS idx_match_participants_puuid_game_creation 
ON match_participants(puuid, created_at DESC)
INCLUDE (match_id, summoner_id, champion_id, win, kills, deaths, assists);

-- Crear índice en matches para ordenamiento rápido por game_creation
CREATE INDEX IF NOT EXISTS idx_matches_game_creation_desc 
ON matches(game_creation DESC);

-- Crear índice compuesto para joins eficientes
CREATE INDEX IF NOT EXISTS idx_match_participants_match_id_puuid 
ON match_participants(match_id, puuid);

-- Comentarios para documentación
COMMENT ON INDEX idx_match_participants_puuid_game_creation IS 'Índice para optimizar getMatchHistory: permite filtrar por puuid y ordenar por fecha de inserción';
COMMENT ON INDEX idx_matches_game_creation_desc IS 'Índice para ordenar partidas por fecha de creación en Riot API';
COMMENT ON INDEX idx_match_participants_match_id_puuid IS 'Índice para joins eficientes entre match_participants y matches';
