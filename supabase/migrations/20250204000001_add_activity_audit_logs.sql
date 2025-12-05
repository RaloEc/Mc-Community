-- Tabla de auditoría para registrar acciones de ocultar/borrar
CREATE TABLE IF NOT EXISTS activity_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('hide', 'unhide', 'admin_delete')),
  activity_type TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_activity_audit_logs_user_id ON activity_audit_logs(user_id);
CREATE INDEX idx_activity_audit_logs_action ON activity_audit_logs(action);
CREATE INDEX idx_activity_audit_logs_created_at ON activity_audit_logs(created_at DESC);
CREATE INDEX idx_activity_audit_logs_activity ON activity_audit_logs(activity_type, activity_id);

-- RLS: Solo admins pueden ver logs
ALTER TABLE activity_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON activity_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON activity_audit_logs
  FOR INSERT
  WITH CHECK (true);
