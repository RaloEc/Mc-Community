-- Actualización de la función para incluir vistas por periodo
-- Esto permite calcular trends reales de vistas comparando periodos

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
  vistas_ultimos_30_dias BIGINT;
  vistas_30_60_dias_atras BIGINT;
  fecha_limite_recientes DATE;
  fecha_limite_periodo_anterior DATE;
  fecha_hoy DATE;
BEGIN
  -- Calcular fechas
  fecha_hoy := CURRENT_DATE;
  fecha_limite_recientes := fecha_hoy - INTERVAL '30 days';
  fecha_limite_periodo_anterior := fecha_hoy - INTERVAL '60 days';

  -- Total de noticias
  SELECT COUNT(*) INTO total_noticias_count
  FROM noticias;

  -- Total de vistas (todas las noticias)
  SELECT COALESCE(SUM(vistas), 0) INTO total_vistas_sum
  FROM noticias;

  -- Vistas de los últimos 30 días
  -- Suma las vistas de noticias publicadas en los últimos 30 días
  SELECT COALESCE(SUM(vistas), 0) INTO vistas_ultimos_30_dias
  FROM noticias
  WHERE fecha_publicacion >= fecha_limite_recientes;

  -- Vistas del periodo anterior (30-60 días atrás)
  -- Suma las vistas de noticias publicadas entre 30 y 60 días atrás
  SELECT COALESCE(SUM(vistas), 0) INTO vistas_30_60_dias_atras
  FROM noticias
  WHERE fecha_publicacion >= fecha_limite_periodo_anterior
    AND fecha_publicacion < fecha_limite_recientes;

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
    'vistas_ultimos_30_dias', vistas_ultimos_30_dias,
    'vistas_30_60_dias_atras', vistas_30_60_dias_atras,
    'noticias_30d', noticias_recientes_count,
    'noticias_por_mes', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          EXTRACT(YEAR FROM fecha_publicacion)::INTEGER as año,
          EXTRACT(MONTH FROM fecha_publicacion)::INTEGER as mes,
          TO_CHAR(fecha_publicacion, 'YYYY-MM') as mes_formato,
          COUNT(*) as cantidad
        FROM noticias
        WHERE fecha_publicacion >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY EXTRACT(YEAR FROM fecha_publicacion), EXTRACT(MONTH FROM fecha_publicacion), TO_CHAR(fecha_publicacion, 'YYYY-MM')
        ORDER BY año DESC, mes DESC
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

-- Comentario actualizado
COMMENT ON FUNCTION obtener_estadisticas_admin_noticias() IS 
'Obtiene todas las estadísticas de administración de noticias en una sola llamada optimizada. 
Incluye contadores, distribuciones por mes/categoría/autor, noticias más vistas, 
y vistas por periodo (últimos 30 días vs 30-60 días atrás) para calcular trends reales.';
