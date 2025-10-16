import { useQuery } from '@tanstack/react-query'

export interface CategoriaNoticia {
  id: number | string;
  nombre: string;
  slug: string;
  descripcion?: string;
  orden?: number;
  color?: string;
  es_activa?: boolean;
  noticias_count?: number;
  parent_id?: string | null;
  categoria_padre_id?: string | null;
  categoria_padre?: {
    id: string;
    nombre: string;
  } | null;
  nivel?: number;
  hijos?: CategoriaNoticia[];
}

/**
 * Valida que una categoría tenga un ID válido
 */
function esIdValido(id: any): boolean {
  if (id === null || id === undefined || id === '') {
    return false
  }
  
  // Si es string, verificar que no esté vacío después de trim
  if (typeof id === 'string' && id.trim() === '') {
    return false
  }
  
  return true
}

/**
 * Filtra y valida las categorías, eliminando aquellas con datos inválidos
 */
function validarYFiltrarCategorias(categorias: any[]): CategoriaNoticia[] {
  const categoriasValidas: CategoriaNoticia[] = []
  const categoriasInvalidas: any[] = []
  
  for (const categoria of categorias) {
    // Validar que tenga un ID válido
    if (!esIdValido(categoria.id)) {
      categoriasInvalidas.push({
        ...categoria,
        razon: 'ID nulo, undefined o vacío'
      })
      continue
    }
    
    // Validar que tenga nombre
    if (!categoria.nombre || typeof categoria.nombre !== 'string' || categoria.nombre.trim() === '') {
      categoriasInvalidas.push({
        ...categoria,
        razon: 'Nombre inválido o vacío'
      })
      continue
    }
    
    // Validar que tenga slug
    if (!categoria.slug || typeof categoria.slug !== 'string' || categoria.slug.trim() === '') {
      categoriasInvalidas.push({
        ...categoria,
        razon: 'Slug inválido o vacío'
      })
      continue
    }
    
    // Si pasa todas las validaciones, agregar a la lista de válidas
    categoriasValidas.push(categoria)
  }
  
  // En desarrollo, mostrar advertencias si hay datos corruptos
  if (process.env.NODE_ENV === 'development' && categoriasInvalidas.length > 0) {
    console.warn(
      `⚠️ Se detectaron ${categoriasInvalidas.length} categoría(s) con datos inválidos:`,
      categoriasInvalidas
    )
    console.warn('Estas categorías fueron filtradas y no se mostrarán en la interfaz.')
  }
  
  return categoriasValidas
}

/**
 * Hook para obtener categorías con validación de datos
 */
export function useCategorias(admin: boolean = false) {
  return useQuery({
    queryKey: ['categorias', admin],
    queryFn: async () => {
      const url = admin 
        ? '/api/admin/noticias/categorias?admin=true'
        : '/api/noticias/categorias'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar las categorías')
      }
      
      const data = await response.json()
      
      // Validar y filtrar datos antes de retornarlos
      const categoriasValidas = validarYFiltrarCategorias(data)
      
      return categoriasValidas
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para obtener categorías padre válidas (excluyendo la categoría actual y sus descendientes)
 */
export function useCategoriasPadre(
  categoriaActualId?: string | number,
  maxNivel: number = 2
) {
  const { data: todasCategorias, ...rest } = useCategorias(true)
  
  // Función para calcular niveles
  const calcularNiveles = (categorias: CategoriaNoticia[]): CategoriaNoticia[] => {
    const categoriasMap = new Map<string, CategoriaNoticia>()
    
    // Crear mapa de categorías
    categorias.forEach(cat => {
      categoriasMap.set(cat.id.toString(), { ...cat, nivel: 1, hijos: [] })
    })
    
    // Calcular niveles
    const calcularNivel = (categoriaId: string, visitados = new Set<string>()): number => {
      if (visitados.has(categoriaId)) return 1 // Evitar ciclos
      
      const categoria = categoriasMap.get(categoriaId)
      if (!categoria || !categoria.parent_id) return 1
      
      visitados.add(categoriaId)
      const nivelPadre = calcularNivel(categoria.parent_id, visitados)
      visitados.delete(categoriaId)
      
      return nivelPadre + 1
    }
    
    // Asignar niveles y organizar hijos
    categorias.forEach(cat => {
      const categoria = categoriasMap.get(cat.id.toString())!
      categoria.nivel = calcularNivel(cat.id.toString())
      
      if (cat.parent_id) {
        const padre = categoriasMap.get(cat.parent_id)
        if (padre) {
          padre.hijos = padre.hijos || []
          padre.hijos.push(categoria)
        }
      }
    })
    
    return Array.from(categoriasMap.values())
  }
  
  // Función para obtener descendientes
  const obtenerDescendientes = (categoriaId: string, categorias: CategoriaNoticia[]): string[] => {
    const descendientes: string[] = []
    
    const buscarHijos = (padreId: string) => {
      categorias.forEach(cat => {
        if (cat.parent_id === padreId) {
          descendientes.push(cat.id.toString())
          buscarHijos(cat.id.toString())
        }
      })
    }
    
    buscarHijos(categoriaId)
    return descendientes
  }
  
  // Procesar categorías si están disponibles
  const categoriasPadre = todasCategorias ? (() => {
    // Calcular niveles
    const categoriasConNivel = calcularNiveles(todasCategorias)
    
    // Filtrar categoría actual y sus descendientes
    let categoriasFiltradas = categoriasConNivel
    if (categoriaActualId) {
      const descendientes = obtenerDescendientes(categoriaActualId.toString(), categoriasConNivel)
      categoriasFiltradas = categoriasConNivel.filter(cat => 
        cat.id.toString() !== categoriaActualId.toString() && 
        !descendientes.includes(cat.id.toString())
      )
    }
    
    // Solo permitir categorías hasta el nivel máximo especificado
    return categoriasFiltradas.filter(cat => (cat.nivel || 1) <= maxNivel)
  })() : []
  
  return {
    ...rest,
    data: categoriasPadre,
  }
}
