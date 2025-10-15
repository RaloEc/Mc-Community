# Estadísticas en Tiempo Real - Panel de Noticias

## 📊 Descripción

Se ha implementado un sistema de estadísticas en tiempo real para el panel de administración de noticias usando **Supabase Realtime**. Las estadísticas se actualizan automáticamente cuando ocurren cambios en la tabla `noticias`, sin necesidad de recargar la página.

## ✨ Características

### Métricas en Tiempo Real

1. **Total Noticias**: Contador total de noticias publicadas
2. **Total Vistas**: Suma de todas las vistas de todas las noticias
3. **Últimos 30 días**: Noticias publicadas en los últimos 30 días
4. **Pendientes**: Noticias programadas para publicación futura

### Indicador Visual

- **Punto verde pulsante**: Indica que la conexión Realtime está activa
- **Mensaje de estado**: "Estadísticas en tiempo real activas"

### Actualizaciones Automáticas

Las estadísticas se actualizan automáticamente cuando:
- ✅ Se crea una nueva noticia (INSERT)
- ✅ Se actualiza una noticia existente (UPDATE)
- ✅ Se elimina una noticia (DELETE)
- ✅ Se incrementan las vistas de una noticia

## 🛠️ Implementación Técnica

### 1. Hook Personalizado (`useEstadisticasNoticias`)

**Ubicación**: `src/components/noticias/hooks/useAdminNoticias.ts`

```typescript
export function useEstadisticasNoticias() {
  const queryClient = useQueryClient()
  const [realtimeEnabled, setRealtimeEnabled] = useState(false)

  // Query inicial
  const query = useQuery<EstadisticasNoticias>({
    queryKey: ['admin-noticias-estadisticas'],
    queryFn: async () => {
      const respuesta = await fetch('/api/admin/noticias/estadisticas?admin=true')
      return respuesta.json()
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: true,
  })

  // Suscripción a Realtime
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('admin-noticias-estadisticas-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'noticias',
      }, (payload) => {
        // Invalidar queries cuando hay cambios
        queryClient.invalidateQueries({ 
          queryKey: ['admin-noticias-estadisticas'] 
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return { ...query, realtimeEnabled }
}
```

### 2. Componente de Estadísticas

**Ubicación**: `src/components/admin/noticias/EstadisticasNoticias.tsx`

- Muestra las 4 métricas principales
- Indicador visual de conexión Realtime
- Tarjetas con iconos y colores distintivos
- Porcentajes de cambio (tendencias)

### 3. Configuración de Base de Datos

**Migración**: `supabase/migrations/20250115_habilitar_realtime_noticias.sql`

```sql
-- Habilitar replicación completa
ALTER TABLE public.noticias REPLICA IDENTITY FULL;

-- Agregar tabla a la publicación de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.noticias;
```

### 4. Endpoint de API

**Ubicación**: `src/app/api/admin/noticias/estadisticas/route.ts`

- Usa la función RPC `obtener_estadisticas_admin_noticias()`
- Fallback a consultas individuales si la RPC falla
- Optimizado con agregaciones SQL

## 🚀 Cómo Usar

### 1. Aplicar la Migración

**Opción A: Usando el script batch**
```cmd
habilitar_realtime_noticias.bat
```

**Opción B: Manualmente en Supabase SQL Editor**
```sql
-- Ejecutar el contenido de:
-- supabase/migrations/20250115_habilitar_realtime_noticias.sql
```

### 2. Verificar la Configuración

```sql
-- Verificar que Realtime está habilitado
SELECT 
  schemaname,
  tablename,
  'Realtime habilitado' as status
FROM 
  pg_publication_tables
WHERE 
  pubname = 'supabase_realtime' 
  AND tablename = 'noticias';
```

### 3. Acceder al Panel

1. Navega a `/admin/noticias`
2. Observa el indicador verde pulsante si Realtime está activo
3. Las estadísticas se actualizarán automáticamente

## 🔍 Monitoreo y Debugging

### Logs en Consola

El sistema registra eventos importantes:

```
🔴 Configurando Realtime para estadísticas de noticias...
✅ Realtime conectado para estadísticas de noticias
🔴 Cambio detectado en noticias: INSERT
🔴 Cambio detectado en noticias: UPDATE
```

### Verificar Conexión

```typescript
const { realtimeEnabled } = useEstadisticasNoticias()
console.log('Realtime activo:', realtimeEnabled)
```

### Errores Comunes

1. **"CHANNEL_ERROR"**: Verifica que la tabla esté en la publicación
2. **"TIMED_OUT"**: Problemas de red o configuración de Supabase
3. **Estadísticas no se actualizan**: Verifica que `REPLICA IDENTITY FULL` esté configurado

## 📈 Rendimiento

### Optimizaciones Implementadas

1. **React Query Cache**: 
   - `staleTime: 30s` - Reduce peticiones innecesarias
   - `gcTime: 5min` - Mantiene datos en caché

2. **Invalidación Selectiva**:
   - Solo invalida queries cuando hay cambios reales
   - No recarga toda la página

3. **Agregaciones SQL**:
   - Cálculos en el servidor (PostgreSQL)
   - Reduce transferencia de datos

4. **Suscripción Única**:
   - Un solo canal Realtime por componente
   - Cleanup automático al desmontar

## 🔒 Seguridad

### Políticas RLS

Las estadísticas respetan las políticas de Row Level Security (RLS):
- Solo usuarios con rol `admin` pueden ver las estadísticas
- Las funciones RPC usan `SECURITY DEFINER`

### Validación de Permisos

```typescript
// En el endpoint de API
const esAdmin = await verificarRolAdmin(supabase, request)
if (!esAdmin) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
}
```

## 🧪 Testing

### Probar Actualizaciones en Tiempo Real

1. Abre el panel de admin en una pestaña
2. En otra pestaña, crea/edita/elimina una noticia
3. Observa cómo las estadísticas se actualizan automáticamente

### Probar Incremento de Vistas

1. Abre una noticia en el frontend
2. El contador de vistas se incrementa automáticamente
3. Las estadísticas del admin se actualizan en tiempo real

## 📚 Referencias

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [React Query Documentation](https://tanstack.com/query/latest)
- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)

## 🎯 Próximas Mejoras

- [ ] Gráficos en tiempo real con Chart.js
- [ ] Notificaciones push cuando hay cambios importantes
- [ ] Histórico de cambios en las últimas 24 horas
- [ ] Dashboard de actividad en tiempo real
- [ ] Métricas de rendimiento del servidor

## 🐛 Solución de Problemas

### Realtime no se conecta

1. Verifica que la migración se aplicó correctamente
2. Revisa los logs de Supabase en el dashboard
3. Asegúrate de que el proyecto tiene Realtime habilitado

### Estadísticas no se actualizan

1. Verifica que la función RPC existe y funciona
2. Revisa los permisos de la función
3. Comprueba que el endpoint de API devuelve datos correctos

### Performance Issues

1. Aumenta el `staleTime` si hay demasiadas peticiones
2. Considera usar debouncing para actualizaciones frecuentes
3. Revisa los índices de la tabla `noticias`

---

**Última actualización**: 15 de Octubre, 2025
**Versión**: 1.0.0
