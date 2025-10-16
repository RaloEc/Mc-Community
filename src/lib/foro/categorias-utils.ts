/**
 * Utilidades para trabajar con categorías del foro
 * Incluye funciones para transformar listas planas a estructuras de árbol
 */

export interface CategoriaPlana {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  color?: string | null;
  icono?: string | null;
  parent_id?: string | null;
  nivel?: number;
  orden?: number;
  es_activa?: boolean;
  total_hilos?: number;
  [key: string]: any; // Permitir propiedades adicionales
}

export interface CategoriaArbol extends CategoriaPlana {
  subcategorias?: CategoriaArbol[];
  children?: CategoriaArbol[]; // Alias para compatibilidad
}

/**
 * Transforma una lista plana de categorías en una estructura de árbol jerárquica
 * Soporta hasta 3 niveles de anidamiento
 * 
 * @param categorias - Array de categorías en formato plano
 * @returns Array de categorías en formato árbol (solo categorías de nivel 1 con sus hijas anidadas)
 * 
 * @example
 * const categoriasPlanas = [
 *   { id: '1', nombre: 'General', parent_id: null, nivel: 1 },
 *   { id: '2', nombre: 'Ayuda', parent_id: '1', nivel: 2 },
 *   { id: '3', nombre: 'FAQ', parent_id: '2', nivel: 3 }
 * ];
 * 
 * const arbol = construirArbolCategorias(categoriasPlanas);
 * // Resultado:
 * // [
 * //   {
 * //     id: '1',
 * //     nombre: 'General',
 * //     subcategorias: [
 * //       {
 * //         id: '2',
 * //         nombre: 'Ayuda',
 * //         subcategorias: [
 * //           { id: '3', nombre: 'FAQ', subcategorias: [] }
 * //         ]
 * //       }
 * //     ]
 * //   }
 * // ]
 */
export function construirArbolCategorias<T extends CategoriaPlana>(
  categorias: T[]
): CategoriaArbol[] {
  // Crear un mapa para acceso rápido por ID
  const categoriaMap = new Map<string, CategoriaArbol>();
  
  // Inicializar todas las categorías en el mapa
  categorias.forEach(cat => {
    categoriaMap.set(cat.id, {
      ...cat,
      subcategorias: [],
      children: [], // Alias para compatibilidad
    });
  });

  // Array para las categorías raíz (nivel 1)
  const raices: CategoriaArbol[] = [];

  // Construir el árbol
  categorias.forEach(cat => {
    const nodo = categoriaMap.get(cat.id);
    if (!nodo) return;

    if (!cat.parent_id || cat.nivel === 1) {
      // Es una categoría raíz
      raices.push(nodo);
    } else {
      // Es una subcategoría, agregarla a su padre
      const padre = categoriaMap.get(cat.parent_id);
      if (padre) {
        padre.subcategorias!.push(nodo);
        padre.children!.push(nodo); // Mantener alias sincronizado
      } else {
        // Si no se encuentra el padre, tratarla como raíz
        console.warn(`Categoría ${cat.id} tiene parent_id ${cat.parent_id} pero el padre no existe`);
        raices.push(nodo);
      }
    }
  });

  // Ordenar recursivamente por el campo 'orden'
  const ordenarRecursivamente = (cats: CategoriaArbol[]) => {
    cats.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    cats.forEach(cat => {
      if (cat.subcategorias && cat.subcategorias.length > 0) {
        ordenarRecursivamente(cat.subcategorias);
      }
    });
  };

  ordenarRecursivamente(raices);

  return raices;
}

/**
 * Aplana una estructura de árbol de categorías a una lista plana
 * Útil para operaciones que requieren iterar sobre todas las categorías
 * 
 * @param arbol - Array de categorías en formato árbol
 * @returns Array de categorías en formato plano
 */
export function aplanarArbolCategorias<T extends CategoriaArbol>(
  arbol: T[]
): CategoriaPlana[] {
  const resultado: CategoriaPlana[] = [];

  const aplanar = (cats: T[]) => {
    cats.forEach(cat => {
      // Agregar la categoría actual (sin subcategorias para evitar recursión infinita)
      const { subcategorias, children, ...catPlana } = cat;
      resultado.push(catPlana as unknown as CategoriaPlana);

      // Procesar subcategorías recursivamente
      if (cat.subcategorias && cat.subcategorias.length > 0) {
        aplanar(cat.subcategorias as T[]);
      }
    });
  };

  aplanar(arbol);
  return resultado;
}

