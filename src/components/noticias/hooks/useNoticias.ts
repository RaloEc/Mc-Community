'use client';

import { useState, useEffect } from 'react';
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

// Hook personalizado para gestionar las noticias
export function useNoticias(initialFiltros: FiltroNoticias = {}, limit: number = 16) {
  const queryClient = useQueryClient();
  
  // Estado para los filtros
  const [filtros, setFiltros] = useState<FiltroNoticias>(initialFiltros);
  const [page, setPage] = useState(1);
  const pageSize = limit;

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
    const from = (pageParam - 1) * pageSize;
    const to = pageParam * pageSize;
    params.append('limit', to.toString());
    
    return `${baseUrl}${params.toString()}`;
  };

  // Consulta de categorías
  const { data: categorias = [] } = useQuery({
    queryKey: ['noticias', 'categorias'],
    queryFn: async () => {
      const response = await fetch('/api/categorias');
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data = await response.json();
      
      // Ordenar categorías jerárquicamente
      return data.success && data.data ? data.data.sort((a: any, b: any) => {
        // Primero por parent_id (null primero)
        if (!a.parent_id && b.parent_id) return -1;
        if (a.parent_id && !b.parent_id) return 1;
        // Luego por orden si existe
        if (a.orden !== undefined && b.orden !== undefined) {
          return a.orden - b.orden;
        }
        // Finalmente por nombre
        return a.nombre.localeCompare(b.nombre);
      }) : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

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
    queryKey: ['noticias', 'lista', filtros],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const url = buildApiUrl(pageParam);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error al obtener noticias: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        } else {
          throw new Error('Formato de datos inválido');
        }
      } catch (error) {
        console.error('Error al cargar noticias:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Si la última página tiene menos elementos que el tamaño de página,
      // significa que no hay más páginas
      return lastPage.length < pageSize ? undefined : allPages.length + 1;
    },
  });
  
  // Extraer todas las noticias de las páginas
  const noticias = data?.pages.flat() || [];

  // Función para cargar más noticias
  const loadMoreNoticias = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  // Función para actualizar filtros
  const updateFiltros = (newFiltros: FiltroNoticias) => {
    setFiltros(prev => ({ ...prev, ...newFiltros }));
    setPage(1); // Reiniciar paginación
  };

  // Función para limpiar filtros
  const clearFiltros = () => {
    setFiltros({
      busqueda: '',
      autor: '',
      categoria: '',
      ordenFecha: 'desc'
    });
    setPage(1);
  };

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
