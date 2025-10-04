# 📊 Análisis de Rendimiento de Noticias (Tabla + Gráficos)

## Descripción

Se ha implementado un sistema completo de análisis de rendimiento en la página de administración de noticias. Incluye una **tabla interactiva** y **gráficos visuales** con métricas por período (semanal, mensual, anual). El sistema es colapsable y permite alternar entre vista de tabla y gráficos mediante un switch.

## Características

### ✨ Funcionalidades Principales

1. **Switch entre Tabla y Gráficos**
   - Botón toggle para alternar entre vistas
   - Estado se mantiene durante la sesión
   - Transiciones suaves entre vistas

2. **Tabla Interactiva con TanStack Table**
   - Ordenamiento por columnas (título, fecha, vistas, tendencia)
   - Búsqueda global en tiempo real
   - Paginación con controles avanzados
   - Responsive y optimizada para móviles

3. **Gráficos Visuales con Recharts**
   - **Gráfico de Barras**: Top 10 noticias por vistas
   - **Gráfico de Líneas**: Evolución de tendencias
   - **Gráfico de Área**: Comparación semanal vs mensual
   - **Gráfico Circular**: Distribución de tendencias
   - Tabs para navegar entre tipos de gráficos

4. **Métricas por Período**
   - **Semanal**: Vistas de los últimos 7 días
   - **Mensual**: Vistas de los últimos 30 días
   - **Anual**: Vistas de los últimos 365 días
   - Selector de período en tiempo real

5. **Indicadores de Tendencia**
   - 🟢 **Tendencia Positiva**: Aumento > 5%
   - 🔴 **Tendencia Negativa**: Disminución > 5%
   - ⚪ **Estable**: Cambio entre -5% y +5%

6. **Colapsable**
   - Botón para mostrar/ocultar la tabla
   - No ocupa espacio cuando está cerrada
   - Estado se mantiene durante la sesión

7. **Optimización de Rendimiento**
   - Carga lazy: solo se obtienen datos cuando se abre
   - Caché de 5 minutos con React Query
   - Fallback automático si falla la función RPC
   - Memoización de datos procesados para gráficos

## Archivos Creados

### Frontend

1. **`src/components/admin/noticias/EstadisticasTabla.tsx`**
   - Componente principal de la tabla
   - Implementa TanStack React Table
   - Incluye búsqueda, ordenamiento y paginación

2. **`src/components/admin/noticias/EstadisticasGraficos.tsx`** ⭐ NUEVO
   - Componente de visualización de gráficos
   - Implementa 4 tipos de gráficos con Recharts
   - Sistema de tabs para navegar entre gráficos
   - Selector de período integrado

3. **`src/components/admin/hooks/useEstadisticasDetalladas.ts`**
   - Hook personalizado con React Query
   - Obtiene estadísticas desde Supabase
   - Incluye fallback si falla la función RPC

4. **`src/app/admin/noticias/page.tsx`** (modificado)
   - Integra tabla y gráficos colapsables
   - Switch para alternar entre vistas
   - Gestiona el estado de mostrar/ocultar
   - Controla el período seleccionado

### Backend

4. **`supabase/migrations/20250102_estadisticas_detalladas_noticias.sql`**
   - Función RPC `obtener_estadisticas_detalladas_noticias`
   - Calcula métricas por período
   - Optimizada con índices

## Uso

### En la Interfaz

1. **Abrir el Análisis**
   - Ve a `/admin/noticias`
   - Busca la sección "Análisis de Rendimiento"
   - Haz clic en el botón con el icono de flecha para expandir

2. **Alternar entre Tabla y Gráficos**
   - Una vez abierto, verás dos botones: "Gráficos" y "Tabla"
   - Haz clic en "Gráficos" para ver visualizaciones
   - Haz clic en "Tabla" para ver datos tabulares
   - El cambio es instantáneo

3. **Explorar Gráficos**
   - **Barras**: Top 10 noticias con comparación de períodos
   - **Tendencias**: Evolución de vistas y cambios porcentuales
   - **Comparación**: Área que muestra vistas semanales vs mensuales
   - **Distribución**: Gráfico circular con tendencias positivas/negativas/estables
   - Usa las tabs para navegar entre tipos de gráficos

