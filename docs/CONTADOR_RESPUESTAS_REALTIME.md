# Contador de Respuestas en Tiempo Real

## 📋 Descripción

Se ha implementado un contador de respuestas en tiempo real en la cabecera de los hilos del foro que:
- Se actualiza automáticamente cuando se agregan o eliminan respuestas
- **NO contabiliza respuestas eliminadas** (soft deleted)
- Usa Supabase Realtime para actualizaciones instantáneas
- Mantiene sincronización con el sistema de soft delete en cascada

## 🎯 Características

### ✅ Actualización en Tiempo Real
- El contador se actualiza automáticamente sin recargar la página
- Detecta cuando se agregan nuevas respuestas
- Detecta cuando se eliminan respuestas (soft delete)
- Detecta cuando se restauran respuestas

### ✅ Exclusión de Posts Eliminados
- Solo cuenta respuestas con `deleted = false`
- Compatible con el sistema de soft delete en cascada
- Cuando eliminas un post con respuestas, el contador disminuye automáticamente

### ✅ Optimización
- Usa la función RPC `contar_respuestas_por_hilo` para conteo eficiente
- Suscripción específica por hilo (no escucha todos los posts)
- Se limpia automáticamente al salir de la página

## 📁 Archivos Modificados/Creados

### Nuevo Componente
**`src/components/foro/ContadorRespuestasRealtime.tsx`**
```typescript
- Componente cliente que escucha cambios en tiempo real
- Se suscribe a cambios en foro_posts para un hilo específico
- Actualiza el contador usando la función RPC
```

### Página Actualizada
**`src/app/foro/hilos/[slug]/page.tsx`**
```typescript
// Antes (estático)
<span className="font-medium">{hilo.respuestas ?? 0}</span>

// Ahora (en tiempo real)
<ContadorRespuestasRealtime 
  hiloId={hilo.id}
  respuestasIniciales={hilo.respuestas ?? 0}
/>
```

### Migración Corregida
**`supabase/migrations/20251012000001_fix_contar_respuestas_deleted.sql`**
```sql
-- Ahora usa 'deleted = false' en lugar de 'deleted_at IS NULL'
-- Retorna 'respuestas' en lugar de 'conteo' (consistencia)
```

## 🔧 Cómo Funciona

### 1. Carga Inicial
```typescript
// El componente recibe el conteo inicial del servidor
<ContadorRespuestasRealtime 
  hiloId="abc-123"
  respuestasIniciales={5}  // Valor inicial
/>
```

### 2. Suscripción Realtime
```typescript
// Se suscribe a cambios en foro_posts para este hilo
supabase
  .channel(`hilo-respuestas-${hiloId}`)
  .on('postgres_changes', {
    event: '*',  // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'foro_posts',
    filter: `hilo_id=eq.${hiloId}`,
  }, (payload) => {
    // Actualizar conteo
  })
```

### 3. Actualización del Conteo
```typescript
// Cuando hay un cambio, llama a la función RPC
const { data } = await supabase.rpc('contar_respuestas_por_hilo', {
  hilo_ids: [hiloId]
});

// Actualiza el estado con el nuevo conteo
setRespuestas(data[0].respuestas || 0);
```

## 🧪 Casos de Uso

### Caso 1: Agregar Respuesta
```
Usuario A está viendo el hilo
Usuario B agrega una respuesta
→ Contador de Usuario A se actualiza automáticamente: 5 → 6
```

### Caso 2: Eliminar Respuesta (Soft Delete)
```
Usuario A está viendo el hilo (5 respuestas)
Usuario B elimina una respuesta
→ Contador de Usuario A se actualiza: 5 → 4
```

### Caso 3: Eliminar con Cascada
```
Usuario A está viendo el hilo (10 respuestas)
Usuario B elimina un post que tiene 3 respuestas
→ Se eliminan 4 posts en total (1 + 3 respuestas)
→ Contador de Usuario A se actualiza: 10 → 6
```

### Caso 4: Restaurar Post
```
Usuario A está viendo el hilo (6 respuestas)
Moderador restaura un post con 3 respuestas
→ Se restauran 4 posts en total
→ Contador de Usuario A se actualiza: 6 → 10
```

## 🔗 Integración con Soft Delete

El contador está completamente integrado con el sistema de soft delete:

```sql
-- Función de conteo (solo posts activos)
SELECT COUNT(*) 
FROM foro_posts 
WHERE hilo_id = '...' 
  AND deleted = false;  -- ✅ Excluye eliminados

-- Soft delete en cascada
soft_delete_post_cascade(post_id, deleted_by)
→ Marca deleted = true en post y respuestas
→ Trigger de Realtime detecta el cambio
→ Contador se actualiza automáticamente
```

## 📊 Beneficios

1. **UX Mejorada**: Los usuarios ven cambios instantáneos sin recargar
2. **Datos Precisos**: El contador siempre refleja el estado real
3. **Consistencia**: Integrado con soft delete y cascada
4. **Rendimiento**: Solo escucha cambios del hilo específico
5. **Escalable**: Usa funciones RPC optimizadas

## 🚀 Instalación

Para aplicar todos los cambios:

```cmd
aplicar_migraciones_soft_delete.bat
```

O manualmente:
```cmd
supabase db push
```

## 🔍 Verificación

### 1. Verificar la función RPC
```sql
SELECT * FROM contar_respuestas_por_hilo(ARRAY['tu-hilo-id']::uuid[]);
```

### 2. Verificar Realtime
```sql
-- Verificar que Realtime esté habilitado en foro_posts
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'foro_posts';
```

### 3. Probar en el navegador
1. Abre un hilo en dos pestañas diferentes
2. En una pestaña, agrega una respuesta
3. En la otra pestaña, el contador debe actualizarse automáticamente

## 📝 Notas Técnicas

- **Canal único por hilo**: Cada instancia del componente crea su propio canal
- **Limpieza automática**: El canal se cierra cuando el componente se desmonta
- **Fallback**: Si Realtime falla, muestra el último valor conocido
- **Logs**: Los cambios se registran en la consola para debugging

## 🐛 Troubleshooting

### El contador no se actualiza
1. Verifica que Realtime esté habilitado en Supabase
2. Revisa la consola del navegador para errores
3. Verifica que la función RPC exista y tenga permisos

### El contador muestra valores incorrectos
1. Verifica que `deleted = false` esté en la función RPC
2. Ejecuta la migración actualizada
3. Limpia la caché del navegador

### Múltiples actualizaciones
- Es normal ver varias actualizaciones si se eliminan posts en cascada
- Cada cambio en `foro_posts` dispara una actualización
