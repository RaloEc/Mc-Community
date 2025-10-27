-- Habilitar RLS en el bucket weapon-analysis-temp
UPDATE storage.buckets
SET public = false, file_size_limit = 5242880 -- 5MB
WHERE id = 'weapon-analysis-temp';

-- Política para permitir a los usuarios autenticados subir archivos
CREATE POLICY "Usuarios autenticados pueden subir archivos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'weapon-analysis-temp' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para permitir a los usuarios ver sus propios archivos
CREATE POLICY "Usuarios pueden ver sus propios archivos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'weapon-analysis-temp' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para permitir a los usuarios eliminar sus propios archivos
CREATE POLICY "Usuarios pueden eliminar sus propios archivos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'weapon-analysis-temp' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Asegurarse de que el bucket tiene las políticas correctas
UPDATE storage.buckets
SET public = false, file_size_limit = 5242880 -- 5MB
WHERE id = 'weapon-analysis-temp';
