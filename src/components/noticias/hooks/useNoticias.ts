'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Noticia, CategoriaNoticia } from '@/types';

// Tipos para filtros
export type FiltroNoticias = {
  busqueda?: string;
  autor?: string;
  categoria?: string;
  ordenFecha?: 'asc' | 'desc';
};

// Tipo para categorías
export type Categoria = CategoriaNoticia;

// Hook personalizado para gestionar las noticias con prefetching y optimizaciones
export function useNoticias(initialFiltros: FiltroNoticias = {}, limit: number = 16) {
  const queryClient = useQueryClient();
  
  // Estado para los filtros - ahora se actualiza con initialFiltros
  const [filtros, setFiltros] = useState<FiltroNoticias>(initialFiltros);
  const [page, setPage] = useState(1);
  const pageSize = limit;

  // Actualizar filtros cuando cambien los initialFiltros
  useEffect(() => {
    setFiltros(initialFiltros);
  }, [initialFiltros.busqueda, initialFiltros.autor, initialFiltros.categoria, initialFiltros.ordenFecha]);

  // Función para construir la URL de la API con los filtros
  const buildApiUrl = (pageParam: number = 1): string => {
    const baseUrl = '/api/noticias?';
    const params = new URLSearchParams();
    
    // Añadir parámetros de filtros si existen
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
    if (filtros.autor) params.append('autor', filtros.autor);
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.ordenFecha) params.append('ordenFecha', filtros.ordenFecha);
    
    // Añadir parámetros de paginación
    params.append('page', pageParam.toString());
    params.append('pageSize', pageSize.toString());
    
    return `${baseUrl}${params.toString()}`;
  };

  // Consulta de categorías
  const { data: categorias = [] } = useQuery({
    queryKey: ['noticias', 'categorias'],
    queryFn: async () => {
      const response = await fetch('/api/noticias/categorias');
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data = await response.json();
      
      if (!(data.success && Array.isArray(data.data))) {
        return [] as Categoria[];
      }

      // Construir jerarquía padre → subcategorías respetando orden/nombre
      const planas = data.data as Array<{
        id: string;
        nombre: string;
        color?: string | null;
        icono?: string | null;
        parent_id?: string | null;
        orden?: number | null;
        slug?: string | null;
      }>;

      // Mapa para acceso y clon con subcategorias
      const map = new Map<string, Categoria & { subcategorias?: Categoria[] }>();
      planas.forEach((c) => {
        map.set(String(c.id), {
          id: String(c.id),
          nombre: c.nombre,
          slug: (c.slug ?? String(c.id)) as string,
          color: c.color ?? undefined,
          icono: c.icono ?? undefined,
          parent_id: c.parent_id ?? null,
          // Inicializar contenedor de subcategorías
          subcategorias: [],
        } as unknown as Categoria & { subcategorias?: Categoria[] });
      });

      const raices: (Categoria & { subcategorias?: Categoria[] })[] = [];
      planas.forEach((c) => {
        const nodo = map.get(String(c.id));
        if (!nodo) return;
        if (!c.parent_id) {
          raices.push(nodo);
        } else {
          const padre = map.get(String(c.parent_id));
          if (padre) {
            if (!padre.subcategorias) padre.subcategorias = [];
            padre.subcategorias.push(nodo);
          } else {
            // Sin padre válido, tratar como raíz para no perderla
            raices.push(nodo);
          }
        }
      });

      // Función de ordenación por 'orden' y luego por 'nombre'
      const ordenar = (arr: (Categoria & { subcategorias?: Categoria[] })[]) => {
        arr.sort((a, b) => {
          const oa = (planaOrden(String(a.id), planas));
          const ob = (planaOrden(String(b.id), planas));
          if (oa !== ob) return oa - ob;
          return a.nombre.localeCompare(b.nombre);
        });
        arr.forEach((n) => n.subcategorias && ordenar(n.subcategorias));
      };

      const planaOrden = (id: string, lista: typeof planas) => {
        const item = lista.find((x) => String(x.id) === id);
        return (item?.orden ?? 0);
      };

      ordenar(raices);

      return raices as unknown as Categoria[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Memoizar la query key para evitar re-renders innecesarios
  const queryKey = useMemo(() => ['noticias', 'lista', filtros], [
    filtros.busqueda,
    filtros.autor,
    filtros.categoria,
    filtros.ordenFecha
  ]);

  // Consulta principal de noticias con paginación infinita
  const {
    data,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const url = buildApiUrl(pageParam);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error al obtener noticias: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Verificar si hay más páginas
          const hasMore = result.data.length >= pageSize;
          
          // Devolver tanto los datos como la información de paginación
          return {
            data: result.data,
            hasMore,
            total: result.total || 0
          };
        } else {
          throw new Error(result.message || 'Error al cargar noticias');
        }
      } catch (error) {
        console.error('Error al cargar noticias:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos para reducir peticiones
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    refetchOnWindowFocus: false,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Usar la información de paginación del servidor para determinar si hay más páginas
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
  });
  
  // Extraer todas las noticias de las páginas
  const noticias = data?.pages.flatMap(page => page.data) || [];

  // Función para prefetch de la siguiente página
  const prefetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      const nextPage = (data?.pages.length || 0) + 1;
      const nextPageUrl = buildApiUrl(nextPage);
      
      queryClient.prefetchQuery({
        queryKey: [...queryKey, nextPage],
        queryFn: async () => {
          const response = await fetch(nextPageUrl);
          if (!response.ok) throw new Error('Error al prefetch');
          const result = await response.json();
          
          if (result.success) {
            return {
              data: result.data,
              hasMore: result.data.length >= pageSize,
              total: result.total || 0
            };
          }
          
          return { data: [], hasMore: false, total: 0 };
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [hasNextPage, isFetchingNextPage, data?.pages.length, buildApiUrl, queryClient, queryKey, pageSize]);

  // Función para cargar más noticias
  const loadMoreNoticias = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Función para actualizar filtros
  const updateFiltros = useCallback((newFiltros: FiltroNoticias) => {
    setFiltros(prev => ({ ...prev, ...newFiltros }));
    setPage(1); // Reiniciar paginación
  }, []);

  // Función para limpiar filtros
  const clearFiltros = useCallback(() => {
    setFiltros({
      busqueda: '',
      autor: '',
      categoria: '',
      ordenFecha: 'desc'
    });
    setPage(1);
  }, []);

  // Prefetch automático cuando se carga una página
  useEffect(() => {
    if (noticias.length > 0 && hasNextPage && !isFetchingNextPage) {
      // Prefetch después de un pequeño delay para no interferir con la carga actual
      const timer = setTimeout(() => {
        prefetchNextPage();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [noticias.length, hasNextPage, isFetchingNextPage, prefetchNextPage]);

  // Efecto para manejar la visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Opcional: refrescar datos solo si han pasado X minutos desde la última actualización
        const lastUpdate = queryClient.getQueryState(['noticias', 'lista', filtros])?.dataUpdatedAt;
        const now = Date.now();
        
        if (lastUpdate && (now - lastUpdate > 5 * 60 * 1000)) { // 5 minutos
          refetch();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [filtros, queryClient, refetch]);

  return {
    noticias,
    categorias,
    filtros,
    isLoading,
    isRefetching,
    isError,
    error,
    updateFiltros,
    clearFiltros,
    loadMoreNoticias,
    hasNextPage,
    isFetchingNextPage
  };
}
