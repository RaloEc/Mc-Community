-- Crear una función específica para manejar UUIDs
-- Esta función tiene un nombre diferente para evitar conflictos con la versión TEXT[]
CREATE OR REPLACE FUNCTION contar_comentarios_por_noticia_uuid(noticia_ids UUID[])
RETURNS TABLE (noticia_id UUID, total_comentarios BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.noticia_id,
        COUNT(c.id)::BIGINT as total_comentarios
    FROM 
        noticias_comentarios c
    WHERE 
        c.noticia_id = ANY(noticia_ids)
    GROUP BY 
        c.noticia_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar para obtener el conteo de una sola noticia usando UUID
CREATE OR REPLACE FUNCTION obtener_contador_comentarios_uuid(noticia_id_param UUID)
RETURNS BIGINT AS $$
DECLARE
    total BIGINT;
BEGIN
    SELECT COUNT(*) INTO total 
    FROM noticias_comentarios 
    WHERE noticia_id = noticia_id_param;
    
    RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
