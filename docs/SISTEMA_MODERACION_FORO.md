# Sistema Completo de Moderación del Foro

## 📋 Descripción General

Sistema integral de moderación para el foro de la comunidad que incluye gestión de reportes, sanciones de usuarios, herramientas avanzadas de moderación y estadísticas en tiempo real.

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. `foro_reportes`
Almacena todos los reportes de contenido inapropiado.

**Campos:**
- `id` (UUID): Identificador único
- `tipo_contenido` (VARCHAR): Tipo de contenido reportado (hilo, post, comentario)
- `contenido_id` (UUID): ID del contenido reportado
- `reportado_por` (UUID): Usuario que realizó el reporte
- `razon` (VARCHAR): Razón del reporte
- `descripcion` (TEXT): Descripción detallada
- `estado` (VARCHAR): Estado del reporte (pendiente, en_revision, resuelto, desestimado)
- `prioridad` (VARCHAR): Prioridad (baja, media, alta, critica)
- `asignado_a` (UUID): Moderador asignado
- `resuelto_por` (UUID): Moderador que resolvió
- `resolucion` (TEXT): Resolución del reporte
- `created_at`, `updated_at`, `resuelto_en` (TIMESTAMPTZ)

#### 2. `foro_acciones_moderacion`
Registro completo de todas las acciones de moderación.

**Tipos de acciones:**
- `eliminar_contenido`
- `advertencia`
- `suspension_temporal`
- `suspension_permanente`
- `baneo`
- `desbaneo`
- `editar_contenido`
- `mover_hilo`
- `cerrar_hilo`
- `abrir_hilo`
- `destacar_hilo`
- `quitar_destacado`

#### 3. `foro_sanciones`
Sanciones aplicadas a usuarios.

**Tipos de sanciones:**
- `advertencia`: Advertencia formal
- `suspension_temporal`: Suspensión por días específicos
- `suspension_permanente`: Suspensión indefinida
- `baneo`: Baneo definitivo

#### 4. `foro_puntos_moderacion`
Sistema de puntos y seguimiento de usuarios problemáticos.

**Campos clave:**
- `puntos_totales`: Puntos acumulados
- `advertencias`: Número de advertencias
- `suspensiones`: Número de suspensiones
- `en_lista_vigilancia`: Marcador para usuarios problemáticos
- `notas_moderador`: Notas internas para moderadores

#### 5. `foro_plantillas_mensajes`
Plantillas predefinidas para mensajes de moderación.

**Tipos:**
- `advertencia`
- `suspension`
- `baneo`
- `resolucion`
- `otro`

#### 6. `foro_terminos_prohibidos`
Lista de términos prohibidos o sensibles.

**Acciones:**
- `bloquear`: Bloquear automáticamente
- `revisar`: Marcar para revisión
- `advertir`: Advertir al usuario

#### 7. `foro_config_moderacion`
Configuración del sistema de moderación.

**Configuraciones por defecto:**
- `puntos_advertencia`: 5
- `puntos_suspension_temporal`: 10
- `puntos_suspension_permanente`: 20
- `umbral_suspension_automatica`: 15
- `umbral_baneo_automatico`: 30
- `dias_suspension_temporal`: 7
- `moderacion_automatica_activa`: true

#### 8. `foro_notificaciones_moderacion`
Notificaciones enviadas a usuarios sobre acciones de moderación.

## 🔧 Funciones RPC

### Gestión de Reportes

#### `crear_reporte_foro(p_tipo_contenido, p_contenido_id, p_razon, p_descripcion)`
Crea un nuevo reporte de contenido.

**Parámetros:**
- `p_tipo_contenido`: Tipo de contenido (hilo, post, comentario)
- `p_contenido_id`: ID del contenido
- `p_razon`: Razón del reporte
- `p_descripcion`: Descripción opcional

**Retorna:** UUID del reporte creado

#### `obtener_reportes_foro(p_estado, p_tipo_contenido, p_limit, p_offset)`
Obtiene reportes con filtros y paginación.

**Parámetros:**
- `p_estado`: Filtrar por estado (opcional)
- `p_tipo_contenido`: Filtrar por tipo (opcional)
- `p_limit`: Límite de resultados (default: 50)
- `p_offset`: Offset para paginación (default: 0)

**Retorna:** Tabla con reportes y datos relacionados

#### `resolver_reporte_foro(p_reporte_id, p_resolucion, p_accion)`
Marca un reporte como resuelto.

