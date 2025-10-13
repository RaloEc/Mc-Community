-- =====================================================
-- CORRECCIÓN: Contador de respuestas debe excluir posts eliminados
-- =====================================================
-- Problema: La función contar_respuestas_por_hilo incluye posts con deleted=true
-- Solución: Actualizar la función para filtrar por deleted=false
-- =====================================================

-- Actualizar función para contar respuestas por hilo excluyendo las eliminadas
-- Esta función recibe un array de IDs de hilos y devuelve un conjunto de resultados
-- con el ID del hilo y el conteo de respuestas NO ELIMINADAS para cada uno

CREATE OR REPLACE FUNCTION public.contar_respuestas_por_hilo(hilo_ids uuid[])
RETURNS TABLE(hilo_id uuid, respuestas bigint) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    hilo_id,
    COUNT(*) as respuestas
  FROM 
    public.foro_posts
  WHERE 
    hilo_id = ANY(hilo_ids)
    AND (deleted IS NULL OR deleted = false)  -- Solo contar respuestas no eliminadas
  GROUP BY 
    hilo_id;
$$;

-- Permisos para la función
GRANT EXECUTE ON FUNCTION public.contar_respuestas_por_hilo(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.contar_respuestas_por_hilo(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.contar_respuestas_por_hilo(uuid[]) TO service_role;

-- Comentario sobre la corrección
COMMENT ON FUNCTION public.contar_respuestas_por_hilo IS 'Cuenta respuestas de hilos excluyendo posts eliminados (deleted=false o NULL)';
