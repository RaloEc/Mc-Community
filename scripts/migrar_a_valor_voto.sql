-- Verificar si existe la columna 'valor' y migrar a 'valor_voto' si es necesario
DO $$
BEGIN
    -- Verificar si existe la columna 'valor' y no existe 'valor_voto'
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'foro_votos_hilos' 
        AND column_name = 'valor'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'foro_votos_hilos' 
        AND column_name = 'valor_voto'
    ) THEN
        -- Renombrar la columna 'valor' a 'valor_voto'
        ALTER TABLE public.foro_votos_hilos RENAME COLUMN valor TO valor_voto;
        RAISE NOTICE 'Columna "valor" renombrada a "valor_voto"';
    ELSE
        RAISE NOTICE 'No se encontró la columna "valor" o ya existe "valor_voto"';
    END IF;
END $$;
