-- Función para eliminar un post y sus respuestas en cascada (soft delete)
-- Esta función marca como eliminado un post y todas sus respuestas recursivamente

CREATE OR REPLACE FUNCTION soft_delete_post_cascade(
  p_post_id UUID,
  p_deleted_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected_count INTEGER := 0;
  v_temp_count INTEGER := 0;
  v_post_exists BOOLEAN;
  v_timestamp TIMESTAMPTZ := NOW();
BEGIN
  -- Verificar si el post existe
  SELECT EXISTS(
    SELECT 1 FROM foro_posts WHERE id = p_post_id
  ) INTO v_post_exists;
  
  IF NOT v_post_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Post no encontrado',
      'affected_count', 0
    );
  END IF;
  
  -- Marcar como eliminado el post principal
  UPDATE foro_posts
  SET 
    deleted = true,
    deleted_at = v_timestamp,
    deleted_by = p_deleted_by
  WHERE id = p_post_id
    AND deleted = false;
  
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  
  -- Marcar como eliminadas todas las respuestas recursivamente
  -- Usando una CTE recursiva para encontrar todos los posts hijos
  WITH RECURSIVE respuestas_recursivas AS (
    -- Caso base: respuestas directas del post eliminado
    SELECT id, post_padre_id
    FROM foro_posts
    WHERE post_padre_id = p_post_id
      AND deleted = false
    
    UNION ALL
    
    -- Caso recursivo: respuestas de las respuestas
    SELECT fp.id, fp.post_padre_id
    FROM foro_posts fp
    INNER JOIN respuestas_recursivas rr ON fp.post_padre_id = rr.id
    WHERE fp.deleted = false
  )
  UPDATE foro_posts
  SET 
    deleted = true,
    deleted_at = v_timestamp,
    deleted_by = p_deleted_by
  WHERE id IN (SELECT id FROM respuestas_recursivas);
  
  -- Sumar las respuestas eliminadas al contador
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_affected_count := v_affected_count + v_temp_count;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Post y respuestas eliminados correctamente',
    'affected_count', v_affected_count,
    'deleted_at', v_timestamp
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'affected_count', 0
    );
END;
$$;

-- Función para restaurar un post y sus respuestas en cascada
CREATE OR REPLACE FUNCTION restore_post_cascade(
  p_post_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected_count INTEGER := 0;
  v_temp_count INTEGER := 0;
  v_post_exists BOOLEAN;
BEGIN
  -- Verificar si el post existe
  SELECT EXISTS(
    SELECT 1 FROM foro_posts WHERE id = p_post_id
  ) INTO v_post_exists;
  
  IF NOT v_post_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Post no encontrado',
      'affected_count', 0
    );
  END IF;
  
  -- Restaurar el post principal
  UPDATE foro_posts
  SET 
    deleted = false,
    deleted_at = NULL,
    deleted_by = NULL
  WHERE id = p_post_id
    AND deleted = true;
  
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  
  -- Restaurar todas las respuestas recursivamente
  WITH RECURSIVE respuestas_recursivas AS (
    -- Caso base: respuestas directas del post restaurado
    SELECT id, post_padre_id
    FROM foro_posts
    WHERE post_padre_id = p_post_id
      AND deleted = true
    
    UNION ALL
    
    -- Caso recursivo: respuestas de las respuestas
    SELECT fp.id, fp.post_padre_id
    FROM foro_posts fp
    INNER JOIN respuestas_recursivas rr ON fp.post_padre_id = rr.id
    WHERE fp.deleted = true
  )
  UPDATE foro_posts
  SET 
    deleted = false,
    deleted_at = NULL,
    deleted_by = NULL
  WHERE id IN (SELECT id FROM respuestas_recursivas);
  
  -- Sumar las respuestas restauradas al contador
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_affected_count := v_affected_count + v_temp_count;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Post y respuestas restaurados correctamente',
    'affected_count', v_affected_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'affected_count', 0
    );
END;
$$;

-- Permisos para las funciones
GRANT EXECUTE ON FUNCTION soft_delete_post_cascade(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_post_cascade(UUID, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION restore_post_cascade(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_post_cascade(UUID) TO service_role;

-- Comentarios de documentación
COMMENT ON FUNCTION soft_delete_post_cascade IS 'Elimina (soft delete) un post y todas sus respuestas recursivamente en cascada';
COMMENT ON FUNCTION restore_post_cascade IS 'Restaura un post y todas sus respuestas recursivamente en cascada';
