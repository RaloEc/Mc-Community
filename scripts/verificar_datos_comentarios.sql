-- Verificar si hay datos en la tabla de comentarios
SELECT COUNT(*) as total_comentarios FROM comentarios;

-- Mostrar algunos comentarios de ejemplo
SELECT * FROM comentarios LIMIT 5;

-- Verificar si hay comentarios relacionados con noticias
-- Intentar diferentes columnas que podrían contener la relación
SELECT COUNT(*) as comentarios_con_noticia_id 
FROM comentarios 
WHERE noticia_id IS NOT NULL;

-- Verificar si hay una columna tipo_contenido o content_type
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'comentarios' 
AND (column_name LIKE '%tipo%' OR column_name LIKE '%type%');

-- Si existe una columna tipo_contenido, verificar si hay comentarios de noticias
SELECT tipo_contenido, COUNT(*) 
FROM comentarios 
WHERE EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'comentarios' 
    AND column_name = 'tipo_contenido'
)
GROUP BY tipo_contenido;
