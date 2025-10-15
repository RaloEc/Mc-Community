-- Migración: Habilitar Realtime para la tabla noticias
-- Esto permite que los cambios en la tabla se transmitan en tiempo real a los clientes suscritos

-- 1. Habilitar replicación para la tabla noticias
ALTER TABLE public.noticias REPLICA IDENTITY FULL;

-- 2. Habilitar publicación de cambios para Realtime
-- Nota: En Supabase, la publicación 'supabase_realtime' ya existe por defecto
-- Solo necesitamos agregar la tabla a la publicación

-- Verificar si la tabla ya está en la publicación
DO $$
BEGIN
  -- Agregar la tabla noticias a la publicación de Realtime
  -- Esto permite que INSERT, UPDATE y DELETE se transmitan en tiempo real
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'noticias'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.noticias;
    RAISE NOTICE 'Tabla noticias agregada a la publicación supabase_realtime';
  ELSE
    RAISE NOTICE 'Tabla noticias ya está en la publicación supabase_realtime';
  END IF;
END $$;

-- 3. Comentario sobre la configuración
COMMENT ON TABLE public.noticias IS 
'Tabla de noticias con Realtime habilitado. Los cambios se transmiten automáticamente a los clientes suscritos.';

-- 4. Verificar la configuración
SELECT 
  schemaname,
  tablename,
  'Realtime habilitado' as status
FROM 
  pg_publication_tables
WHERE 
  pubname = 'supabase_realtime' 
  AND tablename = 'noticias';
