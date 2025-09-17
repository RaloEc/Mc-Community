-- Revisar la estructura completa de la tabla comentarios
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comentarios'
ORDER BY ordinal_position;
