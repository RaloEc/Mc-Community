-- =====================================================
-- SISTEMA COMPLETO DE MODERACIÓN DEL FORO
-- =====================================================
-- Este archivo crea todas las tablas y funciones necesarias
-- para el sistema de moderación del foro
-- =====================================================

-- 1. TABLA DE REPORTES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.foro_reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_contenido VARCHAR(50) NOT NULL CHECK (tipo_contenido IN ('hilo', 'post', 'comentario')),
    contenido_id UUID NOT NULL,
    reportado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razon VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'resuelto', 'desestimado')),
    prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
    asignado_a UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resuelto_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolucion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resuelto_en TIMESTAMPTZ
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_foro_reportes_estado ON public.foro_reportes(estado);
CREATE INDEX IF NOT EXISTS idx_foro_reportes_tipo_contenido ON public.foro_reportes(tipo_contenido);
CREATE INDEX IF NOT EXISTS idx_foro_reportes_contenido_id ON public.foro_reportes(contenido_id);
CREATE INDEX IF NOT EXISTS idx_foro_reportes_reportado_por ON public.foro_reportes(reportado_por);
CREATE INDEX IF NOT EXISTS idx_foro_reportes_asignado_a ON public.foro_reportes(asignado_a);
CREATE INDEX IF NOT EXISTS idx_foro_reportes_created_at ON public.foro_reportes(created_at DESC);

COMMENT ON TABLE public.foro_reportes IS 'Reportes de contenido inapropiado en el foro';

-- =====================================================
-- 2. TABLA DE ACCIONES DE MODERACIÓN
-- =====================================================
CREATE TABLE IF NOT EXISTS public.foro_acciones_moderacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_accion VARCHAR(50) NOT NULL CHECK (tipo_accion IN (
        'eliminar_contenido', 
        'advertencia', 
        'suspension_temporal', 
        'suspension_permanente', 
        'baneo', 
        'desbaneo',
        'editar_contenido',
        'mover_hilo',
        'cerrar_hilo',
        'abrir_hilo',
        'destacar_hilo',
        'quitar_destacado'
    )),
    tipo_contenido VARCHAR(50) CHECK (tipo_contenido IN ('hilo', 'post', 'comentario', 'usuario')),
    contenido_id UUID,
    usuario_afectado UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    moderador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razon TEXT NOT NULL,
    detalles JSONB,
    notificar_usuario BOOLEAN DEFAULT true,
    reporte_id UUID REFERENCES public.foro_reportes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_foro_acciones_tipo_accion ON public.foro_acciones_moderacion(tipo_accion);
CREATE INDEX IF NOT EXISTS idx_foro_acciones_usuario_afectado ON public.foro_acciones_moderacion(usuario_afectado);
CREATE INDEX IF NOT EXISTS idx_foro_acciones_moderador ON public.foro_acciones_moderacion(moderador_id);
CREATE INDEX IF NOT EXISTS idx_foro_acciones_created_at ON public.foro_acciones_moderacion(created_at DESC);

COMMENT ON TABLE public.foro_acciones_moderacion IS 'Registro de todas las acciones de moderación realizadas';

