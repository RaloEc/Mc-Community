-- Verificar la estructura de la tabla foro_votos_hilos
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'foro_votos_hilos';

-- Verificar restricciones de la tabla
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM   pg_constraint
WHERE  conrelid = 'public.foro_votos_hilos'::regclass;
