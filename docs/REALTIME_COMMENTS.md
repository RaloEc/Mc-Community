# 🔄 Sistema de Comentarios en Tiempo Real

## 📋 Descripción

Se ha implementado un sistema de actualizaciones en tiempo real para comentarios y respuestas usando **Supabase Realtime**. Esto permite que los usuarios vean nuevos comentarios sin necesidad de recargar la página.

## ✨ Características

- ✅ **Actualizaciones instantáneas**: Los comentarios aparecen en tiempo real
- ✅ **Eficiente**: No hace polling constante, solo escucha cambios
- ✅ **Escalable**: Usa WebSockets de Supabase
- ✅ **Bidireccional**: Todos los usuarios conectados ven los cambios
- ✅ **Optimizado**: Solo invalida caché cuando hay cambios reales

## 🎯 Cómo Funciona

### 1. **Subscripción a Cambios**
Cuando un usuario abre un hilo o noticia, se crea una subscripción a la tabla correspondiente:
- **Hilos del foro**: Escucha cambios en `foro_posts`
- **Noticias**: Escucha cambios en `comentarios`

### 2. **Eventos Detectados**
El sistema escucha tres tipos de eventos:
- **INSERT**: Nuevo comentario creado
- **UPDATE**: Comentario editado
- **DELETE**: Comentario eliminado (soft delete)

### 3. **Actualización de UI**
Cuando se detecta un cambio:
1. Se invalida el caché de React Query
2. React Query recarga los datos automáticamente
3. La UI se actualiza mostrando el nuevo contenido

## 📁 Archivos Creados/Modificados

### Nuevo Hook
- **`src/hooks/useRealtimeComments.ts`**: Hook personalizado para manejar subscripciones

### Componentes Actualizados
- **`src/components/foro/HiloComentariosOptimizado.tsx`**: Integrado realtime para hilos
- **`src/components/noticias/NoticiaComentariosOptimizado.tsx`**: Integrado realtime para noticias

### Base de Datos
- **Migración**: Habilitado Realtime en tablas `foro_posts` y `comentarios`

## 🚀 Uso

El sistema funciona automáticamente. No requiere configuración adicional por parte del usuario.

### Ejemplo de Flujo:

1. **Usuario A** abre un hilo en el navegador Chrome
2. **Usuario B** abre el mismo hilo en Firefox
3. **Usuario B** escribe un comentario
4. **Usuario A** ve el comentario aparecer automáticamente sin recargar

## ⚙️ Configuración Técnica

### Hook `useRealtimeComments`

```typescript
useRealtimeComments('hilo', hiloId);
```

**Parámetros:**
- `contentType`: `'hilo'` o `'noticia'`
- `contentId`: ID del hilo o noticia

### Tablas con Realtime Habilitado
- ✅ `foro_posts`
- ✅ `comentarios`

## 🔧 Troubleshooting

### Los cambios no se ven en tiempo real

1. **Verificar que Realtime esté habilitado:**
```sql
SELECT * FROM pg_publication_tables 
WHERE tablename IN ('foro_posts', 'comentarios');
```

2. **Revisar la consola del navegador:**
Deberías ver logs como:
```
[Realtime] Iniciando suscripción a foro_posts para hilo:xxx
[Realtime] Estado de suscripción: SUBSCRIBED
[Realtime] Cambio detectado en foro_posts: {...}
```

3. **Verificar conexión WebSocket:**
En las DevTools → Network → WS, deberías ver una conexión activa a Supabase

### Desactivar Realtime (si es necesario)

Si quieres desactivar temporalmente el realtime, simplemente comenta la línea:

```typescript
// useRealtimeComments('hilo', hiloId);
```

## 📊 Rendimiento

### Ventajas vs Polling
- **Polling cada 5 segundos**: 720 peticiones/hora por usuario
- **Realtime**: 1 conexión WebSocket, 0 peticiones adicionales

### Consumo de Recursos
- **Ancho de banda**: Mínimo (solo envía cambios)
- **Base de datos**: Sin carga adicional
- **Cliente**: 1 WebSocket por página

## 🔐 Seguridad

- ✅ Las subscripciones respetan las políticas RLS de Supabase
- ✅ Solo se envían datos que el usuario tiene permiso de ver
- ✅ Los cambios se validan en el servidor

## 🎨 Personalización

### Cambiar el comportamiento de invalidación

Edita `src/hooks/useRealtimeComments.ts`:

```typescript
// Invalidar solo en INSERT
if (payload.eventType === 'INSERT') {
  queryClient.invalidateQueries({ queryKey });
}

// Invalidar con delay
setTimeout(() => {
  queryClient.invalidateQueries({ queryKey });
}, 1000);

// Invalidar sin refetch automático
queryClient.invalidateQueries({ 
  queryKey,
  refetchType: 'none' 
});
```

## 📝 Notas

- El sistema se desuscribe automáticamente cuando el usuario sale de la página
- Funciona con paginación infinita sin problemas
- Compatible con el sistema de caché de React Query
- No interfiere con las actualizaciones optimistas

## 🔮 Mejoras Futuras

- [ ] Indicador visual de "nuevo comentario disponible"
- [ ] Notificación de "X usuarios están escribiendo..."
- [ ] Sincronización de estado de lectura
- [ ] Presencia de usuarios en línea
