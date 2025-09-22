-- Migración: conteo de vistas para noticias y foros
-- Asegura columnas, índices y funciones RPC para incrementar vistas

-- 1) Columnas vistas en tablas principales
ALTER TABLE public.noticias
  ADD COLUMN IF NOT EXISTS vistas BIGINT NOT NULL DEFAULT 0;

-- foro_hilos podría tener "visitas" en algunos entornos; normalizamos a "vistas"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'foro_hilos' AND column_name = 'vistas'
  ) THEN
    ALTER TABLE public.foro_hilos ADD COLUMN vistas BIGINT NOT NULL DEFAULT 0;
  END IF;

  -- Si existe una columna anterior llamada "visitas", sincronizar a "vistas" una sola vez
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'foro_hilos' AND column_name = 'visitas'
  ) THEN
    UPDATE public.foro_hilos SET vistas = COALESCE(vistas, 0) + COALESCE(visitas, 0)
    WHERE COALESCE(visitas, 0) <> 0;
  END IF;
END
$$;

-- 2) Índices para ordenar por vistas
CREATE INDEX IF NOT EXISTS idx_noticias_vistas ON public.noticias (vistas);
CREATE INDEX IF NOT EXISTS idx_foro_hilos_vistas ON public.foro_hilos (vistas);

-- 3) Funciones RPC de incremento atómico
-- Nota: Usamos SECURITY DEFINER y fijamos search_path para evitar problemas de seguridad

-- 3.1) Incrementar vistas de hilo
CREATE OR REPLACE FUNCTION public.incrementar_vista_hilo(hilo_id UUID)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.foro_hilos
  SET vistas = COALESCE(vistas, 0) + 1
  WHERE id = hilo_id
  RETURNING vistas;
$$;

-- 3.2) Incrementar vistas de noticia
CREATE OR REPLACE FUNCTION public.incrementar_vista_noticia(noticia_id UUID)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.noticias
  SET vistas = COALESCE(vistas, 0) + 1
  WHERE id = noticia_id
  RETURNING vistas;
$$;

-- 4) Políticas RLS opcionales (si RLS está activa y queremos permitir el RPC a usuarios anónimos)
-- Ajusta según tus políticas actuales. Por defecto, al usar service role desde el backend no es necesario.
