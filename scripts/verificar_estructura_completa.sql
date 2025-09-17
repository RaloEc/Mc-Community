-- Verificar estructura de la vista noticias_con_autor
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'noticias_con_autor'
ORDER BY ordinal_position;

-- Verificar si hay tablas de comentarios con otro nombre
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    table_name LIKE '%coment%' OR 
    table_name LIKE '%comment%' OR
    table_name LIKE '%respuesta%' OR
    table_name LIKE '%reply%'
)
ORDER BY table_name, ordinal_position;

-- Verificar si hay columnas que puedan relacionar con noticias
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    column_name LIKE '%noticia%' OR
    column_name LIKE '%post%' OR
    column_name LIKE '%hilo%' OR
    column_name LIKE '%coment%' OR
    column_name LIKE '%comment%'
)
ORDER BY table_name, column_name;

-- Verificar si hay funciones relacionadas con comentarios
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%coment%' OR
    routine_name LIKE '%comment%' OR
    routine_name LIKE '%notic%' OR
    routine_name LIKE '%post%'
);

-- Verificar si hay triggers en la base de datos
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
