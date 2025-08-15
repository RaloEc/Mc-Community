'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

export interface AdminAuthState {
  isLoading: boolean
  isAdmin: boolean
  user: any
  profile: any
}

// Clave para almacenar en sessionStorage
const ADMIN_AUTH_CACHE_KEY = 'admin_auth_state'
// Tiempo de caché en milisegundos (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000

export function useAdminAuth() {
  const { user, loading: authLoading, authInitialized } = useAuth()
  const [adminState, setAdminState] = useState<AdminAuthState>({
    isLoading: true,
    isAdmin: false,
    user: null,
    profile: null
  })
  const router = useRouter()
  const lastCheckRef = useRef<number>(0)
  const checkInProgressRef = useRef<boolean>(false)

  // Función para obtener datos de caché
  const getFromCache = () => {
    try {
      if (typeof window === 'undefined') return null
      
      const cachedData = sessionStorage.getItem(ADMIN_AUTH_CACHE_KEY)
      if (!cachedData) return null
      
      const { state, timestamp } = JSON.parse(cachedData)
      const now = Date.now()
      
      // Verificar si el caché aún es válido
      if (now - timestamp < CACHE_DURATION) {
        return state
      }
      
      // Caché expirado, eliminar
      sessionStorage.removeItem(ADMIN_AUTH_CACHE_KEY)
      return null
    } catch (error) {
      console.error('Error al leer caché de admin:', error)
      return null
    }
  }

  // Función para guardar en caché
  const saveToCache = (state: AdminAuthState) => {
    try {
      if (typeof window === 'undefined') return
      
      const cacheData = {
        state,
        timestamp: Date.now()
      }
      
      sessionStorage.setItem(ADMIN_AUTH_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error al guardar caché de admin:', error)
    }
  }

  useEffect(() => {
    if (!authInitialized) return

    let isMounted = true
    const controller = new AbortController()
    
    // Intentar usar caché primero
    const cachedState = getFromCache()
    if (cachedState) {
      setAdminState(cachedState)
      // Aún así verificamos en segundo plano, pero sin bloquear la UI
      setTimeout(() => checkAdminAuth(true), 100)
      return
    }

    // Timeout de seguridad
    const timeoutId = setTimeout(() => {
      if (isMounted && adminState.isLoading) {
        console.log('Timeout en useAdminAuth, forzando resolución de estado')
        setAdminState({
          isLoading: false,
          isAdmin: false,
          user: null,
          profile: null
        })
        router.push('/login')
      }
    }, 5000)

    async function checkAdminAuth(isBackgroundCheck = false) {
      // Evitar verificaciones simultáneas
      if (checkInProgressRef.current) return
      
      // Limitar frecuencia de verificaciones (no más de una cada 2 segundos)
      const now = Date.now()
      if (now - lastCheckRef.current < 2000 && isBackgroundCheck) return
      
      lastCheckRef.current = now
      checkInProgressRef.current = true

      try {
        if (!isMounted) return

        // Si tenemos usuario en el contexto y no es una verificación en segundo plano, usarlo
        if (user && !isBackgroundCheck) {
          // Obtener perfil del usuario desde el contexto
          const supabase = createClient()
          const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('role, username')
            .eq('id', user.id)
            .single()

          if (profileError) {
            throw profileError
          }

          if (!profile || profile.role !== 'admin') {
            const newState = {
              isLoading: false,
              isAdmin: false,
              user: user,
              profile: profile
            }
            setAdminState(newState)
            saveToCache(newState)
            router.push('/')
            return
          }

          const newState = {
            isLoading: false,
            isAdmin: true,
            user: user,
            profile: profile
          }
          setAdminState(newState)
          saveToCache(newState)
          return
        }

        // Solo si es necesario, verificar con Supabase
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          const newState = {
            isLoading: false,
            isAdmin: false,
            user: null,
            profile: null
          }
          setAdminState(newState)
          saveToCache(newState)
          if (!isBackgroundCheck) router.push('/login')
          return
        }

        // Obtener perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('perfiles')
          .select('role, username')
          .eq('id', session.user.id)
          .single()

        if (profileError || !profile || profile.role !== 'admin') {
          const newState = {
            isLoading: false,
            isAdmin: false,
            user: session.user,
            profile: profile || null
          }
          setAdminState(newState)
          saveToCache(newState)
          if (!isBackgroundCheck) router.push('/')
          return
        }

        // Usuario es admin
        const newState = {
          isLoading: false,
          isAdmin: true,
          user: session.user,
          profile: profile
        }
        setAdminState(newState)
        saveToCache(newState)
      } catch (error: any) {
        console.error('Error verificando autenticación de admin:', error)
        
        if (!isBackgroundCheck) {
          const newState = {
            isLoading: false,
            isAdmin: false,
            user: null,
            profile: null
          }
          setAdminState(newState)
          router.push('/login')
        }
      } finally {
        checkInProgressRef.current = false
        if (!isBackgroundCheck) clearTimeout(timeoutId)
      }
    }

    checkAdminAuth()

    return () => {
      isMounted = false
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [authInitialized, router, user])

  return adminState
}
