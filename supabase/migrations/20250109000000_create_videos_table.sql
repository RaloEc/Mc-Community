-- Crear tabla de seguimiento de videos
CREATE TABLE "public"."videos" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "status" TEXT NOT NULL DEFAULT 'uploading', -- 'uploading', 'processing', 'completed', 'failed'
  "original_path" TEXT, -- Ruta en 'video-uploads'
  "public_url" TEXT, -- URL final en 'videos'
  "error_message" TEXT, -- Mensaje de error si falla
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para búsquedas por usuario
CREATE INDEX idx_videos_user_id ON "public"."videos"(user_id);

-- Crear índice para búsquedas por estado
CREATE INDEX idx_videos_status ON "public"."videos"(status);

-- Habilitar RLS
ALTER TABLE "public"."videos" ENABLE ROW LEVEL SECURITY;

-- Habilitar Realtime con REPLICA IDENTITY FULL
ALTER TABLE "public"."videos" REPLICA IDENTITY FULL;

-- Política: Usuarios autenticados pueden insertar sus propios videos
CREATE POLICY "Allow authenticated insert"
ON "public"."videos" FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios pueden ver sus propios videos (sin importar estado)
CREATE POLICY "Allow individual read"
ON "public"."videos" FOR SELECT
TO authenticated USING (auth.uid() = user_id);

-- Política: Todos pueden ver videos completados
CREATE POLICY "Allow public read on completed"
ON "public"."videos" FOR SELECT
USING (status = 'completed');

-- Política: Usuarios pueden actualizar sus propios videos (solo admin/service role puede hacer esto)
CREATE POLICY "Allow service role update"
ON "public"."videos" FOR UPDATE
TO service_role USING (true) WITH CHECK (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER videos_updated_at_trigger
BEFORE UPDATE ON "public"."videos"
FOR EACH ROW
EXECUTE FUNCTION update_videos_updated_at();
