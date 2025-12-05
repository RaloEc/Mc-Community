-- Tabla para registrar qué actividades están ocultas por el usuario
CREATE TABLE IF NOT EXISTS activity_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'forum_thread', 'forum_post', 'weapon_stats', 'lol_match', 'noticia', 'comentario'
  activity_id TEXT NOT NULL, -- ID del recurso (hilo_id, post_id, weapon_stats_id, match_id, noticia_id, comentario_id)
  hidden_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_type, activity_id),
  CONSTRAINT valid_activity_type CHECK (activity_type IN ('forum_thread', 'forum_post', 'weapon_stats', 'lol_match', 'noticia', 'comentario'))
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_activity_visibility_user_id ON activity_visibility(user_id);
CREATE INDEX idx_activity_visibility_activity ON activity_visibility(activity_type, activity_id);
CREATE INDEX idx_activity_visibility_user_activity ON activity_visibility(user_id, activity_type, activity_id);

-- RLS: Los usuarios solo ven sus propias visibilidades
ALTER TABLE activity_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity visibility"
  ON activity_visibility
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity visibility"
  ON activity_visibility
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity visibility"
  ON activity_visibility
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins pueden ver todo (para auditoría si es necesario)
CREATE POLICY "Admins can view all activity visibility"
  ON activity_visibility
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );
