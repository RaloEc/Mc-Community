-- =====================================================
-- Migración: Optimización de Noticias para Admin
-- Descripción: Crea función RPC optimizada para obtener
--              noticias recientes y más vistas con caché
-- Fecha: 2025-01-02
-- =====================================================

-- 1. Crear índices para optimizar las consultas
-- =====================================================

-- Índice compuesto para noticias recientes ordenadas por fecha
CREATE INDEX IF NOT EXISTS idx_noticias_recientes 
ON noticias(creada_en DESC, estado) 
WHERE estado IN ('publicada', 'borrador', 'programada');

-- Índice para noticias más vistas
CREATE INDEX IF NOT EXISTS idx_noticias_mas_vistas 
ON noticias(vistas DESC, estado) 
WHERE estado = 'publicada' AND vistas > 0;

-- Índice para búsqueda por estado y fecha de publicación
CREATE INDEX IF NOT EXISTS idx_noticias_estado_publicacion 
ON noticias(estado, publicada_en DESC NULLS LAST);

-- Índice para búsqueda por autor
CREATE INDEX IF NOT EXISTS idx_noticias_autor 
ON noticias(autor_id, creada_en DESC);

-- 2. Crear función RPC para obtener noticias recientes
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_noticias_recientes(
  limite INTEGER DEFAULT 5,
  incluir_borradores BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  slug TEXT,
  estado TEXT,
  vistas INTEGER,
  publicada_en TIMESTAMPTZ,
  creada_en TIMESTAMPTZ,
  imagen_portada TEXT,
  categoria_id UUID,
  categoria_nombre TEXT,
  categoria_color TEXT,
  autor_id UUID,
  autor_username TEXT,
  autor_avatar TEXT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.titulo,
    n.slug,
    n.estado,
    n.vistas,
    n.publicada_en,
    n.creada_en,
    n.imagen_portada,
    n.categoria_id,
    c.nombre AS categoria_nombre,
    c.color AS categoria_color,
    n.autor_id,
    p.username AS autor_username,
    p.avatar_url AS autor_avatar
  FROM noticias n
  LEFT JOIN categorias c ON n.categoria_id = c.id
  LEFT JOIN perfiles p ON n.autor_id = p.id
  WHERE 
    CASE 
      WHEN incluir_borradores THEN n.estado IN ('publicada', 'borrador', 'programada')
      ELSE n.estado = 'publicada'
    END
  ORDER BY n.creada_en DESC
  LIMIT limite;
END;
$$;

-- 3. Crear función RPC para obtener noticias más vistas
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_noticias_mas_vistas(
  limite INTEGER DEFAULT 5,
  dias_atras INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  slug TEXT,
  vistas INTEGER,
  publicada_en TIMESTAMPTZ,
  creada_en TIMESTAMPTZ,
  imagen_portada TEXT,
  categoria_id UUID,
  categoria_nombre TEXT,
  categoria_color TEXT,
  autor_id UUID,
  autor_username TEXT,
  autor_avatar TEXT,
  tendencia NUMERIC
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  fecha_limite TIMESTAMPTZ;
BEGIN
  fecha_limite := NOW() - (dias_atras || ' days')::INTERVAL;
  
  RETURN QUERY
  SELECT 
    n.id,
    n.titulo,
    n.slug,
    n.vistas,
    n.publicada_en,
    n.creada_en,
    n.imagen_portada,
    n.categoria_id,
    c.nombre AS categoria_nombre,
    c.color AS categoria_color,
    n.autor_id,
    p.username AS autor_username,
    p.avatar_url AS autor_avatar,
    -- Calcular tendencia (vistas / días desde publicación)
    CASE 
      WHEN n.publicada_en IS NOT NULL AND n.publicada_en > fecha_limite THEN
        ROUND(n.vistas::NUMERIC / GREATEST(EXTRACT(DAY FROM (NOW() - n.publicada_en)), 1), 2)
      ELSE 0
    END AS tendencia
  FROM noticias n
  LEFT JOIN categorias c ON n.categoria_id = c.id
  LEFT JOIN perfiles p ON n.autor_id = p.id
  WHERE 
    n.estado = 'publicada'
    AND n.vistas > 0
    AND (n.publicada_en IS NULL OR n.publicada_en >= fecha_limite)
  ORDER BY n.vistas DESC, tendencia DESC
  LIMIT limite;
END;
$$;

-- 4. Crear función RPC unificada para dashboard
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_noticias_dashboard(
  limite_recientes INTEGER DEFAULT 5,
  limite_vistas INTEGER DEFAULT 5,
  incluir_borradores BOOLEAN DEFAULT TRUE,
  dias_atras INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  resultado JSON;
  recientes JSON;
  mas_vistas JSON;
BEGIN
  -- Obtener noticias recientes
  SELECT json_agg(row_to_json(t))
  INTO recientes
  FROM (
    SELECT * FROM obtener_noticias_recientes(limite_recientes, incluir_borradores)
  ) t;

  -- Obtener noticias más vistas
  SELECT json_agg(row_to_json(t))
  INTO mas_vistas
  FROM (
    SELECT * FROM obtener_noticias_mas_vistas(limite_vistas, dias_atras)
  ) t;

  -- Construir resultado unificado
  resultado := json_build_object(
    'recientes', COALESCE(recientes, '[]'::json),
    'mas_vistas', COALESCE(mas_vistas, '[]'::json),
    'timestamp', NOW()
  );

  RETURN resultado;
END;
$$;

-- 5. Crear vista materializada para caché (opcional)
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_noticias_dashboard AS
SELECT 
  n.id,
  n.titulo,
  n.slug,
  n.estado,
  n.vistas,
  n.publicada_en,
  n.creada_en,
  n.imagen_portada,
  n.categoria_id,
  c.nombre AS categoria_nombre,
  c.color AS categoria_color,
  n.autor_id,
  p.username AS autor_username,
  p.avatar_url AS autor_avatar,
  -- Calcular score para ordenamiento
  (n.vistas * 0.7 + 
   EXTRACT(EPOCH FROM (NOW() - n.creada_en)) / 86400 * 0.3) AS score
FROM noticias n
LEFT JOIN categorias c ON n.categoria_id = c.id
LEFT JOIN perfiles p ON n.autor_id = p.id
WHERE n.estado IN ('publicada', 'borrador', 'programada')
ORDER BY n.creada_en DESC;

-- Crear índice en la vista materializada
CREATE INDEX IF NOT EXISTS idx_mv_noticias_dashboard_score 
ON mv_noticias_dashboard(score DESC);

CREATE INDEX IF NOT EXISTS idx_mv_noticias_dashboard_vistas 
ON mv_noticias_dashboard(vistas DESC);

-- 6. Función para refrescar la vista materializada
-- =====================================================

CREATE OR REPLACE FUNCTION refrescar_cache_noticias_dashboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_noticias_dashboard;
END;
$$;

-- 7. Crear trigger para actualizar caché automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_refrescar_cache_noticias()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Refrescar caché de forma asíncrona
  PERFORM pg_notify('refrescar_cache_noticias', '');
  RETURN NEW;
END;
$$;

-- Crear triggers
DROP TRIGGER IF EXISTS trigger_noticias_cache ON noticias;
CREATE TRIGGER trigger_noticias_cache
AFTER INSERT OR UPDATE OR DELETE ON noticias
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refrescar_cache_noticias();

-- 8. Otorgar permisos
-- =====================================================

-- Permisos para las funciones RPC
GRANT EXECUTE ON FUNCTION obtener_noticias_recientes TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_noticias_mas_vistas TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_noticias_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION refrescar_cache_noticias_dashboard TO authenticated;

-- Permisos para la vista materializada
GRANT SELECT ON mv_noticias_dashboard TO authenticated;

-- 9. Comentarios para documentación
-- =====================================================

COMMENT ON FUNCTION obtener_noticias_recientes IS 
'Obtiene las noticias más recientes con información de categoría y autor. Optimizada con índices.';

COMMENT ON FUNCTION obtener_noticias_mas_vistas IS 
'Obtiene las noticias más vistas con cálculo de tendencia. Incluye filtro por días.';

COMMENT ON FUNCTION obtener_noticias_dashboard IS 
'Función unificada que retorna noticias recientes y más vistas en una sola consulta.';

COMMENT ON MATERIALIZED VIEW mv_noticias_dashboard IS 
'Vista materializada para caché de noticias del dashboard. Refrescar periódicamente.';

-- =====================================================
-- Fin de la migración
-- =====================================================
