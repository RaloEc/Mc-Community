-- =====================================================
-- PASO 1: Eliminar todas las versiones de las funciones
-- Ejecuta este script PRIMERO en el SQL Editor de Supabase
-- =====================================================

-- Eliminar todas las versiones de buscar_contenido_foro
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname = 'buscar_contenido_foro'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.proname || '(' || r.args || ') CASCADE';
    END LOOP;
END $$;

-- Eliminar otras funciones
DROP FUNCTION IF EXISTS get_hilos_recientes_moderacion(INT, INT, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_comentarios_recientes_moderacion(INT, INT) CASCADE;

-- Verificar que se eliminaron
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
  );
