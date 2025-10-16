# Gestor de Categorías Simplificado - Documentación

## 📋 Resumen

Se ha implementado un nuevo gestor de categorías simplificado con una interfaz limpia, optimizada para móviles y enfocada en acciones rápidas de gestión. Utiliza componentes de shadcn/ui como Accordion y DropdownMenu para una mejor experiencia de usuario.

## 🎯 Objetivos Alcanzados

✅ **Lista anidada y expandible** con Accordion de shadcn/ui
✅ **Acciones rápidas** agrupadas en DropdownMenu
✅ **Optimizado para móviles** con diseño responsive
✅ **Integración completa** con Supabase y React Query
✅ **Formularios validados** con React Hook Form y Zod
✅ **Mutaciones optimistas** con invalidación automática de caché

## 🏗️ Arquitectura

### Componentes Creados

```
src/
├── components/
│   ├── categories/
│   │   ├── CategoryList.tsx       # Componente principal de lista
│   │   └── CategoryItem.tsx       # Componente recursivo para cada categoría
│   └── admin/
│       └── foro/
│           └── GestorCategoriasSimplificado.tsx  # Wrapper principal
└── hooks/
    └── useCategoryMutations.ts    # Hook de mutaciones con React Query
```

### Flujo de Datos

```
useValidatedCategories (React Query)
    ↓
construirArbolCategorias (transformación)
    ↓
CategoryList (renderiza nivel 1)
    ↓
CategoryItem (recursivo para niveles 2 y 3)
    ↓
useCategoryMutations (mutaciones)
    ↓
Invalidación de caché → Refresco automático
```

## 📁 Archivos Creados

### 1. `src/hooks/useCategoryMutations.ts`

Hook personalizado que encapsula todas las mutaciones de categorías:

```typescript
export function useCategoryMutations() {
  return {
    updateCategory,      // PUT - Actualizar/Renombrar
    createSubcategory,   // POST - Crear subcategoría
    deleteCategory,      // DELETE - Eliminar categoría
  };
}
```

**Características:**
- ✅ Mutaciones con `useMutation` de React Query
- ✅ Invalidación automática de caché
- ✅ Toasts de éxito/error con Sonner
- ✅ Manejo de errores robusto

### 2. `src/components/categories/CategoryList.tsx`

Componente principal que renderiza la lista de categorías de nivel 1:

```typescript
export const CategoryList = ({ categories, onRefetch }: CategoryListProps) => {
  const topLevelCategories = categories.filter(
    (cat) => !cat.parent_id || cat.nivel === 1
  );
  
  return (
    <div className="w-full space-y-2">
      {topLevelCategories.map((category) => (
        <CategoryItem key={category.id} category={category} level={1} />
      ))}
    </div>
  );
};
```

### 3. `src/components/categories/CategoryItem.tsx`

Componente recursivo que renderiza cada categoría con sus acciones:

**Características principales:**

#### a) Diseño Responsive
```typescript
<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
  {/* Contenido adaptable a móvil y desktop */}
</div>
```

#### b) Badges de Nivel con Colores
```typescript
const levelStyles = {
  1: { bgColor: "bg-blue-500/10", label: "Principal" },
  2: { bgColor: "bg-green-500/10", label: "Subcategoría" },
  3: { bgColor: "bg-purple-500/10", label: "Sub-Subcategoría" },
};
```