#### `desestimar_reporte_foro(p_reporte_id, p_razon)`
Marca un reporte como desestimado.

#### `procesar_reportes_masivo(p_reporte_ids, p_accion, p_resolucion)`
Procesa múltiples reportes en lote.

**Retorna:** Número de reportes procesados

### Gestión de Sanciones

#### `aplicar_sancion_usuario(p_usuario_id, p_tipo_sancion, p_razon, p_dias_duracion, p_puntos, p_notificar)`
Aplica una sanción a un usuario.

**Funcionalidades:**
- Registra la acción de moderación
- Crea la sanción
- Actualiza puntos del usuario
- Envía notificación (opcional)

**Retorna:** UUID de la sanción creada

#### `obtener_historial_moderacion_usuario(p_usuario_id)`
Obtiene el historial completo de moderación de un usuario.

#### `obtener_sanciones_activas_usuario(p_usuario_id)`
Obtiene las sanciones activas de un usuario.

### Estadísticas

#### `obtener_estadisticas_moderacion(p_fecha_inicio, p_fecha_fin)`
Obtiene estadísticas completas de moderación.

**Retorna JSON con:**
- `reportes_totales`
- `reportes_pendientes`
- `reportes_resueltos`
- `tiempo_promedio_resolucion` (en horas)
- `acciones_por_tipo`
- `usuarios_sancionados`
- `usuarios_en_vigilancia`

#### `verificar_sancion_usuario(p_usuario_id)`
Verifica si un usuario está sancionado.

**Retorna JSON con:**
- `sancionado`: boolean
- `tipo_sancion`: tipo de sanción activa
- `fin_sancion`: fecha de fin
- `puntos_totales`: puntos acumulados

## 🔐 Políticas de Seguridad (RLS)

### Reportes
- ✅ Usuarios autenticados pueden crear reportes
- ✅ Usuarios pueden ver sus propios reportes
- ✅ Administradores tienen acceso completo

### Acciones de Moderación
- ✅ Solo administradores pueden ver y crear acciones

### Sanciones
- ✅ Usuarios pueden ver sus propias sanciones
- ✅ Administradores tienen acceso completo

### Notificaciones
- ✅ Usuarios pueden ver y actualizar sus notificaciones

### Configuración y Plantillas
- ✅ Solo administradores tienen acceso

## 🌐 API Routes

### `/api/admin/foro/reportes`

**GET** - Obtener reportes
```typescript
Query params:
- estado?: string
- tipo_contenido?: string
- limit?: number
- offset?: number
```

**POST** - Crear reporte
```typescript
Body: {
  tipo_contenido: string;
  contenido_id: string;
  razon: string;
  descripcion?: string;
}
```

**PATCH** - Resolver/Desestimar reporte
```typescript
Body: {
  reporte_id: string;
  accion: 'resolver' | 'desestimar';
  resolucion: string;
}
```

### `/api/admin/foro/reportes/masivo`

**POST** - Procesar reportes en lote
```typescript
Body: {
  reporte_ids: string[];
  accion: 'resolver' | 'desestimar';
  resolucion: string;
}
```

### `/api/admin/foro/sanciones`

**POST** - Aplicar sanción
```typescript
Body: {
  usuario_id: string;
  tipo_sancion: string;
  razon: string;
  dias_duracion?: number;
  puntos?: number;
  notificar?: boolean;
}
```

**GET** - Obtener sanciones de usuario
```typescript
Query params:
- usuario_id: string
```

### `/api/admin/foro/usuarios/[id]/historial`

**GET** - Obtener historial de moderación de usuario

### `/api/admin/foro/estadisticas-moderacion`

**GET** - Obtener estadísticas de moderación
```typescript
Query params:
- fecha_inicio?: string
- fecha_fin?: string
```

## 🎨 Componentes de UI

### `TablaReportes`
Tabla principal para gestionar reportes.

**Características:**
- Filtros por estado y tipo de contenido
- Selección múltiple para acciones masivas
- Diálogo para resolver/desestimar reportes
- Badges de prioridad y estado
- Vista previa del contenido reportado

### `GestionUsuarios`
Gestión completa de usuarios y sanciones.

**Características:**
- Búsqueda de usuarios por ID
- Visualización de historial de moderación
- Aplicación de sanciones
- Vista de sanciones activas
- Configuración de puntos y duración

### `EstadisticasModeracion`
Dashboard de estadísticas en tiempo real.

