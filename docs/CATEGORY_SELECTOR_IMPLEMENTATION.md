# Implementación del Componente CategorySelector

## Resumen

Se ha creado un nuevo componente reutilizable `CategorySelector` para la selección de categorías jerárquicas en el foro, utilizando shadcn/ui y siguiendo las mejores prácticas de React y Next.js.

## Archivos Creados

### 1. `src/components/foro/CategorySelector.tsx`

Componente principal que maneja la selección de categorías con las siguientes características:

**Props:**
- `categories: Category[]` - Array de categorías con estructura jerárquica
- `selectedCategoryId?: string` - ID de la categoría actualmente seleccionada
- `onSelectCategory: (category: Category) => void` - Callback ejecutado al seleccionar una categoría

**Características:**
- ✅ Utiliza el componente `Collapsible` de shadcn/ui para categorías con subcategorías
- ✅ Ícono `ChevronRight` de lucide-react que rota al expandir/colapsar
- ✅ Separación clara entre acción de expandir y acción de seleccionar
- ✅ Tanto categorías principales como subcategorías son seleccionables
- ✅ Estado interno para manejar categorías expandidas/colapsadas
- ✅ Sangría visual para indicar jerarquía (1.5rem por nivel)
- ✅ Estilo distintivo para el ítem seleccionado (bg-accent)
- ✅ Soporte para colores personalizados por categoría
- ✅ Animaciones suaves con Tailwind CSS

**Interfaz TypeScript:**
```typescript
interface Category {
  id: string;
  nombre: string;
  subcategories?: Category[];
  color?: string;
}
```

## Archivos Modificados

### 1. `src/components/foro/CrearHiloForm.tsx`

**Cambios realizados:**

1. **Importaciones actualizadas:**
   - Agregado: `CategorySelector` y tipo `Category`
   - Removido: Componentes `Select` no utilizados

2. **Tipo de datos actualizado:**
   - Cambiado de `hijos` a `subcategorias` para coincidir con `getForoCategorias()`

3. **Nuevo estado:**
   - `selectedCategory: Category | null` - Almacena la categoría seleccionada completa

4. **Nuevas funciones:**
   - `formattedCategories` - Convierte las categorías de la BD al formato del componente
   - `findCategoryById()` - Busca una categoría por ID (incluyendo subcategorías)
   - `handleCategorySelect()` - Maneja la selección de categoría

5. **UI simplificada:**
   - Reemplazada la implementación manual de categorías con `CategorySelector`
   - Mejorada la visualización de la categoría seleccionada
   - Aumentada la altura máxima del contenedor a 400px

## Estructura de Datos

Las categorías se organizan jerárquicamente en la base de datos:

```typescript
// Ejemplo de estructura
[
  {
    id: "uuid-1",
    nombre: "Juegos",
    color: "#3b82f6",
    subcategorias: [
      {
        id: "uuid-2",
        nombre: "Minecraft",
        color: "#3b82f6"
      },
      {
        id: "uuid-3",
        nombre: "Delta Force",
        color: "#10f494"
      }
    ]
  },
  {
    id: "uuid-4",
    nombre: "Tecnología",
    color: "#3b82f6",
    subcategorias: [
      {
        id: "uuid-5",
        nombre: "IA",
        color: "#3b82f6"
      }
    ]
  }
]
```

## Flujo de Funcionamiento

1. **Carga inicial:**
   - `getForoCategorias()` obtiene las categorías de la BD con estructura jerárquica
   - Las categorías se pasan al componente `CrearHiloForm`

2. **Transformación de datos:**
   - `formattedCategories` convierte las categorías al formato esperado por `CategorySelector`
   - Se mapean los campos: `subcategorias` → `subcategories`

3. **Selección de categoría:**
   - Usuario hace clic en una categoría (principal o subcategoría)
   - `handleCategorySelect()` actualiza el estado con la categoría completa
   - Se guarda el ID en `categoriaId` para el envío del formulario
   - La UI muestra la categoría seleccionada con opción de cambiar

4. **Expansión/Colapso:**
   - Usuario hace clic en el ícono `ChevronRight`
   - El componente `Collapsible` maneja el estado de expansión
   - El ícono rota 90° con animación suave

## Ventajas de la Implementación

1. **Reutilizable:** El componente `CategorySelector` puede usarse en otras partes de la aplicación
2. **Tipo seguro:** Interfaces TypeScript bien definidas
3. **Accesible:** Uso de componentes shadcn/ui con accesibilidad integrada
4. **Mantenible:** Código limpio y bien organizado
5. **Escalable:** Soporta múltiples niveles de jerarquía
6. **UX mejorada:** Separación clara entre acciones de expandir y seleccionar
7. **Visual:** Colores personalizados y animaciones suaves

## Uso en Otras Páginas

Para usar el componente en otras partes de la aplicación:

```tsx
import { CategorySelector, type Category } from '@/components/foro/CategorySelector';

function MiComponente() {
  const [selectedId, setSelectedId] = useState<string>('');
  
  const handleSelect = (category: Category) => {
    setSelectedId(category.id);
    console.log('Categoría seleccionada:', category);
  };

  return (
    <CategorySelector
      categories={misCategorias}
      selectedCategoryId={selectedId}
      onSelectCategory={handleSelect}
    />
  );
}
```

## Próximas Mejoras Potenciales

- [ ] Agregar búsqueda/filtrado de categorías
- [ ] Soporte para selección múltiple
- [ ] Agregar contador de hilos por categoría
- [ ] Implementar drag & drop para reordenar (admin)
- [ ] Agregar iconos personalizados por categoría
- [ ] Modo compacto/expandido
