import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type VotoHiloPayload = {
  hilo_id: string;
  // Agrega aquí otros campos que necesites de la tabla foro_votos_hilos
  [key: string]: any;
};

type VotoHiloChangesPayload = RealtimePostgresChangesPayload<Record<string, any>>;

/**
 * Hook para suscribirse a cambios en tiempo real de votos de hilos del foro
 * Actualiza automáticamente el cache de React Query cuando hay cambios
 */
export function useRealtimeVotosHilos() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  console.log('[useRealtimeVotosHilos] Hook montado');

  useEffect(() => {
    console.log('[useRealtimeVotosHilos] useEffect ejecutándose');
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      console.log('[useRealtimeVotosHilos] Configurando suscripción para votos de hilos');

      // Crear canal de Realtime para votos de hilos con configuración específica
      channel = supabase
        .channel('votos-hilos-global', {
          config: {
            broadcast: { self: true },
            presence: { key: '' },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*', // Escuchar INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'foro_votos_hilos',
          },
          (payload) => {
            console.log('[useRealtimeVotosHilos] Cambio detectado en votos de hilos:', payload);
            console.log('[useRealtimeVotosHilos] Tipo de evento:', payload.eventType);
            
            // Obtener el hilo_id del payload de forma segura
            const newRecord = payload.new as VotoHiloPayload | null;
            const oldRecord = payload.old as VotoHiloPayload | null;
            const hiloId = newRecord?.hilo_id || oldRecord?.hilo_id;
            
            if (!hiloId) {
              console.warn('[useRealtimeVotosHilos] No se pudo obtener hilo_id del payload');
              return;
            }
            
            // Invalidar queries con refetch en background (sin mostrar loading)
            queryClient.invalidateQueries({ 
              queryKey: ['foro', 'hilos'],
              exact: false,
              refetchType: 'none' // No refetch automático
            });
            
            // Refetch silencioso en background después de un pequeño delay
            setTimeout(() => {
              queryClient.refetchQueries({
                queryKey: ['foro', 'hilos'],
                exact: false,
                type: 'active'
              });
            }, 50);
            
            console.log('[useRealtimeVotosHilos] Queries invalidadas para hilo:', hiloId);
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.error('[useRealtimeVotosHilos] Error en suscripción:', err);
          }
          console.log('[useRealtimeVotosHilos] Estado de suscripción:', status);
        });
    };

    setupRealtimeSubscription();

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      if (channel) {
        console.log('[useRealtimeVotosHilos] Desuscribiendo del canal de votos de hilos');
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient, supabase]);
}
