-- Crear una función para actualizar múltiples registros de news_ticker
CREATE OR REPLACE FUNCTION public.update_news_ticker(updates jsonb[])
RETURNS SETOF news_ticker
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_item jsonb;
  updated_record news_ticker%ROWTYPE;
BEGIN
  -- Eliminar registros que no están en la lista de actualizaciones
  DELETE FROM news_ticker
  WHERE id NOT IN (
    SELECT (item->>'id')::uuid
    FROM unnest(updates) AS item
    WHERE item->>'id' IS NOT NULL
  );

  -- Actualizar o insertar cada registro
  FOREACH update_item IN ARRAY updates
  LOOP
    IF update_item->>'id' IS NOT NULL THEN
      -- Actualizar registro existente
      UPDATE news_ticker
      SET 
        mensaje = COALESCE(update_item->>'mensaje', mensaje),
        activo = COALESCE((update_item->>'activo')::boolean, activo),
        orden = COALESCE((update_item->>'orden')::integer, orden),
        actualizado_en = NOW()
      WHERE id = (update_item->>'id')::uuid
      RETURNING * INTO updated_record;
    ELSE
      -- Insertar nuevo registro
      INSERT INTO news_ticker (mensaje, activo, orden)
      VALUES (
        update_item->>'mensaje',
        COALESCE((update_item->>'activo')::boolean, true),
        COALESCE((update_item->>'orden')::integer, 0)
      )
      RETURNING * INTO updated_record;
    END IF;

    RETURN NEXT updated_record;
  END LOOP;

  RETURN;
END;
$$;

-- Otorgar permisos a la función
GRANT EXECUTE ON FUNCTION public.update_news_ticker(jsonb[]) TO authenticated;

-- Crear un disparador para actualizar automáticamente actualizado_en
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_news_ticker_updated_at'
  ) THEN
    CREATE TRIGGER update_news_ticker_updated_at
    BEFORE UPDATE ON public.news_ticker
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
