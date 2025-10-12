-- =====================================================
-- PASO 4: Corregir función de comentarios
-- Esta función elimina la referencia a votos_conteo que no existe en foro_posts
-- =====================================================

-- Eliminar la función anterior
DROP FUNCTION IF EXISTS get_comentarios_recientes_moderacion(INT, INT);

-- Recrear la función sin votos_conteo
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

-- Verificar que la función se creó correctamente
SELECT 
  routine_name,
  routine_type,
  specific_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_comentarios_recientes_moderacion';
