-- =====================================================
-- Corrección: Función obtener_comentarios_noticia
-- =====================================================
-- Esta función corrige el problema donde las respuestas
-- no incluyen la información del autor (username, avatar, etc.)
-- =====================================================

-- PASO 1: Eliminar la función existente
DROP FUNCTION IF EXISTS obtener_comentarios_noticia(text, integer, integer, text) CASCADE;

-- PASO 2: Crear la función con los tipos correctos
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
    username VARCHAR,
    avatar_url VARCHAR,
    color VARCHAR,
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
            c.id AS comentario_id,
            c.contenido,
            c.created_at,
            c.usuario_id,
            c.comentario_padre_id
        FROM 
            comentarios c
        JOIN 
            noticias_comentarios nc ON c.id = nc.comentario_id
        WHERE 
            nc.noticia_id::TEXT = p_noticia_id
            AND c.comentario_padre_id IS NULL -- Solo comentarios principales
            AND (c.deleted IS NULL OR c.deleted = FALSE) -- Excluir comentarios eliminados
        ORDER BY 
            c.created_at DESC
        LIMIT p_limite
        OFFSET p_offset
    ),
    respuestas AS (
        -- Obtener respuestas a estos comentarios CON información del autor
        SELECT 
            c.id AS respuesta_id,
            c.comentario_padre_id,
            jsonb_build_object(
                'id', c.id,
                'texto', c.contenido,
                'created_at', c.created_at,
                'autor_id', c.usuario_id,
                'autor', jsonb_build_object(
                    'id', COALESCE(p.id, c.usuario_id),
                    'username', COALESCE(p.username, 'Usuario'),
                    'avatar_url', COALESCE(p.avatar_url, ''),
                    'color', COALESCE(p.color, '#3b82f6'),
                    'role', COALESCE(p.role, 'usuario'),
                    'is_own', c.usuario_id = v_user_id
                ),
                'editado', COALESCE((c.historial_ediciones IS NOT NULL), false),
                'isEdited', COALESCE((c.historial_ediciones IS NOT NULL), false)
            ) AS respuesta_json
        FROM 
            comentarios c
        LEFT JOIN 
            perfiles p ON c.usuario_id = p.id
        WHERE 
            c.comentario_padre_id IN (SELECT cn.comentario_id FROM comentarios_noticia cn)
            AND (c.deleted IS NULL OR c.deleted = FALSE) -- Excluir comentarios eliminados
    ),
    respuestas_agrupadas AS (
        -- Agrupar respuestas por comentario padre
        SELECT 
            r.comentario_padre_id,
            jsonb_agg(r.respuesta_json ORDER BY (r.respuesta_json->>'created_at')::TIMESTAMPTZ ASC) AS respuestas
        FROM 
            respuestas r
        GROUP BY 
            r.comentario_padre_id
    )
    -- Resultado final con comentarios principales y sus respuestas
    SELECT 
        cn.comentario_id AS id,
        cn.contenido AS texto,
        cn.created_at,
        cn.usuario_id AS autor_id,
        COALESCE(p.username, 'Usuario') AS username,
        COALESCE(p.avatar_url, '') AS avatar_url,
        COALESCE(p.color, '#3b82f6') AS color,
        COALESCE(p.role = 'admin', false) AS es_admin,
        TRUE AS es_autor, 
        cn.usuario_id = v_user_id AS es_propio,
        COALESCE(ra.respuestas, '[]'::JSONB) AS respuestas
    FROM 
        comentarios_noticia cn
    LEFT JOIN 
        perfiles p ON cn.usuario_id = p.id
    LEFT JOIN 
        respuestas_agrupadas ra ON cn.comentario_id = ra.comentario_padre_id
    ORDER BY 
        CASE WHEN v_ascending THEN cn.created_at END ASC,
        CASE WHEN NOT v_ascending THEN cn.created_at END DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que la función se creó correctamente
SELECT 'Función obtener_comentarios_noticia actualizada correctamente' AS resultado;
