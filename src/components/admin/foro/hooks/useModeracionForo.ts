/**
 * Hook personalizado para gestionar la moderación del foro
 * Incluye funciones para hilos, comentarios, búsqueda y acciones de moderación
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getServiceClient } from '@/utils/supabase-service';
import { toast } from 'sonner';

// Tipos
export interface HiloModeracion {
  id: string;
  titulo: string;
  slug: string;
  contenido: string;
  autor_id: string;
  autor_username: string;
  autor_avatar_url: string | null;
  autor_rol: string;
  categoria_id: string;
  categoria_nombre: string;
  categoria_color: string | null;
  vistas: number;
  votos_conteo: number;
  comentarios_count: number;
  created_at: string;
  updated_at: string;
  es_fijado: boolean;
  es_cerrado: boolean;
  etiquetas: Array<{
    id: string;
    nombre: string;
    color: string | null;
  }>;
}

export interface ComentarioModeracion {
  id: string;
  contenido: string;
  autor_id: string;
  autor_username: string;
  autor_avatar_url: string | null;
  autor_rol: string;
  hilo_id: string;
  hilo_titulo: string;
  hilo_slug: string;
  parent_id: string | null;
  votos_conteo: number;
  created_at: string;
  updated_at: string;
  editado: boolean;
}

export interface ResultadoBusqueda {
  tipo: 'hilo' | 'comentario';
  id: string;
  titulo: string;
  contenido: string;
  autor_username: string;
  created_at: string;
  url_relativa: string;
}

export interface FiltrosHilos {
  categoria?: string;
  ordenCampo?: 'created_at' | 'vistas' | 'votos_conteo' | 'comentarios_count';
  ordenDireccion?: 'ASC' | 'DESC';
}

// Keys para React Query
export const MODERACION_FORO_KEYS = {
  all: ['moderacion-foro'] as const,
  hilos: (filtros?: FiltrosHilos) => [...MODERACION_FORO_KEYS.all, 'hilos', filtros] as const,
  comentarios: () => [...MODERACION_FORO_KEYS.all, 'comentarios'] as const,
  busqueda: (termino: string) => [...MODERACION_FORO_KEYS.all, 'busqueda', termino] as const,
};

/**
 * Hook para obtener hilos con paginación infinita para moderación
 */
export function useHilosModeracion(filtros: FiltrosHilos = {}) {
  return useInfiniteQuery({
    queryKey: MODERACION_FORO_KEYS.hilos(filtros),
    queryFn: async ({ pageParam = 0 }): Promise<HiloModeracion[]> => {
      const supabase = getServiceClient();
      const limite = 20;
      
      const { data, error } = await supabase.rpc('get_hilos_recientes_moderacion', {
        limite,
        offset_val: pageParam,
        filtro_categoria: filtros.categoria || null,
        orden_campo: filtros.ordenCampo || 'created_at',
        orden_direccion: filtros.ordenDireccion || 'DESC',
      });
      
      if (error) {
        console.error('Error al obtener hilos para moderación:', error);
        throw error;
      }
      
      return data as HiloModeracion[];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length * 20 : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para obtener comentarios con paginación infinita para moderación
 */
export function useComentariosModeracion() {
  return useInfiniteQuery({
    queryKey: MODERACION_FORO_KEYS.comentarios(),
    queryFn: async ({ pageParam = 0 }): Promise<ComentarioModeracion[]> => {
      const supabase = getServiceClient();
      const limite = 50;
      
      const { data, error } = await supabase.rpc('get_comentarios_recientes_moderacion', {
        limite,
        offset_val: pageParam,
      });
      
      if (error) {
        console.error('Error al obtener comentarios para moderación:', error);
        throw error;
      }
      
      return data as ComentarioModeracion[];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para buscar contenido en el foro
 */
export function useBuscarContenidoForo(termino: string, enabled: boolean = true) {
  return useQuery({
    queryKey: MODERACION_FORO_KEYS.busqueda(termino),
    queryFn: async (): Promise<ResultadoBusqueda[]> => {
      if (!termino || termino.length < 3) {
        return [];
      }
      
      const supabase = getServiceClient();
      const { data, error } = await supabase.rpc('buscar_contenido_foro', {
        termino_busqueda: termino,
        limite: 20,
      });
      
      if (error) {
        console.error('Error al buscar contenido:', error);
        throw error;
      }
      
      return data as ResultadoBusqueda[];
    },
    enabled: enabled && termino.length >= 3,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para eliminar un hilo (soft delete)
 */
export function useEliminarHilo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (hiloId: string) => {
      const supabase = getServiceClient();
      const { error } = await supabase
        .from('foro_hilos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', hiloId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODERACION_FORO_KEYS.all });
      toast.success('Hilo eliminado correctamente');
    },
    onError: (error) => {
      console.error('Error al eliminar hilo:', error);
      toast.error('Error al eliminar el hilo');
    },
  });
}

/**
 * Hook para eliminar un comentario (soft delete)
 */
export function useEliminarComentario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (comentarioId: string) => {
      const supabase = getServiceClient();
      const { error } = await supabase
        .from('foro_comentarios')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', comentarioId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODERACION_FORO_KEYS.all });
      toast.success('Comentario eliminado correctamente');
    },
    onError: (error) => {
      console.error('Error al eliminar comentario:', error);
      toast.error('Error al eliminar el comentario');
    },
  });
}

/**
 * Hook para fijar/desfijar un hilo
 */
export function useToggleFijarHilo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ hiloId, esFijado }: { hiloId: string; esFijado: boolean }) => {
      const supabase = getServiceClient();
      const { error } = await supabase
        .from('foro_hilos')
        .update({ es_fijado: esFijado })
        .eq('id', hiloId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: MODERACION_FORO_KEYS.all });
      toast.success(variables.esFijado ? 'Hilo fijado' : 'Hilo desfijado');
    },
    onError: (error) => {
      console.error('Error al fijar/desfijar hilo:', error);
      toast.error('Error al actualizar el hilo');
    },
  });
}

