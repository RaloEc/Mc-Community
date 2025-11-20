-- =====================================================
-- MIGRACIÓN: Agregar campos de estadísticas de Riot
-- =====================================================
-- Añade campos para almacenar información de rango,
-- nivel, ícono de perfil y shard activo

-- Agregar columnas de estadísticas si no existen
ALTER TABLE public.linked_accounts_riot
ADD COLUMN IF NOT EXISTS active_shard VARCHAR(50),
ADD COLUMN IF NOT EXISTS summoner_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'UNRANKED',
ADD COLUMN IF NOT EXISTS rank VARCHAR(10),
ADD COLUMN IF NOT EXISTS league_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice en active_shard para filtrar por servidor
CREATE INDEX IF NOT EXISTS idx_linked_accounts_riot_active_shard 
    ON public.linked_accounts_riot(active_shard);

-- Índice en tier para filtrar por rango
CREATE INDEX IF NOT EXISTS idx_linked_accounts_riot_tier 
    ON public.linked_accounts_riot(tier);

-- Índice en summoner_id para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_linked_accounts_riot_summoner_id 
    ON public.linked_accounts_riot(summoner_id);

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON COLUMN public.linked_accounts_riot.active_shard IS 'Shard activo del jugador (ej: la1, euw1, kr, etc)';
COMMENT ON COLUMN public.linked_accounts_riot.summoner_id IS 'ID encriptado del invocador en League of Legends';
COMMENT ON COLUMN public.linked_accounts_riot.tier IS 'Rango actual (IRON, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER, GRANDMASTER, CHALLENGER, UNRANKED)';
COMMENT ON COLUMN public.linked_accounts_riot.rank IS 'Subdivisión del rango (I, II, III, IV)';
COMMENT ON COLUMN public.linked_accounts_riot.league_points IS 'Puntos de liga (0-100)';
COMMENT ON COLUMN public.linked_accounts_riot.wins IS 'Victorias en ranked solo';
COMMENT ON COLUMN public.linked_accounts_riot.losses IS 'Derrotas en ranked solo';
