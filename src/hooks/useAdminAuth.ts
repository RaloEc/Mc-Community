'use client'

import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'

export interface AdminAuthState {
  isLoading: boolean
  isAdmin: boolean
  user: any
  profile: any
}

/**
 * Hook para verificar autenticación de administrador
 * Usa el AuthContext para obtener la información de sesión y perfil
 * de forma consistente con el resto de la aplicación
 */
export function useAdminAuth() {
  const { user, profile, loading, profileLoading } = useAuth()

  const state = useMemo<AdminAuthState>(() => {
    // Mientras está cargando la sesión o el perfil, mostrar loading
    const isLoading = loading || profileLoading
    
    // Verificar si el usuario es admin basándose en el perfil
    const isAdmin = profile?.role === 'admin'
    
    console.log('[useAdminAuth] Estado actual:', {
      isLoading,
      isAdmin,
      hasUser: !!user,
      hasProfile: !!profile,
      role: profile?.role
    })

    return {
      isLoading,
      isAdmin,
      user,
      profile
    }
  }, [user, profile, loading, profileLoading])

  return state
}
