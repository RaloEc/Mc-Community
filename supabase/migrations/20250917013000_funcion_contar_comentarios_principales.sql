-- Función para obtener el conteo de comentarios principales de una noticia
-- Solo cuenta comentarios principales (no respuestas) y excluye los eliminados
CREATE OR REPLACE FUNCTION public.contar_comentarios_principales(
    p_noticia_id UUID
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    total_comentarios BIGINT;
BEGIN
    SELECT COUNT(c.id) INTO total_comentarios
    FROM comentarios c
    JOIN noticias_comentarios nc ON c.id = nc.comentario_id
    WHERE nc.noticia_id = p_noticia_id
    AND c.comentario_padre_id IS NULL  -- Solo comentarios principales
    AND (c.deleted IS NULL OR c.deleted = FALSE);
    
    RETURN COALESCE(total_comentarios, 0);
END;
$$;

-- Comentario descriptivo para la función
COMMENT ON FUNCTION public.contar_comentarios_principales IS 
'Devuelve el número de comentarios principales (no respuestas) de una noticia, excluyendo los comentarios eliminados.';

-- Crear índice adicional para mejorar el rendimiento si no existe
CREATE INDEX IF NOT EXISTS idx_comentarios_para_contar 
ON public.comentarios (id, comentario_padre_id, deleted)
WHERE comentario_padre_id IS NULL AND (deleted IS NULL OR deleted = FALSE);

-- Script de prueba (opcional, se puede ejecutar por separado)
/*
-- Ejemplo de uso:
SELECT contar_comentarios_principales('14f789b1-5043-4324-b6bf-6e71f2bb1692'::UUID);

-- Para todas las noticias con sus conteos:
SELECT 
    n.id as noticia_id,
    n.titulo,
    contar_comentarios_principales(n.id) as total_comentarios
FROM 
    noticias n
ORDER BY 
    total_comentarios DESC;
*/
