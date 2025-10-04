# Guía de Implementación - Panel de Administración del Foro

## Pasos de Implementación

### 1. Ejecutar Migración SQL

Primero, ejecuta la migración SQL en Supabase:

**Opción A - Usando Supabase CLI:**
```bash
cd r:\Proyectos\BitArena\Mc-Community
supabase db push
```

**Opción B - Manualmente en Supabase Dashboard:**
1. Ir a tu proyecto en Supabase
2. Navegar a SQL Editor
3. Copiar el contenido de `supabase/migrations/20250103_estadisticas_foro_admin.sql`
4. Ejecutar el script

**Verificación:**
```sql
-- Verificar que las funciones se crearon correctamente
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%foro%'
ORDER BY routine_name;

-- Deberías ver 8 funciones:
-- 1. buscar_contenido_foro
-- 2. get_actividad_diaria_foro
-- 3. get_comentarios_recientes_moderacion
-- 4. get_estadisticas_generales_foro
-- 5. get_estadisticas_por_categoria
-- 6. get_hilos_populares
-- 7. get_hilos_recientes_moderacion
-- 8. get_usuarios_mas_activos_foro
```

### 2. Instalar Dependencias Faltantes

Verifica e instala las dependencias necesarias:

```bash
# Verificar package.json
npm list @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Si no están instaladas, ejecutar:
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 3. Verificar Estructura de Archivos

Asegúrate de que todos los archivos se hayan creado correctamente:

```
✅ supabase/migrations/20250103_estadisticas_foro_admin.sql
✅ src/components/admin/foro/hooks/useEstadisticasForo.ts
✅ src/components/admin/foro/hooks/useModeracionForo.ts
✅ src/components/admin/foro/EstadisticasGenerales.tsx
✅ src/components/admin/foro/GraficoActividad.tsx
✅ src/components/admin/foro/HilosPopulares.tsx
✅ src/components/admin/foro/UsuariosActivos.tsx
✅ src/components/admin/foro/EstadisticasCategorias.tsx
✅ src/components/admin/foro/PanelModeracion.tsx
✅ src/components/admin/foro/GestorCategorias.tsx
✅ src/components/admin/foro/BusquedaAvanzada.tsx
✅ src/components/admin/foro/NotificacionesRealTime.tsx
✅ src/app/admin/foro/page.new.tsx
✅ src/app/api/admin/foro/categorias/orden/route.ts
✅ docs/ADMIN_FORO_OPTIMIZADO.md
```

### 4. Probar en Desarrollo

Antes de reemplazar la página actual, prueba la nueva versión:

```bash
# Iniciar servidor de desarrollo
npm run dev
```

Navega a: `http://localhost:3000/admin/foro`

**Pruebas básicas:**
1. ✅ Dashboard carga sin errores
2. ✅ Estadísticas generales se muestran
3. ✅ Gráficos se renderizan correctamente
4. ✅ Panel de moderación funciona
5. ✅ Gestión de categorías responde
6. ✅ Búsqueda funciona
7. ✅ Notificaciones en tiempo real activas

### 5. Activar Nueva Versión

Una vez verificado que todo funciona:

**Opción A - Reemplazo directo (Recomendado):**
```bash
# Hacer backup de la versión actual
copy src\app\admin\foro\page.tsx src\app\admin\foro\page.backup.tsx

# Reemplazar con la nueva versión
copy src\app\admin\foro\page.new.tsx src\app\admin\foro\page.tsx
```

**Opción B - Rollback rápido disponible:**
Si prefieres mantener ambas versiones temporalmente, puedes crear un toggle:

```typescript
// En src/app/admin/foro/page.tsx
'use client';

import { useState } from 'react';
import PageOld from './page.backup';
import PageNew from './page.new';

export default function AdminForoPage() {
  // Cambiar a true para usar la nueva versión
  const useNewVersion = true;
  
  return useNewVersion ? <PageNew /> : <PageOld />;
}
```

### 6. Configurar Políticas RLS (Si es necesario)

Verifica que las políticas de Row Level Security permitan a los administradores acceder a las funciones:

```sql
-- Verificar políticas existentes
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('foro_hilos', 'foro_comentarios', 'foro_categorias');

-- Si es necesario, crear política para administradores
-- (Esto depende de tu configuración actual)
```

### 7. Optimizar Configuración de React Query

Verifica que el QueryClient esté configurado correctamente en `src/lib/react-query/provider.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10,   // 10 minutos
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
```

### 8. Habilitar Supabase Realtime

Para que las notificaciones funcionen, asegúrate de que Realtime esté habilitado:

1. Ir a Supabase Dashboard
2. Navegar a Database > Replication
3. Habilitar replicación para las tablas:
   - `foro_hilos`
   - `foro_comentarios`

**Verificación:**
```sql
-- Verificar que las tablas tengan replicación habilitada
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'foro_%';
```

## Verificación Post-Implementación

### Checklist de Funcionalidades

#### Dashboard Principal
- [ ] Estadísticas generales se cargan correctamente
- [ ] Métricas muestran valores reales
- [ ] Gráfico de actividad se renderiza
- [ ] Hilos populares se muestran
- [ ] Usuarios activos se listan
- [ ] Estadísticas por categoría funcionan
- [ ] Tabs cambian correctamente

#### Panel de Moderación
- [ ] Lista de hilos se carga
- [ ] Filtros por categoría funcionan
- [ ] Ordenamiento funciona
- [ ] Selección múltiple funciona
- [ ] Acciones individuales (fijar, cerrar, eliminar)
- [ ] Acciones por lotes (eliminar, mover)
- [ ] Paginación infinita funciona
- [ ] Búsqueda avanzada responde