/**
 * Hook para cerrar/abrir un hilo
 */
export function useToggleCerrarHilo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ hiloId, esCerrado }: { hiloId: string; esCerrado: boolean }) => {
      const supabase = getServiceClient();
      const { error } = await supabase
        .from('foro_hilos')
        .update({ es_cerrado: esCerrado })
        .eq('id', hiloId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: MODERACION_FORO_KEYS.all });
      toast.success(variables.esCerrado ? 'Hilo cerrado' : 'Hilo abierto');
    },
    onError: (error) => {
      console.error('Error al cerrar/abrir hilo:', error);
      toast.error('Error al actualizar el hilo');
    },
  });
}

/**
 * Hook para mover un hilo a otra categoría
 */
export function useMoverHilo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ hiloId, categoriaId }: { hiloId: string; categoriaId: string }) => {
      const supabase = getServiceClient();
      const { error } = await supabase
        .from('foro_hilos')
        .update({ categoria_id: categoriaId })
        .eq('id', hiloId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODERACION_FORO_KEYS.all });
      toast.success('Hilo movido correctamente');
    },
    onError: (error) => {
      console.error('Error al mover hilo:', error);
      toast.error('Error al mover el hilo');
    },
  });
}

/**
 * Hook para eliminar múltiples hilos (acción por lotes)
 */
export function useEliminarHilosLote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (hiloIds: string[]) => {
      const supabase = getServiceClient();
      const { error } = await supabase
        .from('foro_hilos')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', hiloIds);
      
      if (error) throw error;
      return hiloIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: MODERACION_FORO_KEYS.all });
      toast.success(`${count} hilos eliminados correctamente`);
    },
    onError: (error) => {
      console.error('Error al eliminar hilos:', error);
      toast.error('Error al eliminar los hilos');
    },
  });
}

/**
 * Hook para mover múltiples hilos a otra categoría (acción por lotes)
 */
export function useMoverHilosLote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ hiloIds, categoriaId }: { hiloIds: string[]; categoriaId: string }) => {
      const supabase = getServiceClient();
      const { error } = await supabase
        .from('foro_hilos')
        .update({ categoria_id: categoriaId })
        .in('id', hiloIds);
      
      if (error) throw error;
      return hiloIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: MODERACION_FORO_KEYS.all });
      toast.success(`${count} hilos movidos correctamente`);
    },
    onError: (error) => {
      console.error('Error al mover hilos:', error);
      toast.error('Error al mover los hilos');
    },
  });
}
