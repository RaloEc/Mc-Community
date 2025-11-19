-- Corrige la función obtener_reportes_foro para usar las columnas reales de perfiles
-- (username en lugar de nombre) y mantener los campos adicionales (slug/id de hilo).

CREATE OR REPLACE FUNCTION public.obtener_reportes_foro(
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
    hilo_slug VARCHAR,
    hilo_id UUID
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
        p1.username AS reportador_nombre,
        p1.avatar_url AS reportador_avatar,
        p2.username AS asignado_nombre,
        p3.username AS resuelto_nombre,
        (CASE 
            WHEN r.tipo_contenido = 'hilo' THEN (
                SELECT fh.titulo 
                FROM public.foro_hilos fh 
                WHERE fh.id = r.contenido_id
            )
            WHEN r.tipo_contenido = 'post' THEN (
                SELECT LEFT(fp.contenido, 200) 
                FROM public.foro_posts fp 
                WHERE fp.id = r.contenido_id
            )
            ELSE NULL
        END)::TEXT AS contenido_preview,
        (CASE 
            WHEN r.tipo_contenido = 'hilo' THEN (
                SELECT fh.slug 
                FROM public.foro_hilos fh 
                WHERE fh.id = r.contenido_id
            )
            WHEN r.tipo_contenido = 'post' THEN (
                SELECT h.slug
                FROM public.foro_posts fp
                JOIN public.foro_hilos h ON fp.hilo_id = h.id
                WHERE fp.id = r.contenido_id
            )
            ELSE NULL
        END)::VARCHAR AS hilo_slug,
        CASE 
            WHEN r.tipo_contenido = 'hilo' THEN r.contenido_id
            WHEN r.tipo_contenido = 'post' THEN (
                SELECT fp.hilo_id 
                FROM public.foro_posts fp 
                WHERE fp.id = r.contenido_id
            )
            ELSE NULL
        END AS hilo_id
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
            ELSE 5
        END,
        r.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
