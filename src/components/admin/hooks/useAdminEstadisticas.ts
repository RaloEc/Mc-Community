'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Tipos para las estadísticas
export interface EstadisticasAdmin {
  total_noticias: number;
  total_vistas: number;
  total_categorias: number;
  total_autores: number;
  noticias_recientes: number;
  noticias_pendientes: number;
  noticias_por_mes: Array<{ mes: string; total: number }>;
  noticias_por_categoria: Array<{ categoria: string; total: number }>;
  noticias_por_autor: Array<{ autor: string; total: number }>;
  noticias_mas_vistas: Array<{
    id: string;
    titulo: string;
    vistas: number;
    fecha_publicacion: string;
  }>;
}

export interface NoticiaReciente {
  id: string;
  titulo: string;
  slug: string;
  estado: string;
  vistas: number;
  publicada_en: string | null;
  creada_en: string;
  autor: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

// Hook para obtener estadísticas con actualización en tiempo real
export function useAdminEstadisticas() {
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient<Database>();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Query para estadísticas
  const {
    data: estadisticas,
    isLoading,
    error,
    refetch,
  } = useQuery<EstadisticasAdmin>({
    queryKey: ['admin-estadisticas'],
    queryFn: async () => {
      const response = await fetch('/api/admin/noticias/estadisticas');
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true,
  });

  // Configurar suscripciones en tiempo real
  useEffect(() => {
    // Función para invalidar caché y refrescar datos
    const handleRealtimeUpdate = (payload: any) => {
      console.log('📡 Cambio detectado en tiempo real:', payload);
      setLastUpdate(new Date());
      
      // Invalidar caché de estadísticas
      queryClient.invalidateQueries({ queryKey: ['admin-estadisticas'] });
      queryClient.invalidateQueries({ queryKey: ['admin-noticias-recientes'] });
    };

    // Crear canal de suscripción
    const channel = supabase
      .channel('admin-noticias-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'noticias',
        },
        handleRealtimeUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categorias',
        },
        handleRealtimeUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comentarios_noticias',
        },
        handleRealtimeUpdate
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción en tiempo real:', status);
        setIsRealTimeActive(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    // Cleanup: desuscribirse al desmontar
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsRealTimeActive(false);
      }
    };
  }, [supabase, queryClient]);

  return {
    estadisticas,
    isLoading,
    error,
    refetch,
    isRealTimeActive,
    lastUpdate,
  };
}

// Hook para obtener noticias recientes con actualización en tiempo real
export function useNoticiasRecientes(limit: number = 5) {
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient<Database>();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    data: noticias,
    isLoading,
    error,
    refetch,
  } = useQuery<NoticiaReciente[]>({
    queryKey: ['admin-noticias-recientes', limit],
    queryFn: async () => {
      const response = await fetch(`/api/noticias?admin=true&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Error al cargar noticias recientes');
      }
      const data = await response.json();
      return data.success ? data.data : [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Configurar suscripción en tiempo real para noticias
  useEffect(() => {
    const handleRealtimeUpdate = (payload: any) => {
      console.log('📰 Noticia actualizada en tiempo real:', payload);
      
      // Invalidar caché de noticias recientes
      queryClient.invalidateQueries({ queryKey: ['admin-noticias-recientes'] });
    };

    const channel = supabase
      .channel('admin-noticias-recientes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'noticias',
        },
        handleRealtimeUpdate
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, queryClient, limit]);

  return {
    noticias,
    isLoading,
    error,
    refetch,
  };
}

// Hook para obtener actividad reciente (últimas acciones)
export function useActividadReciente() {
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient<Database>();

  return useQuery({
    queryKey: ['admin-actividad-reciente'],
    queryFn: async () => {
      // Obtener últimas noticias creadas/actualizadas
      const { data: noticias, error: errorNoticias } = await supabase
        .from('noticias')
        .select('id, titulo, creada_en, actualizada_en, autor_id, perfiles(username)')
        .order('actualizada_en', { ascending: false })
        .limit(10);

      if (errorNoticias) throw errorNoticias;

      return noticias || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}
