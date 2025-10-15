/**
 * Hook personalizado para gestionar estadísticas del foro
 * Utiliza React Query para caché y optimización de consultas
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

// Tipos
export interface EstadisticasGenerales {
  total_hilos: number;
  total_comentarios: number;
  total_usuarios: number;
  total_vistas: number;
  total_categorias: number;
  promedio_comentarios_por_hilo: number;
  promedio_hilos_por_usuario: number;
  hilo_mas_votado_id: string;
  hilo_mas_votado_titulo: string;
  hilo_mas_votado_votos: number;
  hilo_menos_votado_id: string;
  hilo_menos_votado_titulo: string;
  hilo_menos_votado_votos: number;
  hilo_mas_visto_id: string;
  hilo_mas_visto_titulo: string;
  hilo_mas_visto_vistas: number;
}

export interface HiloPopular {
  id: string;
  titulo: string;
  slug: string;
  autor_id: string;
  autor_username: string;
  autor_avatar_url: string | null;
  categoria_id: string;
  categoria_nombre: string;
  vistas: number;
  comentarios_count: number;
  votos_conteo: number;
  created_at: string;
  puntuacion_popularidad: number;
}

export interface EstadisticaCategoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  color: string | null;
  icono: string | null;
  parent_id: string | null;
  nivel: number;
  es_activa: boolean;
  total_hilos: number;
  total_comentarios: number;
  total_vistas: number;
  hilos_activos_semana: number;
  ultimo_hilo_fecha: string | null;
}

export interface UsuarioActivo {
  usuario_id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  hilos_creados: number;
  comentarios_creados: number;
  total_votos_recibidos: number;
  ultima_actividad: string;
  es_activo: boolean;
}

export interface ActividadDiaria {
  fecha: string;
  hilos_nuevos: number;
  comentarios_nuevos: number;
  usuarios_activos: number;
  total_vistas: number;
  total_votos: number;
}

// Keys para React Query
export const ESTADISTICAS_FORO_KEYS = {
  all: ['estadisticas-foro'] as const,
  generales: () => [...ESTADISTICAS_FORO_KEYS.all, 'generales'] as const,
  hilosPopulares: (limite?: number, periodoDias?: number) => 
    [...ESTADISTICAS_FORO_KEYS.all, 'hilos-populares', { limite, periodoDias }] as const,
  categorias: () => [...ESTADISTICAS_FORO_KEYS.all, 'categorias'] as const,
  usuariosActivos: (limite?: number, periodoDias?: number) => 
    [...ESTADISTICAS_FORO_KEYS.all, 'usuarios-activos', { limite, periodoDias }] as const,
  actividadDiaria: (dias?: number) => 
    [...ESTADISTICAS_FORO_KEYS.all, 'actividad-diaria', { dias }] as const,
};

/**
 * Hook para obtener estadísticas generales del foro
 */
export function useEstadisticasGenerales() {
  return useQuery({
    queryKey: ESTADISTICAS_FORO_KEYS.generales(),
    queryFn: async (): Promise<EstadisticasGenerales> => {
      console.log('🔄 Obteniendo estadísticas generales del foro...');
      const response = await fetch('/api/admin/foro/estadisticas?tipo=generales', {
        cache: 'no-store', // Forzar no usar cache del navegador
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error al obtener estadísticas generales:', error);
        throw new Error(error.error || 'Error al obtener estadísticas');
      }
      
      const data = await response.json();
      const estadisticas = data[0] as EstadisticasGenerales;
      console.log('✅ Estadísticas del foro obtenidas:', {
        total_hilos: estadisticas.total_hilos,
        total_vistas: estadisticas.total_vistas,
        total_comentarios: estadisticas.total_comentarios
      });
      return estadisticas;
    },
    staleTime: 0, // Siempre considerar datos como stale
    gcTime: 1000 * 60, // 1 minuto
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 10, // Actualizar cada 10 segundos
  });
}

/**
 * Hook para obtener hilos más populares
 */
export function useHilosPopulares(limite: number = 10, periodoDias: number = 30) {
  return useQuery({
    queryKey: ESTADISTICAS_FORO_KEYS.hilosPopulares(limite, periodoDias),
    queryFn: async (): Promise<HiloPopular[]> => {
      const response = await fetch(`/api/admin/foro/estadisticas?tipo=hilos-populares&limite=${limite}&dias=${periodoDias}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error al obtener hilos populares:', error);
        throw new Error(error.error || 'Error al obtener hilos populares');
      }
      
      return await response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
  });
}

/**
 * Hook para obtener estadísticas por categoría
 */
export function useEstadisticasCategorias() {
  return useQuery({
    queryKey: ESTADISTICAS_FORO_KEYS.categorias(),
    queryFn: async (): Promise<EstadisticaCategoria[]> => {
      const response = await fetch('/api/admin/foro/estadisticas?tipo=categorias');
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error al obtener estadísticas de categorías:', error);
        throw new Error(error.error || 'Error al obtener estadísticas de categorías');
      }
      
      return await response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
  });
}

/**
 * Hook para obtener usuarios más activos
 */
export function useUsuariosActivos(limite: number = 10, periodoDias: number = 30) {
  return useQuery({
    queryKey: ESTADISTICAS_FORO_KEYS.usuariosActivos(limite, periodoDias),
    queryFn: async (): Promise<UsuarioActivo[]> => {
      const response = await fetch(`/api/admin/foro/estadisticas?tipo=usuarios-activos&limite=${limite}&dias=${periodoDias}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error al obtener usuarios activos:', error);
        throw new Error(error.error || 'Error al obtener usuarios activos');
      }
      
      return await response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
  });
}

/**
 * Hook para obtener actividad diaria del foro
 */
export function useActividadDiaria(dias: number = 30) {
  return useQuery({
    queryKey: ESTADISTICAS_FORO_KEYS.actividadDiaria(dias),
    queryFn: async (): Promise<ActividadDiaria[]> => {
      const response = await fetch(`/api/admin/foro/estadisticas?tipo=actividad-diaria&dias=${dias}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error al obtener actividad diaria:', error);
        throw new Error(error.error || 'Error al obtener actividad diaria');
      }
      
      return await response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });
}

/**
 * Hook para invalidar todas las estadísticas del foro
 */
export function useInvalidarEstadisticasForo() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ESTADISTICAS_FORO_KEYS.all });
  };
}
