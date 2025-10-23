import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// Esquema de validación con Zod
const categoriaSchema = z.object({
  id: z.string().min(1, 'El ID no puede estar vacío'),
  nombre: z.string().min(1, 'El nombre no puede estar vacío'),
  slug: z.string().min(1, 'El slug no puede estar vacío'),
  descripcion: z.string().optional(),
  color: z.string().nullable().optional(),
  icono: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
  nivel: z.number().optional(),
  es_activa: z.boolean().optional(),
  orden: z.number().optional(),
  total_hilos: z.number().optional(),
})

const categoriasArraySchema = z.array(categoriaSchema)

export type CategoriaForo = z.infer<typeof categoriaSchema>

/**
 * Valida y filtra las categorías usando Zod
 * Registra advertencias en desarrollo para datos inválidos
 */
function validarCategorias(data: unknown): CategoriaForo[] {
  try {
    // Mapear hilos_total a total_hilos si es necesario
    const dataMapeada = Array.isArray(data)
      ? data.map((item: any) => ({
          ...item,
          total_hilos: item.total_hilos ?? item.hilos_total ?? 0,
        }))
      : data;
    
    // Intentar validar todo el array
    return categoriasArraySchema.parse(dataMapeada)
  } catch (error) {
    // Si falla la validación completa, validar elemento por elemento
    if (!Array.isArray(data)) {
      console.error('❌ Los datos recibidos no son un array:', data)
      return []
    }

    const categoriasValidas: CategoriaForo[] = []
    const categoriasInvalidas: Array<{ index: number; data: unknown; error: string }> = []

    data.forEach((item, index) => {
      // Mapear hilos_total a total_hilos
      const itemMapeado = {
        ...item,
        total_hilos: item.total_hilos ?? item.hilos_total ?? 0,
      }
      const result = categoriaSchema.safeParse(itemMapeado)
      
      if (result.success) {
        categoriasValidas.push(result.data)
      } else {
        categoriasInvalidas.push({
          index,
          data: item,
          error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        })
      }
    })

    // En desarrollo, mostrar advertencias detalladas
    if (process.env.NODE_ENV === 'development' && categoriasInvalidas.length > 0) {
      console.warn(
        `⚠️ Se detectaron ${categoriasInvalidas.length} categoría(s) con datos inválidos:`
      )
      categoriasInvalidas.forEach(({ index, data, error }) => {
        console.warn(`  - Índice ${index}:`, data)
        console.warn(`    Errores: ${error}`)
      })
      console.warn('Estas categorías fueron filtradas y no se mostrarán en la interfaz.')
    }

    return categoriasValidas
  }
}

/**
 * Hook personalizado para obtener categorías del foro con validación automática
 */
export function useValidatedCategories() {
  return useQuery({
    queryKey: ['foro-categorias'],
    queryFn: async () => {
      const response = await fetch('/api/admin/foro/categorias')
      
      if (!response.ok) {
        throw new Error('Error al cargar las categorías del foro')
      }
      
      const data = await response.json()
      
      // Validar y filtrar datos antes de retornarlos
      const categoriasValidas = validarCategorias(data)
      
      return categoriasValidas
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para obtener solo las categorías principales (nivel 1)
 * Útil para seleccionar categorías padre
 */
export function useValidatedPrincipalCategories() {
  const { data, ...rest } = useValidatedCategories()
  
  const categoriasPrincipales = data?.filter(c => c.nivel === 1) ?? []
  
  return {
    ...rest,
    data: categoriasPrincipales,
  }
}
