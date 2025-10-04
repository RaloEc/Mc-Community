# Sistema de Resaltado de Reportes del Foro

## Descripción

Sistema implementado para facilitar la gestión de reportes en el foro, permitiendo a los moderadores navegar directamente al contenido reportado y resaltarlo visualmente para una identificación rápida.

## Características

### 1. Enlace "Ver origen" en el gestor de reportes

- **Ubicación**: Diálogo de gestión de reportes en `/admin/foro`
- **Funcionalidad**: 
  - Abre el contenido reportado en una nueva pestaña
  - Para hilos: navega directamente a la página del hilo
  - Para posts/comentarios: navega al hilo y resalta el comentario específico

### 2. Resaltado visual de comentarios

- **Activación**: Solo cuando se accede desde el gestor de reportes
- **Efecto visual**:
  - Animación de pulsación (3 repeticiones)
  - Ring azul alrededor del comentario
  - Scroll automático al comentario resaltado
- **Duración**: 3 segundos, luego se limpia automáticamente

### 3. Limpieza automática de URL

- Los parámetros de resaltado se eliminan de la URL después de mostrar el efecto
- No interfiere con el historial de navegación del usuario

## Implementación Técnica

### Archivos Modificados

1. **`supabase/migrations/20250104000001_agregar_slug_reportes.sql`**
   - Actualiza la función RPC `obtener_reportes_foro`
   - Añade campos `hilo_slug` y `hilo_id` a los resultados

2. **`src/components/admin/foro/moderacion/TablaReportes.tsx`**
   - Añade interfaz actualizada con nuevos campos
   - Implementa función `generarUrlReporte()`
   - Añade botón "Ver origen" con icono de enlace externo

3. **`src/components/foro/posts/PostCard.tsx`**
   - Añade detección de parámetro `highlight` en URL
   - Implementa lógica de resaltado con `useEffect`
   - Añade ID único a cada post (`post-{id}`)
   - Implementa scroll automático al elemento

4. **`src/app/globals.css`**
   - Añade animación `@keyframes highlight`
   - Define clase `.animate-highlight`

## Uso

### Para Moderadores

1. Accede al panel de administración del foro
2. Ve a la sección "Reportes"
3. Haz clic en un reporte para ver sus detalles
4. En la sección "Vista previa del contenido reportado", haz clic en "Ver origen"
5. Se abrirá una nueva pestaña mostrando el contenido reportado con resaltado visual

### Estructura de URL

#### Para hilos reportados:
```
/foro/hilos/{slug}
```

#### Para posts/comentarios reportados:
```
/foro/hilos/{slug}?highlight={post_id}#post-{post_id}
```

**Parámetros:**
- `highlight`: ID del post a resaltar
- `#post-{post_id}`: Ancla para navegación directa

## Beneficios

1. **Eficiencia**: Los moderadores pueden identificar rápidamente el contenido reportado
2. **Contexto**: Ven el contenido en su contexto original dentro del hilo
3. **UX mejorada**: Animación sutil que no es intrusiva
4. **Limpieza**: URL se limpia automáticamente después del resaltado
5. **Accesibilidad**: Funciona con navegación por teclado y lectores de pantalla

## Consideraciones de Rendimiento

- El resaltado solo se activa cuando hay un parámetro `highlight` en la URL
- La animación es eficiente y no afecta el rendimiento
- El scroll es suave y no bloquea la interfaz
- La limpieza de URL usa `replaceState` para no afectar el historial

## Compatibilidad

- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Modo claro y oscuro
- ✅ Dispositivos móviles y tablets
- ✅ Funciona con posts anidados (respuestas)

## Mantenimiento

### Para actualizar la animación:

Edita el archivo `src/app/globals.css`:

```css
@keyframes highlight {
  0%, 100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(59, 130, 246, 0.1);
  }
}
```

### Para cambiar la duración del resaltado:

Edita `src/components/foro/posts/PostCard.tsx`, línea del `setTimeout`:

```typescript
const timer = setTimeout(() => {
  setDebeResaltar(false);
  // ... resto del código
}, 3000); // Cambiar este valor (en milisegundos)
```

## Migración de Base de Datos

Para aplicar la migración en producción:

```bash
# Opción 1: Usando Supabase CLI
supabase db push

# Opción 2: Usando el script batch
ejecutar_migracion_reportes_slug.bat
```

## Troubleshooting

### El resaltado no funciona

1. Verifica que la migración de base de datos se haya aplicado correctamente
2. Confirma que el parámetro `highlight` está en la URL
3. Revisa la consola del navegador para errores

### El scroll no lleva al comentario

1. Verifica que el ID del post sea correcto
2. Confirma que el elemento tiene el atributo `id="post-{id}"`
3. Aumenta el delay del `setTimeout` si la página carga lentamente

### La URL no se limpia

1. Verifica que el navegador soporte `history.replaceState`
2. Revisa que no haya errores en la consola
3. Confirma que el `useEffect` se está ejecutando correctamente
