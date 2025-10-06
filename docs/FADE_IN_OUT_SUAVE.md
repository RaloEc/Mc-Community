# Fade In/Out Suave - Configuración Actual

## ✨ Configuración Aplicada

### Duración: **700ms** (Fade Lento)
- Transición lenta y muy visible
- Fade suave y relajado
- Perfecto para apreciar el cambio de tema

### Timing: **ease-in-out**
- Entrada suave (fade in)
- Salida suave (fade out)
- Transición natural y elegante

## 🎯 Efecto Visual

Cuando cambias de tema:

```
Tema Claro → Tema Oscuro
     ↓
1. Elementos hacen FADE OUT (se desvanecen)
2. Colores cambian durante el fade
3. Elementos hacen FADE IN (aparecen)
     ↓
Transición LENTA de 700ms
```

## 📐 Propiedades con Fade

Todas estas propiedades tienen fade in/out:

- ✅ **Colores de fondo** - `background-color`
- ✅ **Colores de texto** - `color`
- ✅ **Bordes** - `border-color`
- ✅ **Sombras** - `box-shadow`
- ✅ **Opacidad** - `opacity`
- ✅ **SVG e iconos** - `fill`, `stroke`

## 🔧 Personalizar Velocidad

Edita `src/lib/theme/theme-config.ts`:

```typescript
export const themeConfig = {
  transitionDuration: 700,      // ← Fade lento actual
  transitionTiming: "ease-in-out",
}
```

### Opciones Recomendadas

```typescript
// Más rápido
transitionDuration: 300

// Moderado
transitionDuration: 500

// Lento y suave (actual)
transitionDuration: 700  // ← Configuración actual

// Muy lento
transitionDuration: 1000
```

## 💡 Tips

### Para fade más notorio:
- Aumenta duración a `800ms`
- Mantén `ease-in-out`

### Para fade más sutil:
- Reduce duración a `300ms`
- Mantén `ease-in-out`

### Para fade lineal (sin aceleración):
```typescript
transitionTiming: "linear"
```

## 🎨 Ejemplo Visual

```
Tiempo: 0ms ───────────── 350ms ───────────── 700ms

Opacidad:
Tema viejo:  100% ──────→ 50% ──────→ 0%
Tema nuevo:    0% ──────→ 50% ──────→ 100%

Resultado: Transición LENTA, suave y muy visible
```

## ✅ Ventajas de 700ms + ease-in-out

1. **Muy visible** - El fade es claramente perceptible
2. **Suave** - Transición relajada y elegante
3. **Agradable** - Entrada y salida muy suave
4. **Natural** - Cambio gradual y sin brusquedad

---

**Configuración actual:** 700ms con ease-in-out (Fade Lento)  
**Última actualización:** 2025-10-04
