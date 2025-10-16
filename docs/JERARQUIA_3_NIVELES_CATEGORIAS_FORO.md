# Implementación de Jerarquía de 3 Niveles en Categorías del Foro

## 📋 Resumen

Se ha implementado exitosamente un sistema completo de jerarquía de 3 niveles para las categorías del foro, con una interfaz de usuario mejorada basada en acordeones anidados y funcionalidad completa de drag & drop.

## 🎯 Objetivos Completados

✅ **Nivel 1**: Categorías principales (sin padre)
✅ **Nivel 2**: Subcategorías (hijas de nivel 1)
✅ **Nivel 3**: Sub-subcategorías (hijas de nivel 2)

## 🏗️ Arquitectura de la Solución

### 1. Estructura de Datos

```typescript
interface CategoriaPlana {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  color?: string | null;
  icono?: string | null;
  parent_id?: string | null;
  nivel?: number;  // 1, 2 o 3
  orden?: number;
  es_activa?: boolean;
  total_hilos?: number;
}

interface CategoriaArbol extends CategoriaPlana {
  subcategorias?: CategoriaArbol[];
  children?: CategoriaArbol[]; // Alias para compatibilidad
}
```

### 2. Flujo de Datos

```
Base de Datos (lista plana)
    ↓
API (/api/admin/foro/categorias)
    ↓
useValidatedCategories (validación con Zod)
    ↓
construirArbolCategorias (transformación a árbol)
    ↓
Componentes de UI (Accordion anidado)
```

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/lib/foro/categorias-utils.ts`**
   - Funciones de utilidad para trabajar con categorías
   - Transformación de lista plana a árbol
   - Búsqueda recursiva
   - Validación de jerarquía

2. **`src/components/admin/foro/GestorCategoriasNuevo.tsx`**
   - Componente principal con acordeones anidados
   - Drag & drop en estructura jerárquica
   - Badges visuales de nivel
   - Formulario mejorado con cálculo automático de nivel

3. **`src/app/api/admin/foro/categorias/reordenar/route.ts`**
   - Endpoint para actualizar el orden de categorías
   - Validación con Zod
   - Autenticación y autorización

### Archivos Modificados

1. **`src/components/admin/foro/GestorCategorias.tsx`**
   - Actualizado filtro para permitir categorías de nivel 1 y 2 como padres
   - Cálculo automático de nivel basado en el padre
   - Validación mejorada en el Select

2. **`src/components/foro/ForoSidebar.tsx`**
   - Componente `CategoryItem` ahora es recursivo
   - Soporta renderizado de 3 niveles automáticamente

3. **`src/components/foro/CrearHiloForm.tsx`**
   - Función `formatCategory` recursiva
   - Función `findCategoryById` recursiva
   - Soporte completo para 3 niveles

4. **`src/app/admin/foro/page.tsx`**
   - Actualizado import para usar `GestorCategoriasNuevo`

## 🔧 Funcionalidades Implementadas

### 1. Formulario de Categorías

#### Características:
- ✅ Selección de categoría padre (nivel 1 o 2)
- ✅ Cálculo automático de nivel
- ✅ Validación de nivel máximo (3)
- ✅ Feedback visual con emojis y badges
- ✅ Prevención de auto-referencia

#### Ejemplo de Uso:

```typescript
// Crear categoría principal (Nivel 1)
{
  nombre: "General",
  slug: "general",
  parent_id: null,
  nivel: 1  // Calculado automáticamente
}

// Crear subcategoría (Nivel 2)
{
  nombre: "Ayuda",
  slug: "ayuda",
  parent_id: "uuid-de-general",
  nivel: 2  // Calculado automáticamente
}

// Crear sub-subcategoría (Nivel 3)
{
  nombre: "FAQ",
  slug: "faq",
  parent_id: "uuid-de-ayuda",
  nivel: 3  // Calculado automáticamente
}
```

### 2. Interfaz con Acordeones Anidados

#### Características:
- ✅ Visualización jerárquica clara
- ✅ Expansión/colapso de subcategorías
- ✅ Badges de nivel con colores distintivos
- ✅ Indicadores visuales de jerarquía
- ✅ Contador de subcategorías

#### Estructura Visual:

```
📁 General (Principal)
  ↳ 📂 Ayuda (Subcategoría)
      ↳ 📄 FAQ (Sub-Subcategoría)
      ↳ 📄 Tutoriales (Sub-Subcategoría)
  ↳ 📂 Anuncios (Subcategoría)
