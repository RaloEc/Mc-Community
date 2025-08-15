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

// Clave para almacenar en localStorage
const AUTH_SESSION_KEY = 'auth_session_cache'
const AUTH_USER_KEY = 'auth_user_cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutos

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
  const lastAccessUpdateRef = useRef<number>(0)

  // Funciones para manejar el caché
  const getFromCache = (key: string) => {
    try {
      if (typeof window === 'undefined') return null
      
      const cachedData = localStorage.getItem(key)
      if (!cachedData) return null
      
      const { data, timestamp } = JSON.parse(cachedData)
      const now = Date.now()
      
      if (now - timestamp < CACHE_DURATION) {
        return data
      }
      
      localStorage.removeItem(key)
      return null
    } catch (error) {
      console.error(`[AuthContext] Error al leer caché (${key}):`, error)
      return null
    }
  }

  const saveToCache = (key: string, data: any) => {
    try {
      if (typeof window === 'undefined') return
      
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      
      localStorage.setItem(key, JSON.stringify(cacheData))
    } catch (error) {
      console.error(`[AuthContext] Error al guardar caché (${key}):`, error)
    }
  }

  // Optimizado para limitar frecuencia de actualizaciones
  const actualizarUltimoAcceso = useCallback(async (userId: string) => {
    if (!supabase) return
    
    // Limitar a una actualización cada 5 minutos como máximo
    const now = Date.now()
    if (now - lastAccessUpdateRef.current < 5 * 60 * 1000) {
      return
    }
    
    lastAccessUpdateRef.current = now
    
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
    
    // Intentar usar caché primero
    const cachedUser = getFromCache(AUTH_USER_KEY)
    if (cachedUser && cachedUser.id === authUser.id) {
      setUser(cachedUser)
      // Verificar en segundo plano sin bloquear UI
      setTimeout(() => verificarPerfilEnSegundoPlano(authUser), 100)
      return
    }
    
    try {
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (perfilData) {
        setUser(perfilData)
        saveToCache(AUTH_USER_KEY, perfilData)
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
          saveToCache(AUTH_USER_KEY, newProfile)
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
  
  // Función para verificar perfil en segundo plano sin bloquear UI
  const verificarPerfilEnSegundoPlano = async (authUser: User) => {
    if (!isMounted.current || !supabase) return
    
    try {
      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (perfilData && isMounted.current) {
        setUser(perfilData)
        saveToCache(AUTH_USER_KEY, perfilData)
      }
    } catch (error) {
      // Silenciar errores en verificaciones en segundo plano
      console.debug('[AuthContext] Error en verificación en segundo plano:', error)
    }
  }

  useEffect(() => {
    isMounted.current = true
    lastAccessUpdateRef.current = 0

    const fetchSession = async () => {
      if (!supabase) {
        setLoading(false)
        setAuthInitialized(true)
        return
      }
      
      // Intentar usar caché primero
      const cachedSession = getFromCache(AUTH_SESSION_KEY)
      if (cachedSession) {
        setSession(cachedSession)
        if (cachedSession.user) {
          await cargarOcrearPerfil(cachedSession.user)
        }
        setLoading(false)
        setAuthInitialized(true)
        
        // Verificar en segundo plano
        setTimeout(async () => {
          try {
            const { data } = await supabase.auth.getSession()
            if (data.session) {
              setSession(data.session)
              saveToCache(AUTH_SESSION_KEY, data.session)
            }
          } catch (error) {
            console.debug('[AuthContext] Error en verificación de sesión en segundo plano:', error)
          }
        }, 100)
        
        return
      }
      
      // Si no hay caché, obtener sesión normalmente
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (initialSession?.user) {
          setSession(initialSession)
          saveToCache(AUTH_SESSION_KEY, initialSession)
          await cargarOcrearPerfil(initialSession.user)
        }
      } catch (error) {
        console.error('[AuthContext] Error al obtener sesión inicial:', error)
      } finally {
        setLoading(false)
        setAuthInitialized(true)
      }
    }

    fetchSession()

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted.current) return

        console.log(`[AuthContext] onAuthStateChange: Evento: ${event}`)
        
        // Actualizar sesión en caché y estado
        setSession(newSession)
        if (newSession) {
          saveToCache(AUTH_SESSION_KEY, newSession)
        } else {
          localStorage.removeItem(AUTH_SESSION_KEY)
          localStorage.removeItem(AUTH_USER_KEY)
        }

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