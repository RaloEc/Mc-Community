# Sistema de Tema con Fade Suave

## 📋 Descripción

Sistema simple y elegante de cambio de tema con transición **fade suave** aplicada a todos los elementos simultáneamente.

## ✨ Características

- ✅ **Fade in/out suave** - Transición elegante de 500ms con ease-in-out
- ✅ **Todos los elementos cambian juntos** - Efecto limpio y sincronizado
- ✅ **Sin animaciones complejas** - Solo CSS puro
- ✅ **Respeta `prefers-reduced-motion`** - Accesible
- ✅ **GPU-friendly** - Optimizado para rendimiento
- ✅ **Configuración simple** - Un solo archivo

## 🎨 Cómo Funciona

Cuando cambias de tema:
1. Se aplica el nuevo tema al DOM
2. **Todos** los elementos hacen fade in/out simultáneamente
3. Transición suave de 500ms con ease-in-out
4. Resultado: cambio limpio, suave y elegante

**Fade in/out:** Los elementos hacen fade out con el tema anterior y fade in con el nuevo tema, creando una transición muy suave y natural.

## 🔧 Configuración

**Archivo:** `src/lib/theme/theme-config.ts`

```typescript
export const themeConfig = {
  // Duración del fade in/out (en milisegundos)
  transitionDuration: 500,  // Cambiar a 300, 800, etc.
  
  // Función de timing para fade suave
  transitionTiming: "ease-in-out",  // Recomendado para fade in/out
}
```

### Opciones de Duración

```typescript
transitionDuration: 200   // Muy rápido
transitionDuration: 300   // Rápido y elegante
transitionDuration: 500   // Suave (recomendado para fade visible)
transitionDuration: 800   // Muy suave y notorio
```

### Opciones de Timing

```typescript
transitionTiming: "ease"           // Suave
transitionTiming: "ease-in-out"    // Fade in/out suave (recomendado)
transitionTiming: "linear"         // Velocidad constante
```

**Recomendación:** Para un fade in/out suave y visible, usa `500ms` con `ease-in-out`.

## 🚀 Uso

### Botón de Cambio de Tema

```tsx
import { ThemeToggleButton } from '@/lib/theme'

export function MyComponent() {
  return <ThemeToggleButton />
}
```

### Hook Personalizado

```tsx
import { useThemeToggle } from '@/lib/theme'

export function MyComponent() {
  const { theme, toggleTheme } = useThemeToggle()
  
  return (
    <button onClick={toggleTheme}>
      Tema actual: {theme}
    </button>
  )
}
```

## 📦 Estructura

```
src/lib/theme/
├── ThemeProvider.tsx          # Provider de next-themes
├── ThemeToggleButton.tsx      # Botón de cambio
├── useThemeToggle.ts          # Hook simple
├── theme-config.ts            # Configuración
└── index.ts                   # Exportaciones
```

## 🎯 CSS Aplicado

El fade se aplica automáticamente a:
- ✅ Colores de fondo
- ✅ Colores de texto
- ✅ Bordes
- ✅ Sombras
- ✅ SVG e iconos
- ✅ Todos los elementos HTML

```css
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity;
  transition-duration: 500ms;
  transition-timing-function: ease-in-out;
}
```

**Propiedades con transición:**
- `background-color` - Fondos
- `border-color` - Bordes
- `color` - Texto
- `fill` y `stroke` - SVG e iconos
- `opacity` - Opacidad (clave para fade in/out)
- `box-shadow` - Sombras

## ♿ Accesibilidad

El sistema respeta automáticamente `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
  }
}
```

## 🔄 Migración desde Sistema Anterior

Si venías del sistema con wipe/cortina:

### Cambios Principales
- ❌ **Eliminado:** Overlay con animación wipe
- ❌ **Eliminado:** Animaciones complejas
- ❌ **Eliminado:** Configuración de cortina
- ✅ **Nuevo:** Fade simple con CSS
- ✅ **Nuevo:** Configuración minimalista

### Compatibilidad
- ✅ Los componentes existentes siguen funcionando
- ✅ `ThemeToggleButton` funciona igual
- ✅ `useThemeToggle` simplificado pero compatible
- ✅ No requiere cambios en tu código

## 💡 Ventajas

1. **Simple** - Solo CSS, sin JavaScript complejo
2. **Rápido** - Sin overlays ni elementos adicionales
3. **Elegante** - Todos los elementos cambian juntos
4. **Mantenible** - Menos código, menos bugs
5. **Performante** - GPU-friendly, sin reflows

## 📝 Notas

- La duración se configura en `theme-config.ts`
- El fade se aplica automáticamente a **todos** los elementos
- No requiere clases especiales ni configuración adicional
- Funciona en todos los navegadores modernos

---

**Última actualización:** 2025-10-04  
**Versión:** 3.0.0 (Fade Simple)
