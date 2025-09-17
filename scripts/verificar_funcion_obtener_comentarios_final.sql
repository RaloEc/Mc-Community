-- Verificar si la función existe
SELECT 
    r.routine_name,
    p.data_type,
    p.parameter_name,
    p.parameter_mode,
    p.parameter_default
FROM 
    information_schema.routines r
LEFT JOIN 
    information_schema.parameters p ON r.specific_name = p.specific_name
WHERE 
    r.routine_name = 'obtener_comentarios_noticia'
ORDER BY 
    p.ordinal_position;

-- Probar la función con una noticia existente
SELECT 
    id, 
    texto, 
    created_at, 
    autor_id, 
    username, 
    es_admin, 
    es_propio,
    jsonb_array_length(respuestas) as num_respuestas
FROM 
    obtener_comentarios_noticia(
        '14f789b1-5043-4324-b6bf-6e71f2bb1692', -- Reemplazar con un ID de noticia real
        5,  -- límite
        0,  -- offset
        'desc' -- orden
    );
