# 🎨 Guía de Personalización - Cortina de Tema

## 📍 Archivo de Configuración

**Ubicación:** `src/lib/theme/theme-config.ts`

Este archivo centraliza **toda** la personalización de la animación de cambio de tema.

---

## 🎯 Personalización Rápida

### 1. **Hacer la Cortina Más Fina**

```typescript
// En src/lib/theme/theme-config.ts

curtain: {
  height: "200px",  // ← Franja fina de 200px
  // ...
}
```

**Opciones de altura:**
- `"100vh"` - Pantalla completa (por defecto)
- `"50vh"` - Mitad de la pantalla
- `"200px"` - Franja fina de 200 píxeles
- `"30vh"` - 30% de la altura
- `"150px"` - Franja muy fina
- `"10vh"` - Franja mínima

### 2. **Cambiar Velocidad de Animación**

```typescript
animation: {
  duration: 400,  // ← Más rápido (antes: 600ms)
  // ...
}
```

**Recomendaciones:**
- `300ms` - Muy rápido
- `400ms` - Rápido
- `600ms` - Normal (actual)
- `800ms` - Lento
- `1000ms` - Muy lento

### 3. **Cambiar Colores**

```typescript
curtain: {
  colors: {
    light: "#f0f0f0",  // Gris claro en vez de blanco
    dark: "#1a1a1a",   // Gris oscuro en vez de negro
  },
  // ...
}
```

### 4. **Agregar Gradiente**

```typescript
curtain: {
  gradient: "linear-gradient(to bottom, #000000, #1a1a1a)",
  // ...
}
```

**Ejemplos de gradientes:**
```typescript
// Gradiente oscuro elegante
gradient: "linear-gradient(to bottom, #000000, #0a0a0a, #000000)"

// Gradiente claro suave
gradient: "linear-gradient(to bottom, #ffffff, #f5f5f5, #ffffff)"

// Gradiente con color
gradient: "linear-gradient(to bottom, #1e40af, #3b82f6)"
```

### 5. **Agregar Blur (Desenfoque)**

```typescript
effects: {
  blur: true,           // ← Activar blur
  blurAmount: "12px",   // ← Cantidad de desenfoque
  // ...
}
```

### 6. **Agregar Sombra**

```typescript
effects: {
  shadow: true,
  shadowValue: "0 20px 60px rgba(0, 0, 0, 0.5)",
  // ...
}
```

### 7. **Cambiar Curva de Animación (Easing)**

```typescript
animation: {
  easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",  // Con rebote
  // ...
}
```

**Opciones populares:**
```typescript
// Suave (actual)
easing: "cubic-bezier(0.4, 0, 0.2, 1)"

// Con rebote
easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"

// Entrada rápida, salida lenta
easing: "cubic-bezier(0.4, 0, 1, 1)"

// Entrada lenta, salida rápida
easing: "cubic-bezier(0, 0, 0.2, 1)"

// Linear (velocidad constante)
easing: "linear"
```

---

## 🎨 Ejemplos de Configuraciones

### Cortina Fina y Rápida
```typescript
export const themeConfig = {
  animation: {
    duration: 400,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  curtain: {
    height: "150px",  // Franja fina
    colors: {
      light: "#ffffff",
      dark: "#000000",
    },
    gradient: null,
  },
  effects: {
    blur: false,
    blurAmount: "8px",
    shadow: false,
    shadowValue: "0 10px 50px rgba(0, 0, 0, 0.3)",
  },
}
```

### Cortina con Gradiente y Blur
```typescript
export const themeConfig = {
  animation: {
    duration: 600,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  curtain: {
    height: "100vh",
    colors: {
      light: "#ffffff",
      dark: "#000000",
    },
    gradient: "linear-gradient(to bottom, #000000, #1a1a1a, #000000)",
  },
  effects: {
    blur: true,
    blurAmount: "16px",
    shadow: true,
    shadowValue: "0 20px 80px rgba(0, 0, 0, 0.6)",
  },
}
```

### Cortina Minimalista
```typescript
export const themeConfig = {
  animation: {
    duration: 300,
    easing: "linear",
  },
  curtain: {
    height: "10vh",  // Muy fina
    colors: {
      light: "#e5e5e5",
      dark: "#1a1a1a",
    },
    gradient: null,
  },
  effects: {
    blur: false,
    blurAmount: "8px",
    shadow: false,
    shadowValue: "0 10px 50px rgba(0, 0, 0, 0.3)",
  },
}
```

---

## 🔧 Cómo Aplicar los Cambios

1. **Abre el archivo de configuración:**
   ```
   src/lib/theme/theme-config.ts
   ```

2. **Modifica los valores** según tus preferencias

3. **Guarda el archivo** - Los cambios se aplicarán automáticamente

4. **Recarga la página** y prueba el botón de cambio de tema

---

## 💡 Tips y Recomendaciones

### Para una cortina más sutil:
- Usa altura pequeña (`150px` - `200px`)
- Duración rápida (`300ms` - `400ms`)
- Sin efectos adicionales

### Para una transición dramática:
- Usa pantalla completa (`100vh`)
- Duración media (`600ms` - `800ms`)
- Agrega gradiente y blur

### Para mejor rendimiento:
- Evita blur en dispositivos móviles
- Usa duraciones cortas (`300ms` - `400ms`)
- Mantén la altura razonable

### Para accesibilidad:
- No uses duraciones muy largas (> 1000ms)
- El sistema respeta automáticamente `prefers-reduced-motion`
- Los colores sólidos son más accesibles que gradientes complejos

---

## 🐛 Solución de Problemas

### La cortina es muy lenta
→ Reduce `animation.duration` a `400ms` o menos

### La cortina no se ve
→ Verifica que `curtain.height` no sea `"0px"`

### El blur no funciona
→ Algunos navegadores antiguos no soportan `backdrop-filter`

### Los colores no cambian
→ Asegúrate de que `curtain.gradient` sea `null` si quieres usar colores sólidos

---

## 📝 Notas Importantes

- ⚠️ **Todos los cambios en `theme-config.ts` se aplican globalmente**
- ✅ **No necesitas modificar otros archivos**
- 🔄 **Los cambios requieren recargar la página**
- 🎯 **El sistema respeta automáticamente `prefers-reduced-motion`**

---

**Última actualización:** 2025-10-04  
**Versión:** 1.0.0
