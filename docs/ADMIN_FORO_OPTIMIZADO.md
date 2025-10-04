# Panel de Administración del Foro - Documentación Completa

## Descripción General

El panel de administración del foro ha sido completamente rediseñado e implementado con las siguientes mejoras:

- ✅ Estadísticas en tiempo real
- ✅ Panel de moderación unificado
- ✅ Gestión de categorías con drag & drop
- ✅ Sistema de notificaciones en tiempo real
- ✅ Búsqueda avanzada
- ✅ Optimización de rendimiento con React Query
- ✅ Virtualización de listas largas
- ✅ Lazy loading de componentes

## Estructura de Archivos

### Migraciones SQL

```
supabase/migrations/
└── 20250103_estadisticas_foro_admin.sql
    ├── get_estadisticas_generales_foro()
    ├── get_hilos_populares()
    ├── get_estadisticas_por_categoria()
    ├── get_usuarios_mas_activos_foro()
    ├── get_actividad_diaria_foro()
    ├── get_hilos_recientes_moderacion()
    ├── get_comentarios_recientes_moderacion()
    └── buscar_contenido_foro()
```

### Hooks Personalizados

```
src/components/admin/foro/hooks/
├── useEstadisticasForo.ts       # Gestión de estadísticas con React Query
└── useModeracionForo.ts         # Gestión de moderación con React Query
```

### Componentes

```
src/components/admin/foro/
├── EstadisticasGenerales.tsx    # Métricas generales del foro
├── GraficoActividad.tsx         # Gráfico de actividad diaria
├── HilosPopulares.tsx           # Top hilos por engagement
├── UsuariosActivos.tsx          # Usuarios más activos
├── EstadisticasCategorias.tsx   # Estadísticas por categoría
├── PanelModeracion.tsx          # Panel de moderación unificado
├── GestorCategorias.tsx         # Gestión de categorías con drag & drop
├── BusquedaAvanzada.tsx         # Búsqueda en tiempo real
└── NotificacionesRealTime.tsx   # Notificaciones en vivo
```

### Páginas

```
src/app/admin/foro/
├── page.new.tsx                 # Nueva versión del dashboard
└── page.tsx                     # Versión anterior (mantener para rollback)
```

### API Routes

```
src/app/api/admin/foro/
├── categorias/
│   ├── route.ts                 # CRUD de categorías
│   └── orden/
│       └── route.ts             # Actualizar orden de categorías
├── etiquetas/
│   └── route.ts                 # CRUD de etiquetas
└── hilos/
    └── reasignar/
        └── route.ts             # Reasignar hilos a categorías
```

## Funciones SQL Implementadas

### 1. get_estadisticas_generales_foro()

Retorna estadísticas generales del foro:

```sql
{
  "total_hilos": number,
  "total_comentarios": number,
  "total_categorias": number,
  "total_etiquetas": number,
  "hilos_hoy": number,
  "comentarios_hoy": number,
  "hilos_semana": number,
  "comentarios_semana": number,
  "hilos_mes": number,
  "comentarios_mes": number,
  "total_vistas": number,
  "promedio_comentarios_por_hilo": number
}
```

**Uso:**
```typescript
const { data, isLoading } = useEstadisticasGenerales();
```

### 2. get_hilos_populares(limite, periodo_dias)

Retorna los hilos más populares basados en una fórmula de engagement.

**Parámetros:**
- `limite`: Número de hilos a retornar (default: 10)
- `periodo_dias`: Período en días (0 = todos, default: 30)

**Fórmula de popularidad:**
```
puntuacion = (vistas * 0.1) + (comentarios * 2) + (votos * 5)
```

**Uso:**
```typescript
const { data } = useHilosPopulares(10, 30);
```

### 3. get_estadisticas_por_categoria()

Retorna estadísticas detalladas por cada categoría del foro.

**Uso:**
```typescript
const { data } = useEstadisticasCategorias();
```

### 4. get_usuarios_mas_activos_foro(limite, periodo_dias)

Retorna los usuarios más activos basados en su participación.

**Fórmula de actividad:**
```
puntuacion = (hilos * 10) + (comentarios * 2) + (votos_recibidos * 3)
```

**Uso:**
```typescript
const { data } = useUsuariosActivos(10, 30);
```

### 5. get_actividad_diaria_foro(dias)

Retorna la actividad diaria del foro para generar gráficos.

**Uso:**
```typescript
const { data } = useActividadDiaria(30);
```

### 6. get_hilos_recientes_moderacion()

Retorna hilos con filtros y ordenamiento para moderación.

