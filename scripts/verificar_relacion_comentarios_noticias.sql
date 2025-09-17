-- Verificar todas las columnas de la tabla comentarios
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comentarios'
ORDER BY ordinal_position;

-- Verificar si hay alguna columna que pueda relacionarse con noticias
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comentarios'
AND (
    column_name LIKE '%noticia%' OR
    column_name LIKE '%post%' OR
    column_name LIKE '%articulo%' OR
    column_name LIKE '%content%' OR
    column_name LIKE '%tipo%' OR
    column_name LIKE '%type%'
);

-- Verificar la estructura de la tabla noticias
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'noticias'
ORDER BY ordinal_position;
