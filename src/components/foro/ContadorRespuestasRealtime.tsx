'use client';

import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ContadorRespuestasRealtimeProps {
  hiloId: string;
  respuestasIniciales: number;
}

export default function ContadorRespuestasRealtime({
  hiloId,
  respuestasIniciales,
}: ContadorRespuestasRealtimeProps) {
  const [respuestas, setRespuestas] = useState(respuestasIniciales);
  const supabase = createClient();

  useEffect(() => {
    // Función para obtener el conteo actualizado
    const actualizarConteo = async () => {
      try {
        const { data, error } = await supabase.rpc('contar_respuestas_por_hilo', {
          hilo_ids: [hiloId]
        });

        if (error) {
          console.error('Error al obtener conteo de respuestas:', error);
          return;
        }

        if (data && data.length > 0) {
          setRespuestas(data[0].respuestas || 0);
        }
      } catch (error) {
        console.error('Error al actualizar conteo:', error);
      }
    };

    // Suscripción a cambios en foro_posts
    const channel = supabase
      .channel(`hilo-respuestas-${hiloId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'foro_posts',
          filter: `hilo_id=eq.${hiloId}`,
        },
        (payload) => {
          console.log('Cambio detectado en posts:', payload);
          // Actualizar el conteo cuando hay cambios
          actualizarConteo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hiloId, supabase]);

  return (
    <div className="flex items-center gap-1.5">
      <MessageSquare className="h-4 w-4" />
      <span className="font-medium">{respuestas}</span>
    </div>
  );
}
