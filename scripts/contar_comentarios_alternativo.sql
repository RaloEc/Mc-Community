-- Script alternativo para contar comentarios
-- Este script asume una estructura diferente de la tabla comentarios

-- Primero, verificar la estructura real de la tabla
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comentarios'
ORDER BY ordinal_position;

-- Crear una función adaptada a la estructura real
-- Esta función asume que puede haber una columna diferente para identificar la noticia
CREATE OR REPLACE FUNCTION contar_comentarios_alternativo(noticia_ids TEXT[])
RETURNS TABLE (noticia_id TEXT, count BIGINT) AS $$
DECLARE
    -- Variables para almacenar nombres de columnas reales
    id_column TEXT := 'id'; -- Columna de ID del comentario
    noticia_id_column TEXT := 'noticia_id'; -- Columna que podría contener el ID de la noticia
    
    -- Consulta dinámica
    query TEXT;
BEGIN
    -- Verificar si existe la columna noticia_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'noticia_id'
    ) THEN
        -- Usar la columna noticia_id
        RETURN QUERY
        EXECUTE format('
            SELECT noticia_id::TEXT, COUNT(id)::BIGINT
            FROM comentarios
            WHERE noticia_id = ANY($1)
            GROUP BY noticia_id
        ') USING noticia_ids;
    
    -- Verificar si existe la columna post_id (común en sistemas de comentarios)
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'post_id'
    ) THEN
        -- Usar la columna post_id
        RETURN QUERY
        EXECUTE format('
            SELECT post_id::TEXT, COUNT(id)::BIGINT
            FROM comentarios
            WHERE post_id = ANY($1)
            GROUP BY post_id
        ') USING noticia_ids;
    
    -- Verificar si existe la columna hilo_id (otra posibilidad)
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comentarios' AND column_name = 'hilo_id'
    ) THEN
        -- Usar la columna hilo_id
        RETURN QUERY
        EXECUTE format('
            SELECT hilo_id::TEXT, COUNT(id)::BIGINT
            FROM comentarios
            WHERE hilo_id = ANY($1)
            GROUP BY hilo_id
        ') USING noticia_ids;
    
    ELSE
        -- Si no encontramos ninguna columna esperada, devolver un resultado vacío
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Probar la función
SELECT * FROM contar_comentarios_alternativo(ARRAY['id-de-una-noticia-existente']);
