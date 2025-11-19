-- =====================================================
-- SISTEMA DE REPORTES PARA NOTICIAS
-- =====================================================
-- Este archivo crea las tablas y funciones necesarias
-- para reportar noticias y comentarios de noticias
-- =====================================================

-- 1. TABLA DE REPORTES DE NOTICIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.noticias_reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_contenido VARCHAR(50) NOT NULL CHECK (tipo_contenido IN ('noticia', 'comentario')),
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
CREATE INDEX IF NOT EXISTS idx_noticias_reportes_estado ON public.noticias_reportes(estado);
CREATE INDEX IF NOT EXISTS idx_noticias_reportes_tipo_contenido ON public.noticias_reportes(tipo_contenido);
CREATE INDEX IF NOT EXISTS idx_noticias_reportes_contenido_id ON public.noticias_reportes(contenido_id);
CREATE INDEX IF NOT EXISTS idx_noticias_reportes_reportado_por ON public.noticias_reportes(reportado_por);
CREATE INDEX IF NOT EXISTS idx_noticias_reportes_asignado_a ON public.noticias_reportes(asignado_a);
CREATE INDEX IF NOT EXISTS idx_noticias_reportes_created_at ON public.noticias_reportes(created_at DESC);

COMMENT ON TABLE public.noticias_reportes IS 'Reportes de contenido inapropiado en noticias y comentarios';

-- =====================================================
-- FUNCIONES RPC
-- =====================================================

-- Función para crear un reporte de noticia
CREATE OR REPLACE FUNCTION crear_reporte_noticia(
    p_tipo_contenido VARCHAR,
    p_contenido_id UUID,
    p_razon VARCHAR,
    p_descripcion TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_reporte_id UUID;
BEGIN
    INSERT INTO public.noticias_reportes (
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

-- Función para obtener reportes de noticias con filtros
CREATE OR REPLACE FUNCTION obtener_reportes_noticias(
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
    contenido_preview TEXT,
    noticia_id UUID,
    noticia_titulo VARCHAR
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
            WHEN r.tipo_contenido = 'noticia' THEN (SELECT LEFT(titulo, 200) FROM public.noticias WHERE id = r.contenido_id)
            WHEN r.tipo_contenido = 'comentario' THEN (SELECT LEFT(texto, 200) FROM public.noticias_comentarios WHERE id = r.contenido_id)
            ELSE NULL
        END AS contenido_preview,
        CASE 
            WHEN r.tipo_contenido = 'noticia' THEN r.contenido_id
            WHEN r.tipo_contenido = 'comentario' THEN (SELECT noticia_id FROM public.noticias_comentarios WHERE id = r.contenido_id)
            ELSE NULL
        END AS noticia_id,
        CASE 
            WHEN r.tipo_contenido = 'noticia' THEN (SELECT titulo FROM public.noticias WHERE id = r.contenido_id)
            WHEN r.tipo_contenido = 'comentario' THEN (SELECT n.titulo FROM public.noticias n INNER JOIN public.noticias_comentarios nc ON n.id = nc.noticia_id WHERE nc.id = r.contenido_id)
            ELSE NULL
        END AS noticia_titulo
    FROM public.noticias_reportes r
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

-- Función para resolver un reporte de noticia
CREATE OR REPLACE FUNCTION resolver_reporte_noticia(
    p_reporte_id UUID,
    p_resolucion TEXT,
    p_accion VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.noticias_reportes
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

-- Función para desestimar un reporte de noticia
CREATE OR REPLACE FUNCTION desestimar_reporte_noticia(
    p_reporte_id UUID,
    p_razon TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.noticias_reportes
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

-- Función para procesamiento masivo de reportes de noticias
CREATE OR REPLACE FUNCTION procesar_reportes_noticias_masivo(
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
            PERFORM resolver_reporte_noticia(v_reporte_id, p_resolucion);
            v_count := v_count + 1;
        ELSIF p_accion = 'desestimar' THEN
            PERFORM desestimar_reporte_noticia(v_reporte_id, p_resolucion);
            v_count := v_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en reportes de noticias
CREATE OR REPLACE FUNCTION actualizar_updated_at_noticias_reportes()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_noticias_reportes
    BEFORE UPDATE ON public.noticias_reportes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at_noticias_reportes();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.noticias_reportes ENABLE ROW LEVEL SECURITY;

-- Políticas para reportes de noticias
CREATE POLICY "Los usuarios pueden crear reportes de noticias" ON public.noticias_reportes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reportado_por);

CREATE POLICY "Los usuarios pueden ver sus propios reportes de noticias" ON public.noticias_reportes
    FOR SELECT TO authenticated
    USING (auth.uid() = reportado_por);

CREATE POLICY "Los admins pueden ver todos los reportes de noticias" ON public.noticias_reportes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
