-- Agregar columna noticia_id a la tabla news_ticker
ALTER TABLE news_ticker
ADD COLUMN IF NOT EXISTS noticia_id UUID REFERENCES noticias(id) ON DELETE SET NULL;

-- Crear índice para búsquedas rápidas por noticia_id
CREATE INDEX IF NOT EXISTS idx_news_ticker_noticia_id ON news_ticker(noticia_id);