```

### 3. Drag & Drop Jerárquico

#### Características:
- ✅ Reordenar dentro del mismo nivel
- ✅ Reordenar dentro del mismo padre
- ✅ Actualización automática en base de datos
- ✅ Feedback visual durante el arrastre
- ✅ Persistencia del orden

#### Limitaciones:
- ❌ No se puede mover entre diferentes padres (requiere edición)
- ❌ No se puede cambiar el nivel arrastrando

### 4. Visualización en el Foro

#### `/foro` - Sidebar
```typescript
// ForoSidebar es recursivo automáticamente
<CategoryItem category={categoria} isRoot={false} />
```

#### `/foro/crear-hilo` - Selector de Categoría
```typescript
// CategorySelector renderiza recursivamente
{categories.map((category) => renderCategory(category))}
```

## 🎨 Diseño Visual

### Badges de Nivel

| Nivel | Color | Emoji | Label |
|-------|-------|-------|-------|
| 1 | Azul (`bg-blue-500`) | 📁 | Principal |
| 2 | Verde (`bg-green-500`) | 📂 | Subcategoría |
| 3 | Morado (`bg-purple-500`) | 📄 | Sub-Subcategoría |

### Indicadores Visuales

- **Color de categoría**: Círculo de color personalizado
- **Icono**: Emoji personalizable
- **Slug**: Badge con fuente monoespaciada
- **Total de hilos**: Icono de carpeta + contador
- **Estado**: Badge "Inactiva" si `es_activa = false`

## 🔍 Funciones de Utilidad

### `construirArbolCategorias()`

Transforma una lista plana en estructura de árbol.

```typescript
const categoriasPlanas = [
  { id: '1', nombre: 'General', parent_id: null, nivel: 1 },
  { id: '2', nombre: 'Ayuda', parent_id: '1', nivel: 2 },
  { id: '3', nombre: 'FAQ', parent_id: '2', nivel: 3 }
];

const arbol = construirArbolCategorias(categoriasPlanas);
// Resultado: Árbol jerárquico con subcategorias anidadas
```

### `encontrarCategoriaPorId()`

Búsqueda recursiva en el árbol.

```typescript
const categoria = encontrarCategoriaPorId('3', arbol);
// Encuentra la categoría incluso en nivel 3
```

### `obtenerRutaCategoria()`

Obtiene el camino completo desde la raíz.

```typescript
const ruta = obtenerRutaCategoria('3', categoriasPlanas);
// Resultado: [General, Ayuda, FAQ]
```

### `esDescendiente()`

Valida relaciones para evitar referencias circulares.

```typescript
const esHija = esDescendiente('3', '1', categoriasPlanas);
// Resultado: true (FAQ es descendiente de General)
```

## 🔐 Validación y Seguridad

### Validación en el Formulario

```typescript
// Cálculo automático de nivel
const nivelCalculado = useMemo(() => {
  if (!formData.parent_id) return 1;
  const padre = categorias.find(c => c.id === formData.parent_id);
  return padre ? (padre.nivel || 1) + 1 : 1;
}, [formData.parent_id, categorias]);

