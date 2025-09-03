-- Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('noticia', 'hilo')),
  content_id VARCHAR(255) NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  parent_id UUID REFERENCES comentarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_comentarios_content ON comentarios(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_author ON comentarios(author_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_parent ON comentarios(parent_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_created_at ON comentarios(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comentarios_updated_at 
    BEFORE UPDATE ON comentarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Política para leer comentarios (todos pueden leer)
CREATE POLICY "Todos pueden leer comentarios" ON comentarios
    FOR SELECT USING (true);

-- Política para insertar comentarios (solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden crear comentarios" ON comentarios
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Política para actualizar comentarios (solo el autor)
CREATE POLICY "Solo el autor puede actualizar sus comentarios" ON comentarios
    FOR UPDATE USING (auth.uid() = author_id);

-- Política para eliminar comentarios (solo el autor o admin)
CREATE POLICY "Solo el autor o admin pueden eliminar comentarios" ON comentarios
    FOR DELETE USING (
        auth.uid() = author_id OR 
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