**Parámetros:**
- `limite`: Número de hilos por página
- `offset_val`: Offset para paginación
- `filtro_categoria`: UUID de categoría (opcional)
- `orden_campo`: Campo de ordenamiento
- `orden_direccion`: ASC o DESC

### 7. get_comentarios_recientes_moderacion()

Retorna comentarios recientes para moderación con paginación.

### 8. buscar_contenido_foro(termino_busqueda, limite)

Busca en hilos y comentarios por término.

**Uso:**
```typescript
const { data } = useBuscarContenidoForo(termino, true);
```

## Componentes Principales

### EstadisticasGenerales

Muestra métricas clave del foro en tarjetas visuales:
- Total de hilos, comentarios, categorías
- Actividad por período (hoy, semana, mes)
- Promedio de engagement

**Características:**
- Actualización automática cada 5 minutos
- Skeleton loading states
- Diseño responsive

### GraficoActividad

Gráfico de área/línea con actividad diaria:
- Nuevos hilos
- Nuevos comentarios
- Vistas totales

**Características:**
- Filtros de período (7, 14, 30 días)
- Tooltips interactivos
- Responsive con Recharts

### PanelModeracion

Panel unificado para moderación de contenido:

**Funcionalidades:**
- Ver hilos y comentarios recientes
- Filtros por categoría y ordenamiento
- Acciones individuales:
  - Fijar/desfijar hilos
  - Cerrar/abrir hilos
  - Eliminar hilos/comentarios
- Acciones por lotes:
  - Eliminar múltiples hilos
  - Mover múltiples hilos a otra categoría
- Paginación infinita con scroll

**Características:**
- Virtualización para rendimiento
- Selección múltiple con checkboxes
- Confirmación de acciones destructivas

### GestorCategorias

Gestión visual de categorías con drag & drop:

**Funcionalidades:**
- Crear/editar/eliminar categorías
- Reorganizar con drag & drop
- Configurar:
  - Nombre y slug
  - Descripción
  - Color e icono
  - Categoría padre (subcategorías)
  - Estado activo/inactivo

**Características:**
- Integración con @dnd-kit
- Actualización automática del orden
- Validación de slugs únicos

### BusquedaAvanzada

Búsqueda en tiempo real en hilos y comentarios:

**Características:**
- Debounce de 500ms
- Búsqueda mínima de 3 caracteres
- Resultados agrupados por tipo
- Links directos al contenido

### NotificacionesRealTime

Sistema de notificaciones en tiempo real:

**Características:**
- Suscripción a Supabase Realtime
- Notificaciones de:
  - Nuevos hilos
  - Nuevos comentarios
- Badge con contador de no leídas
- Panel desplegable
- Marcar como leídas

## Optimizaciones de Rendimiento

### 1. React Query

Todas las consultas utilizan React Query para:
- Caché automático de datos
- Revalidación inteligente
- Deduplicación de peticiones
- Estados de loading/error

**Configuración de caché:**
```typescript
{
  staleTime: 1000 * 60 * 5,      // 5 minutos
  gcTime: 1000 * 60 * 15,        // 15 minutos
  refetchOnWindowFocus: true,
  refetchInterval: 1000 * 60 * 5 // Actualizar cada 5 min
}
```

### 2. Lazy Loading

Todos los componentes principales se cargan de forma diferida:
```typescript
const EstadisticasGenerales = lazy(() => import('@/components/admin/foro/EstadisticasGenerales'));
```

### 3. Paginación Infinita

El panel de moderación utiliza `useInfiniteQuery` para:
- Cargar datos por lotes
- Scroll infinito con Intersection Observer
- Mantener estado entre navegaciones

### 4. Memoización

Componentes optimizados con `React.memo`:
```typescript
const MetricaCard = React.memo(({ titulo, valor, icono }) => { ... });
```

### 5. Índices de Base de Datos

Índices creados para optimizar consultas:
```sql
CREATE INDEX idx_foro_hilos_created_at ON foro_hilos(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_foro_hilos_categoria_id ON foro_hilos(categoria_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_foro_comentarios_hilo_id ON foro_comentarios(hilo_id) WHERE deleted_at IS NULL;
```

## Migración desde la Versión Anterior

### Paso 1: Ejecutar Migración SQL

```bash
# Ejecutar la migración en Supabase
supabase db push
```

O manualmente en el SQL Editor de Supabase:
```sql
-- Copiar y ejecutar el contenido de:
-- supabase/migrations/20250103_estadisticas_foro_admin.sql
```