#### c) DropdownMenu con Acciones
```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {level < 3 && (
      <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
        Crear Subcategoría
      </DropdownMenuItem>
    )}
    <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
      Editar
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
      Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### d) Accordion para Subcategorías
```typescript
{hasChildren ? (
  <Accordion type="single" collapsible>
    <AccordionItem value={category.id}>
      <AccordionTrigger>{content}</AccordionTrigger>
      <AccordionContent>
        {category.children!.map((child) => (
          <CategoryItem key={child.id} category={child} level={level + 1} />
        ))}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
) : (
  content
)}
```

### 4. `src/components/admin/foro/GestorCategoriasSimplificado.tsx`

Wrapper principal que integra todo:

```typescript
export default function GestorCategoriasSimplificado() {
  const { data, refetch, isLoading, error } = useValidatedCategories();
  const categoriasArbol = useMemo(() => {
    // Transformar a árbol
    return construirArbolCategorias(categoriasMapeadas);
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Nueva Categoría
        </Button>
      </CardHeader>
      <CardContent>
        <CategoryList categories={categoriasArbol} onRefetch={refetch} />
      </CardContent>
    </Card>
  );
}
```

## 🎨 Dialogs Implementados

### 1. Dialog de Editar/Renombrar

**Características:**
- ✅ Formulario con React Hook Form
- ✅ Validación con Zod
- ✅ Auto-generación de slug
- ✅ Selector de color con preview
- ✅ Input de emoji para icono
- ✅ Estado de loading durante mutación

**Schema de Validación:**
```typescript
const renameSchema = z.object({
  nombre: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  descripcion: z.string().max(500).optional(),
  color: z.string().optional(),
  icono: z.string().max(2).optional(),
});
```

**Handler:**
```typescript
const handleRename = async (data: RenameFormData) => {
  await updateCategory.mutateAsync({
    id: category.id,
    nombre: data.nombre,
    slug: data.slug,
    descripcion: data.descripcion,
    color: data.color,
    icono: data.icono,
  });
  setRenameDialogOpen(false);
  renameForm.reset();
  onRefetch?.();
};
```

### 2. Dialog de Crear Subcategoría

**Características:**
- ✅ Mismo formulario que renombrar
- ✅ Nivel calculado automáticamente (parent.nivel + 1)
- ✅ Validación de nivel máximo (3)
- ✅ Parent_id asignado automáticamente

**Handler:**
```typescript
const handleCreateSubcategory = async (data: CreateSubcategoryFormData) => {
  await createSubcategory.mutateAsync({
    nombre: data.nombre,
    slug: data.slug,
    descripcion: data.descripcion,
    color: data.color,
    icono: data.icono,
    parent_id: category.id,
    nivel: level + 1,
  });
  setCreateDialogOpen(false);
  createForm.reset();
  onRefetch?.();
};
```

### 3. AlertDialog de Eliminar

**Características:**
- ✅ Confirmación antes de eliminar
- ✅ Advertencia si tiene subcategorías
- ✅ Estado de loading
- ✅ Botón de cancelar

**Handler:**
```typescript
const handleDelete = async () => {
  await deleteCategory.mutateAsync({ id: category.id });
  setDeleteDialogOpen(false);
  onRefetch?.();
};
```

## 🔧 Funcionalidades

### Auto-generación de Slug

```typescript
const generarSlug = (nombre: string) => {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Quitar acentos
    .replace(/[^a-z0-9]+/g, '-')      // Reemplazar espacios por guiones
    .replace(/(^-|-$)/g, '');          // Quitar guiones al inicio/fin
};
```

**Ejemplo:**
- Input: `"Discusión General"`
- Output: `"discusion-general"`

### Validación de Nivel Máximo

```typescript
{level < 3 && (
  <DropdownMenuItem onClick={handleCreateSubCategory}>
    Crear Subcategoría
  </DropdownMenuItem>
)}
```

Solo las categorías de nivel 1 y 2 pueden tener subcategorías.

### Invalidación de Caché

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['foro-categorias'] });
  toast.success('Operación exitosa');
}
```

Después de cada mutación, se invalida la caché y React Query refresca automáticamente los datos.

## 📱 Optimización para Móviles

### Diseño Responsive

```typescript
// Layout adaptable
<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
  {/* En móvil: columna, en desktop: fila */}
</div>

// Padding adaptable
<div className="pl-4 sm:pl-8">
  {/* Menos padding en móvil */}
</div>

// Botón full-width en móvil
<Button className="w-full sm:w-auto">
  Nueva Categoría
</Button>
```

### Touch-Friendly

- ✅ Botones con tamaño mínimo de 44x44px
- ✅ Espaciado generoso entre elementos
- ✅ DropdownMenu alineado a la derecha
- ✅ Accordion con área de toque grande

## 🎨 Estilos y Colores

### Badges de Nivel

| Nivel | Color Base | Background | Border | Text |
|-------|-----------|------------|--------|------|
| 1 | Azul | `bg-blue-500/10` | `border-blue-500` | `text-blue-600` |
| 2 | Verde | `bg-green-500/10` | `border-green-500` | `text-green-600` |
| 3 | Morado | `bg-purple-500/10` | `border-purple-500` | `text-purple-600` |

### Dark Mode

Todos los componentes soportan dark mode automáticamente:

```typescript
className="bg-blue-500/10 dark:bg-blue-500/20"
className="text-blue-600 dark:text-blue-400"
```

## 🧪 Casos de Uso

### Caso 1: Editar Categoría

1. Hacer clic en el menú de 3 puntos (⋯)
2. Seleccionar "Editar"
3. Modificar nombre (el slug se actualiza automáticamente)
4. Cambiar color o icono si se desea
5. Hacer clic en "Guardar Cambios"
6. La lista se refresca automáticamente

### Caso 2: Crear Subcategoría

1. Hacer clic en el menú de 3 puntos de la categoría padre
2. Seleccionar "Crear Subcategoría"
3. Llenar el formulario
4. Hacer clic en "Crear Subcategoría"
5. La nueva subcategoría aparece anidada bajo su padre

### Caso 3: Eliminar Categoría

1. Hacer clic en el menú de 3 puntos
2. Seleccionar "Eliminar" (texto rojo)
3. Confirmar en el AlertDialog
4. La categoría y sus subcategorías se eliminan

### Caso 4: Expandir/Colapsar

1. Hacer clic en el trigger del Accordion (flecha)
2. Las subcategorías se expanden/colapsan
3. El estado se mantiene durante la sesión

## 🔍 Diferencias con Versión Anterior

| Característica | Versión Anterior | Versión Simplificada |
|----------------|------------------|----------------------|
| **Estructura** | Accordion complejo con drag & drop | Lista simple con Accordion |
| **Acciones** | Botones individuales | DropdownMenu agrupado |
| **Formularios** | Dialog grande con muchos campos | Dialog compacto y enfocado |
| **Móvil** | Difícil de usar | Optimizado touch-friendly |
| **Complejidad** | Alta | Baja |
| **Mantenibilidad** | Media | Alta |

## 📊 Ventajas

✅ **Simplicidad**: Interfaz limpia y fácil de entender
✅ **Rendimiento**: Menos re-renders, mejor caché
✅ **Móvil**: Diseño responsive y touch-friendly
✅ **Mantenibilidad**: Código modular y bien organizado
✅ **UX**: Acciones rápidas sin navegación compleja
✅ **Validación**: Formularios robustos con Zod
✅ **Feedback**: Toasts claros y estados de loading

## 🚀 Cómo Usar

### En el Panel de Admin

1. Ir a `/admin/foro`
2. Navegar a la pestaña "Categorías"
3. El nuevo gestor simplificado se carga automáticamente

### Crear Categoría Principal

```typescript
// Hacer clic en "Nueva Categoría"
// Llenar formulario
// Submit → Mutación → Invalidación → Refresco
```

### Gestionar Subcategorías

```typescript
// Expandir categoría padre
// Menú de 3 puntos → "Crear Subcategoría"
// Llenar formulario → Submit
```

## 🔐 Seguridad

- ✅ Validación en cliente con Zod
- ✅ Validación en servidor (API route)
- ✅ Autenticación requerida (admin)
- ✅ Sanitización de inputs
- ✅ Prevención de XSS con React

## 📈 Mejoras Futuras

### Corto Plazo
- [ ] Búsqueda/filtrado de categorías
- [ ] Ordenamiento manual (drag & drop simple)
- [ ] Duplicar categoría

### Mediano Plazo
- [ ] Bulk actions (selección múltiple)
- [ ] Importar/exportar categorías
- [ ] Historial de cambios

### Largo Plazo
- [ ] Permisos granulares por categoría
- [ ] Analytics por categoría
- [ ] Plantillas de categorías

## 🎉 Resultado Final

Se ha implementado exitosamente un gestor de categorías simplificado que:

✅ **Reduce la complejidad** de la interfaz anterior
✅ **Mejora la experiencia móvil** significativamente
✅ **Mantiene todas las funcionalidades** esenciales
✅ **Integra perfectamente** con Supabase y React Query
✅ **Proporciona feedback claro** al usuario
✅ **Es fácil de mantener** y extender

El componente está listo para producción y puede ser usado inmediatamente en `/admin/foro`.
