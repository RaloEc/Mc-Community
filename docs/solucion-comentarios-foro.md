# Solución al Problema de Persistencia de Comentarios en Hilos del Foro

## Problema Identificado

Los comentarios y respuestas en los hilos del foro desaparecían después de recargar la página. Esto ocurría porque:

1. Los comentarios para hilos del foro (`contentType === 'hilo'`) se estaban guardando en la tabla `comentarios`.
2. Sin embargo, la API al cargar los comentarios para hilos del foro los buscaba en la tabla `foro_posts`.
3. Esta inconsistencia causaba que los comentarios recién creados aparecieran temporalmente (mientras estaban en memoria), pero desaparecieran al recargar la página.

## Estructura de la Base de Datos

- **Tabla `comentarios`**: Almacena comentarios generales con soporte para respuestas anidadas mediante `comentario_padre_id`.
- **Tabla `foro_posts`**: Almacena posts/mensajes dentro de hilos del foro, con soporte para posts padre mediante `post_padre_id`.

## Solución Implementada

### 1. Modificación de la API de Comentarios (`/api/comentarios/route.ts`)

Se modificó el endpoint POST para que:
- Si el comentario es para un hilo del foro (`content_type === 'hilo'`), se guarde en la tabla `foro_posts`.
- Para otros tipos de contenido, se siga guardando en la tabla `comentarios`.

### 2. Modificación de la API de Respuestas (`/api/comentarios/reply/route.ts`)

Se modificó el endpoint POST para que:
- Al crear una respuesta, primero verifique si el comentario padre está en `comentarios` o en `foro_posts`.
- Si el padre está en `foro_posts` (post de hilo del foro), guarde la respuesta en `foro_posts` con `post_padre_id`.
- De lo contrario, guarde la respuesta en `comentarios` como antes.

### 3. Formato de Respuesta

Se aseguró que el formato de respuesta de la API sea consistente independientemente de la tabla donde se almacenen los datos, para que el frontend pueda procesar los comentarios de manera uniforme.

## Beneficios de la Solución

1. **Consistencia**: Los comentarios y respuestas para hilos del foro ahora se guardan y cargan desde la misma tabla (`foro_posts`).
2. **Persistencia**: Los comentarios y respuestas persisten correctamente después de recargar la página.
3. **Mantenimiento de la Estructura**: Se respeta la estructura de datos existente sin necesidad de migrar datos o modificar esquemas.
4. **Experiencia de Usuario**: Los usuarios pueden ver y responder a comentarios en hilos del foro sin problemas de persistencia.

## Funcionalidad de Edición y Eliminación de Comentarios

### Edición de Comentarios

1. **API de Edición**: Se implementó un endpoint PUT en `/api/comentarios/edit` que permite a los usuarios editar sus propios comentarios.
2. **Interfaz de Usuario**: Se añadió un botón de edición que solo aparece para el autor del comentario.
3. **Historial de Ediciones**: Se registra si un comentario ha sido editado y cuándo, mostrando "(editado)" junto al comentario.

### Eliminación de Comentarios

1. **Eliminación Física**: Los comentarios se eliminan completamente de la base de datos, independientemente de si tienen respuestas.
2. **Tablas de Referencias**: Se crearon tablas `comentarios_eliminados` y `foro_posts_eliminados` para mantener referencias a comentarios eliminados.
3. **Manejo de Citas**: Cuando un comentario es eliminado pero tiene citas en respuestas:
   - El comentario desaparece de la lista principal de comentarios.
   - En las respuestas que lo citan, se muestra "Este comentario ha sido eliminado" en el área de cita.
   - Se mantiene la integridad de la conversación sin mostrar contenido eliminado.

### Seguridad

- Solo el autor del comentario puede editarlo o eliminarlo.
- Se verifica la autenticación y autoría en los endpoints de API.

## Consideraciones Futuras

- Considerar unificar el sistema de comentarios en una sola tabla para simplificar la lógica.
- Implementar un sistema de notificaciones para respuestas a comentarios.
- Añadir funcionalidades adicionales como reacciones a comentarios.
