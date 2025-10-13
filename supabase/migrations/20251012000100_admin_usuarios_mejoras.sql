-- =====================================================
-- MIGRACIÓN: Mejoras para Admin de Usuarios
-- Descripción: Agrega tablas para auditoría, suspensiones,
--              advertencias y estadísticas de usuarios
-- =====================================================

-- 1. Tabla de logs de auditoría para acciones administrativas
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usuario_afectado_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL, -- 'crear_usuario', 'editar_usuario', 'eliminar_usuario', 'cambiar_rol', 'activar', 'desactivar', 'suspender', 'advertir'
  detalles JSONB DEFAULT '{}', -- Información adicional sobre la acción
  ip_address VARCHAR(45), -- IP del admin que realizó la acción
  user_agent TEXT, -- User agent del navegador
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_usuario_afectado_id ON admin_logs(usuario_afectado_id);
CREATE INDEX idx_admin_logs_accion ON admin_logs(accion);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- 2. Tabla de suspensiones de usuarios
CREATE TABLE IF NOT EXISTS usuario_suspensiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('suspension_temporal', 'suspension_permanente', 'baneo')),
  razon TEXT NOT NULL,
  inicio TIMESTAMPTZ DEFAULT NOW(),
  fin TIMESTAMPTZ, -- NULL para suspensiones permanentes
  activa BOOLEAN DEFAULT TRUE,
  moderador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notas_internas TEXT, -- Notas privadas para moderadores
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_usuario_suspensiones_usuario_id ON usuario_suspensiones(usuario_id);
CREATE INDEX idx_usuario_suspensiones_activa ON usuario_suspensiones(activa);
CREATE INDEX idx_usuario_suspensiones_fin ON usuario_suspensiones(fin);

-- 3. Tabla de advertencias a usuarios
CREATE TABLE IF NOT EXISTS usuario_advertencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razon TEXT NOT NULL,
  severidad INTEGER DEFAULT 1 CHECK (severidad >= 1 AND severidad <= 3), -- 1: leve, 2: moderada, 3: grave
  moderador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_usuario_advertencias_usuario_id ON usuario_advertencias(usuario_id);
CREATE INDEX idx_usuario_advertencias_created_at ON usuario_advertencias(created_at DESC);

-- 4. Tabla de estadísticas de actividad de usuarios (caché)
CREATE TABLE IF NOT EXISTS usuario_estadisticas (
  usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_hilos INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_noticias INTEGER DEFAULT 0,
  total_comentarios INTEGER DEFAULT 0,
  total_votos_dados INTEGER DEFAULT 0,
  total_votos_recibidos INTEGER DEFAULT 0,
  total_reportes_realizados INTEGER DEFAULT 0,
  total_reportes_recibidos INTEGER DEFAULT 0,
  puntuacion_reputacion INTEGER DEFAULT 0,
  ultima_actividad TIMESTAMPTZ,
  dias_activo INTEGER DEFAULT 0,
  racha_dias_consecutivos INTEGER DEFAULT 0,
  ultima_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_usuario_estadisticas_ultima_actividad ON usuario_estadisticas(ultima_actividad DESC);
CREATE INDEX idx_usuario_estadisticas_puntuacion ON usuario_estadisticas(puntuacion_reputacion DESC);

-- 5. Agregar campos adicionales a la tabla perfiles si no existen
DO $$ 
BEGIN
  -- Campo para indicar si el email está verificado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'perfiles' AND column_name = 'email_verificado') THEN
    ALTER TABLE perfiles ADD COLUMN email_verificado BOOLEAN DEFAULT FALSE;
  END IF;

  -- Campo para racha de días consecutivos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'perfiles' AND column_name = 'racha_dias') THEN
    ALTER TABLE perfiles ADD COLUMN racha_dias INTEGER DEFAULT 0;
  END IF;

  -- Campo para badges/logros
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'perfiles' AND column_name = 'badges') THEN
    ALTER TABLE perfiles ADD COLUMN badges JSONB DEFAULT '[]';
  END IF;

  -- Campo para notas de moderador
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'perfiles' AND column_name = 'notas_moderador') THEN
    ALTER TABLE perfiles ADD COLUMN notas_moderador TEXT;
  END IF;

  -- Campo para IP de registro
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'perfiles' AND column_name = 'ip_registro') THEN
    ALTER TABLE perfiles ADD COLUMN ip_registro VARCHAR(45);
  END IF;
END $$;

