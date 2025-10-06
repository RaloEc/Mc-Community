# 🎬 Animación de Cortina Progresiva - Resumen de Cambios

## 🔄 Cambio de Comportamiento

### ❌ Antes (Problema)
- La cortina bajaba y **a la mitad** cambiaba el tema de golpe
- El tema se aplicaba todo de una vez
- La cortina no siempre cubría toda la página
- Efecto visual: "salto" brusco del tema

### ✅ Ahora (Solución)
- El tema cambia **inmediatamente** en el DOM
- La cortina del tema **anterior** cubre la pantalla
- La cortina baja **revelando progresivamente** el nuevo tema
- Efecto visual: el tema se aplica gradualmente mientras la cortina baja

## 🎯 Cómo Funciona

```
1. Usuario hace clic en cambiar tema
   ↓
2. El tema cambia INMEDIATAMENTE en el DOM (invisible para el usuario)
   ↓
3. La cortina del tema ANTERIOR aparece cubriendo toda la pantalla
   ↓
4. La cortina baja de arriba hacia abajo (0% → 100%)
   ↓
5. Mientras baja, va revelando el NUEVO tema progresivamente
   ↓
6. Cuando termina, la cortina desaparece
```

## 📐 Diagrama Visual

```
ANTES DEL CLIC:
┌─────────────────┐
│   Tema Claro    │
│   (visible)     │
└─────────────────┘

DESPUÉS DEL CLIC (inmediato):
┌─────────────────┐
│ Cortina Blanca  │  ← Cubre todo
│  (tema viejo)   │
└─────────────────┘
     (debajo)
┌─────────────────┐
│   Tema Oscuro   │  ← Ya aplicado pero oculto
│   (invisible)   │
└─────────────────┘

DURANTE ANIMACIÓN (cortina bajando):
┌─────────────────┐
│   Tema Oscuro   │  ← Revelado progresivamente
├─────────────────┤
│ Cortina Blanca  │  ← Bajando
│                 │
└─────────────────┘

AL FINAL:
┌─────────────────┐
│   Tema Oscuro   │
│   (visible)     │
└─────────────────┘
```

## 🔧 Cambios Técnicos Realizados

### 1. **ThemeWipeOverlay.tsx**
- Ahora usa el tema **opuesto** al objetivo para la cortina
- Si vas a oscuro → muestra cortina clara
- Si vas a claro → muestra cortina oscura
- Altura siempre `100vh` (pantalla completa)
- Animación: `theme-wipe-reveal` (0% → 100%)

### 2. **useThemeToggle.ts**
- Cambia el tema **inmediatamente** (sin setTimeout)
- No espera a la mitad de la animación
- La cortina se encarga de ocultar el cambio

### 3. **globals.css**
- Nueva animación `theme-wipe-reveal`:
  ```css
  @keyframes theme-wipe-reveal {
    0% { transform: translateY(0%); }
    100% { transform: translateY(100%); }
  }
  ```

### 4. **theme-config.ts**
- Duración por defecto: `500ms`
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Altura siempre `100vh` (no configurable)

## 🎨 Personalización

### Cambiar Velocidad
```typescript
// En theme-config.ts
animation: {
  duration: 300,  // Más rápido
  // o
  duration: 800,  // Más lento
}
```

### Cambiar Colores
```typescript
curtain: {
  colors: {
    light: "#f0f0f0",  // Gris claro en vez de blanco
    dark: "#1a1a1a",   // Gris oscuro en vez de negro
  },
}
```

### Agregar Gradiente
```typescript
curtain: {
  gradient: "linear-gradient(to bottom, #000000, #1a1a1a)",
}
```

### Agregar Blur
```typescript
effects: {
  blur: true,
  blurAmount: "12px",
}
```

## ✅ Ventajas de Este Enfoque

1. **Transición suave** - El tema se revela gradualmente
2. **Sin saltos** - No hay cambio brusco visible
3. **Cubre toda la página** - Siempre 100vh
4. **GPU-friendly** - Solo usa `transform`
5. **Configurable** - Fácil de personalizar

## 🐛 Problemas Resueltos

- ✅ La cortina ahora **siempre** recorre toda la página
- ✅ El tema se aplica **progresivamente** (no de golpe)
- ✅ No hay "salto" visible del tema
- ✅ La animación es más fluida y natural

## 📝 Notas Importantes

- La altura de la cortina **siempre** es `100vh` (no se puede cambiar)
- El parámetro `curtain.height` se mantiene por compatibilidad pero no se usa
- La cortina usa el color del tema **anterior**, no del nuevo
- El cambio de tema es instantáneo en el DOM, la cortina solo lo oculta

---

**Última actualización:** 2025-10-04  
**Versión:** 2.0.0 (Cortina Progresiva)
