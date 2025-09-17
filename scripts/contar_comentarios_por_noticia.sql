-- Función para contar comentarios por noticia
CREATE OR REPLACE FUNCTION contar_comentarios_por_noticia(noticia_ids TEXT[])
RETURNS TABLE (content_id TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.content_id,
    COUNT(c.id)::BIGINT
  FROM 
    comentarios c
  WHERE 
    c.content_type = 'noticia'
    AND c.content_id = ANY(noticia_ids)
  GROUP BY 
    c.content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
