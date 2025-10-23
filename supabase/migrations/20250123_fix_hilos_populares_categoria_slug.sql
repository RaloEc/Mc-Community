-- =====================================================
-- FIX: Cambiar categoria_nombre por categoria_slug en get_hilos_populares
-- =====================================================
-- Problema: El componente HilosPopulares.tsx usa categoria_nombre en la URL
-- pero debería usar categoria_slug para que coincida con la ruta /foro/hilos/[slug]
-- 
-- Ejemplo de error:
-- ❌ /foro/delta%20force/m4a1-para-extraccion (categoria_nombre con espacios)
-- ✅ /foro/hilos/m4a1-para-extraccion (solo slug del hilo)
-- =====================================================

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
  categoria_slug TEXT,
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
    c.slug::TEXT as categoria_slug,
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

COMMENT ON FUNCTION get_hilos_populares IS 'Obtiene hilos más populares por período (solo no borrados) con categoria_slug para URLs correctas';

GRANT EXECUTE ON FUNCTION get_hilos_populares TO authenticated;
