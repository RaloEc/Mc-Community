-- =====================================================
-- FUNCIONES FALTANTES PARA PANEL DE ADMINISTRACIÓN DEL FORO
-- =====================================================
-- Funciones: buscar_contenido_foro, get_actividad_diaria_foro, 
--            get_estadisticas_generales_foro, get_usuarios_mas_activos_foro
-- =====================================================

-- Eliminar funciones si existen
DROP FUNCTION IF EXISTS buscar_contenido_foro(TEXT, TEXT, INT, INT);
DROP FUNCTION IF EXISTS get_actividad_diaria_foro(INT);
DROP FUNCTION IF EXISTS get_estadisticas_generales_foro();
DROP FUNCTION IF EXISTS get_usuarios_mas_activos_foro(INT, INT);

-- =====================================================
-- 1. FUNCIÓN: buscar_contenido_foro
-- =====================================================
-- Busca en títulos, contenido y nombres de usuario
-- Soporta ordenamiento por fecha (ASC/DESC)
-- Compatible con paginación
-- =====================================================

CREATE OR REPLACE FUNCTION buscar_contenido_foro(
  termino_busqueda TEXT,
  orden_direccion TEXT DEFAULT 'DESC',
  limite INT DEFAULT 50,
  offset_val INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  tipo TEXT,
  titulo TEXT,
  contenido TEXT,
  slug TEXT,
  autor_id UUID,
  autor_username TEXT,
  autor_avatar_url TEXT,
  categoria_id UUID,
  categoria_nombre TEXT,
  hilo_id UUID,
  hilo_titulo TEXT,
  vistas BIGINT,
  votos_conteo INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  termino_lower TEXT;
BEGIN
  termino_lower := LOWER(termino_busqueda);
  
  RETURN QUERY
  WITH resultados AS (
    -- Buscar en hilos
    SELECT 
      h.id,
      'hilo'::TEXT as tipo,
      h.titulo::TEXT,
      h.contenido::TEXT,
      h.slug::TEXT,
      h.autor_id,
      p.username::TEXT as autor_username,
      p.avatar_url::TEXT as autor_avatar_url,
      h.categoria_id,
      c.nombre::TEXT as categoria_nombre,
      NULL::UUID as hilo_id,
      NULL::TEXT as hilo_titulo,
      COALESCE(h.vistas, 0)::BIGINT as vistas,
      COALESCE(h.votos_conteo, 0) as votos_conteo,
      h.created_at as fecha_creacion,
      h.updated_at as fecha_actualizacion
    FROM foro_hilos h
    LEFT JOIN perfiles p ON h.autor_id = p.id
    LEFT JOIN foro_categorias c ON h.categoria_id = c.id
    WHERE 
      LOWER(h.titulo) LIKE '%' || termino_lower || '%'
      OR LOWER(h.contenido) LIKE '%' || termino_lower || '%'
      OR LOWER(p.username) LIKE '%' || termino_lower || '%'
    
    UNION ALL
    
    -- Buscar en comentarios
    SELECT 
      fp.id,
      'comentario'::TEXT as tipo,
      NULL::TEXT as titulo,
      fp.contenido::TEXT,
      NULL::TEXT as slug,
      fp.autor_id,
      p.username::TEXT as autor_username,
      p.avatar_url::TEXT as autor_avatar_url,
      h.categoria_id,
      c.nombre::TEXT as categoria_nombre,
      fp.hilo_id,
      h.titulo::TEXT as hilo_titulo,
      0::BIGINT as vistas,
      0 as votos_conteo,
      fp.created_at as fecha_creacion,
      fp.updated_at as fecha_actualizacion
    FROM foro_posts fp
    LEFT JOIN perfiles p ON fp.autor_id = p.id
    LEFT JOIN foro_hilos h ON fp.hilo_id = h.id
    LEFT JOIN foro_categorias c ON h.categoria_id = c.id
    WHERE 
      LOWER(fp.contenido) LIKE '%' || termino_lower || '%'
      OR LOWER(p.username) LIKE '%' || termino_lower || '%'
  )
  SELECT 
    r.id,
    r.tipo,
    r.titulo,
    r.contenido,
    r.slug,
    r.autor_id,
    r.autor_username,
    r.autor_avatar_url,
    r.categoria_id,
    r.categoria_nombre,
    r.hilo_id,
    r.hilo_titulo,
    r.vistas,
    r.votos_conteo,
    r.fecha_creacion,
    r.fecha_actualizacion
  FROM resultados r
  ORDER BY 
    CASE WHEN orden_direccion = 'DESC' THEN r.fecha_creacion END DESC,
    CASE WHEN orden_direccion = 'ASC' THEN r.fecha_creacion END ASC
  LIMIT limite OFFSET offset_val;
END;
$$;

-- =====================================================
-- 2. FUNCIÓN: get_actividad_diaria_foro
-- =====================================================
-- Obtiene actividad diaria del foro por rangos de tiempo
-- Rangos: 7 días, 30 días, 90 días, 180 días, 365 días
-- Métricas: hilos nuevos, comentarios, usuarios activos
-- =====================================================

CREATE OR REPLACE FUNCTION get_actividad_diaria_foro(
  dias INT DEFAULT 30
)
RETURNS TABLE(
  fecha DATE,
  hilos_nuevos BIGINT,
  comentarios_nuevos BIGINT,
  usuarios_activos BIGINT,
  total_vistas BIGINT,
  total_votos BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH fechas AS (
    SELECT generate_series(
      CURRENT_DATE - (dias || ' days')::INTERVAL,
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE as fecha
  ),
  hilos_por_dia AS (
    SELECT 
      DATE(created_at) as fecha,
      COUNT(*) as total,
      COALESCE(SUM(vistas), 0) as vistas,
      COALESCE(SUM(votos_conteo), 0) as votos
    FROM foro_hilos
    WHERE created_at >= CURRENT_DATE - (dias || ' days')::INTERVAL
    GROUP BY DATE(created_at)
  ),
  comentarios_por_dia AS (
    SELECT 
      DATE(created_at) as fecha,
      COUNT(*) as total
    FROM foro_posts
    WHERE created_at >= CURRENT_DATE - (dias || ' days')::INTERVAL
    GROUP BY DATE(created_at)
  ),
  usuarios_por_dia AS (
    SELECT 
      DATE(actividad.fecha) as fecha,
      COUNT(DISTINCT actividad.usuario_id) as total
    FROM (
      SELECT created_at as fecha, autor_id as usuario_id FROM foro_hilos
      WHERE created_at >= CURRENT_DATE - (dias || ' days')::INTERVAL
      UNION ALL
      SELECT created_at as fecha, autor_id as usuario_id FROM foro_posts
      WHERE created_at >= CURRENT_DATE - (dias || ' days')::INTERVAL
    ) actividad
    GROUP BY DATE(actividad.fecha)
  )
  SELECT 
    f.fecha,
    COALESCE(h.total, 0)::BIGINT as hilos_nuevos,
    COALESCE(c.total, 0)::BIGINT as comentarios_nuevos,
    COALESCE(u.total, 0)::BIGINT as usuarios_activos,
    COALESCE(h.vistas, 0)::BIGINT as total_vistas,
    COALESCE(h.votos, 0)::BIGINT as total_votos
  FROM fechas f
  LEFT JOIN hilos_por_dia h ON f.fecha = h.fecha
  LEFT JOIN comentarios_por_dia c ON f.fecha = c.fecha
  LEFT JOIN usuarios_por_dia u ON f.fecha = u.fecha
  ORDER BY f.fecha ASC;
END;
$$;

-- =====================================================
-- 3. FUNCIÓN: get_estadisticas_generales_foro
-- =====================================================
-- Estadísticas generales del foro
-- Incluye: totales, promedios, hilos con más/menos votos
-- =====================================================

CREATE OR REPLACE FUNCTION get_estadisticas_generales_foro()
RETURNS TABLE(
  total_hilos BIGINT,
  total_comentarios BIGINT,
  total_usuarios BIGINT,
  total_vistas BIGINT,
  total_categorias BIGINT,
  promedio_comentarios_por_hilo NUMERIC,
  promedio_hilos_por_usuario NUMERIC,
  hilo_mas_votado_id UUID,
  hilo_mas_votado_titulo TEXT,
  hilo_mas_votado_votos INT,
  hilo_menos_votado_id UUID,
  hilo_menos_votado_titulo TEXT,
  hilo_menos_votado_votos INT,
  hilo_mas_visto_id UUID,
  hilo_mas_visto_titulo TEXT,
  hilo_mas_visto_vistas BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_hilos BIGINT;
  v_total_comentarios BIGINT;
  v_total_usuarios BIGINT;
  v_total_vistas BIGINT;
  v_total_categorias BIGINT;
  v_promedio_comentarios NUMERIC;
  v_promedio_hilos NUMERIC;
  v_mas_votado_id UUID;
  v_mas_votado_titulo TEXT;
  v_mas_votado_votos INT;
  v_menos_votado_id UUID;
  v_menos_votado_titulo TEXT;
  v_menos_votado_votos INT;
  v_mas_visto_id UUID;
  v_mas_visto_titulo TEXT;
  v_mas_visto_vistas BIGINT;
BEGIN
  -- Total de hilos
  SELECT COUNT(*) INTO v_total_hilos FROM foro_hilos;
  
  -- Total de comentarios
  SELECT COUNT(*) INTO v_total_comentarios FROM foro_posts;
  
  -- Total de usuarios activos (que han creado hilos o comentarios)
  SELECT COUNT(DISTINCT usuario_id) INTO v_total_usuarios
  FROM (
    SELECT autor_id as usuario_id FROM foro_hilos
    UNION
    SELECT autor_id as usuario_id FROM foro_posts
  ) usuarios;
  
  -- Total de vistas
  SELECT COALESCE(SUM(vistas), 0) INTO v_total_vistas FROM foro_hilos;
  
  -- Total de categorías activas
  SELECT COUNT(*) INTO v_total_categorias FROM foro_categorias WHERE es_activa = true;
  
  -- Promedio de comentarios por hilo
  IF v_total_hilos > 0 THEN
    v_promedio_comentarios := v_total_comentarios::NUMERIC / v_total_hilos::NUMERIC;
  ELSE
    v_promedio_comentarios := 0;
  END IF;
  
  -- Promedio de hilos por usuario
  IF v_total_usuarios > 0 THEN
    v_promedio_hilos := v_total_hilos::NUMERIC / v_total_usuarios::NUMERIC;
  ELSE
    v_promedio_hilos := 0;
  END IF;
  
  -- Hilo más votado
  SELECT id, titulo, COALESCE(votos_conteo, 0)
  INTO v_mas_votado_id, v_mas_votado_titulo, v_mas_votado_votos
  FROM foro_hilos
  ORDER BY COALESCE(votos_conteo, 0) DESC
  LIMIT 1;
  
  -- Hilo menos votado
  SELECT id, titulo, COALESCE(votos_conteo, 0)
  INTO v_menos_votado_id, v_menos_votado_titulo, v_menos_votado_votos
  FROM foro_hilos
  ORDER BY COALESCE(votos_conteo, 0) ASC
  LIMIT 1;
  
  -- Hilo más visto
  SELECT id, titulo, COALESCE(vistas, 0)
  INTO v_mas_visto_id, v_mas_visto_titulo, v_mas_visto_vistas
  FROM foro_hilos
  ORDER BY COALESCE(vistas, 0) DESC
  LIMIT 1;
  
  RETURN QUERY SELECT
    v_total_hilos,
    v_total_comentarios,
    v_total_usuarios,
    v_total_vistas,
    v_total_categorias,
    ROUND(v_promedio_comentarios, 2),
    ROUND(v_promedio_hilos, 2),
    v_mas_votado_id,
    v_mas_votado_titulo,
    v_mas_votado_votos,
    v_menos_votado_id,
    v_menos_votado_titulo,
    v_menos_votado_votos,
    v_mas_visto_id,
    v_mas_visto_titulo,
    v_mas_visto_vistas;
END;
$$;

-- =====================================================
-- 4. FUNCIÓN: get_usuarios_mas_activos_foro
-- =====================================================
-- Obtiene usuarios más activos en el último mes
-- Métricas: hilos creados, comentarios, votaciones
-- Incluye: nombre, usuario, avatar, rol, fecha de creación
-- Compatible con paginación
-- =====================================================

CREATE OR REPLACE FUNCTION get_usuarios_mas_activos_foro(
  limite INT DEFAULT 20,
  offset_val INT DEFAULT 0
)
RETURNS TABLE(
  usuario_id UUID,
  username TEXT,
  avatar_url TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  hilos_creados BIGINT,
  comentarios_creados BIGINT,
  total_votos_recibidos BIGINT,
  ultima_actividad TIMESTAMPTZ,
  es_activo BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH actividad_usuarios AS (
    SELECT 
      p.id as usuario_id,
      p.username,
      p.avatar_url,
      p.role,
      p.created_at as perfil_created_at,
      -- Hilos creados en el último mes
      (SELECT COUNT(*) 
       FROM foro_hilos h 
       WHERE h.autor_id = p.id 
       AND h.created_at >= CURRENT_DATE - INTERVAL '30 days') as hilos_creados,
      -- Comentarios creados en el último mes
      (SELECT COUNT(*) 
       FROM foro_posts fp 
       WHERE fp.autor_id = p.id 
       AND fp.created_at >= CURRENT_DATE - INTERVAL '30 days') as comentarios_creados,
      -- Total de votos recibidos en hilos
      (SELECT COALESCE(SUM(votos_conteo), 0) 
       FROM foro_hilos h 
       WHERE h.autor_id = p.id) as total_votos_recibidos,
      -- Última actividad
      GREATEST(
        (SELECT MAX(h.created_at) FROM foro_hilos h WHERE h.autor_id = p.id),
        (SELECT MAX(fp.created_at) FROM foro_posts fp WHERE fp.autor_id = p.id)
      ) as ultima_actividad
    FROM perfiles p
    WHERE EXISTS (
      SELECT 1 FROM foro_hilos h WHERE h.autor_id = p.id
      UNION
      SELECT 1 FROM foro_posts fp WHERE fp.autor_id = p.id
    )
  )
  SELECT 
    au.usuario_id,
    au.username::TEXT,
    au.avatar_url::TEXT,
    au.role::TEXT,
    au.perfil_created_at,
    au.hilos_creados::BIGINT,
    au.comentarios_creados::BIGINT,
    au.total_votos_recibidos::BIGINT,
    au.ultima_actividad,
    -- Usuario es activo si tuvo actividad en el último mes
    (au.ultima_actividad >= CURRENT_DATE - INTERVAL '30 days') as es_activo
  FROM actividad_usuarios au
  WHERE au.hilos_creados > 0 OR au.comentarios_creados > 0
  ORDER BY 
    (au.hilos_creados + au.comentarios_creados) DESC,
    au.total_votos_recibidos DESC
  LIMIT limite OFFSET offset_val;
END;
$$;

-- =====================================================
-- COMENTARIOS Y PERMISOS
-- =====================================================

COMMENT ON FUNCTION buscar_contenido_foro IS 'Busca contenido en hilos y comentarios por título, contenido o nombre de usuario';
COMMENT ON FUNCTION get_actividad_diaria_foro IS 'Obtiene métricas de actividad diaria del foro para un rango de días especificado';
COMMENT ON FUNCTION get_estadisticas_generales_foro IS 'Retorna estadísticas generales del foro incluyendo totales y promedios';
COMMENT ON FUNCTION get_usuarios_mas_activos_foro IS 'Lista usuarios más activos basado en hilos, comentarios y votos del último mes';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION buscar_contenido_foro TO authenticated;
GRANT EXECUTE ON FUNCTION get_actividad_diaria_foro TO authenticated;
GRANT EXECUTE ON FUNCTION get_estadisticas_generales_foro TO authenticated;
GRANT EXECUTE ON FUNCTION get_usuarios_mas_activos_foro TO authenticated;