-- 6. Función para verificar si un usuario está suspendido
CREATE OR REPLACE FUNCTION verificar_suspension_usuario(p_usuario_id UUID)
RETURNS TABLE (
  esta_suspendido BOOLEAN,
  tipo_suspension VARCHAR,
  razon TEXT,
  fecha_fin TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as esta_suspendido,
    us.tipo::VARCHAR,
    us.razon,
    us.fin as fecha_fin
  FROM usuario_suspensiones us
  WHERE us.usuario_id = p_usuario_id
    AND us.activa = TRUE
    AND (us.fin IS NULL OR us.fin > NOW())
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- Si no hay resultados, el usuario no está suspendido
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::TEXT, NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para obtener estadísticas completas de un usuario
CREATE OR REPLACE FUNCTION obtener_estadisticas_usuario(p_usuario_id UUID)
RETURNS TABLE (
  total_hilos BIGINT,
  total_posts BIGINT,
  total_noticias BIGINT,
  total_comentarios BIGINT,
  total_votos_dados BIGINT,
  total_votos_recibidos BIGINT,
  total_advertencias BIGINT,
  total_suspensiones BIGINT,
  ultima_actividad TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*) FROM foro_hilos WHERE autor_id = p_usuario_id AND deleted = FALSE), 0)::BIGINT as total_hilos,
    COALESCE((SELECT COUNT(*) FROM foro_posts WHERE autor_id = p_usuario_id AND deleted = FALSE), 0)::BIGINT as total_posts,
    COALESCE((SELECT COUNT(*) FROM noticias WHERE autor_id = p_usuario_id), 0)::BIGINT as total_noticias,
    COALESCE((SELECT COUNT(*) FROM comentarios WHERE usuario_id = p_usuario_id AND deleted = FALSE), 0)::BIGINT as total_comentarios,
    COALESCE((SELECT COUNT(*) FROM foro_votos_hilos WHERE usuario_id = p_usuario_id), 0)::BIGINT as total_votos_dados,
    COALESCE((
      SELECT COUNT(*) 
      FROM foro_votos_hilos fvh
      JOIN foro_hilos fh ON fvh.hilo_id = fh.id
      WHERE fh.autor_id = p_usuario_id
    ), 0)::BIGINT as total_votos_recibidos,
    COALESCE((SELECT COUNT(*) FROM usuario_advertencias WHERE usuario_id = p_usuario_id), 0)::BIGINT as total_advertencias,
    COALESCE((SELECT COUNT(*) FROM usuario_suspensiones WHERE usuario_id = p_usuario_id), 0)::BIGINT as total_suspensiones,
    GREATEST(
      (SELECT MAX(created_at) FROM foro_hilos WHERE autor_id = p_usuario_id),
      (SELECT MAX(created_at) FROM foro_posts WHERE autor_id = p_usuario_id),
      (SELECT MAX(created_at) FROM comentarios WHERE usuario_id = p_usuario_id)
    ) as ultima_actividad;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para actualizar estadísticas de usuario (caché)
CREATE OR REPLACE FUNCTION actualizar_estadisticas_usuario(p_usuario_id UUID)
RETURNS VOID AS $$
DECLARE
  v_stats RECORD;
BEGIN
  -- Obtener estadísticas
  SELECT * INTO v_stats FROM obtener_estadisticas_usuario(p_usuario_id);
  
  -- Insertar o actualizar en la tabla de caché
  INSERT INTO usuario_estadisticas (
    usuario_id,
    total_hilos,
    total_posts,
    total_noticias,
    total_comentarios,
    total_votos_dados,
    total_votos_recibidos,
    ultima_actividad,
    ultima_actualizacion
  ) VALUES (
    p_usuario_id,
    v_stats.total_hilos,
    v_stats.total_posts,
    v_stats.total_noticias,
    v_stats.total_comentarios,
    v_stats.total_votos_dados,
    v_stats.total_votos_recibidos,
    v_stats.ultima_actividad,
    NOW()
  )
  ON CONFLICT (usuario_id) DO UPDATE SET
    total_hilos = EXCLUDED.total_hilos,
    total_posts = EXCLUDED.total_posts,
    total_noticias = EXCLUDED.total_noticias,
    total_comentarios = EXCLUDED.total_comentarios,
    total_votos_dados = EXCLUDED.total_votos_dados,
    total_votos_recibidos = EXCLUDED.total_votos_recibidos,
    ultima_actividad = EXCLUDED.ultima_actividad,
    ultima_actualizacion = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Función para obtener usuarios con filtros avanzados
CREATE OR REPLACE FUNCTION obtener_usuarios_admin(
  p_busqueda TEXT DEFAULT NULL,
  p_rol VARCHAR DEFAULT NULL,
  p_activo BOOLEAN DEFAULT NULL,
  p_fecha_desde TIMESTAMPTZ DEFAULT NULL,
  p_fecha_hasta TIMESTAMPTZ DEFAULT NULL,
  p_inactivo_dias INTEGER DEFAULT NULL,
  p_email_verificado BOOLEAN DEFAULT NULL,
  p_orden_campo VARCHAR DEFAULT 'created_at',
  p_orden_direccion VARCHAR DEFAULT 'DESC',
  p_limite INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  avatar_url VARCHAR,
  role VARCHAR,
  activo BOOLEAN,
  email_verificado BOOLEAN,
  created_at TIMESTAMPTZ,
  fecha_ultimo_acceso TIMESTAMPTZ,
  total_registros BIGINT
) AS $$
DECLARE
  v_query TEXT;
  v_count_query TEXT;
  v_total BIGINT;
