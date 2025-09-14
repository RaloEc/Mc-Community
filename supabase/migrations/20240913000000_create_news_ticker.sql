-- Crear tabla para los mensajes del ticker de noticias
CREATE TABLE IF NOT EXISTS news_ticker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mensaje TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_news_ticker_activo_orden ON news_ticker(activo, orden);

-- Insertar datos iniciales
INSERT INTO news_ticker (mensaje, orden) VALUES
    ('Nueva actualización disponible para Minecraft 1.20', 1),
    ('Evento especial este fin de semana', 2),
    ('Concurso de construcción en progreso', 3)
ON CONFLICT DO NOTHING;
