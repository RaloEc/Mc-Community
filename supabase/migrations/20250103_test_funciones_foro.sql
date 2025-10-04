-- Script de prueba para identificar qué función falla
-- Ejecutar línea por línea en Supabase SQL Editor

-- Test 1: get_hilos_populares
SELECT 'Probando get_hilos_populares...' as test;
SELECT * FROM get_hilos_populares(5, 30) LIMIT 1;

-- Test 2: get_estadisticas_por_categoria
SELECT 'Probando get_estadisticas_por_categoria...' as test;
SELECT * FROM get_estadisticas_por_categoria() LIMIT 1;

-- Test 3: get_hilos_recientes_moderacion
SELECT 'Probando get_hilos_recientes_moderacion...' as test;
SELECT * FROM get_hilos_recientes_moderacion(5, 0, NULL, 'created_at', 'DESC') LIMIT 1;

-- Test 4: get_comentarios_recientes_moderacion
SELECT 'Probando get_comentarios_recientes_moderacion...' as test;
SELECT * FROM get_comentarios_recientes_moderacion(5, 0) LIMIT 1;
