-- Función de respaldo para contar comentarios
-- Esta función intentará diferentes columnas que podrían relacionar comentarios con noticias

CREATE OR REPLACE FUNCTION contar_comentarios_flexible(noticia_ids TEXT[])
RETURNS TABLE (noticia_id TEXT, total_comentarios BIGINT) AS $$
DECLARE
    columna_noticia TEXT := NULL;
    columna_tipo TEXT := NULL;
    query_text TEXT;
BEGIN
    -- Verificar si existe la columna noticia_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'noticia_id'
    ) THEN
        columna_noticia := 'noticia_id';
    END IF;
    
    -- Verificar si existe la columna post_id
    IF columna_noticia IS NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'post_id'
    ) THEN
        columna_noticia := 'post_id';
    END IF;
    
    -- Verificar si existe la columna content_id
    IF columna_noticia IS NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'content_id'
    ) THEN
        columna_noticia := 'content_id';
    END IF;
    
    -- Verificar si existe la columna tipo_contenido o content_type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'tipo_contenido'
    ) THEN
        columna_tipo := 'tipo_contenido';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'content_type'
    ) THEN
        columna_tipo := 'content_type';
    END IF;
    
    -- Si encontramos una columna para el ID de la noticia
    IF columna_noticia IS NOT NULL THEN
        -- Si también hay una columna de tipo, filtrar por tipo 'noticia'
        IF columna_tipo IS NOT NULL THEN
            query_text := format('
                SELECT %I::TEXT as noticia_id, COUNT(*)::BIGINT as total_comentarios
                FROM comentarios
                WHERE %I = ANY($1)
                AND %I = ''noticia''
                GROUP BY %I
            ', columna_noticia, columna_noticia, columna_tipo, columna_noticia);
            
            RETURN QUERY EXECUTE query_text USING noticia_ids;
        ELSE
            -- Si no hay columna de tipo, contar todos los comentarios que coincidan con el ID
            query_text := format('
                SELECT %I::TEXT as noticia_id, COUNT(*)::BIGINT as total_comentarios
                FROM comentarios
                WHERE %I = ANY($1)
                GROUP BY %I
            ', columna_noticia, columna_noticia, columna_noticia);
            
            RETURN QUERY EXECUTE query_text USING noticia_ids;
        END IF;
    ELSE
        -- Si no encontramos una columna adecuada, devolver resultados vacíos
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
