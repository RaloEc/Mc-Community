'use client'

import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { Profile } from '@/context/AuthContext'
import type { User } from '@supabase/supabase-js'

export interface AdminAuthState {
  isLoading: boolean
  isAdmin: boolean
  user: User | null
  profile: Profile | null
}

/**
 * Hook para verificar autenticación de administrador
 * Usa el AuthContext refactorizado con React Query
 * Elimina race conditions al usar un estado sincronizado
 */
export function useAdminAuth(): AdminAuthState {
  const { user, profile, loading } = useAuth()

  const state = useMemo<AdminAuthState>(() => {
    // Estado de carga unificado desde React Query
    const isLoading = loading
    
    // Verificar si el usuario es admin basándose en el perfil
    // Solo es admin si hay perfil Y el role es 'admin'
    const isAdmin = !!profile && profile.role === 'admin'
    
    console.log('[useAdminAuth] Estado actual:', {
      isLoading,
      isAdmin,
      hasUser: !!user,
      hasProfile: !!profile,
      role: profile?.role,
    })

    return {
      isLoading,
      isAdmin,
      user,
      profile,
    }
  }, [user, profile, loading])

  return state
}
