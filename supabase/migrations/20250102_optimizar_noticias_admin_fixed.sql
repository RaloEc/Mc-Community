-- =====================================================
-- Migración: Optimización de Noticias para Admin (CORREGIDA)
-- Descripción: Crea función RPC optimizada para obtener
--              noticias recientes y más vistas con caché
-- Fecha: 2025-01-02
-- Adaptada al esquema real de la tabla noticias
-- =====================================================

-- 1. Crear índices para optimizar las consultas
-- =====================================================

-- Índice para noticias recientes ordenadas por fecha de publicación
CREATE INDEX IF NOT EXISTS idx_noticias_recientes 
ON noticias(fecha_publicacion DESC NULLS LAST);

-- Índice para noticias más vistas
CREATE INDEX IF NOT EXISTS idx_noticias_mas_vistas 
ON noticias(vistas DESC) 
WHERE vistas > 0;

-- Índice para búsqueda por autor
CREATE INDEX IF NOT EXISTS idx_noticias_autor 
ON noticias(autor_id, fecha_publicacion DESC);

-- Índice compuesto para destacadas
CREATE INDEX IF NOT EXISTS idx_noticias_destacadas 
ON noticias(destacada, fecha_publicacion DESC) 
WHERE destacada = true;

-- 2. Crear función RPC para obtener noticias recientes
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_noticias_recientes(
  limite INTEGER DEFAULT 5,
  incluir_borradores BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id UUID,
  titulo VARCHAR,
  imagen_portada VARCHAR,
  autor VARCHAR,
  fecha_publicacion TIMESTAMPTZ,
  vistas BIGINT,
  destacada BOOLEAN,
  autor_id UUID,
  juego_id UUID,
  created_at TIMESTAMPTZ,
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
    n.imagen_portada,
    n.autor,
    n.fecha_publicacion,
    COALESCE(n.vistas, 0) as vistas,
    COALESCE(n.destacada, false) as destacada,
    n.autor_id,
    n.juego_id,
    n.created_at,
    p.username AS autor_username,
    p.avatar_url AS autor_avatar
  FROM noticias n
  LEFT JOIN perfiles p ON n.autor_id = p.id
  WHERE 
    CASE 
      WHEN incluir_borradores THEN TRUE
      ELSE n.fecha_publicacion IS NOT NULL
    END
  ORDER BY 
    n.fecha_publicacion DESC NULLS LAST,
    n.created_at DESC
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
  titulo VARCHAR,
  imagen_portada VARCHAR,
  autor VARCHAR,
  fecha_publicacion TIMESTAMPTZ,
  vistas BIGINT,
  destacada BOOLEAN,
  autor_id UUID,
  juego_id UUID,
  created_at TIMESTAMPTZ,
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
    n.imagen_portada,
    n.autor,
    n.fecha_publicacion,
    COALESCE(n.vistas, 0) as vistas,
    COALESCE(n.destacada, false) as destacada,
    n.autor_id,
    n.juego_id,
    n.created_at,
    p.username AS autor_username,
    p.avatar_url AS autor_avatar,
    -- Calcular tendencia (vistas / días desde publicación)
    CASE 
      WHEN n.fecha_publicacion IS NOT NULL AND n.fecha_publicacion > fecha_limite THEN
        ROUND(n.vistas::NUMERIC / GREATEST(EXTRACT(DAY FROM (NOW() - n.fecha_publicacion)), 1), 2)
      ELSE 
        ROUND(n.vistas::NUMERIC / GREATEST(EXTRACT(DAY FROM (NOW() - n.created_at)), 1), 2)
    END AS tendencia
  FROM noticias n
  LEFT JOIN perfiles p ON n.autor_id = p.id
  WHERE 
    n.vistas > 0
    AND (
      (n.fecha_publicacion IS NOT NULL AND n.fecha_publicacion >= fecha_limite)
      OR (n.fecha_publicacion IS NULL AND n.created_at >= fecha_limite)
    )
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

DROP MATERIALIZED VIEW IF EXISTS mv_noticias_dashboard CASCADE;

CREATE MATERIALIZED VIEW mv_noticias_dashboard AS
SELECT 
  n.id,
  n.titulo,
  n.imagen_portada,
  n.autor,
  n.fecha_publicacion,
  n.vistas,
  n.destacada,
  n.autor_id,
  n.juego_id,
  n.created_at,
  p.username AS autor_username,
  p.avatar_url AS autor_avatar,
  -- Calcular score para ordenamiento
  (COALESCE(n.vistas, 0) * 0.7 + 
   EXTRACT(EPOCH FROM (NOW() - COALESCE(n.fecha_publicacion, n.created_at))) / 86400 * 0.3) AS score
FROM noticias n
LEFT JOIN perfiles p ON n.autor_id = p.id
ORDER BY COALESCE(n.fecha_publicacion, n.created_at) DESC;

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
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla el refresh concurrente, intentar refresh normal
    REFRESH MATERIALIZED VIEW mv_noticias_dashboard;
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
GRANT EXECUTE ON FUNCTION obtener_noticias_recientes TO anon;
GRANT EXECUTE ON FUNCTION obtener_noticias_mas_vistas TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_noticias_mas_vistas TO anon;
GRANT EXECUTE ON FUNCTION obtener_noticias_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_noticias_dashboard TO anon;
GRANT EXECUTE ON FUNCTION refrescar_cache_noticias_dashboard TO authenticated;

-- Permisos para la vista materializada
GRANT SELECT ON mv_noticias_dashboard TO authenticated;
GRANT SELECT ON mv_noticias_dashboard TO anon;

-- 9. Comentarios para documentación
-- =====================================================

COMMENT ON FUNCTION obtener_noticias_recientes IS 
'Obtiene las noticias más recientes con información del autor. Optimizada con índices.';

COMMENT ON FUNCTION obtener_noticias_mas_vistas IS 
'Obtiene las noticias más vistas con cálculo de tendencia. Incluye filtro por días.';

COMMENT ON FUNCTION obtener_noticias_dashboard IS 
'Función unificada que retorna noticias recientes y más vistas en una sola consulta.';

COMMENT ON MATERIALIZED VIEW mv_noticias_dashboard IS 
'Vista materializada para caché de noticias del dashboard. Refrescar periódicamente.';

-- =====================================================
-- Fin de la migración
-- =====================================================
