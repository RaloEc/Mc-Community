-- Crear tabla de eventos
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('actualizacion', 'parche', 'evento', 'torneo')),
  juego_nombre TEXT,
  imagen_url TEXT,
  icono_url TEXT,
  url TEXT,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'cancelado')),
  creado_por UUID REFERENCES perfiles(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  publicado_en TIMESTAMP WITH TIME ZONE
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);

-- Función para obtener eventos próximos
CREATE OR REPLACE FUNCTION obtener_eventos_proximos(limite INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE,
  tipo TEXT,
  juego_nombre TEXT,
  imagen_url TEXT,
  icono_url TEXT,
  url TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.titulo,
    e.descripcion,
    e.fecha,
    e.tipo,
    e.juego_nombre,
    e.imagen_url,
    e.icono_url,
    e.url
  FROM 
    eventos e
  WHERE 
    e.estado = 'publicado'
    AND e.fecha >= CURRENT_DATE
  ORDER BY 
    e.fecha ASC
  LIMIT 
    limite;
END;
$$;
