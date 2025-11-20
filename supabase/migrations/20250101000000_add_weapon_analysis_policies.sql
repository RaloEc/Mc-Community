-- Habilitar RLS en el bucket weapon-analysis-temp
UPDATE storage.buckets
SET public = false, file_size_limit = 5242880 -- 5MB
WHERE id = 'weapon-analysis-temp';

-- Política para permitir a los usuarios autenticados subir archivos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Usuarios autenticados pueden subir archivos'
  ) THEN
    CREATE POLICY "Usuarios autenticados pueden subir archivos"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'weapon-analysis-temp' AND 
        auth.role() = 'authenticated' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Política para permitir a los usuarios ver sus propios archivos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Usuarios pueden ver sus propios archivos'
  ) THEN
    CREATE POLICY "Usuarios pueden ver sus propios archivos"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'weapon-analysis-temp' AND 
        auth.role() = 'authenticated' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Política para permitir a los usuarios eliminar sus propios archivos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Usuarios pueden eliminar sus propios archivos'
  ) THEN
    CREATE POLICY "Usuarios pueden eliminar sus propios archivos"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'weapon-analysis-temp' AND 
        auth.role() = 'authenticated' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Asegurarse de que el bucket tiene las políticas correctas
UPDATE storage.buckets
SET public = false, file_size_limit = 5242880 -- 5MB
WHERE id = 'weapon-analysis-temp';
