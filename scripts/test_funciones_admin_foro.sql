-- =====================================================
-- SCRIPT DE PRUEBA PARA FUNCIONES DE ADMINISTRACIÓN DEL FORO
-- =====================================================

-- 1. Probar buscar_contenido_foro
SELECT '=== PRUEBA 1: buscar_contenido_foro ===' as test;
SELECT * FROM buscar_contenido_foro('minecraft', 'DESC', 10, 0);

-- 2. Probar get_actividad_diaria_foro (últimos 7 días)
SELECT '=== PRUEBA 2: get_actividad_diaria_foro (7 días) ===' as test;
SELECT * FROM get_actividad_diaria_foro(7);

-- 3. Probar get_actividad_diaria_foro (últimos 30 días)
SELECT '=== PRUEBA 3: get_actividad_diaria_foro (30 días) ===' as test;
SELECT * FROM get_actividad_diaria_foro(30);

-- 4. Probar get_estadisticas_generales_foro
SELECT '=== PRUEBA 4: get_estadisticas_generales_foro ===' as test;
SELECT * FROM get_estadisticas_generales_foro();

-- 5. Probar get_usuarios_mas_activos_foro
SELECT '=== PRUEBA 5: get_usuarios_mas_activos_foro ===' as test;
SELECT * FROM get_usuarios_mas_activos_foro(10, 0);

-- 6. Verificar que todas las funciones existen
SELECT '=== VERIFICACIÓN: Funciones creadas ===' as test;
SELECT 
    routine_name as "Función",
    routine_type as "Tipo",
    data_type as "Tipo de retorno"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'buscar_contenido_foro',
    'get_actividad_diaria_foro',
    'get_estadisticas_generales_foro',
    'get_usuarios_mas_activos_foro',
    'get_hilos_populares',
    'get_estadisticas_por_categoria',
    'get_hilos_recientes_moderacion',
    'get_comentarios_recientes_moderacion'
)
ORDER BY routine_name;
