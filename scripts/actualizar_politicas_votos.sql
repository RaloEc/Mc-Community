-- Habilitar RLS si no está habilitado
ALTER TABLE public.foro_votos_hilos ENABLE ROW LEVEL SECURITY;

-- Crear políticas si no existen
DO $$
BEGIN
    -- Política para permitir a los usuarios ver sus propios votos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'foro_votos_hilos' 
        AND policyname = 'Permitir ver votos propios'
    ) THEN
        CREATE POLICY "Permitir ver votos propios"
        ON public.foro_votos_hilos
        FOR SELECT
        USING (auth.uid() = usuario_id);
    END IF;

    -- Política para permitir a los usuarios insertar sus propios votos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'foro_votos_hilos' 
        AND policyname = 'Permitir insertar votos propios'
    ) THEN
        CREATE POLICY "Permitir insertar votos propios"
        ON public.foro_votos_hilos
        FOR INSERT
        WITH CHECK (auth.uid() = usuario_id);
    END IF;

    -- Política para permitir a los usuarios actualizar sus propios votos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'foro_votos_hilos' 
        AND policyname = 'Permitir actualizar votos propios'
    ) THEN
        CREATE POLICY "Permitir actualizar votos propios"
        ON public.foro_votos_hilos
        FOR UPDATE
        USING (auth.uid() = usuario_id)
        WITH CHECK (auth.uid() = usuario_id);
    END IF;

    -- Política para permitir a los usuarios eliminar sus propios votos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'foro_votos_hilos' 
        AND policyname = 'Permitir eliminar votos propios'
    ) THEN
        CREATE POLICY "Permitir eliminar votos propios"
        ON public.foro_votos_hilos
        FOR DELETE
        USING (auth.uid() = usuario_id);
    END IF;
END $$;

-- Verificar que las políticas se hayan aplicado correctamente
SELECT * FROM pg_policies WHERE tablename = 'foro_votos_hilos';
