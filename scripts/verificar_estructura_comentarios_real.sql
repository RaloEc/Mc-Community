-- Verificar la estructura real de la tabla comentarios
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'comentarios'
ORDER BY 
    ordinal_position;

-- Verificar si hay datos en la tabla
SELECT 
    id, 
    content_type, 
    content_id, 
    author_id, 
    text, -- Verificar si esta columna existe o si se llama 'texto'
    parent_id,
    created_at,
    updated_at
FROM 
    comentarios
LIMIT 5;

-- Verificar la relación entre comentarios y noticias
SELECT 
    nc.id,
    nc.noticia_id,
    nc.comentario_id,
    c.id AS comentario_id_real,
    c.content_type,
    c.content_id,
    c.text -- Verificar si esta columna existe o si se llama 'texto'
FROM 
    noticias_comentarios nc
JOIN 
    comentarios c ON nc.comentario_id = c.id
LIMIT 5;