### Paso 2: Verificar Funciones

Verificar que todas las funciones RPC estén creadas:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%foro%';
```

### Paso 3: Reemplazar Página

Opción A - Reemplazo directo:
```bash
# Renombrar archivos
mv src/app/admin/foro/page.tsx src/app/admin/foro/page.old.tsx
mv src/app/admin/foro/page.new.tsx src/app/admin/foro/page.tsx
```

Opción B - Prueba gradual:
```typescript
// En src/app/admin/foro/page.tsx
// Importar y usar condicionalmente
const useNewVersion = true; // Toggle para pruebas
```

### Paso 4: Verificar Dependencias

Asegurarse de que estén instaladas:
```json
{
  "@tanstack/react-query": "^5.90.2",
  "@dnd-kit/core": "latest",
  "@dnd-kit/sortable": "latest",
  "@dnd-kit/utilities": "latest",
  "recharts": "^3.1.2",
  "date-fns": "^4.1.0",
  "react-intersection-observer": "^9.16.0"
}
```

Si faltan, instalar:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Testing

### Pruebas Funcionales

1. **Estadísticas:**
   - ✅ Verificar que las métricas se actualicen correctamente
   - ✅ Comprobar filtros de período en gráficos
   - ✅ Validar cálculos de popularidad

2. **Moderación:**
   - ✅ Probar acciones individuales (fijar, cerrar, eliminar)
   - ✅ Probar acciones por lotes
   - ✅ Verificar filtros y ordenamiento
   - ✅ Comprobar paginación infinita

3. **Categorías:**
   - ✅ Crear/editar/eliminar categorías
   - ✅ Reorganizar con drag & drop
   - ✅ Validar slugs únicos
   - ✅ Probar jerarquía (subcategorías)

4. **Búsqueda:**
   - ✅ Buscar en hilos y comentarios
   - ✅ Verificar debounce
   - ✅ Comprobar resultados relevantes

5. **Notificaciones:**
   - ✅ Crear nuevo hilo y verificar notificación
   - ✅ Crear comentario y verificar notificación
   - ✅ Marcar como leídas
   - ✅ Eliminar notificaciones

### Pruebas de Rendimiento

1. **Carga inicial:**
   - Tiempo de carga < 2s
   - Lazy loading funcionando

2. **Paginación:**
   - Scroll suave sin lag
   - Carga de páginas < 500ms

3. **Búsqueda:**
   - Respuesta < 300ms
   - Debounce efectivo

## Troubleshooting

### Error: Función RPC no encontrada

**Problema:** `function get_estadisticas_generales_foro() does not exist`

**Solución:**
```sql
-- Verificar que la migración se ejecutó
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'get_estadisticas_generales_foro';

-- Si no existe, ejecutar manualmente la migración
```

### Error: Drag & drop no funciona

**Problema:** Las categorías no se pueden arrastrar

**Solución:**
```bash
# Verificar instalación de @dnd-kit
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Error: Notificaciones no aparecen

**Problema:** No se reciben notificaciones en tiempo real

**Solución:**
1. Verificar que Realtime esté habilitado en Supabase
2. Comprobar políticas RLS en las tablas
3. Verificar conexión a Supabase

### Performance: Carga lenta

**Problema:** El dashboard tarda mucho en cargar

**Solución:**
1. Verificar que React Query esté configurado
2. Comprobar que los índices SQL estén creados
3. Revisar Network tab para peticiones duplicadas

## Próximas Mejoras

- [ ] Sistema de roles y permisos granulares
- [ ] Exportación de informes (PDF, CSV)
- [ ] Análisis de sentimiento en comentarios
- [ ] Detección automática de spam
- [ ] Webhooks para eventos importantes
- [ ] Dashboard personalizable con widgets arrastrables
- [ ] Modo oscuro/claro
- [ ] Atajos de teclado
- [ ] Historial de moderación
- [ ] Sistema de advertencias a usuarios

## Soporte

Para reportar bugs o sugerir mejoras, crear un issue en el repositorio con:
- Descripción del problema
- Pasos para reproducir
- Screenshots (si aplica)
- Logs de consola

## Changelog

### v2.0.0 (2025-01-03)
- ✅ Rediseño completo del panel de administración
- ✅ Implementación de estadísticas en tiempo real
- ✅ Panel de moderación unificado
- ✅ Gestión de categorías con drag & drop
- ✅ Sistema de notificaciones en tiempo real
- ✅ Búsqueda avanzada
- ✅ Optimizaciones de rendimiento
- ✅ Documentación completa
