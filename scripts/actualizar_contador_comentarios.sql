-- Primero, verificar si existe la función y eliminarla si es necesario
DROP FUNCTION IF EXISTS contar_comentarios_por_noticia(TEXT[]);

-- Crear la función actualizada
CREATE OR REPLACE FUNCTION contar_comentarios_por_noticia(noticia_ids TEXT[])
RETURNS TABLE (noticia_id TEXT, total_comentarios BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.noticia_id::TEXT,
        COUNT(c.id)::BIGINT as total_comentarios
    FROM 
        comentarios c
    WHERE 
        c.noticia_id = ANY(noticia_ids)
    GROUP BY 
        c.noticia_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear una función auxiliar para obtener el conteo de una sola noticia
CREATE OR REPLACE FUNCTION obtener_contador_comentarios(noticia_id_param TEXT)
RETURNS BIGINT AS $$
DECLARE
    total BIGINT;
BEGIN
    SELECT COUNT(*) INTO total 
    FROM comentarios 
    WHERE noticia_id = noticia_id_param;
    
    RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
