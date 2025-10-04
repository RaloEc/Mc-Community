-- =====================================================
-- Script de DEBUG - Ejecutar función por función
-- Copiar y pegar SOLO UNA función a la vez en Supabase
-- =====================================================

-- FUNCIÓN 1: get_hilos_populares
-- Copiar desde aquí ↓
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
-- Hasta aquí ↑
-- Verificar: SELECT * FROM get_hilos_populares(5, 30);

-- =====================================================

-- FUNCIÓN 2: get_estadisticas_por_categoria
-- Copiar desde aquí ↓
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
-- Hasta aquí ↑
-- Verificar: SELECT * FROM get_estadisticas_por_categoria();

-- =====================================================

-- FUNCIÓN 3: get_hilos_recientes_moderacion
-- Copiar desde aquí ↓
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
-- Hasta aquí ↑
-- Verificar: SELECT * FROM get_hilos_recientes_moderacion(5, 0, NULL, 'created_at', 'DESC');

-- =====================================================

-- FUNCIÓN 4: get_comentarios_recientes_moderacion
-- Copiar desde aquí ↓
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
-- Hasta aquí ↑
-- Verificar: SELECT * FROM get_comentarios_recientes_moderacion(5, 0);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%foro%'
ORDER BY routine_name;