-- =====================================================
-- 3. TABLA DE SANCIONES DE USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.foro_sanciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_sancion VARCHAR(50) NOT NULL CHECK (tipo_sancion IN (
        'advertencia', 
        'suspension_temporal', 
        'suspension_permanente', 
        'baneo'
    )),
    razon TEXT NOT NULL,
    puntos_acumulados INTEGER DEFAULT 0,
    inicio TIMESTAMPTZ DEFAULT NOW(),
    fin TIMESTAMPTZ,
    activa BOOLEAN DEFAULT true,
    moderador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    accion_id UUID REFERENCES public.foro_acciones_moderacion(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_foro_sanciones_usuario ON public.foro_sanciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_foro_sanciones_activa ON public.foro_sanciones(activa);
CREATE INDEX IF NOT EXISTS idx_foro_sanciones_tipo ON public.foro_sanciones(tipo_sancion);
CREATE INDEX IF NOT EXISTS idx_foro_sanciones_fin ON public.foro_sanciones(fin);

COMMENT ON TABLE public.foro_sanciones IS 'Sanciones aplicadas a usuarios del foro';

-- =====================================================
-- 4. TABLA DE PUNTOS DE MODERACIÓN POR USUARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.foro_puntos_moderacion (
    usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    puntos_totales INTEGER DEFAULT 0,
    advertencias INTEGER DEFAULT 0,
    suspensiones INTEGER DEFAULT 0,
    ultima_sancion TIMESTAMPTZ,
    en_lista_vigilancia BOOLEAN DEFAULT false,
    notas_moderador TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_foro_puntos_vigilancia ON public.foro_puntos_moderacion(en_lista_vigilancia) WHERE en_lista_vigilancia = true;
CREATE INDEX IF NOT EXISTS idx_foro_puntos_totales ON public.foro_puntos_moderacion(puntos_totales DESC);

COMMENT ON TABLE public.foro_puntos_moderacion IS 'Sistema de puntos y seguimiento de usuarios problemáticos';

-- =====================================================
-- 5. TABLA DE PLANTILLAS DE MENSAJES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.foro_plantillas_mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('advertencia', 'suspension', 'baneo', 'resolucion', 'otro')),
    asunto VARCHAR(200),
    contenido TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    activa BOOLEAN DEFAULT true,
    creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_foro_plantillas_tipo ON public.foro_plantillas_mensajes(tipo);
CREATE INDEX IF NOT EXISTS idx_foro_plantillas_activa ON public.foro_plantillas_mensajes(activa);

COMMENT ON TABLE public.foro_plantillas_mensajes IS 'Plantillas predefinidas para mensajes de moderación';

-- =====================================================
-- 6. TABLA DE TÉRMINOS PROHIBIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.foro_terminos_prohibidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    termino VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'prohibido' CHECK (tipo IN ('prohibido', 'sensible', 'revision_automatica')),
    accion VARCHAR(50) DEFAULT 'bloquear' CHECK (accion IN ('bloquear', 'revisar', 'advertir')),
    severidad INTEGER DEFAULT 1 CHECK (severidad BETWEEN 1 AND 10),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_foro_terminos_activo ON public.foro_terminos_prohibidos(activo);
CREATE INDEX IF NOT EXISTS idx_foro_terminos_tipo ON public.foro_terminos_prohibidos(tipo);

COMMENT ON TABLE public.foro_terminos_prohibidos IS 'Lista de términos prohibidos o sensibles para moderación automática';

-- =====================================================
-- 7. TABLA DE CONFIGURACIÓN DE MODERACIÓN
-- =====================================================
CREATE TABLE IF NOT EXISTS public.foro_config_moderacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración por defecto
INSERT INTO public.foro_config_moderacion (clave, valor, descripcion) VALUES
    ('puntos_advertencia', '5', 'Puntos que suma una advertencia'),
    ('puntos_suspension_temporal', '10', 'Puntos que suma una suspensión temporal'),
    ('puntos_suspension_permanente', '20', 'Puntos que suma una suspensión permanente'),
    ('umbral_suspension_automatica', '15', 'Puntos necesarios para suspensión automática'),
    ('umbral_baneo_automatico', '30', 'Puntos necesarios para baneo automático'),
    ('dias_suspension_temporal', '7', 'Días de duración de suspensión temporal por defecto'),
    ('moderacion_automatica_activa', 'true', 'Activar moderación automática de términos prohibidos')
ON CONFLICT (clave) DO NOTHING;

COMMENT ON TABLE public.foro_config_moderacion IS 'Configuración del sistema de moderación';

-- =====================================================
-- 8. TABLA DE NOTIFICACIONES DE MODERACIÓN
-- =====================================================
CREATE TABLE IF NOT EXISTS public.foro_notificaciones_moderacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    accion_id UUID REFERENCES public.foro_acciones_moderacion(id) ON DELETE CASCADE,
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_foro_notif_usuario ON public.foro_notificaciones_moderacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_foro_notif_leida ON public.foro_notificaciones_moderacion(leida);
CREATE INDEX IF NOT EXISTS idx_foro_notif_created_at ON public.foro_notificaciones_moderacion(created_at DESC);

COMMENT ON TABLE public.foro_notificaciones_moderacion IS 'Notificaciones enviadas a usuarios sobre acciones de moderación';

-- =====================================================
-- FUNCIONES RPC
-- =====================================================

-- Función para crear un reporte
CREATE OR REPLACE FUNCTION crear_reporte_foro(
    p_tipo_contenido VARCHAR,
    p_contenido_id UUID,
    p_razon VARCHAR,
    p_descripcion TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_reporte_id UUID;
BEGIN
    INSERT INTO public.foro_reportes (
        tipo_contenido,
        contenido_id,
        reportado_por,
        razon,
        descripcion
    ) VALUES (
        p_tipo_contenido,
        p_contenido_id,
        auth.uid(),
        p_razon,
        p_descripcion
    ) RETURNING id INTO v_reporte_id;
    
    RETURN v_reporte_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener reportes con filtros
CREATE OR REPLACE FUNCTION obtener_reportes_foro(
    p_estado VARCHAR DEFAULT NULL,
    p_tipo_contenido VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    tipo_contenido VARCHAR,
    contenido_id UUID,
    reportado_por UUID,
    razon VARCHAR,
    descripcion TEXT,
    estado VARCHAR,
    prioridad VARCHAR,
    asignado_a UUID,
    resuelto_por UUID,
    resolucion TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    resuelto_en TIMESTAMPTZ,
    reportador_nombre VARCHAR,
    reportador_avatar VARCHAR,
    asignado_nombre VARCHAR,
    resuelto_nombre VARCHAR,
    contenido_preview TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.tipo_contenido,
        r.contenido_id,
        r.reportado_por,
        r.razon,
        r.descripcion,
        r.estado,
        r.prioridad,
        r.asignado_a,
        r.resuelto_por,
        r.resolucion,
        r.created_at,
        r.updated_at,
        r.resuelto_en,
        p1.nombre AS reportador_nombre,
        p1.avatar_url AS reportador_avatar,
        p2.nombre AS asignado_nombre,
        p3.nombre AS resuelto_nombre,
        CASE 
            WHEN r.tipo_contenido = 'hilo' THEN (SELECT titulo FROM public.foro_hilos WHERE id = r.contenido_id)
            WHEN r.tipo_contenido = 'post' THEN (SELECT LEFT(contenido, 200) FROM public.foro_posts WHERE id = r.contenido_id)
            ELSE NULL
        END AS contenido_preview
    FROM public.foro_reportes r
    LEFT JOIN public.perfiles p1 ON r.reportado_por = p1.id
    LEFT JOIN public.perfiles p2 ON r.asignado_a = p2.id
    LEFT JOIN public.perfiles p3 ON r.resuelto_por = p3.id
    WHERE 
        (p_estado IS NULL OR r.estado = p_estado)
        AND (p_tipo_contenido IS NULL OR r.tipo_contenido = p_tipo_contenido)
    ORDER BY 
        CASE r.prioridad
            WHEN 'critica' THEN 1
            WHEN 'alta' THEN 2
            WHEN 'media' THEN 3
            WHEN 'baja' THEN 4
        END,
        r.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para resolver un reporte
CREATE OR REPLACE FUNCTION resolver_reporte_foro(
    p_reporte_id UUID,
    p_resolucion TEXT,
    p_accion VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.foro_reportes
    SET 
        estado = 'resuelto',
        resuelto_por = auth.uid(),
        resolucion = p_resolucion,
        resuelto_en = NOW(),
        updated_at = NOW()
    WHERE id = p_reporte_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para desestimar un reporte
CREATE OR REPLACE FUNCTION desestimar_reporte_foro(
    p_reporte_id UUID,
    p_razon TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.foro_reportes
    SET 
        estado = 'desestimado',
        resuelto_por = auth.uid(),
        resolucion = p_razon,
        resuelto_en = NOW(),
        updated_at = NOW()
    WHERE id = p_reporte_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para aplicar sanción a usuario
CREATE OR REPLACE FUNCTION aplicar_sancion_usuario(
    p_usuario_id UUID,
    p_tipo_sancion VARCHAR,
    p_razon TEXT,
    p_dias_duracion INTEGER DEFAULT NULL,
    p_puntos INTEGER DEFAULT 0,
    p_notificar BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
    v_sancion_id UUID;
    v_accion_id UUID;
    v_fin TIMESTAMPTZ;
BEGIN
    -- Calcular fecha de fin si es temporal
    IF p_tipo_sancion = 'suspension_temporal' AND p_dias_duracion IS NOT NULL THEN
        v_fin := NOW() + (p_dias_duracion || ' days')::INTERVAL;
    END IF;
    
    -- Registrar acción de moderación
    INSERT INTO public.foro_acciones_moderacion (
        tipo_accion,
        tipo_contenido,
        usuario_afectado,
        moderador_id,
        razon,
        notificar_usuario
    ) VALUES (
        p_tipo_sancion,
        'usuario',
        p_usuario_id,
        auth.uid(),
        p_razon,
        p_notificar
    ) RETURNING id INTO v_accion_id;
    
    -- Crear sanción
    INSERT INTO public.foro_sanciones (
        usuario_id,
        tipo_sancion,
        razon,
        puntos_acumulados,
        fin,
        moderador_id,
        accion_id
    ) VALUES (
        p_usuario_id,
        p_tipo_sancion,
        p_razon,
        p_puntos,
        v_fin,
        auth.uid(),
        v_accion_id
    ) RETURNING id INTO v_sancion_id;
    
    -- Actualizar puntos del usuario
    INSERT INTO public.foro_puntos_moderacion (usuario_id, puntos_totales, ultima_sancion)
    VALUES (p_usuario_id, p_puntos, NOW())
    ON CONFLICT (usuario_id) DO UPDATE
    SET 
        puntos_totales = foro_puntos_moderacion.puntos_totales + p_puntos,
        advertencias = CASE WHEN p_tipo_sancion = 'advertencia' THEN foro_puntos_moderacion.advertencias + 1 ELSE foro_puntos_moderacion.advertencias END,
        suspensiones = CASE WHEN p_tipo_sancion LIKE 'suspension%' THEN foro_puntos_moderacion.suspensiones + 1 ELSE foro_puntos_moderacion.suspensiones END,
        ultima_sancion = NOW(),
        updated_at = NOW();
    
    -- Crear notificación si se requiere
    IF p_notificar THEN
        INSERT INTO public.foro_notificaciones_moderacion (
            usuario_id,
            tipo,
            titulo,
            mensaje,
            accion_id
        ) VALUES (
            p_usuario_id,
            p_tipo_sancion,
            'Acción de moderación',
            p_razon,
            v_accion_id
        );
    END IF;
    
    RETURN v_sancion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener historial de moderación de un usuario
CREATE OR REPLACE FUNCTION obtener_historial_moderacion_usuario(
    p_usuario_id UUID
) RETURNS TABLE (
    id UUID,
    tipo_accion VARCHAR,
    razon TEXT,
    moderador_nombre VARCHAR,
    created_at TIMESTAMPTZ,
    detalles JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.tipo_accion,
        a.razon,
        p.nombre AS moderador_nombre,
        a.created_at,
        a.detalles
    FROM public.foro_acciones_moderacion a
    LEFT JOIN public.perfiles p ON a.moderador_id = p.id
    WHERE a.usuario_afectado = p_usuario_id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener sanciones activas de un usuario
CREATE OR REPLACE FUNCTION obtener_sanciones_activas_usuario(
    p_usuario_id UUID
) RETURNS TABLE (
    id UUID,
    tipo_sancion VARCHAR,
    razon TEXT,
    inicio TIMESTAMPTZ,
    fin TIMESTAMPTZ,
    puntos_acumulados INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.tipo_sancion,
        s.razon,
        s.inicio,
        s.fin,
        s.puntos_acumulados
    FROM public.foro_sanciones s
    WHERE s.usuario_id = p_usuario_id
        AND s.activa = true
        AND (s.fin IS NULL OR s.fin > NOW())
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para procesamiento masivo de reportes
CREATE OR REPLACE FUNCTION procesar_reportes_masivo(
    p_reporte_ids UUID[],
    p_accion VARCHAR,
    p_resolucion TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_reporte_id UUID;
BEGIN
    FOREACH v_reporte_id IN ARRAY p_reporte_ids
    LOOP
        IF p_accion = 'resolver' THEN
            PERFORM resolver_reporte_foro(v_reporte_id, p_resolucion);
            v_count := v_count + 1;
        ELSIF p_accion = 'desestimar' THEN
            PERFORM desestimar_reporte_foro(v_reporte_id, p_resolucion);
            v_count := v_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de moderación
CREATE OR REPLACE FUNCTION obtener_estadisticas_moderacion(
    p_fecha_inicio TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_fecha_fin TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'reportes_totales', (
            SELECT COUNT(*) FROM public.foro_reportes 
            WHERE created_at BETWEEN p_fecha_inicio AND p_fecha_fin
        ),
        'reportes_pendientes', (
            SELECT COUNT(*) FROM public.foro_reportes 
            WHERE estado = 'pendiente'
        ),
        'reportes_resueltos', (
            SELECT COUNT(*) FROM public.foro_reportes 
            WHERE estado = 'resuelto' AND resuelto_en BETWEEN p_fecha_inicio AND p_fecha_fin
        ),
        'tiempo_promedio_resolucion', (
            SELECT EXTRACT(EPOCH FROM AVG(resuelto_en - created_at))/3600 
            FROM public.foro_reportes 
            WHERE estado = 'resuelto' AND resuelto_en BETWEEN p_fecha_inicio AND p_fecha_fin
        ),
        'acciones_por_tipo', (
            SELECT json_object_agg(tipo_accion, count)
            FROM (
                SELECT tipo_accion, COUNT(*) as count
                FROM public.foro_acciones_moderacion
                WHERE created_at BETWEEN p_fecha_inicio AND p_fecha_fin
                GROUP BY tipo_accion
            ) sub
        ),
        'usuarios_sancionados', (
            SELECT COUNT(DISTINCT usuario_id) 
            FROM public.foro_sanciones 
            WHERE created_at BETWEEN p_fecha_inicio AND p_fecha_fin
        ),
        'usuarios_en_vigilancia', (
            SELECT COUNT(*) 
            FROM public.foro_puntos_moderacion 
            WHERE en_lista_vigilancia = true
        )
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario está sancionado
CREATE OR REPLACE FUNCTION verificar_sancion_usuario(
    p_usuario_id UUID
) RETURNS JSON AS $$
DECLARE
    v_sancion JSON;
BEGIN
    SELECT json_build_object(
        'sancionado', EXISTS(
            SELECT 1 FROM public.foro_sanciones
            WHERE usuario_id = p_usuario_id
                AND activa = true
                AND (fin IS NULL OR fin > NOW())
        ),
        'tipo_sancion', (
            SELECT tipo_sancion FROM public.foro_sanciones
            WHERE usuario_id = p_usuario_id
                AND activa = true
                AND (fin IS NULL OR fin > NOW())
            ORDER BY created_at DESC
            LIMIT 1
        ),
        'fin_sancion', (
            SELECT fin FROM public.foro_sanciones
            WHERE usuario_id = p_usuario_id
                AND activa = true
                AND (fin IS NULL OR fin > NOW())
            ORDER BY created_at DESC
            LIMIT 1
        ),
        'puntos_totales', (
            SELECT puntos_totales FROM public.foro_puntos_moderacion
            WHERE usuario_id = p_usuario_id
        )
    ) INTO v_sancion;
    
    RETURN v_sancion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en reportes
CREATE OR REPLACE FUNCTION actualizar_updated_at_reportes()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_reportes
    BEFORE UPDATE ON public.foro_reportes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at_reportes();

-- Trigger para desactivar sanciones expiradas
CREATE OR REPLACE FUNCTION desactivar_sanciones_expiradas()
RETURNS void AS $$
BEGIN
    UPDATE public.foro_sanciones
    SET activa = false
    WHERE activa = true
        AND fin IS NOT NULL
        AND fin < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.foro_reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foro_acciones_moderacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foro_sanciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foro_puntos_moderacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foro_plantillas_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foro_terminos_prohibidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foro_config_moderacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foro_notificaciones_moderacion ENABLE ROW LEVEL SECURITY;

-- Políticas para reportes
CREATE POLICY "Los usuarios pueden crear reportes" ON public.foro_reportes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reportado_por);

CREATE POLICY "Los usuarios pueden ver sus propios reportes" ON public.foro_reportes
    FOR SELECT TO authenticated
    USING (auth.uid() = reportado_por);

CREATE POLICY "Los admins pueden ver todos los reportes" ON public.foro_reportes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para acciones de moderación (solo admins)
CREATE POLICY "Solo admins pueden ver acciones de moderación" ON public.foro_acciones_moderacion
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Solo admins pueden crear acciones de moderación" ON public.foro_acciones_moderacion
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para sanciones
CREATE POLICY "Los usuarios pueden ver sus propias sanciones" ON public.foro_sanciones
    FOR SELECT TO authenticated
    USING (auth.uid() = usuario_id);

CREATE POLICY "Los admins pueden ver todas las sanciones" ON public.foro_sanciones
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para notificaciones
CREATE POLICY "Los usuarios pueden ver sus notificaciones" ON public.foro_notificaciones_moderacion
    FOR SELECT TO authenticated
    USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden actualizar sus notificaciones" ON public.foro_notificaciones_moderacion
    FOR UPDATE TO authenticated
    USING (auth.uid() = usuario_id);

-- Políticas para plantillas (solo admins)
CREATE POLICY "Solo admins pueden gestionar plantillas" ON public.foro_plantillas_mensajes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para términos prohibidos (solo admins)
CREATE POLICY "Solo admins pueden gestionar términos prohibidos" ON public.foro_terminos_prohibidos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para configuración (solo admins)
CREATE POLICY "Solo admins pueden gestionar configuración" ON public.foro_config_moderacion
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para puntos de moderación
CREATE POLICY "Los usuarios pueden ver sus puntos" ON public.foro_puntos_moderacion
    FOR SELECT TO authenticated
    USING (auth.uid() = usuario_id);

CREATE POLICY "Los admins pueden ver todos los puntos" ON public.foro_puntos_moderacion
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================
COMMENT ON SCHEMA public IS 'Sistema completo de moderación del foro implementado';