**Métricas mostradas:**
- Reportes totales (últimos 30 días)
- Reportes pendientes
- Reportes resueltos
- Usuarios sancionados
- Usuarios en lista de vigilancia
- Tiempo promedio de resolución
- Acciones por tipo

## 📊 Flujo de Trabajo

### 1. Reporte de Contenido
```
Usuario reporta contenido
    ↓
Reporte creado con estado "pendiente"
    ↓
Moderador revisa reporte
    ↓
Moderador toma acción:
    - Resolver (con acción de moderación)
    - Desestimar (sin acción)
```

### 2. Aplicación de Sanción
```
Moderador aplica sanción
    ↓
Se registra acción de moderación
    ↓
Se crea sanción en tabla
    ↓
Se actualizan puntos del usuario
    ↓
Se envía notificación (opcional)
    ↓
Se verifica umbral automático
```

### 3. Sistema de Puntos
```
Advertencia: +5 puntos
Suspensión temporal: +10 puntos
Suspensión permanente: +20 puntos

Umbrales:
- 15 puntos: Suspensión automática
- 30 puntos: Baneo automático
```

## 🚀 Uso del Sistema

### Crear un Reporte (Usuario)
```typescript
const reporteId = await supabase.rpc('crear_reporte_foro', {
  p_tipo_contenido: 'hilo',
  p_contenido_id: 'uuid-del-hilo',
  p_razon: 'Contenido inapropiado',
  p_descripcion: 'Descripción detallada del problema'
});
```

### Aplicar Sanción (Administrador)
```typescript
const sancionId = await supabase.rpc('aplicar_sancion_usuario', {
  p_usuario_id: 'uuid-del-usuario',
  p_tipo_sancion: 'advertencia',
  p_razon: 'Violación de normas de la comunidad',
  p_puntos: 5,
  p_notificar: true
});
```

### Verificar Estado de Usuario
```typescript
const estado = await supabase.rpc('verificar_sancion_usuario', {
  p_usuario_id: 'uuid-del-usuario'
});

if (estado.sancionado) {
  console.log(`Usuario sancionado: ${estado.tipo_sancion}`);
  console.log(`Puntos totales: ${estado.puntos_totales}`);
}
```

### Obtener Estadísticas
```typescript
const stats = await supabase.rpc('obtener_estadisticas_moderacion', {
  p_fecha_inicio: '2025-01-01',
  p_fecha_fin: '2025-01-31'
});
```

## 🔄 Mantenimiento

### Desactivar Sanciones Expiradas
```sql
SELECT desactivar_sanciones_expiradas();
```

Se recomienda ejecutar esta función periódicamente (ej: cada hora) mediante un cron job o trigger programado.

## 📝 Notas Importantes

1. **Seguridad**: Todas las acciones de moderación requieren rol de administrador
2. **Auditoría**: Todas las acciones quedan registradas con timestamp y moderador
3. **Notificaciones**: Los usuarios reciben notificaciones de acciones de moderación
4. **Puntos**: El sistema de puntos es acumulativo y permanente
5. **RLS**: Las políticas RLS garantizan que solo usuarios autorizados accedan a datos sensibles

## 🛠️ Archivos Creados

### Migraciones
- `supabase/migrations/20250104000000_sistema_moderacion_foro.sql`

### API Routes
- `src/app/api/admin/foro/reportes/route.ts`
- `src/app/api/admin/foro/reportes/masivo/route.ts`
- `src/app/api/admin/foro/sanciones/route.ts`
- `src/app/api/admin/foro/usuarios/[id]/historial/route.ts`
- `src/app/api/admin/foro/estadisticas-moderacion/route.ts`

### Componentes
- `src/components/admin/foro/moderacion/TablaReportes.tsx`
- `src/components/admin/foro/moderacion/GestionUsuarios.tsx`
- `src/components/admin/foro/moderacion/EstadisticasModeracion.tsx`

### Páginas
- `src/app/admin/foro/page.tsx` (actualizada)

## 🎯 Próximas Mejoras

- [ ] Sistema de plantillas de mensajes completamente funcional
- [ ] Moderación automática basada en términos prohibidos
- [ ] Dashboard de métricas avanzadas con gráficos
- [ ] Sistema de apelaciones para usuarios sancionados
- [ ] Integración con sistema de notificaciones en tiempo real
- [ ] Exportación de reportes y estadísticas
- [ ] Historial de ediciones de contenido moderado
- [ ] Sistema de roles de moderación (moderador, super-moderador, admin)
