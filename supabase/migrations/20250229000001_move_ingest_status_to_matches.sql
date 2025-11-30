-- Mover ingest_status de match_participants a matches (una sola fila por partida)
-- Esto es más eficiente: una partida tiene un estado único, no 10 diferentes

-- 1. Agregar columna a matches
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS ingest_status TEXT DEFAULT 'processing' CHECK (ingest_status IN ('processing', 'ready', 'failed'));

-- 2. Índice para queries rápidas de partidas en procesamiento
CREATE INDEX IF NOT EXISTS idx_matches_ingest_status 
ON matches(ingest_status) 
WHERE ingest_status = 'processing';

-- 3. Eliminar columna de match_participants (ya no la necesitamos)
ALTER TABLE match_participants 
DROP COLUMN IF EXISTS ingest_status;

-- 4. Eliminar índices antiguos
DROP INDEX IF EXISTS idx_match_participants_ingest_status;
DROP INDEX IF EXISTS idx_match_participants_puuid_status;

COMMENT ON COLUMN matches.ingest_status IS 'Estado de ingesta de la partida: processing (datos básicos), ready (completo), failed (error)';
