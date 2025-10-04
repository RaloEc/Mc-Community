-- =====================================================
-- MIGRACIÓN: Estadísticas Detalladas para Admin del Foro (CORREGIDA)
-- Fecha: 2025-01-03
-- Descripción: Funciones optimizadas para obtener estadísticas
--              en tiempo real del foro para el panel de administración
--              SIN usar deleted_at (columna no existe en las tablas)
-- =====================================================

-- 1. Función para obtener estadísticas generales del foro
CREATE OR REPLACE FUNCTION get_estadisticas_generales_foro()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resultado JSON;
BEGIN
  SELECT json_build_object(
    'total_hilos', (SELECT COUNT(*) FROM foro_hilos),
    'total_comentarios', (SELECT COUNT(*) FROM foro_posts),
    'total_categorias', (SELECT COUNT(*) FROM foro_categorias WHERE es_activa = true),
    'total_etiquetas', (SELECT COUNT(*) FROM foro_etiquetas),
    'hilos_hoy', (
      SELECT COUNT(*) FROM foro_hilos 
      WHERE DATE(created_at) = CURRENT_DATE
    ),
    'comentarios_hoy', (
      SELECT COUNT(*) FROM foro_posts 
      WHERE DATE(created_at) = CURRENT_DATE
    ),
    'hilos_semana', (
      SELECT COUNT(*) FROM foro_hilos 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'comentarios_semana', (
      SELECT COUNT(*) FROM foro_posts 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'hilos_mes', (
      SELECT COUNT(*) FROM foro_hilos 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'comentarios_mes', (
      SELECT COUNT(*) FROM foro_posts 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'total_vistas', (SELECT COALESCE(SUM(vistas), 0) FROM foro_hilos),
    'promedio_comentarios_por_hilo', (
      SELECT ROUND(AVG(comentarios_count)::numeric, 2)
      FROM (
        SELECT COUNT(*) as comentarios_count
        FROM foro_posts
        GROUP BY hilo_id
      ) subq
    )
  ) INTO resultado;
  
  RETURN resultado;
END;
$$;

-- 2. Función para obtener hilos más populares (por vistas, comentarios y votos)
CREATE OR REPLACE FUNCTION get_hilos_populares(
  limite INT DEFAULT 10,
  periodo_dias INT DEFAULT 30
)
RETURNS TABLE(
  id UUID,
  titulo VARCHAR,
  slug VARCHAR,
  autor_id UUID,
  autor_username VARCHAR,
  autor_avatar_url TEXT,
  categoria_id UUID,
  categoria_nombre VARCHAR,
  vistas BIGINT,
  comentarios_count BIGINT,
  votos_conteo INT,
  created_at TIMESTAMPTZ,
  puntuacion_popularidad NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.titulo,
    h.slug,
    h.autor_id,
    p.username as autor_username,
    p.avatar_url as autor_avatar_url,
    h.categoria_id,
    c.nombre as categoria_nombre,
    COALESCE(h.vistas, 0) as vistas,
    (SELECT COUNT(*) FROM foro_posts fp WHERE fp.hilo_id = h.id) as comentarios_count,
    COALESCE(h.votos_conteo, 0) as votos_conteo,
    h.created_at,
    -- Fórmula de popularidad: (vistas * 0.1) + (comentarios * 2) + (votos * 5)
    (COALESCE(h.vistas, 0) * 0.1 + 
     (SELECT COUNT(*) FROM foro_posts fp WHERE fp.hilo_id = h.id) * 2 + 
     COALESCE(h.votos_conteo, 0) * 5)::NUMERIC as puntuacion_popularidad
  FROM foro_hilos h
  LEFT JOIN perfiles p ON h.autor_id = p.id
  LEFT JOIN foro_categorias c ON h.categoria_id = c.id
  WHERE (periodo_dias = 0 OR h.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)
  ORDER BY puntuacion_popularidad DESC
  LIMIT limite;
END;
$$;

-- 3. Función para obtener estadísticas por categoría
CREATE OR REPLACE FUNCTION get_estadisticas_por_categoria()
RETURNS TABLE(
  id UUID,
  nombre VARCHAR,
  slug VARCHAR,
  descripcion TEXT,
  color VARCHAR,
  icono VARCHAR,
  parent_id UUID,
  nivel INT,
  es_activa BOOLEAN,
  total_hilos BIGINT,
  total_comentarios BIGINT,
  total_vistas BIGINT,
  hilos_activos_semana BIGINT,
  ultimo_hilo_fecha TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    c.slug,
    c.descripcion,
    c.color,
    c.icono,
    c.parent_id,
    c.nivel,
    c.es_activa,
    (SELECT COUNT(*) FROM foro_hilos h WHERE h.categoria_id = c.id) as total_hilos,
    (SELECT COUNT(*) FROM foro_posts fp 
     INNER JOIN foro_hilos h ON fp.hilo_id = h.id 
     WHERE h.categoria_id = c.id) as total_comentarios,
    (SELECT COALESCE(SUM(h.vistas), 0) FROM foro_hilos h WHERE h.categoria_id = c.id) as total_vistas,
    (SELECT COUNT(*) FROM foro_hilos h 
     WHERE h.categoria_id = c.id 
     AND h.created_at >= CURRENT_DATE - INTERVAL '7 days') as hilos_activos_semana,
    (SELECT MAX(h.created_at) FROM foro_hilos h WHERE h.categoria_id = c.id) as ultimo_hilo_fecha
  FROM foro_categorias c
  ORDER BY c.orden ASC, c.nombre ASC;
END;
$$;

-- 4. Función para obtener usuarios más activos en el foro
CREATE OR REPLACE FUNCTION get_usuarios_mas_activos_foro(
  limite INT DEFAULT 10,
  periodo_dias INT DEFAULT 30
)
RETURNS TABLE(
  usuario_id UUID,
  username VARCHAR,
  avatar_url TEXT,
  rol VARCHAR,
  total_hilos BIGINT,
  total_comentarios BIGINT,
  total_votos_recibidos BIGINT,
  puntuacion_actividad NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as usuario_id,
    p.username,
    p.avatar_url,
    p.rol,
    (SELECT COUNT(*) FROM foro_hilos h 
     WHERE h.autor_id = p.id 
     AND (periodo_dias = 0 OR h.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)) as total_hilos,
    (SELECT COUNT(*) FROM foro_posts fp 
     WHERE fp.autor_id = p.id 
     AND (periodo_dias = 0 OR fp.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)) as total_comentarios,
    (SELECT COALESCE(SUM(h.votos_conteo), 0) FROM foro_hilos h 
     WHERE h.autor_id = p.id 
     AND (periodo_dias = 0 OR h.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)) as total_votos_recibidos,
    -- Puntuación: hilos * 10 + comentarios * 2 + votos recibidos * 3
    ((SELECT COUNT(*) FROM foro_hilos h 
      WHERE h.autor_id = p.id 
      AND (periodo_dias = 0 OR h.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)) * 10 +
     (SELECT COUNT(*) FROM foro_posts fp 
      WHERE fp.autor_id = p.id 
      AND (periodo_dias = 0 OR fp.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)) * 2 +
     (SELECT COALESCE(SUM(h.votos_conteo), 0) FROM foro_hilos h 
      WHERE h.autor_id = p.id 
      AND (periodo_dias = 0 OR h.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)) * 3)::NUMERIC as puntuacion_actividad
  FROM perfiles p
  WHERE EXISTS (
    SELECT 1 FROM foro_hilos h 
    WHERE h.autor_id = p.id 
    AND (periodo_dias = 0 OR h.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)
  ) OR EXISTS (
    SELECT 1 FROM foro_posts fp 
    WHERE fp.autor_id = p.id 
    AND (periodo_dias = 0 OR fp.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)
  )
  ORDER BY puntuacion_actividad DESC
  LIMIT limite;
END;
$$;

-- 5. Función para obtener actividad diaria del foro (últimos 30 días)
CREATE OR REPLACE FUNCTION get_actividad_diaria_foro(dias INT DEFAULT 30)
RETURNS TABLE(
  fecha DATE,
  nuevos_hilos BIGINT,
  nuevos_comentarios BIGINT,
  total_vistas BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH fechas AS (
    SELECT generate_series(
      CURRENT_DATE - (dias - 1 || ' days')::INTERVAL,
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE as fecha
  )
  SELECT 
    f.fecha,
    COALESCE((SELECT COUNT(*) FROM foro_hilos h 
              WHERE DATE(h.created_at) = f.fecha), 0) as nuevos_hilos,
    COALESCE((SELECT COUNT(*) FROM foro_posts fp 
              WHERE DATE(fp.created_at) = f.fecha), 0) as nuevos_comentarios,
    COALESCE((SELECT SUM(h.vistas) FROM foro_hilos h 
              WHERE DATE(h.created_at) = f.fecha), 0) as total_vistas
  FROM fechas f
  ORDER BY f.fecha ASC;
END;
$$;

-- 6. Función para obtener hilos recientes para moderación
CREATE OR REPLACE FUNCTION get_hilos_recientes_moderacion(
  limite INT DEFAULT 20,
  offset_val INT DEFAULT 0,
  filtro_categoria UUID DEFAULT NULL,
  orden_campo VARCHAR DEFAULT 'created_at',
  orden_direccion VARCHAR DEFAULT 'DESC'
)
RETURNS TABLE(
  id UUID,
  titulo VARCHAR,
  slug VARCHAR,
  contenido TEXT,
  autor_id UUID,
  autor_username VARCHAR,
  autor_avatar_url TEXT,
  autor_rol VARCHAR,
  categoria_id UUID,
  categoria_nombre VARCHAR,
  categoria_color VARCHAR,
  vistas BIGINT,
  votos_conteo INT,
  comentarios_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  es_fijado BOOLEAN,
  es_cerrado BOOLEAN,
  etiquetas JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query TEXT;
BEGIN
  query := format('
    SELECT 
      h.id,
      h.titulo,
      h.slug,
      h.contenido,
      h.autor_id,
      p.username as autor_username,
      p.avatar_url as autor_avatar_url,
      p.rol as autor_rol,
      h.categoria_id,
      c.nombre as categoria_nombre,
      c.color as categoria_color,
      COALESCE(h.vistas, 0) as vistas,
      COALESCE(h.votos_conteo, 0) as votos_conteo,
      (SELECT COUNT(*) FROM foro_posts fp WHERE fp.hilo_id = h.id) as comentarios_count,
      h.created_at,
      h.updated_at,
      COALESCE(h.es_fijado, false) as es_fijado,
      COALESCE(h.es_cerrado, false) as es_cerrado,
      COALESCE((
        SELECT json_agg(json_build_object(
          ''id'', e.id,
          ''nombre'', e.nombre,
          ''color'', e.color
        ))
        FROM foro_etiquetas e
        INNER JOIN foro_hilos_etiquetas he ON e.id = he.etiqueta_id
        WHERE he.hilo_id = h.id
      ), ''[]''::json) as etiquetas
    FROM foro_hilos h
    LEFT JOIN perfiles p ON h.autor_id = p.id
    LEFT JOIN foro_categorias c ON h.categoria_id = c.id
    WHERE ($1::UUID IS NULL OR h.categoria_id = $1)
    ORDER BY %I %s
    LIMIT $2 OFFSET $3
  ', orden_campo, orden_direccion);

  RETURN QUERY EXECUTE query USING filtro_categoria, limite, offset_val;
END;
$$;

-- 7. Función para obtener comentarios recientes para moderación
CREATE OR REPLACE FUNCTION get_comentarios_recientes_moderacion(
  limite INT DEFAULT 50,
  offset_val INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  contenido TEXT,
  autor_id UUID,
  autor_username VARCHAR,
  autor_avatar_url TEXT,
  autor_rol VARCHAR,
  hilo_id UUID,
  hilo_titulo VARCHAR,
  hilo_slug VARCHAR,
  parent_id UUID,
  votos_conteo INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  editado BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.contenido,
    fp.autor_id,
    p.username as autor_username,
    p.avatar_url as autor_avatar_url,
    p.rol as autor_rol,
    fp.hilo_id,
    h.titulo as hilo_titulo,
    h.slug as hilo_slug,
    fp.post_padre_id as parent_id,
    0 as votos_conteo,
    fp.created_at,
    fp.updated_at,
    COALESCE(fp.editado, false) as editado
  FROM foro_posts fp
  LEFT JOIN perfiles p ON fp.autor_id = p.id
  LEFT JOIN foro_hilos h ON fp.hilo_id = h.id
  ORDER BY fp.created_at DESC
  LIMIT limite OFFSET offset_val;
END;
$$;

-- 8. Función para buscar contenido en el foro (hilos y comentarios)
CREATE OR REPLACE FUNCTION buscar_contenido_foro(
  termino_busqueda TEXT,
  limite INT DEFAULT 20
)
RETURNS TABLE(
  tipo VARCHAR,
  id UUID,
  titulo TEXT,
  contenido TEXT,
  autor_username VARCHAR,
  created_at TIMESTAMPTZ,
  url_relativa TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Buscar en hilos
  SELECT 
    'hilo'::VARCHAR as tipo,
    h.id,
    h.titulo::TEXT,
    LEFT(h.contenido, 200)::TEXT as contenido,
    p.username as autor_username,
    h.created_at,
    ('/foro/' || c.slug || '/' || h.slug)::TEXT as url_relativa
  FROM foro_hilos h
  LEFT JOIN perfiles p ON h.autor_id = p.id
  LEFT JOIN foro_categorias c ON h.categoria_id = c.id
  WHERE (
      h.titulo ILIKE '%' || termino_busqueda || '%' OR
      h.contenido ILIKE '%' || termino_busqueda || '%'
    )
  
  UNION ALL
  
  -- Buscar en comentarios
  SELECT 
    'comentario'::VARCHAR as tipo,
    fp.id,
    ('Comentario en: ' || h.titulo)::TEXT as titulo,
    LEFT(fp.contenido, 200)::TEXT as contenido,
    p.username as autor_username,
    fp.created_at,
    ('/foro/' || c.slug || '/' || h.slug || '#comentario-' || fp.id)::TEXT as url_relativa
  FROM foro_posts fp
  LEFT JOIN perfiles p ON fp.autor_id = p.id
  LEFT JOIN foro_hilos h ON fp.hilo_id = h.id
  LEFT JOIN foro_categorias c ON h.categoria_id = c.id
  WHERE fp.contenido ILIKE '%' || termino_busqueda || '%'
  
  ORDER BY created_at DESC
  LIMIT limite;
END;
$$;

-- 9. Crear índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_foro_hilos_created_at ON foro_hilos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foro_hilos_categoria_id ON foro_hilos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_foro_hilos_autor_id ON foro_hilos(autor_id);
CREATE INDEX IF NOT EXISTS idx_foro_posts_created_at ON foro_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foro_posts_hilo_id ON foro_posts(hilo_id);
CREATE INDEX IF NOT EXISTS idx_foro_posts_autor_id ON foro_posts(autor_id);

-- 10. Comentarios sobre las funciones
COMMENT ON FUNCTION get_estadisticas_generales_foro() IS 'Obtiene estadísticas generales del foro incluyendo totales y métricas por período';
COMMENT ON FUNCTION get_hilos_populares(INT, INT) IS 'Obtiene los hilos más populares basados en vistas, comentarios y votos';
COMMENT ON FUNCTION get_estadisticas_por_categoria() IS 'Obtiene estadísticas detalladas por cada categoría del foro';
COMMENT ON FUNCTION get_usuarios_mas_activos_foro(INT, INT) IS 'Obtiene los usuarios más activos en el foro basados en hilos, comentarios y votos';
COMMENT ON FUNCTION get_actividad_diaria_foro(INT) IS 'Obtiene la actividad diaria del foro para generar gráficos de tendencias';
COMMENT ON FUNCTION get_hilos_recientes_moderacion(INT, INT, UUID, VARCHAR, VARCHAR) IS 'Obtiene hilos recientes con filtros y ordenamiento para moderación';
COMMENT ON FUNCTION get_comentarios_recientes_moderacion(INT, INT) IS 'Obtiene comentarios recientes para moderación';
COMMENT ON FUNCTION buscar_contenido_foro(TEXT, INT) IS 'Busca contenido en hilos y comentarios del foro';
