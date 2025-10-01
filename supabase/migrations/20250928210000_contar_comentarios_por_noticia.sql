-- Función para contar comentarios por noticia de forma eficiente
-- Esta función permite obtener el conteo de comentarios para múltiples noticias en una sola consulta
-- Mejora el rendimiento al evitar múltiples consultas individuales

CREATE OR REPLACE FUNCTION public.contar_comentarios_por_noticia(noticia_ids text[])
RETURNS TABLE (
  noticia_id text,
  total_comentarios bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    content_id::text as noticia_id,
    COUNT(*)::bigint as total_comentarios
  FROM 
    comentarios
  WHERE 
    content_type = 'noticia'
    AND content_id = ANY(noticia_ids)
    AND deleted_at IS NULL
  GROUP BY 
    content_id;
END;
$$;

-- Permisos para la función
GRANT EXECUTE ON FUNCTION public.contar_comentarios_por_noticia TO authenticated;
GRANT EXECUTE ON FUNCTION public.contar_comentarios_por_noticia TO service_role;
GRANT EXECUTE ON FUNCTION public.contar_comentarios_por_noticia TO anon;

-- Comentario para documentación
COMMENT ON FUNCTION public.contar_comentarios_por_noticia IS 'Cuenta el número de comentarios para múltiples noticias en una sola consulta';
