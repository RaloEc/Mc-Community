-- Agregar columna ingest_status a match_participants para marcar el estado de procesamiento
-- Estados: 'processing' (datos básicos guardados, esperando ranking/performance)
--          'ready' (completamente procesado)
--          'failed' (error en procesamiento)

ALTER TABLE match_participants 
ADD COLUMN IF NOT EXISTS ingest_status TEXT DEFAULT 'processing' CHECK (ingest_status IN ('processing', 'ready', 'failed'));

-- Índice para queries rápidas de partidas en procesamiento
CREATE INDEX IF NOT EXISTS idx_match_participants_ingest_status 
ON match_participants(ingest_status) 
WHERE ingest_status = 'processing';

-- Índice compuesto para obtener partidas nuevas en procesamiento por usuario
CREATE INDEX IF NOT EXISTS idx_match_participants_puuid_status 
ON match_participants(puuid, ingest_status);

COMMENT ON COLUMN match_participants.ingest_status IS 'Estado de ingesta: processing (datos básicos), ready (completo), failed (error)';