BEGIN
  -- Construir query dinámicamente
  v_query := 'SELECT p.id, p.username, p.avatar_url, p.role, p.activo, p.email_verificado, p.created_at, p.fecha_ultimo_acceso FROM perfiles p WHERE 1=1';
  
  -- Aplicar filtros
  IF p_busqueda IS NOT NULL THEN
    v_query := v_query || ' AND (p.username ILIKE ''%' || p_busqueda || '%'' OR p.bio ILIKE ''%' || p_busqueda || '%'')';
  END IF;
  
  IF p_rol IS NOT NULL THEN
    v_query := v_query || ' AND p.role = ''' || p_rol || '''';
  END IF;
  
  IF p_activo IS NOT NULL THEN
    v_query := v_query || ' AND p.activo = ' || p_activo;
  END IF;
  
  IF p_fecha_desde IS NOT NULL THEN
    v_query := v_query || ' AND p.created_at >= ''' || p_fecha_desde || '''';
  END IF;
  
  IF p_fecha_hasta IS NOT NULL THEN
    v_query := v_query || ' AND p.created_at <= ''' || p_fecha_hasta || '''';
  END IF;
  
  IF p_inactivo_dias IS NOT NULL THEN
    v_query := v_query || ' AND (p.fecha_ultimo_acceso IS NULL OR p.fecha_ultimo_acceso < NOW() - INTERVAL ''' || p_inactivo_dias || ' days'')';
  END IF;
  
  IF p_email_verificado IS NOT NULL THEN
    v_query := v_query || ' AND p.email_verificado = ' || p_email_verificado;
  END IF;
  
  -- Contar total de registros
  v_count_query := 'SELECT COUNT(*) FROM (' || v_query || ') as subquery';
  EXECUTE v_count_query INTO v_total;
  
  -- Aplicar ordenamiento
  v_query := v_query || ' ORDER BY p.' || p_orden_campo || ' ' || p_orden_direccion;
  
  -- Aplicar paginación
  v_query := v_query || ' LIMIT ' || p_limite || ' OFFSET ' || p_offset;
  
  -- Ejecutar y retornar
  RETURN QUERY EXECUTE v_query || ', ' || v_total || '::BIGINT as total_registros';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Función para registrar acción administrativa
CREATE OR REPLACE FUNCTION registrar_accion_admin(
  p_admin_id UUID,
  p_usuario_afectado_id UUID,
  p_accion VARCHAR,
  p_detalles JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_logs (admin_id, usuario_afectado_id, accion, detalles)
  VALUES (p_admin_id, p_usuario_afectado_id, p_accion, p_detalles)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Función para desactivar suspensiones expiradas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION desactivar_suspensiones_expiradas()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE usuario_suspensiones
  SET activa = FALSE,
      updated_at = NOW()
  WHERE activa = TRUE
    AND fin IS NOT NULL
    AND fin < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Habilitar RLS en las nuevas tablas
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_suspensiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_advertencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_estadisticas ENABLE ROW LEVEL SECURITY;

-- 13. Políticas RLS para admin_logs (solo admins pueden ver)
CREATE POLICY "Admins pueden ver logs" ON admin_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role = 'admin'
    )
  );

CREATE POLICY "Admins pueden insertar logs" ON admin_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role IN ('admin', 'moderator')
    )
  );

-- 14. Políticas RLS para suspensiones (admins y moderadores)
CREATE POLICY "Admins y mods pueden ver suspensiones" ON usuario_suspensiones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins y mods pueden crear suspensiones" ON usuario_suspensiones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins y mods pueden actualizar suspensiones" ON usuario_suspensiones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role IN ('admin', 'moderator')
    )
  );

-- 15. Políticas RLS para advertencias
CREATE POLICY "Admins y mods pueden ver advertencias" ON usuario_advertencias
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role IN ('admin', 'moderator')
    )
    OR usuario_id = auth.uid() -- Los usuarios pueden ver sus propias advertencias
  );

CREATE POLICY "Admins y mods pueden crear advertencias" ON usuario_advertencias
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.role IN ('admin', 'moderator')
    )
  );

-- 16. Políticas RLS para estadísticas (todos pueden ver)
CREATE POLICY "Todos pueden ver estadísticas" ON usuario_estadisticas
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Sistema puede actualizar estadísticas" ON usuario_estadisticas
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- 17. Comentarios en las tablas
COMMENT ON TABLE admin_logs IS 'Registro de auditoría de todas las acciones administrativas';
COMMENT ON TABLE usuario_suspensiones IS 'Registro de suspensiones y baneos de usuarios';
COMMENT ON TABLE usuario_advertencias IS 'Registro de advertencias dadas a usuarios';
COMMENT ON TABLE usuario_estadisticas IS 'Caché de estadísticas de actividad de usuarios';

COMMENT ON FUNCTION verificar_suspension_usuario IS 'Verifica si un usuario está actualmente suspendido';
COMMENT ON FUNCTION obtener_estadisticas_usuario IS 'Obtiene estadísticas completas de actividad de un usuario';
COMMENT ON FUNCTION actualizar_estadisticas_usuario IS 'Actualiza el caché de estadísticas de un usuario';
COMMENT ON FUNCTION registrar_accion_admin IS 'Registra una acción administrativa en los logs';
COMMENT ON FUNCTION desactivar_suspensiones_expiradas IS 'Desactiva suspensiones que han expirado';
