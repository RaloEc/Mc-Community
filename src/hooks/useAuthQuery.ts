'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Session, User } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string | null
  role: 'user' | 'admin' | string
  created_at?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  color?: string | null
  followers_count?: number
  following_count?: number
  friends_count?: number
  connected_accounts?: Record<string, string> | string
}

// Keys para las queries
export const authKeys = {
  session: ['auth', 'session'] as const,
  profile: (userId: string) => ['auth', 'profile', userId] as const,
}

/**
 * Hook para obtener la sesión actual usando React Query
 * Elimina race conditions al centralizar la gestión del estado
 */
export function useSessionQuery() {
  const supabase = createClient()

  return useQuery({
    queryKey: authKeys.session,
    queryFn: async () => {
      console.log('[useSessionQuery] Obteniendo sesión...')
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('[useSessionQuery] Error al obtener sesión:', error)
        throw error
      }
      
      console.log('[useSessionQuery] Sesión obtenida:', {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
      })
      
      return data.session
    },
    // Configuración optimizada para autenticación con baja latencia
    staleTime: 10 * 1000, // 10 segundos (más agresivo para OAuth)
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true, // Revalidar siempre al volver a la pestaña
    refetchOnMount: true, // Siempre refetch al montar
    refetchOnReconnect: true, // Refetch al reconectar
    retry: 2, // 2 reintentos para auth
  })
}

/**
 * Hook para obtener el perfil del usuario usando React Query
 * Solo se ejecuta si hay un userId válido
 */
export function useProfileQuery(userId: string | null | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: userId ? authKeys.profile(userId) : ['auth', 'profile', 'null'],
    queryFn: async () => {
      if (!userId) {
        console.log('[useProfileQuery] No hay userId, retornando null')
        return null
      }

      console.log('[useProfileQuery] Obteniendo perfil para userId:', userId)
      
      // Intentar hasta 3 veces con backoff para casos de OAuth recién creado
      let lastError = null
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (error) {
            lastError = error
            console.log(`[useProfileQuery] Intento ${attempt + 1}/3 falló:`, error.message)
            
            // Si no es el último intento, esperar antes de reintentar
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)))
              continue
            }
            throw error
          }

          if (data) {
            const profile: Profile = {
              id: data.id,
              username: data.username ?? null,
              role: data.role ?? 'user',
              created_at: data.created_at ?? null,
              avatar_url: data.avatar_url ?? null,
              banner_url: (data as any).banner_url ?? null,
              color: data.color ?? null,
              followers_count: (data as any).followers_count ?? 0,
              following_count: (data as any).following_count ?? 0,
              friends_count: (data as any).friends_count ?? 0,
              connected_accounts: (data as any).connected_accounts ?? {},
            }
            
            console.log('[useProfileQuery] Perfil obtenido exitosamente:', {
              username: profile.username,
              role: profile.role,
              followers_count: profile.followers_count,
              following_count: profile.following_count,
              friends_count: profile.friends_count,
              connected_accounts: profile.connected_accounts,
            })
            
            return profile
          }
        } catch (err) {
          lastError = err
          if (attempt === 2) {
            console.error('[useProfileQuery] Error definitivo:', err)
            throw err
          }
        }
      }

      throw lastError || new Error('No se pudo obtener el perfil')
    },
    enabled: !!userId, // Solo ejecutar si hay userId
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: false, // Ya manejamos reintentos manualmente
  })
}

/**
 * Hook combinado que proporciona sesión y perfil de forma sincronizada
 * Elimina race conditions al garantizar que el perfil solo se carga después de la sesión
 */
export function useAuthData() {
  const queryClient = useQueryClient()
  
  // Primero obtener la sesión
  const sessionQuery = useSessionQuery()
  const session = sessionQuery.data ?? null
  const user = session?.user ?? null
  
  // Luego obtener el perfil basado en el userId de la sesión
  const profileQuery = useProfileQuery(user?.id)
  const profile = profileQuery.data ?? null
  
  // Estado de carga combinado: está cargando si cualquiera está cargando
  const isLoading = sessionQuery.isLoading || (user && profileQuery.isLoading)
  
  // Estado de error combinado
  const error = sessionQuery.error || profileQuery.error
  
  console.log('[useAuthData] Estado actual:', {
    sessionLoading: sessionQuery.isLoading,
    profileLoading: profileQuery.isLoading,
    isLoading,
    hasSession: !!session,
    hasUser: !!user,
    hasProfile: !!profile,
    profileRole: profile?.role,
  })
  
  // Funciones de utilidad
  const invalidateAuth = async () => {
    await queryClient.invalidateQueries({ queryKey: authKeys.session })
    if (user?.id) {
      await queryClient.invalidateQueries({ queryKey: authKeys.profile(user.id) })
    }
  }
  
  const refreshProfile = async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({ queryKey: authKeys.profile(user.id) })
    }
  }
  
  return {
    session,
    user,
    profile,
    isLoading,
    error,
    sessionQuery,
    profileQuery,
    invalidateAuth,
    refreshProfile,
  }
}