#### Gestión de Categorías
- [ ] Lista de categorías se muestra
- [ ] Drag & drop funciona
- [ ] Crear nueva categoría
- [ ] Editar categoría existente
- [ ] Eliminar categoría
- [ ] Orden se guarda correctamente
- [ ] Subcategorías se muestran correctamente

#### Notificaciones
- [ ] Badge de notificaciones aparece
- [ ] Nuevos hilos generan notificación
- [ ] Nuevos comentarios generan notificación
- [ ] Panel de notificaciones se abre
- [ ] Marcar como leída funciona
- [ ] Links a contenido funcionan

### Pruebas de Rendimiento

Ejecutar en Chrome DevTools:

1. **Lighthouse Audit:**
   - Performance > 80
   - Accessibility > 90
   - Best Practices > 90

2. **Network Tab:**
   - Carga inicial < 2s
   - Peticiones duplicadas: 0
   - Caché funcionando correctamente

3. **React DevTools Profiler:**
   - Re-renders innecesarios: mínimos
   - Tiempo de renderizado < 100ms

### Monitoreo de Errores

Verificar la consola del navegador:

```javascript
// No debería haber errores de:
// - Funciones RPC no encontradas
// - Políticas RLS
// - Componentes no encontrados
// - Hooks mal usados
```

## Rollback (Si es necesario)

Si encuentras problemas críticos, puedes hacer rollback:

### Rollback de Código

```bash
# Restaurar versión anterior
copy src\app\admin\foro\page.backup.tsx src\app\admin\foro\page.tsx
```

### Rollback de Base de Datos

```sql
-- Eliminar funciones nuevas (si causan problemas)
DROP FUNCTION IF EXISTS get_estadisticas_generales_foro();
DROP FUNCTION IF EXISTS get_hilos_populares(INT, INT);
DROP FUNCTION IF EXISTS get_estadisticas_por_categoria();
DROP FUNCTION IF EXISTS get_usuarios_mas_activos_foro(INT, INT);
DROP FUNCTION IF EXISTS get_actividad_diaria_foro(INT);
DROP FUNCTION IF EXISTS get_hilos_recientes_moderacion(INT, INT, UUID, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS get_comentarios_recientes_moderacion(INT, INT);
DROP FUNCTION IF EXISTS buscar_contenido_foro(TEXT, INT);

-- Eliminar índices nuevos (si causan problemas)
DROP INDEX IF EXISTS idx_foro_hilos_created_at;
DROP INDEX IF EXISTS idx_foro_hilos_categoria_id;
DROP INDEX IF EXISTS idx_foro_hilos_autor_id;
DROP INDEX IF EXISTS idx_foro_comentarios_created_at;
DROP INDEX IF EXISTS idx_foro_comentarios_hilo_id;
DROP INDEX IF EXISTS idx_foro_comentarios_autor_id;
```

## Soporte y Debugging

### Logs Útiles

Habilitar logs detallados:

```typescript
// En useEstadisticasForo.ts y useModeracionForo.ts
// Ya están incluidos console.error para debugging
```

### Herramientas de Debugging

1. **React Query DevTools:**
   Ya está incluido en el proyecto. Acceder con:
   - Botón flotante en desarrollo
   - Ver estado de queries
   - Invalidar caché manualmente

2. **Supabase Logs:**
   - Dashboard > Logs
   - Filtrar por errores
   - Verificar queries lentas

3. **Network Tab:**
   - Verificar peticiones RPC
   - Comprobar tiempos de respuesta
   - Validar payloads

### Problemas Comunes

#### 1. "Function does not exist"

**Causa:** Migración SQL no ejecutada o incompleta

**Solución:**
```sql
-- Verificar funciones
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%foro%';

-- Re-ejecutar migración si es necesario
```

#### 2. "Permission denied for function"

**Causa:** Políticas RLS o permisos insuficientes

**Solución:**
```sql
-- Verificar permisos
SELECT routine_name, routine_schema, security_type
FROM information_schema.routines
WHERE routine_name LIKE '%foro%';

-- Las funciones deben tener SECURITY DEFINER
```

#### 3. Drag & drop no funciona

**Causa:** Dependencias de @dnd-kit no instaladas

**Solución:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm run dev
```

#### 4. Notificaciones no aparecen

**Causa:** Realtime no habilitado o políticas RLS

**Solución:**
1. Habilitar Realtime en Supabase Dashboard
2. Verificar políticas RLS en tablas
3. Comprobar conexión WebSocket en Network tab

#### 5. Gráficos no se renderizan

**Causa:** Recharts no instalado o datos inválidos

**Solución:**
```bash
npm install recharts
# Verificar que date-fns esté instalado
npm install date-fns
```

## Mantenimiento

### Actualizaciones Regulares

1. **Semanalmente:**
   - Revisar logs de errores
   - Verificar rendimiento
   - Comprobar notificaciones

2. **Mensualmente:**
   - Actualizar dependencias
   - Revisar índices SQL
   - Optimizar queries lentas

3. **Trimestralmente:**
   - Auditoría de seguridad
   - Revisión de políticas RLS
   - Limpieza de datos antiguos

### Monitoreo de Métricas

Métricas clave a monitorear:

```sql
-- Rendimiento de funciones RPC
SELECT 
  routine_name,
  (SELECT COUNT(*) FROM pg_stat_user_functions 
   WHERE funcname = routine_name) as calls
FROM information_schema.routines
WHERE routine_name LIKE '%foro%';

-- Tamaño de tablas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'foro_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Contacto

Para soporte adicional:
- Revisar documentación completa en `docs/ADMIN_FORO_OPTIMIZADO.md`
- Crear issue en el repositorio
- Consultar logs de Supabase
