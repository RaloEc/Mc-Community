-- =====================================================
-- MIGRACIÓN: Crear tabla de caché de invocadores
-- =====================================================
-- Tabla para almacenar datos de invocadores con caché de rankings
-- Optimiza las consultas frecuentes de rango sin saturar Riot API

-- Crear tabla summoners si no existe
CREATE TABLE IF NOT EXISTS public.summoners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puuid VARCHAR(255) NOT NULL UNIQUE,
  summoner_id VARCHAR(255),
  summoner_name VARCHAR(255),
  summoner_level INTEGER,
  
  -- Datos de ranking (caché)
  tier VARCHAR(50),
  rank VARCHAR(10),
  league_points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  
  -- Timestamps
  rank_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice en PUUID para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_summoners_puuid 
    ON public.summoners(puuid);

-- Índice en tier para filtrar por rango
CREATE INDEX IF NOT EXISTS idx_summoners_tier 
    ON public.summoners(tier);

-- Índice en rank_updated_at para caché expirado
CREATE INDEX IF NOT EXISTS idx_summoners_rank_updated_at 
    ON public.summoners(rank_updated_at);

-- Índice compuesto para búsquedas de caché fresco
CREATE INDEX IF NOT EXISTS idx_summoners_puuid_rank_updated 
    ON public.summoners(puuid, rank_updated_at);

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.summoners ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública
CREATE POLICY "Allow public read summoners" ON public.summoners
  FOR SELECT
  USING (true);

-- Política para service role insert/update
CREATE POLICY "Allow service role insert summoners" ON public.summoners
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role update summoners" ON public.summoners
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR TIMESTAMP
-- =====================================================

-- Crear función trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_summoners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_summoners_updated_at ON public.summoners;
CREATE TRIGGER trigger_update_summoners_updated_at
  BEFORE UPDATE ON public.summoners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_summoners_updated_at();

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.summoners IS 'Caché de invocadores con datos de ranking actualizados periódicamente';
COMMENT ON COLUMN public.summoners.puuid IS 'PUUID único del invocador (clave primaria de búsqueda)';
COMMENT ON COLUMN public.summoners.summoner_id IS 'ID encriptado del invocador en League of Legends';
COMMENT ON COLUMN public.summoners.summoner_name IS 'Nombre del invocador';
COMMENT ON COLUMN public.summoners.summoner_level IS 'Nivel del invocador';
COMMENT ON COLUMN public.summoners.tier IS 'Rango actual (IRON, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)';
COMMENT ON COLUMN public.summoners.rank IS 'Subdivisión del rango (I, II, III, IV)';
COMMENT ON COLUMN public.summoners.league_points IS 'Puntos de liga (0-100)';
COMMENT ON COLUMN public.summoners.wins IS 'Victorias en ranked solo';
COMMENT ON COLUMN public.summoners.losses IS 'Derrotas en ranked solo';
COMMENT ON COLUMN public.summoners.rank_updated_at IS 'Timestamp de la última actualización de ranking desde Riot API (TTL: 1 hora)';
