-- Función para obtener comentarios de una noticia con información de autor
CREATE OR REPLACE FUNCTION obtener_comentarios_noticia(
    p_noticia_id TEXT,
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
DECLARE
    v_user_id UUID;
    v_ascending BOOLEAN;
BEGIN
    -- Determinar el orden
    v_ascending := p_orden = 'asc';
    
    -- Obtener el ID del usuario actual si está autenticado
    v_user_id := auth.uid();
    
    -- Consulta principal
    RETURN QUERY
    WITH comentarios_noticia AS (
        -- Obtener comentarios asociados a esta noticia
        SELECT 
            c.id,
            c.text,
            c.created_at,
            c.author_id AS autor_id,
            c.parent_id
        FROM 
            comentarios c
        JOIN 
            noticias_comentarios nc ON c.id = nc.comentario_id
        WHERE 
            nc.noticia_id::TEXT = p_noticia_id
            AND c.parent_id IS NULL -- Solo comentarios principales
        ORDER BY 
            c.created_at DESC
        LIMIT p_limite
        OFFSET p_offset
    ),
    respuestas AS (
        -- Obtener respuestas a estos comentarios
        SELECT 
            c.id,
            c.parent_id,
            jsonb_build_object(
                'id', c.id,
                'texto', c.text,
                'created_at', c.created_at,
                'autor_id', c.author_id,
                'autor', jsonb_build_object(
                    'id', p.id,
                    'username', p.username,
                    'avatar_url', p.avatar_url,
                    'color', p.color,
                    'role', p.role,
                    'is_own', c.author_id = v_user_id
                )
            ) AS respuesta_json
        FROM 
            comentarios c
        JOIN 
            perfiles p ON c.author_id = p.id
        WHERE 
            c.parent_id IN (SELECT id FROM comentarios_noticia)
    ),
    respuestas_agrupadas AS (
        -- Agrupar respuestas por comentario padre
        SELECT 
            r.parent_id,
            jsonb_agg(r.respuesta_json ORDER BY (r.respuesta_json->>'created_at')::TIMESTAMPTZ ASC) AS respuestas
        FROM 
            respuestas r
        GROUP BY 
            r.parent_id
    )
    -- Resultado final con comentarios principales y sus respuestas
    SELECT 
        cn.id,
        cn.texto,
        cn.created_at,
        cn.autor_id,
        p.username,
        p.avatar_url,
        p.color,
        p.role = 'admin' AS es_admin,
        FALSE AS es_autor, -- Por ahora no tenemos esta información
        cn.autor_id = v_user_id AS es_propio,
        COALESCE(ra.respuestas, '[]'::JSONB) AS respuestas
    FROM 
        comentarios_noticia cn
    LEFT JOIN 
        perfiles p ON cn.autor_id = p.id
    LEFT JOIN 
        respuestas_agrupadas ra ON cn.id = ra.parent_id
    ORDER BY 
        CASE WHEN v_ascending THEN cn.created_at END ASC,
        CASE WHEN NOT v_ascending THEN cn.created_at END DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
