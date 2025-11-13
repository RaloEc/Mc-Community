-- Agregar columna de cuentas conectadas a la tabla perfiles
ALTER TABLE perfiles 
ADD COLUMN IF NOT EXISTS connected_accounts JSONB DEFAULT '{}';

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_perfiles_connected_accounts ON perfiles USING GIN (connected_accounts);

-- Comentario sobre la estructura del JSON
COMMENT ON COLUMN perfiles.connected_accounts IS 'JSON object with connected accounts. Example: {"twitch": "ricardo_tv", "discord": "ricardo#1234", "league_of_legends": "RicardoGG", "valorant": "Ricardo#TAG", "kick": "ricardo_kick", "delta_force": "ricardo_df"}';
