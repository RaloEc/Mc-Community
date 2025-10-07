-- Crear tabla categorias_noticias si no existe
CREATE TABLE IF NOT EXISTS categorias_noticias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  icono TEXT,
  parent_id UUID REFERENCES categorias_noticias(id) ON DELETE CASCADE,
  es_activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir columna categoria_id a noticias si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'noticias' 
    AND column_name = 'categoria_id'
  ) THEN
    ALTER TABLE noticias ADD COLUMN categoria_id UUID REFERENCES categorias_noticias(id);
  END IF;
END
$$;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_categorias_noticias_parent_id ON categorias_noticias(parent_id);
CREATE INDEX IF NOT EXISTS idx_categorias_noticias_es_activa ON categorias_noticias(es_activa);
CREATE INDEX IF NOT EXISTS idx_noticias_categoria_id ON noticias(categoria_id);

-- Insertar categorías de ejemplo si la tabla está vacía
INSERT INTO categorias_noticias (nombre, slug, descripcion, orden, color, es_activa)
SELECT 'General', 'general', 'Noticias generales', 0, '#3b82f6', true
WHERE NOT EXISTS (SELECT 1 FROM categorias_noticias LIMIT 1);

INSERT INTO categorias_noticias (nombre, slug, descripcion, orden, color, es_activa)
SELECT 'Actualizaciones', 'actualizaciones', 'Actualizaciones del servidor', 1, '#10b981', true
WHERE NOT EXISTS (SELECT 1 FROM categorias_noticias WHERE slug = 'actualizaciones');

INSERT INTO categorias_noticias (nombre, slug, descripcion, orden, color, es_activa)
SELECT 'Eventos', 'eventos', 'Eventos especiales', 2, '#f59e0b', true
WHERE NOT EXISTS (SELECT 1 FROM categorias_noticias WHERE slug = 'eventos');

INSERT INTO categorias_noticias (nombre, slug, descripcion, orden, color, es_activa)
SELECT 'Anuncios', 'anuncios', 'Anuncios importantes', 3, '#ef4444', true
WHERE NOT EXISTS (SELECT 1 FROM categorias_noticias WHERE slug = 'anuncios');

-- Habilitar RLS (Row Level Security)
ALTER TABLE categorias_noticias ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos
CREATE POLICY "Permitir lectura de categorías a todos" ON categorias_noticias
  FOR SELECT USING (true);

-- Política para permitir escritura solo a administradores
CREATE POLICY "Permitir escritura de categorías solo a admins" ON categorias_noticias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );
