# Refactorización: Formulario de Categorías con Validación de Datos

## 📋 Resumen

Se ha refactorizado el componente de formulario "Crear Categoría" para usar React Query con validación automática de datos inválidos del lado del cliente, evitando crasheos cuando la API retorna categorías con IDs nulos o vacíos.

## 🔧 Cambios Implementados

### 1. Hook Personalizado con React Query (`useCategorias.ts`)

**Ubicación:** `src/hooks/useCategorias.ts`

#### Características principales:

- **Validación automática de datos**: Filtra categorías con IDs nulos, undefined o vacíos
- **Advertencias en desarrollo**: Muestra `console.warn` cuando detecta datos corruptos
- **Caché inteligente**: 5 minutos de `staleTime`, 10 minutos de `gcTime`
- **Retry automático**: 2 reintentos en caso de error
- **Sin refetch en focus**: Evita peticiones innecesarias

#### Funciones de validación:

```typescript
function esIdValido(id: any): boolean {
  if (id === null || id === undefined || id === '') return false
  if (typeof id === 'string' && id.trim() === '') return false
  return true
}

function validarYFiltrarCategorias(categorias: any[]): CategoriaNoticia[] {
  // Valida:
  // - ID válido (no nulo, no vacío)
  // - Nombre válido (string no vacío)
  // - Slug válido (string no vacío)
  // Muestra console.warn en desarrollo con datos inválidos
}
```

#### Hooks exportados:

1. **`useCategorias(admin: boolean)`**
   - Obtiene todas las categorías con validación
   - Parámetro `admin`: true para endpoint admin, false para público

2. **`useCategoriasPadre(categoriaActualId?, maxNivel?)`**
   - Obtiene categorías válidas para ser padre
   - Excluye la categoría actual y sus descendientes (evita ciclos)
   - Filtra por nivel máximo (default: 2)
   - Calcula niveles jerárquicos automáticamente

### 2. Refactorización del Componente

**Archivo:** `src/app/admin/noticias/categorias/page.tsx`

#### Cambios en imports:

```typescript
// Antes: Sin React Query
import React, { useState, useEffect, useCallback, useRef } from 'react'

// Después: Con React Query y useMemo
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useCategoriasPadre, type CategoriaNoticia as CategoriaNoticiaImport } from '@/hooks/useCategorias'
```

#### Cambios en el componente `CategoriaForm`:

**Antes:**
```typescript
const [categoriasPadre, setCategoriasPadre] = useState<CategoriaNoticia[]>([])
const [loadingCategorias, setLoadingCategorias] = useState(false)

useEffect(() => {
  const fetchCategoriasPadre = async () => {
    setLoadingCategorias(true)
    try {
      const response = await fetch('/api/admin/noticias/categorias?admin=true')
      const data = await response.json()
      // ... lógica manual de filtrado y validación
      setCategoriasPadre(categoriasPadreValidas)
    } catch (error) {
      // manejo de errores
    } finally {
      setLoadingCategorias(false)
    }
  }
  fetchCategoriasPadre()
}, [])
```

**Después:**
```typescript
// Usar React Query con validación automática
const { 
  data: categoriasPadre = [], 
  isLoading: loadingCategorias,
  error: errorCategorias 
} = useCategoriasPadre(categoria?.id, 2)

// Manejo de errores separado
useEffect(() => {
  if (errorCategorias) {
    console.error('Error al cargar categorías padre:', errorCategorias)
    toast({
      description: 'Error al cargar las categorías disponibles',
      variant: "destructive"
    })
  }
}, [errorCategorias])
```

#### Optimización de filtrado:

**Antes:**
```typescript
const categoriasFiltradas = searchTerm
  ? categoriasPadre.filter(cat => 
      cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  : categoriasPadre;
```

**Después:**
```typescript
// Memoizado para evitar recálculos innecesarios
const categoriasFiltradas = useMemo(() => {
  if (!searchTerm) return categoriasPadre
  
  return categoriasPadre.filter(cat => 
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )
}, [categoriasPadre, searchTerm]);
```

## ✅ Beneficios

### 1. **Prevención de crasheos**
- ✅ Filtra automáticamente categorías con IDs inválidos
- ✅ Valida nombres y slugs antes de renderizar
- ✅ No se pasan datos corruptos al componente Select

### 2. **Debugging mejorado**
- ✅ `console.warn` en desarrollo muestra datos inválidos detectados
- ✅ Incluye la razón de invalidación para cada categoría
- ✅ Solo en desarrollo, no afecta producción

### 3. **Mejor rendimiento**
- ✅ Caché de React Query reduce peticiones al servidor
- ✅ `useMemo` evita recálculos innecesarios del filtrado
- ✅ Revalidación inteligente solo cuando es necesario

### 4. **Código más limpio**
- ✅ Lógica de validación centralizada en el hook
- ✅ Componente más simple y fácil de mantener
- ✅ Separación de responsabilidades clara

### 5. **Reutilización**
- ✅ Hook `useCategorias` puede usarse en otros componentes
- ✅ Validación consistente en toda la aplicación
- ✅ Fácil de extender con nuevas validaciones

## 🔍 Ejemplo de Validación

### Datos inválidos detectados:

```javascript
// Console en desarrollo:
⚠️ Se detectaron 2 categoría(s) con datos inválidos:
[
  {
    id: null,
    nombre: "Categoría sin ID",
    slug: "categoria-sin-id",
    razon: "ID nulo, undefined o vacío"
  },
  {
    id: "123",
    nombre: "",
    slug: "categoria-sin-nombre",
    razon: "Nombre inválido o vacío"
  }
]
Estas categorías fueron filtradas y no se mostrarán en la interfaz.
```

### Datos válidos procesados:

```javascript
// Solo estas categorías llegan al componente:
[
  {
    id: "1",
    nombre: "Noticias",
    slug: "noticias",
    nivel: 1
  },
  {
    id: "2",
    nombre: "Actualizaciones",
    slug: "actualizaciones",
    nivel: 1
  }
]
```

## 📝 Uso del Hook

### Ejemplo básico:

```typescript
import { useCategorias } from '@/hooks/useCategorias'

function MiComponente() {
  const { data: categorias, isLoading, error } = useCategorias(true)
  
  if (isLoading) return <div>Cargando...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <ul>
      {categorias.map(cat => (
        <li key={cat.id}>{cat.nombre}</li>
      ))}
    </ul>
  )
}
```

### Ejemplo con categorías padre:

```typescript
import { useCategoriasPadre } from '@/hooks/useCategorias'

function FormularioCategoria({ categoriaActual }) {
  // Obtiene categorías válidas para ser padre
  // Excluye la categoría actual y sus hijos
  // Solo nivel 1 y 2 (máximo 3 niveles de profundidad)
  const { 
    data: categoriasPadre, 
    isLoading 
  } = useCategoriasPadre(categoriaActual?.id, 2)
  
  return (
    <Select>
      {categoriasPadre.map(cat => (
        <Option key={cat.id} value={cat.id}>
          {cat.nombre} (Nivel {cat.nivel})
        </Option>
      ))}
    </Select>
  )
}
```

## 🧪 Testing

### Casos de prueba cubiertos:

1. ✅ Categorías con `id: null`
2. ✅ Categorías con `id: undefined`
3. ✅ Categorías con `id: ""`
4. ✅ Categorías con `id: "   "` (espacios)
5. ✅ Categorías sin nombre
6. ✅ Categorías sin slug
7. ✅ Categorías válidas se procesan correctamente

## 🚀 Próximos Pasos

### Mejoras opcionales:

1. **Validación de backend**: Agregar validación en la API para prevenir datos inválidos
2. **Sentry/Logging**: Enviar advertencias a un servicio de monitoreo en producción
3. **Tests unitarios**: Agregar tests para las funciones de validación
4. **TypeScript estricto**: Hacer el tipo `id` más estricto (solo `string` o `number`)

## 📚 Referencias

- [React Query Documentation](https://tanstack.com/query/latest)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [shadcn/ui Select Component](https://ui.shadcn.com/docs/components/select)
