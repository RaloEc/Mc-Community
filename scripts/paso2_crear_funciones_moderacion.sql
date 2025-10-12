-- =====================================================
-- PASO 2: Crear las funciones de moderación
-- Ejecuta este script DESPUÉS del paso 1
-- =====================================================

-- 1. get_hilos_recientes_moderacion
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
      (SELECT COUNT(*)::BIGINT FROM foro_posts fp WHERE fp.hilo_id = h.id AND fp.deleted_at IS NULL) as comentarios_count,
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

-- 2. get_comentarios_recientes_moderacion
CREATE OR REPLACE FUNCTION get_comentarios_recientes_moderacion(
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
    fp.parent_id,
    COALESCE(fp.votos_conteo, 0) as votos_conteo,
    fp.created_at,
    fp.updated_at,
    (fp.updated_at > fp.created_at + INTERVAL '1 minute') as editado
  FROM foro_posts fp
  LEFT JOIN perfiles p ON fp.autor_id = p.id
  LEFT JOIN foro_hilos h ON fp.hilo_id = h.id
  WHERE fp.deleted_at IS NULL
  ORDER BY fp.created_at DESC
  LIMIT limite OFFSET offset_val;
END;
$$;

-- 3. buscar_contenido_foro
CREATE OR REPLACE FUNCTION buscar_contenido_foro(
  termino_busqueda TEXT,
  limite INT DEFAULT 20
)
RETURNS TABLE(
  tipo TEXT,
  id UUID,
  titulo TEXT,
  contenido TEXT,
  autor_username TEXT,
  created_at TIMESTAMPTZ,
  url_relativa TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'hilo'::TEXT as tipo,
    h.id,
    h.titulo::TEXT,
    h.contenido::TEXT,
    p.username::TEXT as autor_username,
    h.created_at,
    ('/foro/' || c.slug || '/' || h.slug)::TEXT as url_relativa
  FROM foro_hilos h
  LEFT JOIN perfiles p ON h.autor_id = p.id
  LEFT JOIN foro_categorias c ON h.categoria_id = c.id
  WHERE h.deleted_at IS NULL
    AND (
      h.titulo ILIKE '%' || termino_busqueda || '%' OR
      h.contenido ILIKE '%' || termino_busqueda || '%'
    )
  
  UNION ALL
  
  SELECT 
    'comentario'::TEXT as tipo,
    fp.id,
    h.titulo::TEXT,
    fp.contenido::TEXT,
    p.username::TEXT as autor_username,
    fp.created_at,
    ('/foro/' || c.slug || '/' || h.slug || '#comentario-' || fp.id)::TEXT as url_relativa
  FROM foro_posts fp
  LEFT JOIN perfiles p ON fp.autor_id = p.id
  LEFT JOIN foro_hilos h ON fp.hilo_id = h.id
  LEFT JOIN foro_categorias c ON h.categoria_id = c.id
  WHERE fp.deleted_at IS NULL
    AND fp.contenido ILIKE '%' || termino_busqueda || '%'
  
  ORDER BY created_at DESC
  LIMIT limite;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_hilos_recientes_moderacion TO authenticated;
GRANT EXECUTE ON FUNCTION get_comentarios_recientes_moderacion TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_contenido_foro TO authenticated;

-- Verificar que las funciones se crearon correctamente
SELECT 
  routine_name,
  routine_type,
  specific_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_hilos_recientes_moderacion',
    'get_comentarios_recientes_moderacion',
    'buscar_contenido_foro'
  )
ORDER BY routine_name;
