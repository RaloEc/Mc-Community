-- Tabla para almacenar referencias a comentarios eliminados
CREATE TABLE IF NOT EXISTS public.comentarios_eliminados (
    id UUID PRIMARY KEY,
    eliminado_por UUID NOT NULL,
    eliminado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (eliminado_por) REFERENCES auth.users(id)
);

-- Tabla para almacenar referencias a posts del foro eliminados
CREATE TABLE IF NOT EXISTS public.foro_posts_eliminados (
    id UUID PRIMARY KEY,
    eliminado_por UUID NOT NULL,
    eliminado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (eliminado_por) REFERENCES auth.users(id)
);

-- Añadir índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_comentarios_eliminados_id ON public.comentarios_eliminados(id);
CREATE INDEX IF NOT EXISTS idx_foro_posts_eliminados_id ON public.foro_posts_eliminados(id);
