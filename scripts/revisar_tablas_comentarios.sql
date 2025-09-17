-- Script para revisar tablas relacionadas con comentarios

-- Listar todas las tablas que contienen 'coment' en su nombre
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%coment%';

-- Listar todas las tablas que podrían estar relacionadas con noticias y comentarios
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%coment%' OR 
    table_name LIKE '%notic%' OR 
    table_name LIKE '%post%' OR 
    table_name LIKE '%hilo%' OR
    table_name LIKE '%reply%' OR
    table_name LIKE '%respuesta%'
);

-- Buscar columnas que podrían relacionar comentarios con noticias
SELECT t.table_name, c.column_name, c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND (
    c.column_name LIKE '%noticia%' OR
    c.column_name LIKE '%post%' OR
    c.column_name LIKE '%content%' OR
    c.column_name LIKE '%hilo%'
)
ORDER BY t.table_name, c.column_name;

-- Buscar funciones relacionadas con comentarios
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
    routine_name LIKE '%coment%' OR
    routine_name LIKE '%post%' OR
    routine_name LIKE '%notic%'
);

-- Verificar si hay vistas relacionadas con comentarios
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND (
    table_name LIKE '%coment%' OR
    table_name LIKE '%post%' OR
    table_name LIKE '%notic%'
);
