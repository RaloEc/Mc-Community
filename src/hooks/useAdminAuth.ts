'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

export interface AdminAuthState {
  isLoading: boolean
  isAdmin: boolean
  user: any
  profile: any
}

export function useAdminAuth() {
  const { user, loading: authLoading, authInitialized } = useAuth()
  const [adminState, setAdminState] = useState<AdminAuthState>({
    isLoading: true,
    isAdmin: false,
    user: null,
    profile: null
  })
  const router = useRouter()

  useEffect(() => {
    if (!authInitialized) {
      console.log('useAdminAuth: esperando a que AuthContext se inicialice...')
      return
    }

    let isMounted = true
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('Timeout en useAdminAuth, forzando resolución de estado')
      if (isMounted) {
        setAdminState({
          isLoading: false,
          isAdmin: false,
          user: null,
          profile: null
        })
        router.push('/login')
      }
    }, 5000) // 5 segundos de timeout

    async function checkAdminAuth() {
      try {
        if (!isMounted) return

        // Verificar siempre directamente con Supabase para evitar problemas del contexto
        console.log('Verificando autenticación de admin directamente con Supabase...')
        
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          console.log('No hay sesión activa, redirigiendo a login')
          if (isMounted) {
            setAdminState({
              isLoading: false,
              isAdmin: false,
              user: null,
              profile: null
            })
            router.push('/login')
            return
          }
        }

        console.log('Sesión encontrada, verificando perfil de admin...')
        // Obtener perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('perfiles')
          .select('role, username')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error al obtener perfil de usuario:', profileError)
          if (isMounted) {
            setAdminState({
              isLoading: false,
              isAdmin: false,
              user: null,
              profile: null
            })
            router.push('/login')
            return
          }
        }

        if (!profile) {
          console.log('No se encontró perfil de usuario')
          if (isMounted) {
            setAdminState({
              isLoading: false,
              isAdmin: false,
              user: session.user,
              profile: null
            })
            router.push('/login')
            return
          }
        }

        // Verificar si el usuario tiene rol de admin
        if (!profile || profile.role !== 'admin') {
          console.log('Usuario no tiene rol de admin:', profile?.role || 'sin perfil')
          if (isMounted) {
            setAdminState({
              isLoading: false,
              isAdmin: false,
              user: session.user,
              profile: profile
            })
            router.push('/')
            return
          }
        }

        // Usuario es admin
        console.log('Usuario verificado como admin, cargando dashboard...')
        if (isMounted) {
          setAdminState({
            isLoading: false,
            isAdmin: true,
            user: session.user,
            profile: profile
          })
        }
      } catch (error: any) {
        console.error('Error verificando autenticación de admin:', error)

        if (error.name === 'AbortError' || error.message?.includes('network')) {
          console.error('Timeout o error de red al verificar autenticación de admin')
        }

        if (isMounted) {
          setAdminState({
            isLoading: false,
            isAdmin: false,
            user: null,
            profile: null
          })
          router.push('/login')
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }

    checkAdminAuth()

    return () => {
      isMounted = false
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [authInitialized, router])

  return adminState
}
