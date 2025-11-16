-- Agregar columna gif_url a la tabla comentarios
ALTER TABLE comentarios
ADD COLUMN IF NOT EXISTS gif_url TEXT;

-- Crear índice para búsquedas de comentarios con GIFs
CREATE INDEX IF NOT EXISTS idx_comentarios_gif_url ON comentarios(gif_url) WHERE gif_url IS NOT NULL;

-- Comentario de documentación
COMMENT ON COLUMN comentarios.gif_url IS 'URL del GIF de Tenor asociado al comentario (opcional)';
