-- Función para contar comentarios por noticia
-- Esta función recibe un array de IDs de noticias y devuelve un conjunto de resultados
-- con el ID de la noticia y el conteo de comentarios para cada una

CREATE OR REPLACE FUNCTION public.contar_comentarios_por_noticia(noticia_ids uuid[])
RETURNS TABLE(noticia_id uuid, total_comentarios bigint) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    noticia_id,
    COUNT(*) as total_comentarios
  FROM 
    public.comentarios
  WHERE 
    noticia_id = ANY(noticia_ids)
    AND eliminado = false
  GROUP BY 
    noticia_id;
$$;

-- Permisos para la función
GRANT EXECUTE ON FUNCTION public.contar_comentarios_por_noticia(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.contar_comentarios_por_noticia(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.contar_comentarios_por_noticia(uuid[]) TO service_role;