/**
 * Encuentra una categoría por ID en una estructura de árbol
 * Búsqueda recursiva que soporta 3 niveles
 * 
 * @param id - ID de la categoría a buscar
 * @param categorias - Array de categorías en formato árbol
 * @returns La categoría encontrada o null
 */
export function encontrarCategoriaPorId<T extends CategoriaArbol>(
  id: string,
  categorias: T[]
): T | null {
  for (const cat of categorias) {
    if (cat.id === id) return cat;
    
    if (cat.subcategorias && cat.subcategorias.length > 0) {
      const encontrada = encontrarCategoriaPorId(id, cat.subcategorias as T[]);
      if (encontrada) return encontrada;
    }
  }
  
  return null;
}

/**
 * Obtiene todas las categorías padre de una categoría dada
 * Retorna el camino desde la raíz hasta la categoría
 * 
 * @param id - ID de la categoría
 * @param categorias - Array de categorías en formato plano
 * @returns Array con el camino de categorías padre (de raíz a categoría)
 */
export function obtenerRutaCategoria(
  id: string,
  categorias: CategoriaPlana[]
): CategoriaPlana[] {
  const ruta: CategoriaPlana[] = [];
  let categoriaActual = categorias.find(c => c.id === id);

  while (categoriaActual) {
    ruta.unshift(categoriaActual); // Agregar al inicio
    
    if (!categoriaActual.parent_id) break;
    
    categoriaActual = categorias.find(c => c.id === categoriaActual!.parent_id);
  }

  return ruta;
}

/**
 * Verifica si una categoría es descendiente de otra
 * Útil para validar que no se creen referencias circulares
 * 
 * @param categoriaId - ID de la categoría a verificar
 * @param posibleAncestroId - ID del posible ancestro
 * @param categorias - Array de categorías en formato plano
 * @returns true si categoriaId es descendiente de posibleAncestroId
 */
export function esDescendiente(
  categoriaId: string,
  posibleAncestroId: string,
  categorias: CategoriaPlana[]
): boolean {
  const ruta = obtenerRutaCategoria(categoriaId, categorias);
  return ruta.some(cat => cat.id === posibleAncestroId);
}

/**
 * Obtiene el nivel de una categoría basándose en su parent_id
 * Nivel 1: sin padre
 * Nivel 2: padre de nivel 1
 * Nivel 3: padre de nivel 2
 * 
 * @param categoriaId - ID de la categoría
 * @param categorias - Array de categorías en formato plano
 * @returns El nivel de la categoría (1, 2 o 3)
 */
export function calcularNivel(
  categoriaId: string,
  categorias: CategoriaPlana[]
): number {
  const ruta = obtenerRutaCategoria(categoriaId, categorias);
  return ruta.length;
}

/**
 * Filtra categorías por nivel
 * 
 * @param categorias - Array de categorías
 * @param nivel - Nivel a filtrar (1, 2 o 3)
 * @returns Array de categorías del nivel especificado
 */
export function filtrarPorNivel<T extends CategoriaPlana>(
  categorias: T[],
  nivel: number
): T[] {
  return categorias.filter(cat => cat.nivel === nivel);
}

/**
 * Obtiene todas las subcategorías de una categoría (todos los niveles)
 * 
 * @param categoriaId - ID de la categoría padre
 * @param categorias - Array de categorías en formato plano
 * @returns Array con todas las subcategorías (directas e indirectas)
 */
export function obtenerTodasLasSubcategorias(
  categoriaId: string,
  categorias: CategoriaPlana[]
): CategoriaPlana[] {
  const resultado: CategoriaPlana[] = [];
  
  const agregarSubcategorias = (parentId: string) => {
    const hijas = categorias.filter(cat => cat.parent_id === parentId);
    hijas.forEach(hija => {
      resultado.push(hija);
      agregarSubcategorias(hija.id); // Recursión para obtener nietas
    });
  };
  
  agregarSubcategorias(categoriaId);
  return resultado;
}
