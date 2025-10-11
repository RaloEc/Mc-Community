# Sistema de Votos en Tiempo Real para Comentarios del Foro

## Descripción

Sistema completo de votación para comentarios del foro con sincronización en tiempo real usando Supabase Realtime. Los usuarios verán los votos actualizarse instantáneamente cuando otros usuarios voten, sin necesidad de recargar la página.

## Características

✅ **Votación positiva y negativa** para comentarios del foro  
✅ **Sincronización en tiempo real** entre múltiples navegadores/usuarios  
✅ **Actualización optimista** para respuesta instantánea  
✅ **Políticas RLS** para seguridad de datos  
✅ **Triggers automáticos** para mantener contadores actualizados  
✅ **Integración con React Query** para gestión de caché  

## Instalación

### Paso 1: Aplicar la migración de base de datos

Ejecuta el script de instalación:

```bash
instalar_votos_realtime.bat
```

O manualmente con Supabase CLI:

```bash
npx supabase db push --file supabase/migrations/20251010000000_crear_votos_posts_realtime.sql
```

### Paso 2: Verificar la instalación

La migración crea automáticamente:

1. **Tabla `foro_votos_posts`**: Almacena los votos de usuarios
2. **Columna `votos_totales`**: En la tabla `foro_posts` para caché de contadores
3. **Trigger `actualizar_votos_post`**: Actualiza automáticamente los contadores
4. **Políticas RLS**: Permisos de lectura pública y escritura autenticada
5. **Realtime habilitado**: Para sincronización instantánea

## Arquitectura

### Base de Datos

**Tabla: `foro_votos_posts`**
```sql
- id: UUID (PK)
- post_id: UUID (FK -> foro_posts.id)
- usuario_id: UUID (FK -> auth.users.id)
- valor_voto: SMALLINT (-1 o 1)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- UNIQUE(post_id, usuario_id)
```

**Columna agregada: `foro_posts.votos_totales`**
- Tipo: INTEGER
- Default: 0
- Actualizada automáticamente por trigger

### API Endpoints

**POST `/api/foro/comentario/[id]/votar`**
- Body: `{ value: -1 | 0 | 1 }`
- Respuesta: `{ ok: true, total: number, userVote: -1 | 0 | 1 }`

**GET `/api/foro/comentario/[id]/votar`**
- Respuesta: `{ ok: true, total: number, userVote: -1 | 0 | 1 }`

### Componentes

**`useRealtimeVotos(hiloId: string)`**
- Hook personalizado para suscripción a cambios en tiempo real
- Invalida automáticamente el caché de React Query
- Se limpia automáticamente al desmontar

**`<Votacion />`**
- Componente UI reutilizable para votar
- Props: `id`, `tipo`, `votosIniciales`, `vertical`, `size`
- Actualización optimista para UX fluida

**`CommentCard`**
- Integra el componente `<Votacion />` junto al avatar
- Muestra votos totales del comentario
- Sincroniza automáticamente con cambios en tiempo real

## Flujo de Datos

```
Usuario vota
    ↓
Actualización optimista (UI)
    ↓
POST /api/foro/comentario/[id]/votar
    ↓
Supabase: INSERT/UPDATE/DELETE en foro_votos_posts
    ↓
Trigger: Actualiza foro_posts.votos_totales
    ↓
Realtime: Notifica a todos los clientes suscritos
    ↓
useRealtimeVotos: Invalida cache de React Query
    ↓
UI se actualiza automáticamente en todos los navegadores
```

## Uso

### En el componente de comentarios

```tsx
import { useRealtimeVotos } from '@/hooks/useRealtimeVotos';

function HiloComentarios({ hiloId }) {
  // Activar sincronización en tiempo real
  useRealtimeVotos(hiloId);
  
  // ... resto del componente
}
```

### Componente de votación

```tsx
<Votacion
  id={comentario.id}
  tipo="comentario"
  votosIniciales={comentario.votos_totales || 0}
  vertical={true}
  size="sm"
/>
```

## Políticas de Seguridad (RLS)

- **SELECT**: Todos pueden ver los votos
- **INSERT**: Solo usuarios autenticados pueden votar
- **UPDATE**: Solo el autor del voto puede modificarlo
- **DELETE**: Solo el autor del voto puede eliminarlo

## Optimizaciones

1. **Actualización optimista**: La UI se actualiza inmediatamente antes de confirmar con el servidor
2. **Caché de contadores**: `votos_totales` evita consultas agregadas costosas
3. **Índices de base de datos**: Optimizan búsquedas por `post_id` y `usuario_id`
4. **React Query**: Gestiona caché y sincronización automática
5. **Realtime selectivo**: Solo se suscriben los hilos activos

## Troubleshooting

### Los votos no se actualizan en tiempo real

1. Verifica que Realtime esté habilitado en Supabase:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.foro_votos_posts;
   ```

2. Verifica la consola del navegador para errores de suscripción

3. Asegúrate de que `useRealtimeVotos(hiloId)` esté siendo llamado

### Error al votar

1. Verifica que el usuario esté autenticado
2. Revisa las políticas RLS en Supabase Dashboard
3. Verifica que el endpoint `/api/foro/comentario/[id]/votar` exista

### Los contadores no coinciden

1. Ejecuta el recálculo manual:
   ```sql
   UPDATE public.foro_posts
   SET votos_totales = (
       SELECT COALESCE(SUM(valor_voto), 0)
       FROM public.foro_votos_posts
       WHERE post_id = foro_posts.id
   );
   ```

## Archivos Modificados/Creados

### Migración
- `supabase/migrations/20251010000000_crear_votos_posts_realtime.sql`

### API
- `src/app/api/foro/comentario/[id]/votar/route.ts`
- `src/app/api/comentarios/route.ts` (actualizado)

### Hooks
- `src/hooks/useRealtimeVotos.ts`
- `src/components/foro/hooks/useHiloComentarios.ts` (actualizado)

### Componentes
- `src/components/comentarios/CommentCard.tsx` (actualizado)
- `src/components/foro/HiloComentariosOptimizado.tsx` (actualizado)

### Tipos
- `src/components/comentarios/types.ts` (actualizado)

### Scripts
- `instalar_votos_realtime.bat`

## Próximas Mejoras

- [ ] Agregar animaciones al cambiar votos
- [ ] Mostrar quién votó (opcional, para admins)
- [ ] Estadísticas de votos por usuario
- [ ] Notificaciones cuando tu comentario recibe votos
- [ ] Sistema de reputación basado en votos

## Soporte

Para problemas o preguntas, revisa:
1. Logs de Supabase Dashboard
2. Consola del navegador (Network y Console tabs)
3. Logs del servidor Next.js
