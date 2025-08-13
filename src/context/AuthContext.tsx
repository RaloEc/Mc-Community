'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Session, AuthChangeEvent, User } from '@supabase/supabase-js'
import { PostgrestError } from '@supabase/postgrest-js'

type PerfilUsuario = {
  id: string
  username: string
  role: string
  email?: string
  avatar_url?: string
}

type AuthContextType = {
  session: Session | null
  loading: boolean
  user: PerfilUsuario | null
  authInitialized: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  user: null,
  authInitialized: false,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<PerfilUsuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)
  const isMounted = useRef(true)

  const actualizarUltimoAcceso = useCallback(async (userId: string) => {
    if (!supabase) return
    try {
      await supabase
        .from('perfiles')
        .update({ fecha_ultimo_acceso: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('[AuthContext] Error al actualizar último acceso:', error)
    }
  }, [])

  const cargarOcrearPerfil = useCallback(async (authUser: User) => {
    if (!isMounted.current || !supabase) return
    
    try {
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (perfilData) {
        setUser(perfilData)
        return
      }

      if (perfilError && (perfilError as PostgrestError).code === 'PGRST116') {
        console.log('[AuthContext] Perfil no encontrado, creando uno nuevo.')
        const username = authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'usuario_anonimo'
        const email = authUser.email
        const avatar_url = authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`

        const { data: newProfile, error: createError } = await supabase
          .from('perfiles')
          .upsert({ id: authUser.id, username, email, avatar_url, role: 'usuario' })
          .select('*')
          .single()
        
        if (newProfile) {
          setUser(newProfile)
        } else if (createError) {
          console.error('[AuthContext] Error creando nuevo perfil:', createError)
          setUser(null)
        }
      } else if (perfilError) {
        console.error('[AuthContext] Error obteniendo perfil:', perfilError)
        setUser(null)
      }
    } catch (error) {
      console.error('[AuthContext] Excepción inesperada en cargarOcrearPerfil:', error)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true

    const fetchSession = async () => {
      if (!supabase) {
        setLoading(false)
        setAuthInitialized(true)
        return
      }
      
      // 1. Obtener la sesión inicial para saber si el usuario ya está logueado
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      
      if (initialSession?.user) {
        setSession(initialSession)
        await cargarOcrearPerfil(initialSession.user)
      }
      
      setLoading(false)
      setAuthInitialized(true)
    }

    fetchSession()

    // 2. Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted.current) return

        console.log(`[AuthContext] onAuthStateChange: Evento: ${event}`)
        setSession(newSession)

        if (event === 'SIGNED_IN' && newSession?.user) {
          await cargarOcrearPerfil(newSession.user)
          await actualizarUltimoAcceso(newSession.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'USER_UPDATED' && newSession?.user) {
          await cargarOcrearPerfil(newSession.user)
        }
      }
    )

    return () => {
      isMounted.current = false
      subscription?.unsubscribe()
    }
  }, [cargarOcrearPerfil, actualizarUltimoAcceso])

  const value = {
    session,
    user,
    loading,
    authInitialized,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}