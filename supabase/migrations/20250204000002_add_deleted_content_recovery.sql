-- Tabla para almacenar snapshots de contenido borrado (para recuperación de admin)
CREATE TABLE IF NOT EXISTS deleted_content_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  original_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_snapshot JSONB NOT NULL,
  deleted_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recovery_reason TEXT,
  is_recovered BOOLEAN DEFAULT FALSE,
  recovered_at TIMESTAMP WITH TIME ZONE,
  recovered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_deleted_content_snapshots_activity ON deleted_content_snapshots(activity_type, activity_id);
CREATE INDEX idx_deleted_content_snapshots_deleted_by ON deleted_content_snapshots(deleted_by_user_id);
CREATE INDEX idx_deleted_content_snapshots_deleted_at ON deleted_content_snapshots(deleted_at DESC);
CREATE INDEX idx_deleted_content_snapshots_is_recovered ON deleted_content_snapshots(is_recovered);

-- RLS: Solo admins pueden ver snapshots de contenido borrado
ALTER TABLE deleted_content_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all deleted content snapshots"
  ON deleted_content_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert deleted content snapshots"
  ON deleted_content_snapshots
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update deleted content snapshots"
  ON deleted_content_snapshots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );
