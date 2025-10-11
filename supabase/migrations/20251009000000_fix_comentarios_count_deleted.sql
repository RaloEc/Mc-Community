-- =====================================================
-- CORRECCIÓN: Contador de comentarios debe excluir posts eliminados
-- =====================================================
-- Problema: Las funciones que cuentan comentarios incluyen posts con deleted=true
-- Solución: Actualizar todas las funciones para filtrar por deleted=false
-- =====================================================

-- Función: obtener_hilos_populares
-- Actualizar para contar solo posts no eliminados
CREATE OR REPLACE FUNCTION obtener_hilos_populares(
  p_limite INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  slug TEXT,
  contenido TEXT,
  autor_id UUID,
  autor_username TEXT,
  autor_avatar TEXT,
  autor_color TEXT,
  categoria_id UUID,
  categoria_nombre TEXT,
  vistas BIGINT,
  comentarios_count BIGINT,
  votos_conteo INT,
  created_at TIMESTAMPTZ,
  puntuacion_popularidad NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.titulo::TEXT,
    h.slug::TEXT,
    h.contenido::TEXT,
    h.autor_id,
    p.username::TEXT as autor_username,
    p.avatar_url::TEXT as autor_avatar,
    p.color::TEXT as autor_color,
    h.categoria_id,
    c.nombre::TEXT as categoria_nombre,
    COALESCE(h.vistas, 0)::BIGINT as vistas,
    (SELECT COUNT(*)::BIGINT FROM foro_posts fp WHERE fp.hilo_id = h.id AND fp.deleted = false) as comentarios_count,
    COALESCE(h.votos_conteo, 0) as votos_conteo,
    h.created_at,
    (COALESCE(h.vistas, 0) * 0.1 + 
     (SELECT COUNT(*) FROM foro_posts fp WHERE fp.hilo_id = h.id AND fp.deleted = false) * 2 + 
     COALESCE(h.votos_conteo, 0) * 5)::NUMERIC as puntuacion_popularidad
  FROM foro_hilos h
  LEFT JOIN perfiles p ON h.autor_id = p.id
  LEFT JOIN foro_categorias c ON h.categoria_id = c.id
  ORDER BY puntuacion_popularidad DESC
  LIMIT p_limite;
END;
$$;

-- Función: obtener_estadisticas_categorias
-- Actualizar para contar solo posts no eliminados
CREATE OR REPLACE FUNCTION obtener_estadisticas_categorias()
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  slug TEXT,
  descripcion TEXT,
  icono TEXT,
  color TEXT,
  categoria_padre_id UUID,
  nivel INT,
  es_activa BOOLEAN,
  total_hilos BIGINT,
  total_comentarios BIGINT,
  total_vistas BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre::TEXT,
    c.slug::TEXT,
    c.descripcion::TEXT,
    c.icono::TEXT,
    c.color::TEXT,
    c.categoria_padre_id,
    c.nivel::INT,
    c.es_activa,
    (SELECT COUNT(*)::BIGINT FROM foro_hilos h WHERE h.categoria_id = c.id) as total_hilos,
    (SELECT COUNT(*)::BIGINT FROM foro_posts fp 
     INNER JOIN foro_hilos h ON fp.hilo_id = h.id 
     WHERE h.categoria_id = c.id AND fp.deleted = false) as total_comentarios,
    (SELECT COALESCE(SUM(h.vistas), 0)::BIGINT FROM foro_hilos h WHERE h.categoria_id = c.id) as total_vistas,
    c.created_at
  FROM foro_categorias c
  ORDER BY c.nombre;
END;
$$;

-- Función: obtener_hilos_por_categoria
-- Actualizar para contar solo posts no eliminados
CREATE OR REPLACE FUNCTION obtener_hilos_por_categoria(
  p_categoria_slug TEXT,
  p_limite INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_orden TEXT DEFAULT 'recientes'
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  slug TEXT,
  contenido TEXT,
  autor_id UUID,
  autor_username TEXT,
  autor_avatar TEXT,
  autor_color TEXT,
  categoria_id UUID,
  categoria_nombre TEXT,
  categoria_slug TEXT,
  categoria_color TEXT,
  vistas BIGINT,
  votos_conteo INT,
  comentarios_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  es_fijado BOOLEAN,
  es_cerrado BOOLEAN,
  tiene_solucion BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
      h.id,
      h.titulo::TEXT,
      h.slug::TEXT,
      h.contenido::TEXT,
      h.autor_id,
      p.username::TEXT as autor_username,
      p.avatar_url::TEXT as autor_avatar,
      p.color::TEXT as autor_color,
      h.categoria_id,
      c.nombre::TEXT as categoria_nombre,
      c.slug::TEXT as categoria_slug,
      c.color::TEXT as categoria_color,
      COALESCE(h.vistas, 0)::BIGINT as vistas,
      COALESCE(h.votos_conteo, 0) as votos_conteo,
      (SELECT COUNT(*)::BIGINT FROM foro_posts fp WHERE fp.hilo_id = h.id AND fp.deleted = false) as comentarios_count,
      h.created_at,
      h.updated_at,
      COALESCE(h.es_fijado, false) as es_fijado,
      COALESCE(h.es_cerrado, false) as es_cerrado,
      EXISTS(SELECT 1 FROM foro_posts fp WHERE fp.hilo_id = h.id AND fp.es_solucion = true AND fp.deleted = false) as tiene_solucion
    FROM foro_hilos h
    LEFT JOIN perfiles p ON h.autor_id = p.id
    LEFT JOIN foro_categorias c ON h.categoria_id = c.id
    WHERE c.slug = p_categoria_slug
    ORDER BY 
      CASE 
        WHEN p_orden = 'recientes' THEN h.created_at
        WHEN p_orden = 'populares' THEN NULL
        ELSE h.created_at
      END DESC,
      CASE 
        WHEN p_orden = 'populares' THEN (COALESCE(h.vistas, 0) * 0.1 + 
          (SELECT COUNT(*) FROM foro_posts fp WHERE fp.hilo_id = h.id AND fp.deleted = false) * 2 + 
          COALESCE(h.votos_conteo, 0) * 5)
        ELSE 0
      END DESC
    LIMIT p_limite
    OFFSET p_offset;
END;
$$;

-- Comentario sobre la corrección
COMMENT ON FUNCTION obtener_hilos_populares IS 'Obtiene hilos populares excluyendo comentarios eliminados (deleted=false)';
COMMENT ON FUNCTION obtener_estadisticas_categorias IS 'Obtiene estadísticas de categorías excluyendo comentarios eliminados (deleted=false)';
COMMENT ON FUNCTION obtener_hilos_por_categoria IS 'Obtiene hilos por categoría excluyendo comentarios eliminados (deleted=false)';
