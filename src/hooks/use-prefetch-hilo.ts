import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { createClient } from "@/lib/supabase/client";

/**
 * Hook personalizado para precargar datos de un hilo específico
 * cuando el usuario hace hover sobre un enlace
 */
export function usePrefetchHilo() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  const prefetchHilo = useCallback(async (hiloId: string) => {
    // Verificar si los datos ya están en caché
    const existingData = queryClient.getQueryData(['hilo', hiloId]);
    if (existingData) return;
    
    // Precargar los datos del hilo
    try {
      await queryClient.prefetchQuery({
        queryKey: ['hilo', hiloId],
        queryFn: async () => {
          // Consulta para obtener los datos del hilo
          const { data: hilo, error: hiloError } = await supabase
            .from('foro_hilos')
            .select(`
              *,
              perfiles:autor_id(username, role, avatar_url),
              foro_categorias:categoria_id(nombre, color)
            `)
            .eq('id', hiloId)
            .single();
            
          if (hiloError) throw hiloError;
          
          // Consulta para obtener los primeros comentarios
          const { data: posts, error: postsError } = await supabase
            .from('foro_posts')
            .select(`
              *,
              perfiles:autor_id(username, role, avatar_url)
            `)
            .eq('hilo_id', hiloId)
            .order('created_at', { ascending: true })
            .limit(5);
            
          if (postsError) throw postsError;
          
          return { hilo, posts };
        },
        staleTime: 30 * 1000, // 30 segundos
      });
    } catch (error) {
      console.error('Error al precargar hilo:', error);
    }
  }, [queryClient, supabase]);
  
  return prefetchHilo;
}
