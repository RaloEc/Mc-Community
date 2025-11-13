'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthData, authKeys } from '@/hooks/useAuthQuery'
import type { Session, User } from '@supabase/supabase-js'

export interface Profile {
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
}

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  profile: Profile | null
  supabase: ReturnType<typeof createClient>
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const defaultAuthState: AuthState = {
  user: null,
  session: null,
  loading: true,
  profile: null,
  supabase: createClient(),
  signOut: async () => {},
  refreshAuth: async () => {},
  refreshProfile: async () => {}
}

export const AuthContext = React.createContext<AuthState>(defaultAuthState)

export function AuthProvider({ 
  children, 
  session: initialSession 
}: { 
  children: React.ReactNode
  session?: Session | null 
}) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  
  // Usar React Query para gestionar el estado de autenticación
  const { 
    session, 
    user, 
    profile, 
    isLoading,
    invalidateAuth,
    refreshProfile: refreshProfileQuery
  } = useAuthData()

  // Suscribirse a cambios de autenticación de Supabase
  React.useEffect(() => {
    console.log('[AuthProvider] Configurando listener de auth state change...')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`[AuthProvider] Auth state change: ${event}`, {
        hasSession: !!newSession,
        userId: newSession?.user?.id,
      })
      
      // Manejar eventos de autenticación de forma optimizada
      if (event === 'SIGNED_OUT') {
        // En logout, limpiar todo inmediatamente y forzar refetch
        console.log('[AuthProvider] SIGNED_OUT: Limpiando caché de autenticación')
        queryClient.setQueryData(authKeys.session, null)
        queryClient.removeQueries({ 
          queryKey: ['auth', 'profile'],
          exact: false 
        })
        // Forzar refetch inmediato para actualizar UI
        await queryClient.refetchQueries({ 
          queryKey: authKeys.session,
          type: 'active'
        })
        console.log('[AuthProvider] Estado de auth limpiado y refetched')
        
      } else if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        // Restauración de sesión o refresh de token: refetch inmediato
        console.log(`[AuthProvider] ${event}: Sincronizando sesión y perfil`)
        
        // 1. Refetch de la sesión
        await queryClient.refetchQueries({ 
          queryKey: authKeys.session,
          type: 'active'
        })
        
        // 2. Si hay sesión, refetch del perfil para sincronizar datos
        if (newSession?.user?.id) {
          console.log(`[AuthProvider] Refetching perfil para usuario: ${newSession.user.id}`)
          await queryClient.refetchQueries({ 
            queryKey: authKeys.profile(newSession.user.id),
            type: 'active'
          })
        }
        
        console.log('[AuthProvider] Sesión y perfil sincronizados correctamente')
        
      } else if (event === 'SIGNED_IN') {
        // Login nuevo: refetch inmediato
        console.log('[AuthProvider] SIGNED_IN: Actualizando sesión y perfil')
        
        await queryClient.refetchQueries({ 
          queryKey: authKeys.session,
          type: 'active'
        })
        
        if (newSession?.user?.id) {
          await queryClient.refetchQueries({ 
            queryKey: authKeys.profile(newSession.user.id),
            type: 'active'
          })
        }
        
        console.log('[AuthProvider] Login completado, datos actualizados')
        
      } else {
        // Para otros eventos (USER_UPDATED, PASSWORD_RECOVERY, etc.)
        console.log(`[AuthProvider] ${event}: Invalidando queries de autenticación`)
        await queryClient.invalidateQueries({ queryKey: authKeys.session })
        
        if (newSession?.user?.id) {
          await queryClient.invalidateQueries({ 
            queryKey: authKeys.profile(newSession.user.id) 
          })
        }
      }
    })

    return () => {
      console.log('[AuthProvider] Limpiando listener de auth state change')
      subscription.unsubscribe()
    }
  }, [supabase, queryClient])

  // Funciones de utilidad
  const signOut = React.useCallback(async () => {
    console.log('[AuthProvider] Cerrando sesión...')
    
    // 1. Limpiar TODA la caché de React Query inmediatamente
    queryClient.clear()
    console.log('[AuthProvider] Caché de React Query limpiada completamente')
    
    // 2. Redirigir inmediatamente a la página principal (UX optimista)
    router.push('/')
    console.log('[AuthProvider] Redirigiendo a la página principal...')
    
    // 3. Ejecutar signOut de Supabase en segundo plano (no bloqueante)
    supabase.auth.signOut().then(() => {
      console.log('[AuthProvider] Sesión cerrada exitosamente en Supabase')
    }).catch((error) => {
      console.error('[AuthProvider] Error al cerrar sesión en Supabase:', error)
      // Aunque falle, el usuario ya fue redirigido y la caché limpiada
    })
  }, [router, supabase, queryClient])

  const refreshAuth = React.useCallback(async () => {
    console.log('[AuthProvider] Refrescando autenticación...')
    await invalidateAuth()
  }, [invalidateAuth])
  
  const refreshProfile = React.useCallback(async () => {
    console.log('[AuthProvider] Refrescando perfil...')
    await refreshProfileQuery()
  }, [refreshProfileQuery])

  const value = React.useMemo<AuthState>(() => ({
    user,
    session,
    loading: isLoading,
    profile,
    supabase,
    signOut,
    refreshAuth,
    refreshProfile,
  }), [user, session, isLoading, profile, supabase, signOut, refreshAuth, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return React.useContext(AuthContext)
}
