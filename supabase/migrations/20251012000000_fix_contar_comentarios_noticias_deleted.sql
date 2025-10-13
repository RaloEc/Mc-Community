-- =====================================================
-- CORRECCIÓN: Contador de comentarios de noticias debe excluir comentarios eliminados
-- =====================================================
-- Problema: Las funciones que cuentan comentarios de noticias no filtran por deleted=false
-- Solución: Actualizar todas las funciones para filtrar comentarios eliminados
-- =====================================================

-- Función: contar_comentarios_por_noticia (versión UUID)
-- Actualizar para contar solo comentarios no eliminados
CREATE OR REPLACE FUNCTION public.contar_comentarios_por_noticia(noticia_ids uuid[])
RETURNS TABLE(noticia_id uuid, total_comentarios bigint) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    nc.noticia_id,
    COUNT(*) as total_comentarios
  FROM 
    public.noticias_comentarios nc
  INNER JOIN 
    public.comentarios c ON nc.comentario_id = c.id
  WHERE 
    nc.noticia_id = ANY(noticia_ids)
    AND (c.deleted IS NULL OR c.deleted = false)
  GROUP BY 
    nc.noticia_id;
$$;

-- Función: contar_comentarios_por_noticia_uuid
-- Actualizar para contar solo comentarios no eliminados
CREATE OR REPLACE FUNCTION contar_comentarios_por_noticia_uuid(noticia_ids UUID[])
RETURNS TABLE (noticia_id UUID, total_comentarios BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        nc.noticia_id,
        COUNT(c.id)::BIGINT as total_comentarios
    FROM 
        noticias_comentarios nc
    INNER JOIN 
        comentarios c ON nc.comentario_id = c.id
    WHERE 
        nc.noticia_id = ANY(noticia_ids)
        AND (c.deleted IS NULL OR c.deleted = false)
    GROUP BY 
        nc.noticia_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: obtener_contador_comentarios_uuid
-- Actualizar para contar solo comentarios no eliminados
CREATE OR REPLACE FUNCTION obtener_contador_comentarios_uuid(noticia_id_param UUID)
RETURNS BIGINT AS $$
DECLARE
    total BIGINT;
BEGIN
    SELECT COUNT(*) INTO total 
    FROM noticias_comentarios nc
    INNER JOIN comentarios c ON nc.comentario_id = c.id
    WHERE nc.noticia_id = noticia_id_param
    AND (c.deleted IS NULL OR c.deleted = false);
    
    RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: contar_comentarios_por_noticia (versión TEXT[])
-- Esta versión parece ser para un sistema diferente que usa content_type y content_id
-- Actualizar para usar el campo correcto 'deleted' en lugar de 'deleted_at'
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
    AND (deleted IS NULL OR deleted = false)  -- Corregido: usar 'deleted' en lugar de 'deleted_at'
  GROUP BY 
    content_id;
END;
$$;

-- Permisos para la función
GRANT EXECUTE ON FUNCTION public.contar_comentarios_por_noticia(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.contar_comentarios_por_noticia(text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.contar_comentarios_por_noticia(text[]) TO anon;

-- Comentarios sobre la corrección
COMMENT ON FUNCTION public.contar_comentarios_por_noticia(uuid[]) IS 'Cuenta comentarios de noticias excluyendo comentarios eliminados (deleted=false)';
COMMENT ON FUNCTION public.contar_comentarios_por_noticia(text[]) IS 'Cuenta comentarios de noticias excluyendo comentarios eliminados (deleted=false)';
COMMENT ON FUNCTION contar_comentarios_por_noticia_uuid IS 'Cuenta comentarios de noticias excluyendo comentarios eliminados (deleted=false)';
COMMENT ON FUNCTION obtener_contador_comentarios_uuid IS 'Obtiene el contador de comentarios de una noticia excluyendo comentarios eliminados (deleted=false)';
