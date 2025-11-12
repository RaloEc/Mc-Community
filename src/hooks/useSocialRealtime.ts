'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export const useSocialRealtime = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return

    console.log('[SocialRealtime] Iniciando suscripciones para usuario:', user.id)

    // Canal para solicitudes de amistad recibidas
    const friendRequestsChannel = supabase
      .channel('friend-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `user_a_id=eq.${user.id},user_b_id=eq.${user.id}` // Usuario involucrado
        },
        async (payload) => {
          console.log('[SocialRealtime] Nueva solicitud de amistad:', payload)
          
          const newRequest = payload.new
          
          // Solo notificar si el usuario actual NO es el requester (es decir, recibió la solicitud)
          if (newRequest.requester_id !== user.id) {
            // Obtener información del remitente para la notificación
            const { data: requesterProfile } = await supabase
              .from('perfiles')
              .select('username, avatar_url')
              .eq('id', newRequest.requester_id)
              .single()

            if (requesterProfile) {
              toast.success(`¡${requesterProfile.username} te envió una solicitud de amistad!`, {
                duration: 5000,
                action: {
                  label: 'Ver solicitudes',
                  onClick: () => {
                    // Aquí podrías navegar a la página de solicitudes
                    console.log('Navegar a solicitudes de amistad')
                  }
                }
              })
            }

            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['friend-requests', 'received'] })
            queryClient.invalidateQueries({ queryKey: ['social-stats'] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friend_requests',
          filter: `requester_id=eq.${user.id}` // Solicitudes que envié
        },
        async (payload) => {
          console.log('[SocialRealtime] Solicitud actualizada:', payload)
          
          const updatedRequest = payload.new
          
          // Solo notificar cambios de estado relevantes
          if (updatedRequest.status === 'accepted') {
            // Obtener información del usuario que aceptó
            const otherUserId = updatedRequest.user_a_id === user.id 
              ? updatedRequest.user_b_id 
              : updatedRequest.user_a_id

            const { data: otherProfile } = await supabase
              .from('perfiles')
              .select('username')
              .eq('id', otherUserId)
              .single()

            if (otherProfile) {
              toast.success(`¡${otherProfile.username} aceptó tu solicitud de amistad!`, {
                duration: 5000
              })
            }

            // Invalidar queries
            queryClient.invalidateQueries({ queryKey: ['friend-requests', 'sent'] })
            queryClient.invalidateQueries({ queryKey: ['friends'] })
            queryClient.invalidateQueries({ queryKey: ['social-stats'] })
          } else if (updatedRequest.status === 'rejected') {
            toast.error('Tu solicitud de amistad fue rechazada', {
              duration: 3000
            })
            
            queryClient.invalidateQueries({ queryKey: ['friend-requests', 'sent'] })
          }
        }
      )
      .subscribe()

    // Canal para nuevos seguidores
    const followersChannel = supabase
      .channel('followers-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_follows',
          filter: `followed_id=eq.${user.id}` // Cuando me siguen
        },
        async (payload) => {
          console.log('[SocialRealtime] Nuevo seguidor:', payload)
          
          const newFollow = payload.new
          
          // Obtener información del nuevo seguidor
          const { data: followerProfile } = await supabase
            .from('perfiles')
            .select('username, avatar_url')
            .eq('id', newFollow.follower_id)
            .single()

          if (followerProfile) {
            toast.success(`¡${followerProfile.username} comenzó a seguirte!`, {
              duration: 4000
            })
          }

          // Invalidar queries
          queryClient.invalidateQueries({ queryKey: ['followers', user.id] })
          queryClient.invalidateQueries({ queryKey: ['social-stats'] })
        }
      )
      .subscribe()

    // Cleanup function
    return () => {
      console.log('[SocialRealtime] Limpiando suscripciones')
      supabase.removeChannel(friendRequestsChannel)
      supabase.removeChannel(followersChannel)
    }
  }, [user?.id, queryClient, supabase])

  return {
    // Este hook no retorna nada, solo maneja las suscripciones
  }
}

// Hook para usar en el layout principal o componente raíz
export const useSocialNotifications = () => {
  useSocialRealtime()
}
