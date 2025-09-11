-- Verificar triggers en la tabla foro_votos_hilos
SELECT trigger_name, action_statement, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'foro_votos_hilos';

-- Verificar la definición de la función del trigger
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'actualizar_contador_votos_hilo';
