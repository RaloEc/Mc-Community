# Edición de Hilos en el Foro

## Descripción

Se ha implementado la funcionalidad para que los autores de hilos puedan editar el contenido de sus publicaciones directamente desde la página de visualización del hilo (`/foro/hilos/[slug]`).

## Características

- **Botón de editar**: Solo visible para el autor del hilo
- **Modo de edición**: Muestra el editor Tiptap con el contenido actual
- **Validación de permisos**: El backend verifica que el usuario sea el autor
- **Actualización en tiempo real**: Recarga la página tras guardar para mostrar cambios
- **Cancelación**: Permite cancelar la edición sin guardar cambios
- **Estados de carga**: Muestra indicador mientras se guardan los cambios

## Implementación técnica

### Componentes

#### HiloHeader (Client Component)
**Ubicación**: `src/components/foro/HiloHeader.tsx`

Componente cliente que maneja toda la lógica del header del hilo, incluyendo:
- Visualización de información del hilo (título, autor, estadísticas)
- Botones de acción (responder, seguir, compartir, editar)
- Modo de edición con el editor Tiptap
- Llamada al API para guardar cambios

**Estados principales**:
```typescript
const [modoEdicion, setModoEdicion] = useState(false);
const [contenidoEditado, setContenidoEditado] = useState(hilo.contenido);
const [guardando, setGuardando] = useState(false);
```

**Verificación de permisos**:
```typescript
const { user } = useAuth();
const esAutor = user?.id === hilo.autor_id;
```

### API Endpoint

**Ruta**: `/api/foro/hilos/[id]`  
**Método**: `PATCH`  
**Ubicación**: `src/app/api/foro/hilos/[id]/route.ts`

**Flujo de validación**:
1. Verifica que el usuario esté autenticado
2. Obtiene el hilo de la base de datos
3. Verifica que el usuario sea el autor del hilo
4. Valida que el contenido no esté vacío
5. Actualiza el hilo en la base de datos
6. Retorna el hilo actualizado

**Request**:
```json
{
  "contenido": "<p>Contenido HTML del hilo editado</p>"
}
```

**Response exitosa**:
```json
{
  "success": true,
  "hilo": {
    "id": "...",
    "contenido": "...",
    "updated_at": "..."
  }
}
```

**Errores posibles**:
- `401`: Usuario no autenticado
- `403`: Usuario no es el autor del hilo
- `404`: Hilo no encontrado
- `400`: Contenido vacío
- `500`: Error del servidor

## Flujo de usuario

### Para el autor del hilo

1. **Visualizar hilo**: El autor ve un botón "Editar" en azul junto a los demás botones de acción
2. **Activar edición**: Al hacer clic en "Editar", se muestra el editor Tiptap con el contenido actual
3. **Editar contenido**: El autor puede modificar el contenido usando todas las herramientas del editor
4. **Guardar cambios**: 
   - Clic en "Guardar" → Envía los cambios al servidor
   - Muestra "Guardando..." mientras procesa
   - Recarga la página para mostrar el contenido actualizado
5. **Cancelar edición**: 
   - Clic en "Cancelar" → Descarta los cambios y vuelve al modo de visualización

### Para otros usuarios

- No ven el botón de editar
- Solo pueden ver el contenido del hilo

## Archivos modificados/creados

### Nuevos archivos
- `src/components/foro/HiloHeader.tsx` - Componente del header con funcionalidad de edición
- `src/app/api/foro/hilos/[id]/route.ts` - Endpoint para actualizar hilos

### Archivos modificados
- `src/app/foro/hilos/[slug]/page.tsx` - Usa el nuevo componente HiloHeader

## Seguridad

### Frontend
- Solo muestra el botón de editar si `user?.id === hilo.autor_id`
- Usa el contexto de autenticación para verificar permisos

### Backend
- Verifica autenticación con `supabase.auth.getUser()`
- Obtiene el hilo de la base de datos para verificar el autor
- Compara `hilo.autor_id` con `user.id`
- Valida que el contenido no esté vacío

### Base de datos
- El campo `updated_at` se actualiza automáticamente
- Las políticas RLS de Supabase protegen contra accesos no autorizados

## Mejoras futuras

- [ ] Guardar sin recargar la página (usando revalidación de Next.js)
- [ ] Historial de ediciones
- [ ] Indicador visual de "Editado" en el hilo
- [ ] Límite de tiempo para editar (ej: solo primeras 24 horas)
- [ ] Notificación a usuarios que respondieron sobre la edición
- [ ] Vista previa antes de guardar
- [ ] Autoguardado de borradores

## Notas técnicas

- El componente `HiloHeader` es un Client Component porque necesita estado y eventos
- El editor Tiptap se carga dinámicamente con `next/dynamic` para evitar problemas de SSR
- La recarga de página tras guardar es temporal; se puede mejorar con revalidación
- El contenido se guarda como HTML en la base de datos
- Se mantiene la compatibilidad con todas las extensiones del editor (incluyendo ClickToCopy)

## Ejemplo de uso

```typescript
// En la página del hilo
<HiloHeader 
  hilo={hilo} 
  etiquetas={etiquetas} 
/>
```

El componente maneja automáticamente:
- Mostrar/ocultar el botón de editar según permisos
- Cambiar entre modo visualización y edición
- Guardar cambios en el servidor
- Manejar errores y estados de carga
