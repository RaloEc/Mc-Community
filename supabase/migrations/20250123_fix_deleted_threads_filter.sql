-- =====================================================
-- FIX: Filtrar hilos borrados en todas las funciones RPC
-- =====================================================
-- Problema: Las funciones de estadísticas estaban incluyendo
-- hilos con deleted_at IS NOT NULL
-- Solución: Agregar filtro WHERE deleted_at IS NULL
-- =====================================================

-- 1. Actualizar get_estadisticas_generales_foro
DROP FUNCTION IF EXISTS get_estadisticas_generales_foro();

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
  -- Total de hilos (solo no borrados)
  SELECT COUNT(*) INTO v_total_hilos FROM foro_hilos WHERE deleted_at IS NULL;
  
  -- Total de comentarios (solo de hilos no borrados)
  SELECT COUNT(*) INTO v_total_comentarios 
  FROM foro_posts fp
  INNER JOIN foro_hilos h ON fp.hilo_id = h.id
  WHERE h.deleted_at IS NULL;
  
  -- Total de usuarios activos (que han creado hilos o comentarios no borrados)
  SELECT COUNT(DISTINCT usuario_id) INTO v_total_usuarios
  FROM (
    SELECT autor_id as usuario_id FROM foro_hilos WHERE deleted_at IS NULL
    UNION
    SELECT fp.autor_id as usuario_id FROM foro_posts fp
    INNER JOIN foro_hilos h ON fp.hilo_id = h.id
    WHERE h.deleted_at IS NULL
  ) usuarios;
  
  -- Total de vistas (solo de hilos no borrados)
  SELECT COALESCE(SUM(vistas), 0) INTO v_total_vistas 
  FROM foro_hilos WHERE deleted_at IS NULL;
  
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
  
  -- Hilo más votado (solo no borrados)
  SELECT id, titulo, COALESCE(votos_conteo, 0)
  INTO v_mas_votado_id, v_mas_votado_titulo, v_mas_votado_votos
  FROM foro_hilos
  WHERE deleted_at IS NULL
  ORDER BY COALESCE(votos_conteo, 0) DESC
  LIMIT 1;
  
  -- Hilo menos votado (solo no borrados)
  SELECT id, titulo, COALESCE(votos_conteo, 0)
  INTO v_menos_votado_id, v_menos_votado_titulo, v_menos_votado_votos
  FROM foro_hilos
  WHERE deleted_at IS NULL
  ORDER BY COALESCE(votos_conteo, 0) ASC
  LIMIT 1;
  
  -- Hilo más visto (solo no borrados)
  SELECT id, titulo, COALESCE(vistas, 0)
  INTO v_mas_visto_id, v_mas_visto_titulo, v_mas_visto_vistas
  FROM foro_hilos
  WHERE deleted_at IS NULL
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

-- 2. Actualizar get_hilos_populares
DROP FUNCTION IF EXISTS get_hilos_populares(INT, INT);

