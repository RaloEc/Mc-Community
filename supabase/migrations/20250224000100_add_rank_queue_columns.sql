-- Agrega columnas dedicadas para almacenar los rangos de SoloQ y Flex
ALTER TABLE public.match_participant_ranks
  ADD COLUMN IF NOT EXISTS solo_tier VARCHAR(50),
  ADD COLUMN IF NOT EXISTS solo_rank VARCHAR(50),
  ADD COLUMN IF NOT EXISTS solo_league_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solo_wins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solo_losses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flex_tier VARCHAR(50),
  ADD COLUMN IF NOT EXISTS flex_rank VARCHAR(50),
  ADD COLUMN IF NOT EXISTS flex_league_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flex_wins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flex_losses INTEGER DEFAULT 0;

-- Copiar datos existentes hacia las nuevas columnas de SoloQ
UPDATE public.match_participant_ranks
SET
  solo_tier = COALESCE(solo_tier, tier),
  solo_rank = COALESCE(solo_rank, rank),
  solo_league_points = COALESCE(solo_league_points, league_points),
  solo_wins = COALESCE(solo_wins, wins),
  solo_losses = COALESCE(solo_losses, losses)
WHERE tier IS NOT NULL;

COMMENT ON COLUMN public.match_participant_ranks.solo_tier IS 'Tier del ranking SoloQ capturado para el jugador en esta partida';
COMMENT ON COLUMN public.match_participant_ranks.flex_tier IS 'Tier del ranking Flex capturado para el jugador en esta partida';
