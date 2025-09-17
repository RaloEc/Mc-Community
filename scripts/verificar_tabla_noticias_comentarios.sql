-- Verificar la estructura de la tabla noticias_comentarios
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'noticias_comentarios'
ORDER BY 
    ordinal_position;

-- Verificar si la tabla tiene datos
SELECT 
    COUNT(*) as total_registros
FROM 
    noticias_comentarios;

-- Verificar los tipos de datos de las columnas noticia_id y comentario_id
SELECT 
    pg_typeof(noticia_id) as tipo_noticia_id,
    pg_typeof(comentario_id) as tipo_comentario_id
FROM 
    noticias_comentarios
LIMIT 1;

-- Verificar si hay algún problema de integridad referencial
SELECT 
    nc.id,
    nc.noticia_id,
    nc.comentario_id,
    CASE 
        WHEN n.id IS NULL THEN 'No existe la noticia'
        ELSE 'OK'
    END as estado_noticia,
    CASE 
        WHEN c.id IS NULL THEN 'No existe el comentario'
        ELSE 'OK'
    END as estado_comentario
FROM 
    noticias_comentarios nc
LEFT JOIN 
    noticias n ON nc.noticia_id = n.id
LEFT JOIN 
    comentarios c ON nc.comentario_id = c.id
WHERE 
    n.id IS NULL OR c.id IS NULL
LIMIT 10;
