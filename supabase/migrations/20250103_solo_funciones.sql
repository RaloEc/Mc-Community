-- =====================================================
-- SOLO LAS 4 FUNCIONES FALTANTES - SIN PRUEBAS
-- =====================================================

-- Eliminar si existen
DROP FUNCTION IF EXISTS get_hilos_populares(INT, INT);
DROP FUNCTION IF EXISTS get_estadisticas_por_categoria();
DROP FUNCTION IF EXISTS get_hilos_recientes_moderacion(INT, INT, UUID, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS get_hilos_recientes_moderacion(INT, INT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_comentarios_recientes_moderacion(INT, INT);

-- 1. get_hilos_populares
CREATE FUNCTION get_hilos_populares(
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
  WHERE (periodo_dias = 0 OR h.created_at >= CURRENT_DATE - (periodo_dias || ' days')::INTERVAL)
  ORDER BY puntuacion_popularidad DESC
  LIMIT limite;
END;
$$;

-- 2. get_estadisticas_por_categoria
CREATE FUNCTION get_estadisticas_por_categoria()
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
    (SELECT COUNT(*)::BIGINT FROM foro_hilos h WHERE h.categoria_id = c.id) as total_hilos,
    (SELECT COUNT(*)::BIGINT FROM foro_posts fp 
     INNER JOIN foro_hilos h ON fp.hilo_id = h.id 
     WHERE h.categoria_id = c.id) as total_comentarios,
    (SELECT COALESCE(SUM(h.vistas), 0)::BIGINT FROM foro_hilos h WHERE h.categoria_id = c.id) as total_vistas,
    (SELECT COUNT(*)::BIGINT FROM foro_hilos h 
     WHERE h.categoria_id = c.id 
     AND h.created_at >= CURRENT_DATE - INTERVAL '7 days') as hilos_activos_semana,
    (SELECT MAX(h.created_at) FROM foro_hilos h WHERE h.categoria_id = c.id) as ultimo_hilo_fecha
  FROM foro_categorias c
  ORDER BY c.orden ASC, c.nombre ASC;
END;
$$;

-- 3. get_hilos_recientes_moderacion
CREATE FUNCTION get_hilos_recientes_moderacion(
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
    WHERE ($1::UUID IS NULL OR h.categoria_id = $1)
    ORDER BY %I %s
    LIMIT $2 OFFSET $3
  ', orden_campo, orden_direccion);

  RETURN QUERY EXECUTE query USING filtro_categoria, limite, offset_val;
END;
$$;

-- 4. get_comentarios_recientes_moderacion
CREATE FUNCTION get_comentarios_recientes_moderacion(
  limite INT DEFAULT 50,
  offset_val INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  contenido TEXT,
  autor_id UUID,
  autor_username TEXT,
  autor_avatar_url TEXT,
  autor_rol TEXT,
  hilo_id UUID,
  hilo_titulo TEXT,
  hilo_slug TEXT,
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
    fp.contenido::TEXT,
    fp.autor_id,
    p.username::TEXT as autor_username,
    p.avatar_url::TEXT as autor_avatar_url,
    p.role::TEXT as autor_rol,
    fp.hilo_id,
    h.titulo::TEXT as hilo_titulo,
    h.slug::TEXT as hilo_slug,
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
