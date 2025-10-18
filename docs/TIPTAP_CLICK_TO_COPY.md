# Extensión ClickToCopy para Tiptap

## Descripción

Se ha implementado una extensión personalizada para el editor Tiptap que permite crear texto interactivo que se puede copiar al portapapeles con un solo clic.

## Características

- **Formato visual distintivo**: El texto copiable se muestra con un fondo de color primario y un cursor especial
- **Interactividad**: Al hacer clic en el texto, se copia automáticamente al portapapeles
- **Notificaciones**: Muestra un toast de confirmación cuando el texto se copia exitosamente
- **Integración declarativa**: Usa un Plugin de ProseMirror para manejar los eventos de clic sin necesidad de `useEffect` en el componente padre

## Implementación técnica

### Arquitectura

La extensión utiliza un enfoque declarativo basado en Plugins de ProseMirror:

1. **Mark personalizado**: Define cómo se renderiza el texto copiable en HTML
2. **Plugin de ProseMirror**: Maneja los eventos de clic de forma declarativa
3. **Comando de Tiptap**: Permite aplicar/quitar el formato mediante `toggleClickToCopy()`

### Archivos creados/modificados

- **`src/components/tiptap-editor/extensions/click-to-copy.tsx`**: Extensión principal
- **`src/components/tiptap-editor/extensions.ts`**: Configuración de extensiones (agregada ClickToCopy)
- **`src/components/tiptap-editor/toolbar.tsx`**: Botón en la toolbar (menú "Más opciones")
- **`src/components/foro/HiloContenido.tsx`**: Event listener para copiar texto en páginas de lectura

## Uso

### Para usuarios del editor

1. Selecciona el texto que deseas hacer copiable
2. Abre el menú "Más opciones" (ícono de tres puntos) en la toolbar
3. Haz clic en "Texto copiable" (ícono de copiar)
4. El texto seleccionado ahora tendrá un fondo de color y será clickeable
5. Los lectores pueden hacer clic en el texto para copiarlo al portapapeles

### Para desarrolladores

```typescript
// Aplicar el formato programáticamente
editor.chain().focus().toggleClickToCopy().run()

// Verificar si el texto tiene el formato
editor.isActive('clickToCopy')

// Remover el formato
editor.chain().focus().toggleClickToCopy().run()
```

## Ventajas del enfoque declarativo

### Antes (con useEffect)
```typescript
useEffect(() => {
  const handleClick = (event: MouseEvent) => {
    // Lógica de manejo de clics
  }
  
  editorElement.addEventListener('click', handleClick)
  
  return () => {
    editorElement.removeEventListener('click', handleClick)
  }
}, [editor])
```

### Ahora (con Plugin de ProseMirror)
```typescript
addProseMirrorPlugins() {
  return [
    new Plugin({
      props: {
        handleDOMEvents: {
          click: (view, event) => {
            // Lógica de manejo de clics
          }
        }
      }
    })
  ]
}
```

### Beneficios

1. **Más declarativo**: La lógica está encapsulada en la extensión
2. **Mejor rendimiento**: No hay listeners duplicados
3. **Más mantenible**: No hay dependencias entre componentes
4. **Alineado con React**: Sigue las mejores prácticas de React
5. **Limpieza automática**: ProseMirror maneja la limpieza de eventos

## Estilos

El texto copiable usa las siguientes clases de Tailwind:

```css
cursor-copy /* Cursor de copiar */
rounded-md /* Bordes redondeados */
bg-primary/10 /* Fondo con color primario al 10% */
px-1.5 py-0.5 /* Padding */
text-primary /* Color de texto primario */
hover:bg-primary/20 /* Fondo más oscuro al hacer hover */
transition-colors /* Transición suave de colores */
```

## Casos de uso

- **Comandos de servidor**: Copiar comandos de Minecraft con un clic
- **Códigos de descuento**: Facilitar la copia de códigos promocionales
- **IPs de servidor**: Copiar direcciones IP rápidamente
- **Nombres de usuario**: Copiar nombres de jugadores o usuarios
- **Hashes o IDs**: Copiar identificadores largos fácilmente

## Ejemplo de contenido

```html
<p>
  Para conectarte al servidor, usa la IP: 
  <span data-click-to-copy="true" class="cursor-copy rounded-md bg-primary/10 px-1.5 py-0.5 text-primary hover:bg-primary/20 transition-colors">
    mc.ejemplo.com
  </span>
</p>
```

## Compatibilidad

- ✅ Funciona en todos los navegadores modernos con soporte para Clipboard API
- ✅ Compatible con otros formatos de Tiptap (negrita, cursiva, etc.)
- ✅ Se puede aplicar junto con otros marks
- ✅ Funciona en modo lectura y edición
- ✅ Funciona en hilos del foro (`/foro/hilos/[slug]`) y respuestas
- ✅ Funciona en cualquier lugar donde se use el componente `HiloContenido`

## Funcionamiento en páginas de lectura

En las páginas donde se visualiza el contenido (como `/foro/hilos/[slug]`), el HTML se renderiza sin el editor de Tiptap activo. Para que la funcionalidad de copiar funcione en estos casos, el componente `HiloContenido` incluye un event listener que:

1. Escucha clics en todo el contenido renderizado
2. Detecta si el elemento clickeado tiene el atributo `data-click-to-copy="true"`
3. Copia el texto al portapapeles y muestra una notificación

Este enfoque garantiza que la funcionalidad funcione tanto en el editor como en las páginas de lectura.

## Notas técnicas

### En el editor (Tiptap)
- Usa un **Plugin de ProseMirror** con `handleDOMEvents`
- El plugin retorna `true` cuando maneja un clic, `false` en caso contrario
- Se integra directamente con el ciclo de vida del editor

### En páginas de lectura
- Usa un **useEffect** con event listener en el componente `HiloContenido`
- El listener se limpia automáticamente cuando el componente se desmonta
- Se re-registra cuando cambia el contenido HTML

### General
- La extensión usa `toast` de `sonner` para las notificaciones
- El evento de clic se maneja con `preventDefault()` y `stopPropagation()` para evitar conflictos
- El texto se copia usando `navigator.clipboard.writeText()`
