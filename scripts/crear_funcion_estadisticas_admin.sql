-- Función optimizada para obtener estadísticas de administración de noticias
-- Esta función agrupa múltiples consultas en una sola llamada para mejorar el rendimiento

CREATE OR REPLACE FUNCTION obtener_estadisticas_admin_noticias()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resultado JSON;
  total_noticias_count INTEGER;
  total_vistas_sum BIGINT;
  total_categorias_count INTEGER;
  total_autores_count INTEGER;
  noticias_recientes_count INTEGER;
  noticias_pendientes_count INTEGER;
  fecha_limite_recientes DATE;
  fecha_hoy DATE;
BEGIN
  -- Calcular fechas
  fecha_limite_recientes := CURRENT_DATE - INTERVAL '30 days';
  fecha_hoy := CURRENT_DATE;

  -- Total de noticias
  SELECT COUNT(*) INTO total_noticias_count
  FROM noticias;

  -- Total de vistas
  SELECT COALESCE(SUM(vistas), 0) INTO total_vistas_sum
  FROM noticias;

  -- Total de categorías de tipo noticia
  SELECT COUNT(*) INTO total_categorias_count
  FROM categorias
  WHERE tipo = 'noticia';

  -- Total de autores únicos
  SELECT COUNT(DISTINCT autor_id) INTO total_autores_count
  FROM noticias
  WHERE autor_id IS NOT NULL;

  -- Noticias recientes (últimos 30 días)
  SELECT COUNT(*) INTO noticias_recientes_count
  FROM noticias
  WHERE fecha_publicacion >= fecha_limite_recientes;

  -- Noticias pendientes (programadas para el futuro)
  SELECT COUNT(*) INTO noticias_pendientes_count
  FROM noticias
  WHERE fecha_publicacion > fecha_hoy;

  -- Construir JSON con todas las estadísticas
  SELECT json_build_object(
    'total_noticias', total_noticias_count,
    'total_vistas', total_vistas_sum,
    'total_categorias', total_categorias_count,
    'total_autores', total_autores_count,
    'noticias_recientes', noticias_recientes_count,
    'noticias_pendientes', noticias_pendientes_count,
    'noticias_por_mes', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          TO_CHAR(fecha_publicacion, 'YYYY-MM') as mes,
          COUNT(*) as total
        FROM noticias
        WHERE fecha_publicacion >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(fecha_publicacion, 'YYYY-MM')
        ORDER BY mes DESC
        LIMIT 12
      ) t
    ),
    'noticias_por_categoria', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          c.nombre as categoria,
          COUNT(nc.noticia_id) as total
        FROM categorias c
        LEFT JOIN noticias_categorias nc ON c.id = nc.categoria_id
        WHERE c.tipo = 'noticia'
        GROUP BY c.id, c.nombre
        ORDER BY total DESC
        LIMIT 10
      ) t
    ),
    'noticias_por_autor', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          p.username as autor,
          COUNT(n.id) as total
        FROM perfiles p
        INNER JOIN noticias n ON p.id = n.autor_id
        GROUP BY p.id, p.username
        ORDER BY total DESC
        LIMIT 10
      ) t
    ),
    'noticias_mas_vistas', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          id,
          titulo,
          vistas,
          fecha_publicacion
        FROM noticias
        ORDER BY vistas DESC
        LIMIT 10
      ) t
    )
  ) INTO resultado;

  RETURN resultado;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION obtener_estadisticas_admin_noticias() TO authenticated;

-- Comentario de la función
COMMENT ON FUNCTION obtener_estadisticas_admin_noticias() IS 
'Obtiene todas las estadísticas de administración de noticias en una sola llamada optimizada. Incluye contadores, distribuciones por mes/categoría/autor y noticias más vistas.';

-- Crear índices para optimizar las consultas si no existen
CREATE INDEX IF NOT EXISTS idx_noticias_fecha_publicacion ON noticias(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_noticias_vistas ON noticias(vistas DESC);
CREATE INDEX IF NOT EXISTS idx_noticias_autor_id ON noticias(autor_id);
CREATE INDEX IF NOT EXISTS idx_noticias_categorias_noticia_id ON noticias_categorias(noticia_id);
CREATE INDEX IF NOT EXISTS idx_noticias_categorias_categoria_id ON noticias_categorias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo);

-- Crear vista materializada para estadísticas (opcional, para mejor rendimiento)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estadisticas_noticias AS
SELECT
  COUNT(*) as total_noticias,
  COALESCE(SUM(vistas), 0) as total_vistas,
  COUNT(DISTINCT autor_id) as total_autores,
  COUNT(*) FILTER (WHERE fecha_publicacion >= CURRENT_DATE - INTERVAL '30 days') as noticias_recientes,
  COUNT(*) FILTER (WHERE fecha_publicacion > CURRENT_DATE) as noticias_pendientes
FROM noticias;

-- Crear índice único para la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS mv_estadisticas_noticias_idx ON mv_estadisticas_noticias ((1));

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refrescar_estadisticas_noticias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_noticias;
END;
$$;

-- Comentario
COMMENT ON FUNCTION refrescar_estadisticas_noticias() IS 
'Refresca la vista materializada de estadísticas de noticias. Debe ejecutarse periódicamente o mediante triggers.';

-- Trigger para refrescar automáticamente la vista materializada cuando cambian las noticias
CREATE OR REPLACE FUNCTION trigger_refrescar_estadisticas()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Refrescar la vista materializada de forma asíncrona
  PERFORM refrescar_estadisticas_noticias();
  RETURN NULL;
END;
$$;

-- Crear trigger (comentado por defecto para evitar sobrecarga)
-- Descomentar si se desea actualización automática
/*
DROP TRIGGER IF EXISTS trigger_noticias_estadisticas ON noticias;
CREATE TRIGGER trigger_noticias_estadisticas
AFTER INSERT OR UPDATE OR DELETE ON noticias
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refrescar_estadisticas();
*/
