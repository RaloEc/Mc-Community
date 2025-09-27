'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session, User } from '@supabase/supabase-js'

interface Profile {
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
  profileLoading: boolean
  profile: Profile | null
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const defaultAuthState: AuthState = {
  user: null,
  session: null,
  loading: true,
  profileLoading: false,
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
  const [session, setSession] = React.useState<Session | null>(initialSession || null)
  const [user, setUser] = React.useState<User | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [profileLoading, setProfileLoading] = React.useState<boolean>(false)
  const profileCacheRef = React.useRef<Map<string, Profile>>(new Map())

  const fetchProfile = React.useCallback(async (userId: string, retryCount = 0) => {
    // Cache simple en memoria para evitar refetch innecesario mientras viva la app
    if (profileCacheRef.current.has(userId)) {
      setProfile(profileCacheRef.current.get(userId) ?? null)
      return
    }

    setProfileLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        const p: Profile = {
          id: data.id,
          username: data.username ?? null,
          role: data.role ?? 'user',
          created_at: data.created_at ?? null,
          avatar_url: data.avatar_url ?? null,
          banner_url: (data as any).banner_url ?? null,
          color: data.color ?? null,
        }
        profileCacheRef.current.set(userId, p)
        setProfile(p)
        console.log('AuthContext: Perfil cargado exitosamente:', { username: p.username, role: p.role })
      } else if (error && retryCount < 2) {
        // Retry para casos donde el perfil aún no existe tras OAuth (trigger delay)
        console.log(`AuthContext: Error cargando perfil (intento ${retryCount + 1}/3), reintentando en 300ms:`, error)
        setTimeout(() => {
          fetchProfile(userId, retryCount + 1)
        }, 300 * (retryCount + 1)) // Backoff incremental
        return // No cambiar profileLoading aquí, se cambiará en el retry
      } else {
        console.error('AuthContext: Error definitivo cargando perfil:', error)
        setProfile(null)
      }
    } catch (err) {
      console.error('AuthContext: Error inesperado en fetchProfile:', err)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        console.log('AuthContext: Inicializando y obteniendo sesión...')
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('AuthContext: Error al obtener sesión inicial:', error)
          return
        }
        
        if (!isMounted) return
        
        if (data.session) {
          console.log('AuthContext: Sesión inicial encontrada:', {
            userId: data.session.user.id,
            email: data.session.user.email,
            provider: data.session.user.app_metadata.provider
          })
          setSession(data.session)
          setUser(data.session.user)
          await fetchProfile(data.session.user.id)
        } else {
          console.log('AuthContext: No hay sesión inicial')
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('AuthContext: Error inesperado al inicializar:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    init()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`AuthContext: Cambio de estado de autenticación: ${event}`, {
        tieneSession: !!newSession,
        userId: newSession?.user?.id
      })
      
      if (!isMounted) return
      
      setSession(newSession)
      const u = newSession?.user ?? null
      setUser(u)
      
      if (u) {
        await fetchProfile(u.id)
      } else {
        setProfile(null)
        setProfileLoading(false)
      }
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const refreshAuth = React.useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    setSession(currentSession)
    const u = currentSession?.user ?? null
    setUser(u)
    
    if (u) {
      await fetchProfile(u.id)
    } else {
      setProfile(null)
      setProfileLoading(false)
    }
  }, [supabase, fetchProfile])
  
  const refreshProfile = React.useCallback(async () => {
    if (!user) return
    
    // Limpiar la caché para forzar una recarga desde la base de datos
    profileCacheRef.current.delete(user.id)
    
    // Recargar el perfil
    await fetchProfile(user.id)
    console.log('AuthContext: Perfil actualizado forzosamente')
  }, [user, fetchProfile])

  const value = React.useMemo<AuthState>(() => ({
    user,
    session,
    loading,
    profileLoading,
    profile,
    signOut,
    refreshAuth,
    refreshProfile,
  }), [user, session, loading, profileLoading, profile, signOut, refreshAuth, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return React.useContext(AuthContext)
}