CREATE OR REPLACE FUNCTION get_hilos_populares(
  limite INT DEFAULT 10,
  periodo_dias INT DEFAULT 30
)
RETURNS TABLE(
  id UUID,
  titulo TEXT,
  slug TEXT,
  autor_id UUID,
  autor_username TEXT,
  autor_avatar_url TEXT,
  categoria_id UUID,
  categoria_nombre TEXT,
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
    h.titulo::TEXT,
    h.slug::TEXT,
    h.autor_id,
    p.username::TEXT as autor_username,
    p.avatar_url::TEXT as autor_avatar_url,
    h.categoria_id,
    c.nombre::TEXT as categoria_nombre,
    COALESCE(h.vistas, 0)::BIGINT as vistas,
    (SELECT COUNT(*)::BIGINT FROM foro_posts fp WHERE fp.hilo_id = h.id) as comentarios_count,
    COALESCE(h.votos_conteo, 0) as votos_conteo,
    h.created_at,
    (COALESCE(h.vistas, 0) * 0.1 + 
     (SELECT COUNT(*) FROM foro_posts fp WHERE fp.hilo_id = h.id) * 2 + 
     COALESCE(h.votos_conteo, 0) * 5)::NUMERIC as puntuacion_popularidad
  FROM foro_hilos h
  LEFT JOIN perfiles p ON h.autor_id = p.id
  LEFT JOIN foro_categorias c ON h.categoria_id = c.id
  WHERE h.deleted_at IS NULL
    AND (periodo_dias = 0 OR h.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)
  ORDER BY puntuacion_popularidad DESC
  LIMIT limite;
END;
$$;

-- 3. Actualizar get_estadisticas_por_categoria
DROP FUNCTION IF EXISTS get_estadisticas_por_categoria();

CREATE OR REPLACE FUNCTION get_estadisticas_por_categoria()
RETURNS TABLE(
  id UUID,
  nombre TEXT,
  slug TEXT,
  descripcion TEXT,
  color TEXT,
  icono TEXT,
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
    c.nombre::TEXT,
    c.slug::TEXT,
    c.descripcion::TEXT,
    c.color::TEXT,
    c.icono::TEXT,
    c.parent_id,
    c.nivel::INT,
    c.es_activa,
    (SELECT COUNT(*)::BIGINT FROM foro_hilos h WHERE h.categoria_id = c.id AND h.deleted_at IS NULL) as total_hilos,
    (SELECT COUNT(*)::BIGINT FROM foro_posts fp 
     INNER JOIN foro_hilos h ON fp.hilo_id = h.id 
     WHERE h.categoria_id = c.id AND h.deleted_at IS NULL) as total_comentarios,
    (SELECT COALESCE(SUM(h.vistas), 0)::BIGINT FROM foro_hilos h WHERE h.categoria_id = c.id AND h.deleted_at IS NULL) as total_vistas,
    (SELECT COUNT(*)::BIGINT FROM foro_hilos h 
     WHERE h.categoria_id = c.id 
     AND h.deleted_at IS NULL
     AND h.created_at >= CURRENT_DATE - INTERVAL '7 days') as hilos_activos_semana,
    (SELECT MAX(h.created_at) FROM foro_hilos h WHERE h.categoria_id = c.id AND h.deleted_at IS NULL) as ultimo_hilo_fecha
  FROM foro_categorias c
  ORDER BY c.orden ASC, c.nombre ASC;
END;
$$;

-- 4. Actualizar get_actividad_diaria_foro
DROP FUNCTION IF EXISTS get_actividad_diaria_foro(INT);

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
      AND deleted_at IS NULL
    GROUP BY DATE(created_at)
  ),
  comentarios_por_dia AS (
    SELECT 
      DATE(fp.created_at) as fecha,
      COUNT(*) as total
    FROM foro_posts fp
    INNER JOIN foro_hilos h ON fp.hilo_id = h.id
    WHERE fp.created_at >= CURRENT_DATE - (dias || ' days')::INTERVAL
      AND h.deleted_at IS NULL
    GROUP BY DATE(fp.created_at)
  ),
  usuarios_por_dia AS (
    SELECT 
      DATE(actividad.fecha) as fecha,
      COUNT(DISTINCT actividad.usuario_id) as total
    FROM (
      SELECT created_at as fecha, autor_id as usuario_id FROM foro_hilos
      WHERE created_at >= CURRENT_DATE - (dias || ' days')::INTERVAL
        AND deleted_at IS NULL
      UNION ALL
      SELECT fp.created_at as fecha, fp.autor_id as usuario_id FROM foro_posts fp
      INNER JOIN foro_hilos h ON fp.hilo_id = h.id
      WHERE fp.created_at >= CURRENT_DATE - (dias || ' days')::INTERVAL
        AND h.deleted_at IS NULL
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

-- 5. Actualizar get_usuarios_mas_activos_foro
DROP FUNCTION IF EXISTS get_usuarios_mas_activos_foro(INT, INT);

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
      -- Hilos creados en el último mes (solo no borrados)
      (SELECT COUNT(*) 
       FROM foro_hilos h 
       WHERE h.autor_id = p.id 
       AND h.created_at >= CURRENT_DATE - INTERVAL '30 days'
       AND h.deleted_at IS NULL) as hilos_creados,
      -- Comentarios creados en el último mes (solo de hilos no borrados)
      (SELECT COUNT(*) 
       FROM foro_posts fp 
       INNER JOIN foro_hilos h ON fp.hilo_id = h.id
       WHERE fp.autor_id = p.id 
       AND fp.created_at >= CURRENT_DATE - INTERVAL '30 days'
       AND h.deleted_at IS NULL) as comentarios_creados,
      -- Total de votos recibidos en hilos (solo no borrados)
      (SELECT COALESCE(SUM(votos_conteo), 0) 
       FROM foro_hilos h 
       WHERE h.autor_id = p.id
       AND h.deleted_at IS NULL) as total_votos_recibidos,
      -- Última actividad
      GREATEST(
        (SELECT MAX(h.created_at) FROM foro_hilos h WHERE h.autor_id = p.id AND h.deleted_at IS NULL),
        (SELECT MAX(fp.created_at) FROM foro_posts fp 
         INNER JOIN foro_hilos h ON fp.hilo_id = h.id
         WHERE fp.autor_id = p.id AND h.deleted_at IS NULL)
      ) as ultima_actividad
    FROM perfiles p
    WHERE EXISTS (
      SELECT 1 FROM foro_hilos h WHERE h.autor_id = p.id AND h.deleted_at IS NULL
      UNION
      SELECT 1 FROM foro_posts fp 
      INNER JOIN foro_hilos h ON fp.hilo_id = h.id
      WHERE fp.autor_id = p.id AND h.deleted_at IS NULL
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

-- 6. Actualizar get_hilos_recientes_moderacion
DROP FUNCTION IF EXISTS get_hilos_recientes_moderacion(INT, INT, UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_hilos_recientes_moderacion(
  limite INT DEFAULT 20,
  offset_val INT DEFAULT 0,
  filtro_categoria UUID DEFAULT NULL,
  orden_campo TEXT DEFAULT 'created_at',
  orden_direccion TEXT DEFAULT 'DESC'
)
RETURNS TABLE(
  id UUID,
  titulo TEXT,
  slug TEXT,
  contenido TEXT,
  autor_id UUID,
  autor_username TEXT,
  autor_avatar_url TEXT,
  autor_rol TEXT,
  categoria_id UUID,
  categoria_nombre TEXT,
  categoria_color TEXT,
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
      h.titulo::TEXT,
      h.slug::TEXT,
      h.contenido::TEXT,
      h.autor_id,
      p.username::TEXT as autor_username,
      p.avatar_url::TEXT as autor_avatar_url,
      p.role::TEXT as autor_rol,
      h.categoria_id,
      c.nombre::TEXT as categoria_nombre,
      c.color::TEXT as categoria_color,
      COALESCE(h.vistas, 0)::BIGINT as vistas,
      COALESCE(h.votos_conteo, 0) as votos_conteo,
      (SELECT COUNT(*)::BIGINT FROM foro_posts fp WHERE fp.hilo_id = h.id) as comentarios_count,
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
    WHERE h.deleted_at IS NULL
      AND ($1::UUID IS NULL OR h.categoria_id = $1)
    ORDER BY %I %s
    LIMIT $2 OFFSET $3
  ', orden_campo, orden_direccion);

  RETURN QUERY EXECUTE query USING filtro_categoria, limite, offset_val;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION get_estadisticas_generales_foro IS 'Retorna estadísticas generales del foro (solo hilos no borrados)';
COMMENT ON FUNCTION get_hilos_populares IS 'Obtiene hilos más populares por período (solo no borrados)';
COMMENT ON FUNCTION get_estadisticas_por_categoria IS 'Estadísticas por categoría (solo hilos no borrados)';
COMMENT ON FUNCTION get_actividad_diaria_foro IS 'Actividad diaria del foro (solo hilos no borrados)';
COMMENT ON FUNCTION get_usuarios_mas_activos_foro IS 'Usuarios más activos (solo hilos no borrados)';
COMMENT ON FUNCTION get_hilos_recientes_moderacion IS 'Hilos recientes para moderación (solo no borrados)';

-- Permisos
GRANT EXECUTE ON FUNCTION get_estadisticas_generales_foro TO authenticated;
GRANT EXECUTE ON FUNCTION get_hilos_populares TO authenticated;
GRANT EXECUTE ON FUNCTION get_estadisticas_por_categoria TO authenticated;
GRANT EXECUTE ON FUNCTION get_actividad_diaria_foro TO authenticated;
GRANT EXECUTE ON FUNCTION get_usuarios_mas_activos_foro TO authenticated;
GRANT EXECUTE ON FUNCTION get_hilos_recientes_moderacion TO authenticated;

-- Verificación
SELECT 'Migración completada: Filtro de hilos borrados aplicado a todas las funciones RPC' as mensaje;
