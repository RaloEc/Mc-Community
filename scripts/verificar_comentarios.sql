-- Script para verificar comentarios existentes

-- Primero, verificar la estructura de la tabla comentarios
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'comentarios'
ORDER BY ordinal_position;

-- Contar todos los comentarios
SELECT COUNT(*) as total_comentarios FROM comentarios;

-- Listar las primeras 5 filas de la tabla comentarios para ver su estructura
SELECT * FROM comentarios LIMIT 5;

-- Verificar si existen las tablas relacionadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('comentarios', 'noticias', 'perfiles');

-- Verificar si la función RPC existe
SELECT routine_name, data_type 
FROM information_schema.routines 
WHERE routine_name = 'contar_comentarios_por_noticia';
