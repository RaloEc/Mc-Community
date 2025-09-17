-- Crear una tabla para relacionar noticias y comentarios
CREATE TABLE IF NOT EXISTS noticias_comentarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    noticia_id UUID NOT NULL REFERENCES noticias(id) ON DELETE CASCADE,
    comentario_id UUID NOT NULL REFERENCES comentarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(noticia_id, comentario_id)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_noticias_comentarios_noticia ON noticias_comentarios(noticia_id);
CREATE INDEX IF NOT EXISTS idx_noticias_comentarios_comentario ON noticias_comentarios(comentario_id);

-- Crear función para contar comentarios por noticia
CREATE OR REPLACE FUNCTION contar_comentarios_por_noticia(noticia_ids TEXT[])
RETURNS TABLE (noticia_id TEXT, total_comentarios BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        nc.noticia_id::TEXT,
        COUNT(nc.comentario_id)::BIGINT as total_comentarios
    FROM 
        noticias_comentarios nc
    WHERE 
        nc.noticia_id::TEXT = ANY(noticia_ids)
    GROUP BY 
        nc.noticia_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para obtener el conteo de una sola noticia
CREATE OR REPLACE FUNCTION obtener_contador_comentarios(noticia_id_param TEXT)
RETURNS BIGINT AS $$
DECLARE
    total BIGINT;
BEGIN
    SELECT COUNT(*) INTO total 
    FROM noticias_comentarios 
    WHERE noticia_id::TEXT = noticia_id_param;
    
    RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
