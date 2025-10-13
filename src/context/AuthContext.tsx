'use client'

import React from 'react'
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
}

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  profile: Profile | null
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const defaultAuthState: AuthState = {
  user: null,
  session: null,
  loading: true,
  profile: null,
  signOut: async () => {},
  refreshAuth: async () => {},
  refreshProfile: async () => {}
}

const AuthContext = React.createContext<AuthState>(defaultAuthState)

export function AuthProvider({ 
  children, 
  session: initialSession 
}: { 
  children: React.ReactNode
  session?: Session | null 
}) {
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
      
      // Invalidar queries para forzar recarga con el nuevo estado
      await queryClient.invalidateQueries({ queryKey: authKeys.session })
      
      // Si hay un nuevo usuario, invalidar su perfil también
      if (newSession?.user?.id) {
        await queryClient.invalidateQueries({ 
          queryKey: authKeys.profile(newSession.user.id) 
        })
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
    await supabase.auth.signOut()
    // Las queries se invalidarán automáticamente por el listener
  }, [supabase])

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
    signOut,
    refreshAuth,
    refreshProfile,
  }), [user, session, isLoading, profile, signOut, refreshAuth, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return React.useContext(AuthContext)
}
