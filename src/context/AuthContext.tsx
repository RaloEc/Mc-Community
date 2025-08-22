'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { createClient, createNonPersistentClient, getExistingClient } from '@/lib/supabase/client'
import { Session, AuthChangeEvent, User, SupabaseClient } from '@supabase/supabase-js'
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
  logout: () => Promise<void>
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
  logout: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<PerfilUsuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)
  const isMounted = useRef(true)
  const lastAccessUpdateRef = useRef<number>(0)
  // Crear una única instancia del cliente y mantenerla durante todo el ciclo de vida del componente
  const supabase = useRef<SupabaseClient | null>(null)
  // Referencia para el cliente sin persistencia
  const nonPersistentClient = useRef<SupabaseClient | null>(null)
  
  // Inicializar los clientes una sola vez
  useEffect(() => {
    // Comprobar si ya existen instancias globales antes de crear nuevas
    if (!supabase.current) {
      // Intentar obtener instancias existentes primero
      const existingClient = getExistingClient();
      if (existingClient) {
        console.log('[AuthContext] Usando cliente persistente existente');
        supabase.current = existingClient;
      } else {
        console.log('[AuthContext] No hay cliente persistente, creando uno nuevo');
        supabase.current = createClient();
      }
    }
    
    if (!nonPersistentClient.current) {
      // Intentar obtener instancia no persistente existente
      const existingNonPersistentClient = getExistingClient(true);
      if (existingNonPersistentClient) {
        console.log('[AuthContext] Usando cliente no persistente existente');
        nonPersistentClient.current = existingNonPersistentClient;
      } else {
        console.log('[AuthContext] No hay cliente no persistente, creando uno nuevo');
        nonPersistentClient.current = createNonPersistentClient();
      }
    }
    
    return () => {
      // No es necesario limpiar las instancias, se manejarán automáticamente
    }
  }, [])

  // Método de cierre de sesión fiable y limpieza de caché
  const logout = useCallback(async () => {
    console.log('[AuthContext] Ejecutando logout()')
    try {
      // Usar la instancia del cliente sin persistencia que ya tenemos
      if (!nonPersistentClient.current) {
        nonPersistentClient.current = getExistingClient(true) || createNonPersistentClient()
      }
      
      // Intentar cerrar sesión con scope global para limpiar todas las sesiones
      await nonPersistentClient.current.auth.signOut({ scope: 'global' })
      console.log('[AuthContext] signOut ejecutado correctamente')
      
      // Ya no es necesario cerrar sesión en el cliente normal
      // pues el scope: 'global' limpia todas las sesiones
    } catch (e) {
      console.error('[AuthContext] Error en signOut:', e)
    } finally {
      try {
        if (typeof window !== 'undefined') {
          // Limpiar todas las claves relacionadas con auth
          const keysToRemove = [
            AUTH_SESSION_KEY,
            AUTH_USER_KEY,
            'supabase.auth.token',
            'supabase.auth.expires_at',
            'supabase.auth.refresh_token',
            'sb-localhost-auth-token',
            'sb:token',
            'sb-access-token',
            'sb-refresh-token'
          ]
          
          // Buscar cualquier clave que contenga 'auth', 'token', 'supabase'
          const allKeys = Object.keys(localStorage)
          const authRelatedKeys = allKeys.filter(key => 
            key.includes('auth') || 
            key.includes('token') || 
            key.includes('supabase') ||
            key.includes('sb-')
          )
          
          // Combinar y eliminar duplicados
          const uniqueKeys = Array.from(new Set([...keysToRemove, ...authRelatedKeys]))
          
          uniqueKeys.forEach(key => {
            try {
              localStorage.removeItem(key)
              console.log(`[AuthContext] Eliminada clave: ${key}`)
            } catch {}
          })
        }
      } catch (e) {
        console.error('[AuthContext] Error al limpiar localStorage:', e)
      }
      
      // Limpiar cookies relacionadas con auth
      try {
        document.cookie.split(';').forEach(cookie => {
          const cookieName = cookie.split('=')[0].trim()
          if (cookieName.includes('sb-') || 
              cookieName.includes('supabase') || 
              cookieName.includes('auth')) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
            console.log(`[AuthContext] Eliminada cookie: ${cookieName}`)
          }
        })
      } catch (e) {
        console.error('[AuthContext] Error al limpiar cookies:', e)
      }
      
      setSession(null)
      setUser(null)
    }
  }, [])

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
    if (!supabase.current) return
    
    // Limitar a una actualización cada 5 minutos como máximo
    const now = Date.now()
    if (now - lastAccessUpdateRef.current < 5 * 60 * 1000) {
      return
    }
    
    lastAccessUpdateRef.current = now
    
    try {
      await supabase.current
        .from('perfiles')
        .update({ fecha_ultimo_acceso: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('[AuthContext] Error al actualizar último acceso:', error)
    }
  }, [])

  const cargarOcrearPerfil = useCallback(async (authUser: User) => {
    if (!isMounted.current || !supabase.current) return
    
    // Intentar usar caché primero
    const cachedUser = getFromCache(AUTH_USER_KEY)
    if (cachedUser && cachedUser.id === authUser.id) {
      setUser(cachedUser)
      // Verificar en segundo plano sin bloquear UI
      setTimeout(() => verificarPerfilEnSegundoPlano(authUser), 100)
      return
    }
    
    try {
      const { data: perfilData, error: perfilError } = await supabase.current
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

        const { data: newProfile, error: createError } = await supabase.current
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
    if (!isMounted.current || !supabase.current) return
    
    try {
      const { data: perfilData } = await supabase.current
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
      if (!supabase.current) {
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
            const { data } = await supabase.current.auth.getSession()
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
        const { data: { session: initialSession } } = await supabase.current.auth.getSession()
        
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

    // Verificar que supabase exista antes de suscribirse a eventos
    if (!supabase.current) {
      console.error('[AuthContext] No se pudo inicializar la suscripción a eventos de autenticación: supabase es undefined')
      return () => {
        isMounted.current = false
      }
    }

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.current.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted.current) return

        console.log(`[AuthContext] onAuthStateChange: Evento: ${event}`)

        console.log(`[AuthContext] Procesando evento ${event}`)
        
        // Validar contra el servidor para evitar sesiones no auténticas del storage
        // Pero con lógica mejorada para evitar ciclos de logout
        let validatedUser: User | null = null
        let validatedSession: Session | null = null
        
        try {
          // Usar la instancia del cliente sin persistencia que ya tenemos
          if (!nonPersistentClient.current) {
            nonPersistentClient.current = createNonPersistentClient()
          }
          
          // Para eventos SIGNED_IN y TOKEN_REFRESHED, confiamos en la sesión proporcionada
          // Esto evita el ciclo de validación-logout
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession) {
            console.log(`[AuthContext] Evento ${event} con nueva sesión, confiando en los datos proporcionados`)
            validatedUser = newSession.user
            validatedSession = newSession
          } else {
            // Para otros eventos, validar normalmente
            console.log(`[AuthContext] Validando sesión para evento ${event}`)
            
            // Realizar ambas verificaciones con la misma instancia del cliente
            const [userResponse, sessionResponse] = await Promise.all([
              nonPersistentClient.current.auth.getUser(),
              nonPersistentClient.current.auth.getSession()
            ])
            
            validatedUser = userResponse?.data?.user ?? null
            validatedSession = sessionResponse?.data?.session ?? null
          }
          
          console.log(`[AuthContext] Validación: Usuario ${validatedUser ? 'existe' : 'no existe'}, Sesión ${validatedSession ? 'existe' : 'no existe'}`)
          
          // Verificar que el token no esté expirado solo para eventos que no sean SIGNED_IN
          if (validatedSession && event !== 'SIGNED_IN') {
            const expiryTime = validatedSession.expires_at ? validatedSession.expires_at * 1000 : 0
            const now = Date.now()
            
            if (expiryTime && expiryTime < now) {
              console.warn('[AuthContext] Token expirado, invalidando sesión')
              validatedSession = null
              validatedUser = null
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Error validando sesión:', err)
        }

        // Si no hay usuario o sesión válida, manejar según el tipo de evento
        if (!validatedUser || !validatedSession) {
          console.log('[AuthContext] No hay usuario o sesión válida para evento', event)
          
          // Si el evento ya era SIGNED_OUT, simplemente limpiar estado
          if (event === 'SIGNED_OUT') {
            setSession(null)
            setUser(null)
            try {
              if (typeof window !== 'undefined') {
                localStorage.removeItem(AUTH_SESSION_KEY)
                localStorage.removeItem(AUTH_USER_KEY)
              }
            } catch {}
            return
          }
          
          // Para SIGNED_IN, dar un tiempo de gracia antes de invalidar
          // Esto evita el ciclo de logout inmediato después de login
          if (event === 'SIGNED_IN' && newSession) {
            console.log('[AuthContext] Evento SIGNED_IN con sesión proporcionada pero validación fallida')
            console.log('[AuthContext] Usando sesión proporcionada temporalmente')
            
            // Usar la sesión proporcionada temporalmente
            setSession(newSession)
            if (newSession.user) {
              await cargarOcrearPerfil(newSession.user)
            }
            
            // Programar una revalidación después de un tiempo
            setTimeout(async () => {
              if (!isMounted.current) return
              
              try {
                const { data: { session: revalidatedSession } } = await nonPersistentClient.current.auth.getSession()
                if (revalidatedSession) {
                  console.log('[AuthContext] Revalidación exitosa de sesión')
                  setSession(revalidatedSession)
                  saveToCache(AUTH_SESSION_KEY, revalidatedSession)
                } else {
                  console.warn('[AuthContext] Revalidación fallida, forzando logout')
                  await logout()
                }
              } catch (error) {
                console.error('[AuthContext] Error en revalidación:', error)
              }
            }, 2000) // 2 segundos de gracia
            
            return
          }
          
          // Para otros eventos, limpiar estado normalmente
          setSession(null)
          setUser(null)
          
          try {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(AUTH_SESSION_KEY)
              localStorage.removeItem(AUTH_USER_KEY)
            }
          } catch {}
          
          // Solo forzar logout para TOKEN_REFRESHED y USER_UPDATED
          // Esto evita ciclos de logout innecesarios
          if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            console.warn('[AuthContext] Detectada sesión inválida con evento', event, 'forzando logout')
            await logout()
          }
          
          return
        }

        // Si hay usuario validado, actualizar sesión y caché si newSession existe
        setSession(newSession ?? null)
        if (newSession) saveToCache(AUTH_SESSION_KEY, newSession)

        // Manejar eventos que implican sesión activa
        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'INITIAL_SESSION' ||
          event === 'USER_UPDATED'
        ) {
          await cargarOcrearPerfil(validatedUser)
          await actualizarUltimoAcceso(validatedUser.id)
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
    logout,
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