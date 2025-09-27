-- Agregar columna banner_url a la tabla perfiles
ALTER TABLE perfiles
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Crear políticas para el bucket de banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket de banners
CREATE POLICY "Cualquiera puede ver los banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners')
  ON CONFLICT DO NOTHING;

CREATE POLICY "Usuarios autenticados pueden subir su propio banner"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1])
  ON CONFLICT DO NOTHING;

CREATE POLICY "Usuarios pueden actualizar su propio banner"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1])
  ON CONFLICT DO NOTHING;

CREATE POLICY "Usuarios pueden eliminar su propio banner"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1])
  ON CONFLICT DO NOTHING;

-- Función para obtener la URL del banner (utilidad para futuras consultas)
CREATE OR REPLACE FUNCTION get_banner_url(user_id uuid)
RETURNS text AS $$
  SELECT 'banners/' || user_id || '/banner'
$$ LANGUAGE sql STABLE;
