'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

export interface AdminAuthState {
  isLoading: boolean
  isAdmin: boolean
  user: any
  profile: any
}

const ADMIN_AUTH_CACHE_KEY = 'admin_auth_state'
const CACHE_DURATION = 5 * 60 * 1000 // 5 min

function readCache(): AdminAuthState | null {
  try {
    if (typeof window === 'undefined') return null
    
    const cached = sessionStorage.getItem(ADMIN_AUTH_CACHE_KEY)
    if (!cached) return null
    
    const { state, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_DURATION) return state
    
    sessionStorage.removeItem(ADMIN_AUTH_CACHE_KEY)
  } catch (err) {
    console.error('Error leyendo caché:', err)
  }
  return null
}

function writeCache(state: AdminAuthState) {
  try {
    if (typeof window === 'undefined') return
    
    sessionStorage.setItem(
      ADMIN_AUTH_CACHE_KEY,
      JSON.stringify({ state, timestamp: Date.now() })
    )
  } catch (err) {
    console.error('Error guardando caché:', err)
  }
}

export function useAdminAuth() {
  const { user } = useAuth()
  const [state, setState] = useState<AdminAuthState>({
    isLoading: true,
    isAdmin: false,
    user: null,
    profile: null
  })
  const router = useRouter()
  const lastCheckRef = useRef(0)
  const inProgressRef = useRef(false)

  const updateState = useCallback(
    (newState: AdminAuthState, redirect?: string) => {
      setState(newState)
      writeCache(newState)
      if (redirect) router.push(redirect)
    },
    [router]
  )

  const fetchProfile = useCallback(async (id: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('perfiles')
      .select('role, username')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }, [])

  const checkAuth = useCallback(
    async (background = false) => {
      if (inProgressRef.current) return
      const now = Date.now()
      if (background && now - lastCheckRef.current < 2000) return
      lastCheckRef.current = now
      inProgressRef.current = true
      console.log('[useAdminAuth] Verificando autenticación admin, background:', background)

      try {
        if (user) {
          const profile = await fetchProfile(user.id)
          if (profile?.role === 'admin') {
            updateState({ isLoading: false, isAdmin: true, user, profile })
            console.log('[useAdminAuth] Usuario admin verificado desde contexto')
          } else {
            updateState(
              { isLoading: false, isAdmin: false, user, profile },
              '/'
            )
            console.log('[useAdminAuth] Usuario no es admin, redirigiendo')
          }
          return
        }

        // Si no hay usuario en contexto, verificar sesión
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          console.log('[useAdminAuth] No hay sesión activa')
          updateState(
            { isLoading: false, isAdmin: false, user: null, profile: null },
            background ? undefined : '/login'
          )
          return
        }
        
        console.log('[useAdminAuth] Sesión activa encontrada:', session.user.email)

        const profile = await fetchProfile(session.user.id)
        if (profile?.role === 'admin') {
          updateState({ isLoading: false, isAdmin: true, user: session.user, profile })
          console.log('[useAdminAuth] Usuario admin verificado desde sesión')
        } else {
          updateState(
            { isLoading: false, isAdmin: false, user: session.user, profile },
            '/'
          )
          console.log('[useAdminAuth] Usuario no es admin, redirigiendo')
        }
      } catch (err) {
        console.error('Error verificando admin:', err)
        updateState(
          { isLoading: false, isAdmin: false, user: null, profile: null },
          background ? undefined : '/login'
        )
      } finally {
        inProgressRef.current = false
      }
    },
    [user, fetchProfile, updateState]
  )

  useEffect(() => {
    const cached = readCache()
    if (cached) {
      console.log('[useAdminAuth] Usando estado en caché')
      setState(cached)
      setTimeout(() => checkAuth(true), 100)
      return
    }

    const timeoutId = setTimeout(() => {
      if (state.isLoading) {
        console.log('[useAdminAuth] Timeout en useAdminAuth, forzando resolución de estado')
        updateState({ isLoading: false, isAdmin: false, user: null, profile: null }, '/login')
      }
    }, 3000)

    checkAuth()
    return () => clearTimeout(timeoutId)
  }, [checkAuth, updateState, state.isLoading])

  return state
}