// Filtro de categorías padre posibles
const categoriasPadrePosibles = useMemo(() => {
  return categorias.filter(c => {
    if (categoriaEditando && c.id === categoriaEditando.id) return false;
    return c.nivel === 1 || c.nivel === 2; // Solo nivel 1 y 2 pueden ser padres
  });
}, [categorias, categoriaEditando]);
```

### Validación en la API

```typescript
const categoriaSchema = z.object({
  nombre: z.string().min(1).trim(),
  slug: z.string().min(1).trim(),
  parent_id: z.string().uuid().nullable().optional(),
  nivel: z.number().int().min(1).max(3), // Máximo 3 niveles
  // ... otros campos
});
```

## 📊 Casos de Uso

### Caso 1: Crear Categoría Principal

1. Ir a `/admin/foro` → pestaña "Categorías"
2. Clic en "Nueva Categoría"
3. Llenar formulario:
   - Nombre: "Discusión General"
   - Slug: "discusion-general" (auto-generado)
   - Categoría Padre: "Ninguna (Principal - Nivel 1)"
4. Guardar
5. Resultado: Categoría de nivel 1 creada

### Caso 2: Crear Subcategoría

1. Abrir formulario de nueva categoría
2. Llenar formulario:
   - Nombre: "Preguntas Frecuentes"
   - Slug: "preguntas-frecuentes"
   - Categoría Padre: "📁 Discusión General (Nivel 1)"
3. Guardar
4. Resultado: Categoría de nivel 2 creada, anidada bajo "Discusión General"

### Caso 3: Crear Sub-Subcategoría

1. Abrir formulario de nueva categoría
2. Llenar formulario:
   - Nombre: "Instalación"
   - Slug: "instalacion"
   - Categoría Padre: "📂 Preguntas Frecuentes (Nivel 2)"
3. Guardar
4. Resultado: Categoría de nivel 3 creada, anidada bajo "Preguntas Frecuentes"

### Caso 4: Reordenar Categorías

1. En la vista de acordeones, arrastrar el icono de grip (⋮⋮)
2. Soltar en la nueva posición
3. El orden se actualiza automáticamente en la base de datos

## 🧪 Testing

### Test Manual 1: Crear Jerarquía Completa

```
✅ Crear categoría nivel 1: "General"
✅ Crear categoría nivel 2: "Ayuda" (padre: General)
✅ Crear categoría nivel 3: "FAQ" (padre: Ayuda)
✅ Verificar que aparece en /foro
✅ Verificar que aparece en /foro/crear-hilo
✅ Verificar que aparece en /admin/foro con acordeones
```

### Test Manual 2: Validación de Nivel Máximo

```
✅ Intentar crear categoría nivel 4
❌ Debe fallar: No hay categorías de nivel 3 en el selector de padre
✅ El sistema previene la creación de nivel 4
```

### Test Manual 3: Drag & Drop

```
✅ Arrastrar categoría nivel 1 a nueva posición
✅ Verificar que el orden se actualiza
✅ Arrastrar subcategoría dentro del mismo padre
✅ Verificar persistencia tras recargar
```

## 🐛 Problemas Conocidos y Soluciones

### Problema 1: Select.Item con valor vacío

**Error**: `A <Select.Item /> must have a value prop that is not an empty string`

**Solución**: Usar valor especial `"none"` en lugar de string vacío
```typescript
<SelectItem value="none">Ninguna (Principal)</SelectItem>
```

### Problema 2: Categorías padre no aparecen

**Causa**: Filtro incorrecto o datos no cargados

**Solución**: 
- Verificar que `useValidatedCategories` retorna datos
- Verificar que el filtro incluye nivel 1 y 2
- Agregar logs de debug

### Problema 3: Nivel no se calcula correctamente

**Causa**: `parent_id` no está actualizado en el estado

**Solución**: Usar `useMemo` para calcular nivel reactivamente
```typescript
const nivelCalculado = useMemo(() => {
  if (!formData.parent_id) return 1;
  const padre = categorias.find(c => c.id === formData.parent_id);
  return padre ? (padre.nivel || 1) + 1 : 1;
}, [formData.parent_id, categorias]);
```

## 📈 Mejoras Futuras

### Corto Plazo
- [ ] Permitir mover categorías entre padres con drag & drop
- [ ] Agregar confirmación al cambiar de nivel
- [ ] Mostrar preview de la jerarquía antes de guardar

### Mediano Plazo
- [ ] Importar/exportar estructura de categorías (JSON)
- [ ] Duplicar categoría con toda su jerarquía
- [ ] Historial de cambios en la jerarquía

### Largo Plazo
- [ ] Límite configurable de niveles (actualmente fijo en 3)
- [ ] Permisos por nivel de categoría
- [ ] Analytics por nivel de jerarquía

## 🔗 Referencias

### Archivos Clave

- **Utilidades**: `src/lib/foro/categorias-utils.ts`
- **Componente Principal**: `src/components/admin/foro/GestorCategoriasNuevo.tsx`
- **API**: `src/app/api/admin/foro/categorias/route.ts`
- **Hook de Validación**: `src/hooks/useValidatedCategories.ts`

### Documentación Relacionada

- [API Route Handler](./API_FORO_CATEGORIAS_ROUTE.md)
- [Fix Select Empty Value](./FIX_SELECT_EMPTY_VALUE_FINAL.md)
- [Validación con Zod](./REFACTOR_CATEGORIA_FORM_VALIDACION.md)

## ✅ Checklist de Implementación

- [x] Habilitar 3 niveles en formulario de categorías
- [x] Actualizar selector en /foro para 3 niveles
- [x] Actualizar selector en /foro/crear-hilo para 3 niveles
- [x] Crear funciones de utilidad para árbol
- [x] Refactorizar GestorCategorias con Accordion
- [x] Implementar drag & drop en estructura anidada
- [x] Actualizar diseño visual con badges de nivel
- [x] Crear documentación completa
- [x] Probar funcionalidad end-to-end

## 🎉 Resultado Final

Se ha implementado exitosamente un sistema completo de jerarquía de 3 niveles para las categorías del foro con:

✅ **Interfaz intuitiva** con acordeones anidados
✅ **Drag & drop** funcional en todos los niveles
✅ **Validación robusta** en frontend y backend
✅ **Cálculo automático** de nivel
✅ **Feedback visual** claro con badges y colores
✅ **Soporte completo** en todas las vistas del foro
✅ **Documentación completa** y ejemplos de uso

El sistema está listo para producción y puede manejar estructuras complejas de categorías con hasta 3 niveles de profundidad.
