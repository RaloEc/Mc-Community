-- =====================================================
-- TABLA: linked_accounts_riot
-- =====================================================
-- Integración de cuentas de Riot Games (League of Legends)
-- Relación Many-to-One con tabla auth.users
-- =====================================================

-- Crear tabla linked_accounts_riot
CREATE TABLE IF NOT EXISTS public.linked_accounts_riot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con usuario (Many-to-One)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identificadores de Riot
    puuid VARCHAR(255) NOT NULL UNIQUE,
    game_name VARCHAR(255) NOT NULL,
    tag_line VARCHAR(255) NOT NULL,
    
    -- Información de región y servidor
    region VARCHAR(50) NOT NULL,
    
    -- Tokens de autenticación RSO (Riot Sign-On)
    access_token TEXT,
    refresh_token TEXT,
    
    -- Información del perfil
    profile_icon_id INTEGER,
    summoner_level INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para asegurar que un usuario solo tenga una cuenta de Riot
    UNIQUE(user_id)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice en user_id para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_linked_accounts_riot_user_id 
    ON public.linked_accounts_riot(user_id);

-- Índice en puuid para búsquedas rápidas por PUUID (ya es UNIQUE, pero lo dejamos explícito)
CREATE INDEX IF NOT EXISTS idx_linked_accounts_riot_puuid 
    ON public.linked_accounts_riot(puuid);

-- Índice en game_name + tag_line para búsquedas por nombre del jugador
CREATE INDEX IF NOT EXISTS idx_linked_accounts_riot_game_name_tag 
    ON public.linked_accounts_riot(game_name, tag_line);

-- Índice en region para filtrar por región
CREATE INDEX IF NOT EXISTS idx_linked_accounts_riot_region 
    ON public.linked_accounts_riot(region);

-- Índice en updated_at para ordenar por última actualización
CREATE INDEX IF NOT EXISTS idx_linked_accounts_riot_updated_at 
    ON public.linked_accounts_riot(updated_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.linked_accounts_riot ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias cuentas vinculadas
CREATE POLICY "linked_accounts_riot_select_own" 
    ON public.linked_accounts_riot 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar cuentas para sí mismos
CREATE POLICY "linked_accounts_riot_insert_own" 
    ON public.linked_accounts_riot 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias cuentas
CREATE POLICY "linked_accounts_riot_update_own" 
    ON public.linked_accounts_riot 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias cuentas
CREATE POLICY "linked_accounts_riot_delete_own" 
    ON public.linked_accounts_riot 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Política: Los administradores pueden ver todas las cuentas vinculadas
CREATE POLICY "linked_accounts_riot_admin_select" 
    ON public.linked_accounts_riot 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.role = 'admin'
        )
    );

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.linked_accounts_riot IS 'Almacena cuentas de Riot Games vinculadas a usuarios. Relación Many-to-One con auth.users. Cada usuario puede tener una sola cuenta de Riot vinculada.';

COMMENT ON COLUMN public.linked_accounts_riot.id IS 'Identificador único de la cuenta vinculada';
COMMENT ON COLUMN public.linked_accounts_riot.user_id IS 'Referencia al usuario en auth.users';
COMMENT ON COLUMN public.linked_accounts_riot.puuid IS 'Identificador universal de Riot (Puuid). Único globalmente.';
COMMENT ON COLUMN public.linked_accounts_riot.game_name IS 'Nombre del jugador en Riot (ej: Ricardo)';
COMMENT ON COLUMN public.linked_accounts_riot.tag_line IS 'Tag del jugador en Riot (ej: LAS)';
COMMENT ON COLUMN public.linked_accounts_riot.region IS 'Región del servidor (ej: la1, euw1, kr, br1, etc)';
COMMENT ON COLUMN public.linked_accounts_riot.access_token IS 'Token de acceso RSO para futuras peticiones a la API de Riot';
COMMENT ON COLUMN public.linked_accounts_riot.refresh_token IS 'Token de refresco para renovar el access_token';
COMMENT ON COLUMN public.linked_accounts_riot.profile_icon_id IS 'ID del ícono de perfil del jugador';
COMMENT ON COLUMN public.linked_accounts_riot.summoner_level IS 'Nivel del invocador en League of Legends';
COMMENT ON COLUMN public.linked_accounts_riot.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN public.linked_accounts_riot.updated_at IS 'Fecha de última actualización del registro';
COMMENT ON COLUMN public.linked_accounts_riot.last_updated IS 'Fecha de última actualización de datos desde la API de Riot';

-- =====================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_linked_accounts_riot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_linked_accounts_riot_updated_at ON public.linked_accounts_riot;

CREATE TRIGGER trigger_linked_accounts_riot_updated_at
    BEFORE UPDATE ON public.linked_accounts_riot
    FOR EACH ROW
    EXECUTE FUNCTION public.update_linked_accounts_riot_updated_at();

-- =====================================================
-- INFORMACIÓN ADICIONAL
-- =====================================================
-- 
-- Estructura de la tabla:
-- - id: UUID único para cada registro
-- - user_id: FK a auth.users (relación Many-to-One, UNIQUE para una sola cuenta por usuario)
-- - puuid: Identificador universal de Riot (único globalmente)
-- - game_name: Nombre del jugador
-- - tag_line: Tag del jugador
-- - region: Región del servidor (la1, euw1, kr, br1, na1, etc)
-- - access_token: Token RSO para autenticación
-- - refresh_token: Token para renovar acceso
-- - profile_icon_id: ID del ícono de perfil
-- - summoner_level: Nivel del invocador
-- - Timestamps: created_at, updated_at, last_updated
--
-- Índices creados:
-- 1. idx_linked_accounts_riot_user_id: Búsquedas por usuario
-- 2. idx_linked_accounts_riot_puuid: Búsquedas por PUUID
-- 3. idx_linked_accounts_riot_game_name_tag: Búsquedas por nombre del jugador
-- 4. idx_linked_accounts_riot_region: Filtros por región
-- 5. idx_linked_accounts_riot_updated_at: Ordenamiento por fecha de actualización
--
-- RLS Policies:
-- - Usuarios solo ven/editan/eliminan sus propias cuentas
-- - Administradores pueden ver todas las cuentas
--
-- Relación:
-- - Many-to-One: Múltiples cuentas de Riot pueden existir, pero cada usuario solo tiene una
-- - ON DELETE CASCADE: Si se elimina el usuario, se elimina su cuenta vinculada
-- - UNIQUE(user_id): Asegura que un usuario solo tenga una cuenta de Riot vinculada
