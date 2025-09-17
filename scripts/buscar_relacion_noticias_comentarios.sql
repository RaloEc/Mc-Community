-- Buscar tablas que puedan relacionar noticias y comentarios
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND (
        ccu.table_name = 'noticias' OR
        tc.table_name = 'noticias'
    );

-- Buscar tablas que puedan contener la palabra 'comentario' o 'noticia'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
    table_name LIKE '%coment%' OR
    table_name LIKE '%notic%'
);

-- Buscar columnas que puedan relacionarse con noticias o comentarios
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    column_name LIKE '%notic%' OR
    column_name LIKE '%coment%'
);
