-- =====================================================
-- FUNCIÓN: get_estadisticas_por_categoria
-- =====================================================
-- Obtiene estadísticas detalladas por categoría del foro
-- Incluye información de hilos, comentarios y actividad reciente
-- =====================================================

-- Eliminar función si existe
DROP FUNCTION IF EXISTS get_estadisticas_por_categoria();

-- Crear función
CREATE OR REPLACE FUNCTION get_estadisticas_por_categoria()
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  slug TEXT,
  descripcion TEXT,
  color TEXT,
  icono TEXT,
  parent_id UUID,
  nivel INTEGER,
  es_activa BOOLEAN,
  total_hilos BIGINT,
  total_comentarios BIGINT,
  total_vistas BIGINT,
  hilos_activos_semana BIGINT,
  ultimo_hilo_fecha TIMESTAMPTZ,
  ultimo_hilo_titulo TEXT,
  ultimo_hilo_autor_id UUID,
  ultimo_hilo_autor_username TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Contar hilos por categoría
  hilos_por_categoria AS (
    SELECT 
      c.id as categoria_id,
      COUNT(DISTINCT h.id) as total_hilos,
      SUM(COALESCE(h.vistas, 0)) as total_vistas
    FROM foro_categorias c
    LEFT JOIN foro_hilos h ON h.categoria_id = c.id
    GROUP BY c.id
  ),
  
  -- Contar comentarios por categoría
  comentarios_por_categoria AS (
    SELECT 
      c.id as categoria_id,
      COUNT(DISTINCT p.id) as total_comentarios
    FROM foro_categorias c
    LEFT JOIN foro_hilos h ON h.categoria_id = c.id
    LEFT JOIN foro_posts p ON p.hilo_id = h.id
    WHERE p.post_padre_id IS NOT NULL  -- Solo comentarios, no respuestas a comentarios
    GROUP BY c.id
  ),
  
  -- Contar hilos activos en la última semana
  hilos_activos_recientes AS (
    SELECT 
      c.id as categoria_id,
      COUNT(DISTINCT h.id) as hilos_activos_semana
    FROM foro_categorias c
    LEFT JOIN foro_hilos h ON h.categoria_id = c.id
    WHERE h.created_at >= (CURRENT_DATE - INTERVAL '7 days')
    GROUP BY c.id
  ),
  
  -- Obtener el último hilo por categoría
  ultimo_hilo_por_categoria AS (
    SELECT DISTINCT ON (c.id)
      c.id as categoria_id,
      h.created_at as ultimo_hilo_fecha,
      h.titulo as ultimo_hilo_titulo,
      h.autor_id as ultimo_hilo_autor_id,
      p.username as ultimo_hilo_autor_username
    FROM foro_categorias c
    LEFT JOIN foro_hilos h ON h.categoria_id = c.id
    LEFT JOIN perfiles p ON h.autor_id = p.id
    WHERE h.id IS NOT NULL
    ORDER BY c.id, h.created_at DESC
  )
  
  -- Consulta principal que une todas las estadísticas
  SELECT 
    c.id,
    c.nombre::TEXT,
    c.slug::TEXT,
    c.descripcion::TEXT,
    c.color::TEXT,
    c.icono::TEXT,
    c.categoria_padre_id as parent_id,
    CASE 
      WHEN c.categoria_padre_id IS NULL THEN 0 
      ELSE 2 
    END as nivel,
    TRUE as es_activa,  -- Asumimos que todas están activas a menos que haya un campo específico
    COALESCE(hpc.total_hilos, 0)::BIGINT as total_hilos,
    COALESCE(cpc.total_comentarios, 0)::BIGINT as total_comentarios,
    COALESCE(hpc.total_vistas, 0)::BIGINT as total_vistas,
    COALESCE(har.hilos_activos_semana, 0)::BIGINT as hilos_activos_semana,
    ulh.ultimo_hilo_fecha,
    ulh.ultimo_hilo_titulo::TEXT,
    ulh.ultimo_hilo_autor_id,
    ulh.ultimo_hilo_autor_username::TEXT
  FROM foro_categorias c
  LEFT JOIN hilos_por_categoria hpc ON hpc.categoria_id = c.id
  LEFT JOIN comentarios_por_categoria cpc ON cpc.categoria_id = c.id
  LEFT JOIN hilos_activos_recientes har ON har.categoria_id = c.id
  LEFT JOIN ultimo_hilo_por_categoria ulh ON ulh.categoria_id = c.id
  ORDER BY 
    CASE WHEN c.categoria_padre_id IS NULL THEN 0 ELSE 1 END,  -- Primero categorías principales
    c.orden,  -- Luego por orden definido
    c.nombre;  -- Finalmente por nombre
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION get_estadisticas_por_categoria IS 'Obtiene estadísticas detalladas por categoría del foro, incluyendo conteo de hilos, comentarios, vistas y actividad reciente';

-- =====================================================
-- ACTUALIZAR ENDPOINT API
-- =====================================================
-- La API ya está configurada para usar esta función, pero aquí está la referencia:
-- GET /api/admin/foro/estadisticas?tipo=categorias
-- =====================================================

-- Nota: Asegúrate de que el usuario que ejecuta esta migración tenga los permisos necesarios
-- para crear funciones y modificar esquemas en la base de datos.