4. **Cambiar Período**
   - Usa el selector en la esquina superior derecha
   - Opciones: Semanal, Mensual, Anual
   - Los datos se actualizan automáticamente en ambas vistas

5. **Usar la Tabla (Vista Tabla)**
   - **Buscar**: Usa la barra de búsqueda para filtrar por título o autor
   - **Ordenar**: Haz clic en los encabezados de columna
   - **Paginar**: Usa los botones de navegación (10 resultados por página)

### Programáticamente

```typescript
import { useEstadisticasDetalladas } from '@/components/admin/hooks/useEstadisticasDetalladas';

function MiComponente() {
  const { 
    data: estadisticas, 
    isLoading, 
    error 
  } = useEstadisticasDetalladas({
    periodo: 'mensual',
    enabled: true, // Solo cargar cuando sea necesario
  });

  // Usar estadisticas...
}
```

## Estructura de Datos

### NoticiaEstadistica

```typescript
interface NoticiaEstadistica {
  id: string;                    // UUID de la noticia
  titulo: string;                // Título de la noticia
  autor: string;                 // Nombre del autor
  fecha_publicacion: string;     // Fecha ISO 8601
  vistas: number;                // Total de vistas
  vistas_semana: number;         // Vistas últimos 7 días
  vistas_mes: number;            // Vistas últimos 30 días
  tendencia: 'up' | 'down' | 'stable';  // Tendencia
  porcentaje_cambio: number;     // % de cambio
}
```

## Instalación de Dependencias

```bash
npm install @tanstack/react-table
```

## Migración de Base de Datos

1. **Ejecutar el Script SQL**
   - Ve a Supabase Dashboard → SQL Editor
   - Abre el archivo `supabase/migrations/20250102_estadisticas_detalladas_noticias.sql`
   - Ejecuta el script completo

2. **Verificar la Función**
   ```sql
   SELECT * FROM obtener_estadisticas_detalladas_noticias('mensual', 10);
   ```

## Optimizaciones Implementadas

### Performance

1. **Carga Lazy**
   - La tabla solo carga datos cuando se abre
   - Reduce el tiempo de carga inicial de la página

2. **Caché Inteligente**
   - React Query cachea los resultados por 5 minutos
   - Evita peticiones innecesarias al servidor

3. **Paginación**
   - Solo renderiza 10 filas a la vez
   - Mejora el rendimiento con grandes conjuntos de datos

4. **Memoización**
   - Las columnas están memoizadas
   - Evita re-renderizados innecesarios

### UX

1. **Feedback Visual**
   - Skeleton loaders durante la carga
   - Indicadores de tendencia con colores
   - Animaciones suaves al abrir/cerrar

2. **Responsive**
   - Tabla adaptable a móviles
   - Scroll horizontal en pantallas pequeñas

3. **Accesibilidad**
   - Labels ARIA para lectores de pantalla
   - Navegación por teclado
   - Contraste de colores adecuado

## Mejoras Futuras

### Corto Plazo

- [ ] Exportar datos a CSV/Excel
- [ ] Gráficos de tendencia con Recharts
- [ ] Filtros avanzados por categoría/autor
- [ ] Comparación entre períodos

### Largo Plazo

- [ ] Tabla de analytics real con tracking de vistas
- [ ] Integración con Google Analytics
- [ ] Predicciones con ML
- [ ] Dashboard personalizable

## Troubleshooting

### La tabla no carga datos

1. **Verificar función RPC**
   ```sql
   SELECT * FROM obtener_estadisticas_detalladas_noticias('mensual', 10);
   ```

2. **Revisar consola del navegador**
   - Buscar errores de red
   - Verificar logs de React Query

3. **Verificar permisos**
   - La función debe tener permisos para `authenticated` y `anon`

### La tabla está lenta

1. **Reducir el límite de resultados**
   - Editar el hook para usar menos de 100 registros

2. **Verificar índices en la base de datos**
   - Asegurar que existan índices en `vistas` y `fecha_publicacion`

3. **Aumentar el staleTime**
   - Modificar el hook para cachear por más tiempo

## Soporte

Para reportar bugs o sugerir mejoras, abre un issue en el repositorio.

---

**Última actualización**: 2025-01-02
**Versión**: 1.0.0
