-- Asegurarnos de que la tabla de relación entre noticias y comentarios exista
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

-- Función para contar comentarios por noticia
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
        nc.noticia_id = ANY(noticia_ids)
    GROUP BY 
        nc.noticia_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener los comentarios de una noticia
CREATE OR REPLACE FUNCTION obtener_comentarios_noticia(
    p_noticia_id UUID,
    p_limite INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_orden TEXT DEFAULT 'desc'
)
RETURNS TABLE (
    id UUID,
    texto TEXT,
    created_at TIMESTAMPTZ,
    autor_id UUID,
    username TEXT,
    avatar_url TEXT,
    color TEXT,
    es_admin BOOLEAN,
    es_autor BOOLEAN,
    es_propio BOOLEAN,
    respuestas JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH comentarios_base AS (
        SELECT 
            c.id,
            c.texto,
            c.created_at,
            c.autor_id,
            p.username,
            p.avatar_url,
            p.color,
            p.role = 'admin' as es_admin,
            p.id = (SELECT autor_id FROM noticias WHERE id = p_noticia_id) as es_autor,
            (SELECT COUNT(*) > 0 FROM auth.users WHERE id = c.autor_id) as es_propio
        FROM 
            comentarios c
        JOIN 
            perfiles p ON c.autor_id = p.id
        JOIN
            noticias_comentarios nc ON c.id = nc.comentario_id
        WHERE 
            nc.noticia_id = p_noticia_id
            AND c.comentario_padre_id IS NULL -- Solo comentarios principales
        ORDER BY 
            c.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT 
        cb.*,
        COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'texto', r.texto,
                    'created_at', r.created_at,
                    'autor_id', r.autor_id,
                    'username', pr.username,
                    'avatar_url', pr.avatar_url,
                    'color', pr.color,
                    'es_admin', pr.role = 'admin',
                    'es_autor', pr.id = (SELECT autor_id FROM noticias WHERE id = p_noticia_id),
                    'es_propio', (SELECT COUNT(*) > 0 FROM auth.users WHERE id = r.autor_id)
                )
                ORDER BY r.created_at ASC
            )
            FROM comentarios r
            JOIN perfiles pr ON r.autor_id = pr.id
            WHERE r.comentario_padre_id = cb.id
        ), '[]'::jsonb) as respuestas
    FROM 
        comentarios_base cb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
