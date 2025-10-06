# 🎨 Guía del ThemeTogglerButton

## 📋 Descripción

El `ThemeTogglerButton` es un componente mejorado para cambiar entre temas con soporte para:
- ✅ Modo claro, oscuro y **sistema**
- ✅ Múltiples variantes visuales
- ✅ Diferentes tamaños
- ✅ Dirección horizontal/vertical (para variante expand)
- ✅ Configuración flexible de modos disponibles

---

## 🚀 Uso Básico

### **Importación**
```tsx
import { ThemeToggleButton } from "@/lib/theme"
// o con el tipo
import { ThemeToggleButton, type ThemeToggleButtonProps } from "@/lib/theme"
```

### **Ejemplo Simple**
```tsx
export default function Header() {
  return (
    <header>
      <ThemeToggleButton />
    </header>
  )
}
```

---

## 🎨 Variantes

### **1. Icon (Default)**
Solo icono que rota entre los modos disponibles.

```tsx
<ThemeToggleButton variant="icon" />
```

### **2. Switch**
Toggle switch estilo iOS.

```tsx
<ThemeToggleButton variant="switch" />
```

### **3. Power**
Botón circular con efectos de brillo.

```tsx
<ThemeToggleButton variant="power" />
```

### **4. Expand**
Botón que expande para mostrar todas las opciones disponibles.

```tsx
<ThemeToggleButton variant="expand" />
```

---

## 📏 Tamaños

### **Small (sm)**
```tsx
<ThemeToggleButton size="sm" />
```

### **Medium (md)** - Default
```tsx
<ThemeToggleButton size="md" />
```

### **Large (lg)**
```tsx
<ThemeToggleButton size="lg" />
```

---

## 🔄 Modos Disponibles

### **Solo Light/Dark** (Default)
```tsx
<ThemeToggleButton modes={["light", "dark"]} />
```

### **Con Modo Sistema**
```tsx
<ThemeToggleButton modes={["light", "dark", "system"]} />
```

Cuando incluyes "system", el botón:
- Muestra un icono de Monitor cuando está en modo sistema
- Respeta la preferencia del sistema operativo
- Cambia automáticamente si el usuario cambia el tema del sistema

---

## 📐 Dirección (Solo para variante Expand)

### **Horizontal** (Default)
Los botones se expanden horizontalmente debajo del botón principal.

```tsx
<ThemeToggleButton 
  variant="expand" 
  direction="horizontal" 
/>
```

### **Vertical**
Los botones se expanden verticalmente a la derecha del botón principal.

```tsx
<ThemeToggleButton 
  variant="expand" 
  direction="vertical" 
/>
```

---

## 🎯 Ejemplos Completos

### **Header con Modo Sistema**
```tsx
import { ThemeToggleButton } from "@/lib/theme"

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1>Mi App</h1>
        <ThemeToggleButton 
          variant="expand"
          modes={["light", "dark", "system"]}
          size="md"
        />
      </div>
    </header>
  )
}
```

### **Sidebar con Switch**
```tsx
import { ThemeToggleButton } from "@/lib/theme"

export function Sidebar() {
  return (
    <aside className="w-64 p-4">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Tema</p>
        <ThemeToggleButton 
          variant="switch"
          size="lg"
          modes={["light", "dark"]}
        />
      </div>
    </aside>
  )
}
```

### **Settings con Expand Vertical**
```tsx
import { ThemeToggleButton } from "@/lib/theme"

export function Settings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Apariencia</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona el tema de la aplicación
          </p>
        </div>
        <ThemeToggleButton 
          variant="expand"
          direction="vertical"
          modes={["light", "dark", "system"]}
          size="md"
        />
      </div>
    </div>
  )
}
```

### **Botón Power Grande**
```tsx
import { ThemeToggleButton } from "@/lib/theme"

export function ThemeControl() {
  return (
    <div className="flex justify-center p-8">
      <ThemeToggleButton 
        variant="power"
        size="lg"
        modes={["light", "dark"]}
      />
    </div>
  )
}
```

---

## 🎨 Personalización con className

Puedes agregar clases personalizadas:

```tsx
<ThemeToggleButton 
  variant="icon"
  className="border-2 border-primary"
/>
```

---

## 📊 Props Completas

```tsx
interface ThemeTogglerButtonProps {
  variant?: "default" | "icon" | "switch" | "power" | "expand"
  size?: "sm" | "md" | "lg"
  direction?: "horizontal" | "vertical"
  modes?: ("light" | "dark" | "system")[]
  className?: string
}
```

### **Valores por Defecto**
```tsx
{
  variant: "icon",
  size: "md",
  direction: "horizontal",
  modes: ["light", "dark"],
  className: undefined
}
```

---

## 🔍 Comportamiento

### **Ciclo de Temas**
El botón cicla entre los modos disponibles en orden:
- Con `modes={["light", "dark"]}`: light → dark → light
- Con `modes={["light", "dark", "system"]}`: light → dark → system → light

### **Modo Sistema**
Cuando el tema está en "system":
- El icono muestra un Monitor
- El tema real se determina por `prefers-color-scheme` del navegador
- Si el usuario cambia el tema del sistema, la app se actualiza automáticamente

### **Persistencia**
- El tema seleccionado se guarda en `localStorage`
- Se mantiene entre sesiones
- La key es `mc-community-theme`

---

## 🎭 Iconos Usados

- **Sun** (☀️): Modo claro
- **Moon** (🌙): Modo oscuro
- **Monitor** (🖥️): Modo sistema

---

## ✨ Características Especiales

### **Variante Expand**
- Muestra un menú desplegable con todas las opciones
- Se cierra automáticamente al seleccionar
- Resalta la opción activa
- Soporta dirección horizontal y vertical

### **Variante Power**
- Efectos de brillo en modo claro
- Animación de presión al hacer clic
- Tamaños adaptativos

### **Variante Switch**
- Animación suave de deslizamiento
- Gradientes según el tema
- Iconos dentro del slider

---

## 🧪 Testing

```tsx
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { ThemeToggleButton } from '@/lib/theme'

test('cambia entre temas', () => {
  render(
    <ThemeProvider>
      <ThemeToggleButton modes={["light", "dark", "system"]} />
    </ThemeProvider>
  )
  
  const button = screen.getByRole('button')
  expect(button).toBeInTheDocument()
})
```

---

## 🎉 Conclusión

El `ThemeTogglerButton` es un componente flexible y completo para manejar el cambio de tema en tu aplicación. Con soporte para modo sistema, múltiples variantes y tamaños, se adapta a cualquier diseño.

**¡Disfruta del nuevo diseño!** 🎨
