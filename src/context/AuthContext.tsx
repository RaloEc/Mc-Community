'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'

type AuthContextType = {
  session: Session | null
  loading: boolean
  user: any | null
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  user: null
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)
  const initializationAttempted = useRef(false)
  const profileLoadAttempted = useRef(false)
  const supabaseClientRef = useRef(createClient())
  
  // Agregar un temporizador de seguridad para evitar que la página se quede cargando indefinidamente
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('[AuthContext] Forzando finalización de carga después de 5 segundos')
        setLoading(false)
      }
    }, 5000) // 5 segundos como máximo de espera
    
    return () => clearTimeout(timeoutId)
  }, [loading])
  
  // Efecto para depuración del estado actual
  useEffect(() => {
    console.log('[AuthContext] Estado actual:', { 
      session: session ? 'Presente' : 'Null', 
      user: user ? 'Presente' : 'Null',
      loading,
      authInitialized 
    })
  }, [session, user, loading, authInitialized])

  useEffect(() => {
    console.log('[AuthContext] Inicializando contexto de autenticación')
    const supabase = supabaseClientRef.current

    // Función para cargar el perfil del usuario con manejo de errores mejorado
    const cargarPerfil = async (userId: string) => {
      if (profileLoadAttempted.current) {
        console.log('[AuthContext] Ya se intentó cargar el perfil anteriormente')
        // Aseguramos que loading se establezca en false incluso si ya se intentó cargar el perfil
        setLoading(false)
        return
      }
      
      profileLoadAttempted.current = true
      
      try {
        console.log(`[AuthContext] Cargando perfil para usuario: ${userId}`)
        const { data: perfilData, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error) {
          console.log('[AuthContext] Error al cargar perfil, intentando crear uno nuevo')
          
          // Intentar crear un perfil si no existe
          const { data: userData } = await supabase.auth.getUser()
          if (userData && userData.user) {
            const username = userData.user.user_metadata?.username || 'usuario'
            
            try {
              // Intentar crear el perfil usando upsert para evitar errores de duplicación
              const { data: newProfile, error: createError } = await supabase
                .from('perfiles')
                .upsert({
                  id: userId,
                  username: username,
                  role: 'user'
                }, { onConflict: 'id' })
                .select('*')
                .single()
              
              if (createError) {
                console.error('[AuthContext] Error al crear perfil:', createError)
                // Continuar a pesar del error para no bloquear la carga
              } else {
                console.log('[AuthContext] Perfil creado correctamente:', newProfile)
                setUser(newProfile)
              }
            } catch (createError) {
              console.error('[AuthContext] Error al crear perfil (excepción):', createError)
              // Continuar a pesar del error para no bloquear la carga
            }
          }
        } else {
          console.log('[AuthContext] Perfil cargado correctamente')
          setUser(perfilData)
        }
      } catch (error) {
        console.error('[AuthContext] Error al cargar el perfil:', error)
      } finally {
        // Asegurarse de que loading se establezca en false incluso si hay errores
        setLoading(false)
        console.log('[AuthContext] Estado de carga establecido a false')
      }
    }

    // Obtener la sesión inicial con manejo de errores mejorado
    const inicializarAuth = async () => {
      if (initializationAttempted.current) {
        console.log('[AuthContext] Ya se intentó inicializar la autenticación')
        return
      }
      
      initializationAttempted.current = true
      console.log('[AuthContext] Inicializando autenticación')
      
      try {
        // Forzar una actualización completa de la sesión
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[AuthContext] Error al obtener la sesión inicial:', error.message)
          setLoading(false)
          return
        }
        
        const initialSession = data.session
        console.log('[AuthContext] Sesión inicial obtenida:', initialSession ? 'Presente' : 'Null')
        
        if (initialSession?.user) {
          console.log('[AuthContext] Usuario en sesión:', initialSession.user.email)
          setSession(initialSession)
          
          // Verificar si el usuario existe en la tabla de perfiles
          await cargarPerfil(initialSession.user.id)
        } else {
          console.log('[AuthContext] No hay sesión activa')
          setSession(null)
          setUser(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('[AuthContext] Error al inicializar autenticación:', error)
        setLoading(false)
      } finally {
        setAuthInitialized(true)
        console.log('[AuthContext] Inicialización de autenticación completada')
      }
    }

    // Inicializar autenticación solo una vez
    if (!authInitialized && !initializationAttempted.current) {
      inicializarAuth().catch(err => {
        console.error('[AuthContext] Error en inicialización:', err)
        setLoading(false)
      })
    }
    
    // Configurar la suscripción a eventos de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        try {
          console.log(`[AuthContext] Evento de autenticación: ${event}`, newSession ? 'Con sesión' : 'Sin sesión')
          
          // Actualizar el estado de la sesión
          setSession(newSession)
          
          if (newSession?.user?.id) {
            console.log(`[AuthContext] Usuario autenticado: ${newSession.user.email}`)
            // Forzar la recarga del perfil en cada cambio de estado de autenticación
            profileLoadAttempted.current = false
            await cargarPerfil(newSession.user.id)
          } else {
            console.log('[AuthContext] Usuario desconectado')
            setUser(null)
            setLoading(false)
            
            // Limpiar cualquier dato de sesión en localStorage
            try {
              localStorage.removeItem('mc-community-auth')
              console.log('[AuthContext] Datos de sesión eliminados de localStorage')
            } catch (e) {
              console.error('[AuthContext] Error al limpiar localStorage:', e)
            }
          }
        } catch (error) {
          console.error('[AuthContext] Error en evento de autenticación:', error)
          // Garantizar que loading se establezca en false incluso si hay errores
          setLoading(false)
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [authInitialized])

  // Verificar periódicamente si la sesión sigue siendo válida
  useEffect(() => {
    if (!authInitialized) return

    const supabase = supabaseClientRef.current

    // Función para verificar periódicamente si la sesión sigue siendo válida
    const verificarPerfil = async (userId: string) => {
      try {
        console.log(`[AuthContext] Verificando perfil para usuario: ${userId}`)
        const { data: perfilData, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error) {
          console.log('[AuthContext] Error al verificar perfil, intentando crear uno nuevo')
          
          // Intentar crear un perfil si no existe
          const { data: userData } = await supabase.auth.getUser()
          if (userData && userData.user) {
            const username = userData.user.user_metadata?.username || 'usuario'
            
            try {
              // Intentar crear el perfil usando upsert para evitar errores de duplicación
              const { data: newProfile, error: createError } = await supabase
                .from('perfiles')
                .upsert({
                  id: userId,
                  username: username,
                  role: 'user'
                }, { onConflict: 'id' })
                .select('*')
                .single()
              
              if (createError) {
                console.error('[AuthContext] Error al crear perfil en verificación:', createError)
                // No lanzar error para evitar bloquear la verificación
              } else {
                console.log('[AuthContext] Perfil creado correctamente en verificación:', newProfile)
                setUser(newProfile)
              }
            } catch (createError) {
              console.error('[AuthContext] Error al crear perfil en verificación (excepción):', createError)
              // No lanzar error para evitar bloquear la verificación
            }
          }
        } else {
          console.log('[AuthContext] Perfil verificado correctamente')
          setUser(perfilData)
        }
      } catch (error) {
        console.error('[AuthContext] Error al verificar perfil:', error)
        // No lanzar error para evitar bloquear la verificación
      }
    }

    // Verificar inmediatamente si no hay usuario pero hay sesión
    if (session?.user?.id && !user) {
      verificarPerfil(session.user.id)
    }

    const interval = setInterval(async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (JSON.stringify(currentSession) !== JSON.stringify(session)) {
          console.log('[AuthContext] Actualizando sesión en intervalo')
          setSession(currentSession)
          
          if (currentSession?.user?.id) {
            await verificarPerfil(currentSession.user.id)
          } else if (session && !currentSession) {
            setUser(null)
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error al verificar sesión:', error)
        // No hacer nada más para evitar bloquear la verificación
      }
    }, 60000) // Verificar cada minuto

    return () => clearInterval(interval)
  }, [authInitialized, session, user])

  // Renderizar el contenido incluso si está cargando después de cierto punto
  return (
    <AuthContext.Provider value={{ session, loading, user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
