-- Verificar estructura detallada de la tabla de comentarios
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'comentarios'
ORDER BY 
    ordinal_position;

-- Verificar si hay índices en la tabla de comentarios
SELECT 
    i.relname as index_name,
    a.attname as column_name,
    idx.indisprimary as is_primary_key,
    idx.indisunique as is_unique
FROM 
    pg_class t,
    pg_class i,
    pg_index idx,
    pg_attribute a
WHERE 
    t.oid = idx.indrelid
    AND i.oid = idx.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(idx.indkey)
    AND t.relkind = 'r'
    AND t.relname = 'comentarios';

-- Verificar si hay claves foráneas en la tabla de comentarios
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
    AND tc.table_name = 'comentarios';
