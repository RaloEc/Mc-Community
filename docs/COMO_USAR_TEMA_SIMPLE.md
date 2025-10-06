# 📖 Cómo Usar el Sistema de Tema Simple

## 🎯 Resumen

El sistema de tema ahora es **simple e instantáneo**. No hay animaciones, solo un cambio directo entre tema claro y oscuro.

---

## 🚀 Uso Básico

### **1. Usar el Botón de Tema**

```tsx
import { ThemeToggleButton } from "@/lib/theme"

function MyComponent() {
  return <ThemeToggleButton />
}
```

### **2. Cambiar el Tema Programáticamente**

```tsx
import { useTheme } from "next-themes"

function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }
  
  return (
    <button onClick={toggleTheme}>
      Cambiar a {theme === "light" ? "oscuro" : "claro"}
    </button>
  )
}
```

### **3. Obtener el Tema Actual**

```tsx
import { useTheme } from "next-themes"

function MyComponent() {
  const { theme, resolvedTheme } = useTheme()
  
  // theme: "light" | "dark" | "system"
  // resolvedTheme: "light" | "dark" (resuelve "system")
  
  return (
    <div>
      Tema actual: {resolvedTheme}
    </div>
  )
}
```

---

## 🎨 Variantes del Botón de Tema

### **Icon (Default)**
Solo icono, ideal para headers y toolbars.

```tsx
<ThemeToggleButton variant="icon" />
```

### **Switch**
Toggle switch estilo iOS, más visual.

```tsx
<ThemeToggleButton variant="switch" />
```

### **Power**
Botón circular con efectos de brillo, más llamativo.

```tsx
<ThemeToggleButton variant="power" />
```

### **Con Label**
Mostrar texto junto al icono.

```tsx
<ThemeToggleButton variant="icon" showLabel={true} />
```

### **Con Clases Personalizadas**
```tsx
<ThemeToggleButton 
  variant="icon" 
  className="custom-class" 
/>
```

---

## 🎨 Estilos Condicionales por Tema

### **Usando Tailwind `dark:`**

```tsx
<div className="bg-white dark:bg-black text-gray-900 dark:text-white">
  Este div cambia de color según el tema
</div>
```

### **Usando CSS Variables**

```css
.my-component {
  background: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}
```

### **Usando el Hook `useTheme`**

```tsx
import { useTheme } from "next-themes"

function MyComponent() {
  const { resolvedTheme } = useTheme()
  
  return (
    <div style={{
      backgroundColor: resolvedTheme === "light" ? "#fff" : "#000"
    }}>
      Contenido
    </div>
  )
}
```

---

## 🔧 Configuración Avanzada

### **Cambiar Tema por Defecto**

Edita `src/lib/theme/ThemeProvider.tsx`:

```tsx
<NextThemesProvider
  defaultTheme="dark" // Cambiar aquí
  // ...
>
```

### **Deshabilitar Detección del Sistema**

```tsx
<NextThemesProvider
  enableSystem={false} // Deshabilitar
  // ...
>
```

### **Cambiar Key de localStorage**

```tsx
<NextThemesProvider
  storageKey="mi-app-theme" // Cambiar aquí
  // ...
>
```

---

## 📝 Ejemplos Completos

### **Header con Botón de Tema**

```tsx
import { ThemeToggleButton } from "@/lib/theme"

export function Header() {
  return (
    <header className="bg-white dark:bg-black border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1>Mi App</h1>
        <ThemeToggleButton variant="switch" />
      </div>
    </header>
  )
}
```

### **Componente con Estilos por Tema**

```tsx
import { useTheme } from "next-themes"

export function Card({ children }) {
  const { resolvedTheme } = useTheme()
  
  return (
    <div className={`
      p-4 rounded-lg border
      ${resolvedTheme === "light" 
        ? "bg-white border-gray-200" 
        : "bg-black border-gray-800"
      }
    `}>
      {children}
    </div>
  )
}
```

### **Botón Personalizado de Tema**

```tsx
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export function CustomThemeButton() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {theme === "light" ? <Moon /> : <Sun />}
    </button>
  )
}
```

---

## 🎨 Variables CSS Disponibles

### **Tema Claro**
```css
--background: 0 0% 100%;
--foreground: 0 0% 3.9%;
--primary: 217 91% 60%;
--border: 0 0% 89.8%;
/* ... más variables */
```

### **Tema Oscuro (AMOLED)**
```css
--background: 0 0% 0%;
--foreground: 0 0% 95%;
--primary: 217 91% 60%;
--border: 0 0% 14.9%;
/* ... más variables */
```

### **Uso en Componentes**
```tsx
<div style={{
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
  borderColor: 'hsl(var(--border))'
}}>
  Contenido
</div>
```

---

## 🧪 Testing

### **Verificar que el Tema Cambia**

```tsx
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { ThemeToggleButton } from '@/lib/theme'

test('cambia el tema al hacer clic', () => {
  render(
    <ThemeProvider>
      <ThemeToggleButton />
    </ThemeProvider>
  )
  
  const button = screen.getByRole('button')
  fireEvent.click(button)
  
  // Verificar cambio de tema
})
```

---

## ❓ FAQ

### **¿Por qué no hay animación?**
Se eliminó el sistema de animación "wipe" para simplificar el código y mejorar el rendimiento. El cambio ahora es instantáneo.

### **¿Cómo persiste el tema?**
next-themes guarda automáticamente la preferencia en `localStorage` con la key `mc-community-theme`.

### **¿Funciona con SSR?**
Sí, next-themes maneja correctamente SSR y evita FOUC (Flash of Unstyled Content).

### **¿Puedo agregar más temas?**
Sí, edita `themes={["light", "dark"]}` en `ThemeProvider.tsx` y agrega los estilos correspondientes.

### **¿Cómo detecto el tema del sistema?**
```tsx
const { systemTheme } = useTheme()
// "light" | "dark"
```

---

## 🎉 Conclusión

El sistema de tema es ahora:
- ✅ **Simple**: Sin complejidad innecesaria
- ✅ **Rápido**: Cambio instantáneo
- ✅ **Funcional**: Todo lo que necesitas
- ✅ **Fácil de usar**: API clara y directa

**¡Disfruta del cambio de tema sin complicaciones!** 🎨
