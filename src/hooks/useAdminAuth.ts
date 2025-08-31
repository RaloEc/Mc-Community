'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getExistingClient } from '@/lib/supabase/client'

export interface AdminAuthState {
  isLoading: boolean
  isAdmin: boolean
  user: any
  profile: any
}

// Versión simplificada y directa sin dependencias de caché
export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    isLoading: true,
    isAdmin: false,
    user: null,
    profile: null
  })
  const router = useRouter()
  const isMounted = useRef(true)
  const checkingRef = useRef(false)
  const completedRef = useRef(false)

  // Función para verificar autenticación directamente con Supabase
  async function checkAdminAuth() {
    if (checkingRef.current || !isMounted.current) return
    
    checkingRef.current = true
    console.log('[useAdminAuth] ========== INICIO VERIFICACIÓN ADMIN ==========');
    console.log('[useAdminAuth] URL actual:', typeof window !== 'undefined' ? window.location.pathname : 'No disponible');
    console.log('[useAdminAuth] Verificando autenticación admin directamente con Supabase')
    
    try {
      // Limpiar cualquier caché que pueda interferir
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('admin_auth_state')
          localStorage.removeItem('admin_auth_state')
        } catch (e) {}
      }
      
      // Usar cliente existente o crear uno nuevo si no existe
      // Esto evita crear múltiples instancias de GoTrueClient
      const supabase = getExistingClient() || createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('[useAdminAuth] Resultado de getSession:', session ? 'Sesión encontrada' : 'No hay sesión')
      if (session) {
        console.log('[useAdminAuth] ID de usuario:', session.user?.id)
        console.log('[useAdminAuth] Email de usuario:', session.user?.email)
        console.log('[useAdminAuth] Metadata:', JSON.stringify(session.user?.user_metadata, null, 2))
      }
      
      if (!session?.user) {
        console.log('[useAdminAuth] No hay sesión activa')
        if (isMounted.current) {
          setState({
            isLoading: false,
            isAdmin: false,
            user: null,
            profile: null
          })
        }
        return
      }
      
      // Obtener perfil directamente
      console.log('[useAdminAuth] Consultando perfil para usuario ID:', session.user.id)
      const { data: profile, error } = await supabase
        .from('perfiles')
        .select('*') // Seleccionamos todos los campos para ver qué está disponible
        .eq('id', session.user.id)
        .single()
      
      console.log('[useAdminAuth] Consulta SQL ejecutada:', `SELECT * FROM perfiles WHERE id = '${session.user.id}'`)
      
      if (error) {
        console.error('[useAdminAuth] Error obteniendo perfil:', error)
        console.error('[useAdminAuth] Código de error:', error.code)
        console.error('[useAdminAuth] Mensaje de error:', error.message)
        if (isMounted.current) {
          setState({
            isLoading: false,
            isAdmin: false,
            user: session.user,
            profile: null
          })
        }
        return
      }
      
      // Verificación más robusta del rol de administrador
      console.log('[useAdminAuth] Perfil obtenido:', profile ? 'Encontrado' : 'No encontrado')
      console.log('[useAdminAuth] Campos disponibles en el perfil:', profile ? Object.keys(profile).join(', ') : 'Ninguno')
      console.log('[useAdminAuth] Valor del campo role:', profile?.role)
      console.log('[useAdminAuth] Tipo de dato del campo role:', profile?.role ? typeof profile.role : 'N/A')
      
      // Verificar tanto 'role' como 'rol' por si acaso hay inconsistencia en la base de datos
      // Algunas partes de la aplicación usan 'role' y otras usan 'rol'
      const isAdminByRole = profile?.role === 'admin'
      const isAdminByRol = profile?.rol === 'admin'
      
      // Si cualquiera de los dos campos indica que es admin, considerarlo admin
      const isAdmin = isAdminByRole || isAdminByRol
      
      // Si el perfil existe pero ninguno de los dos campos tiene valor 'admin', verificar si hay otros campos
      // que puedan indicar que es admin (por si el campo ha cambiado de nombre)
      const otherAdminField = profile && Object.entries(profile).find(
        ([key, value]) => 
          key !== 'role' && 
          key !== 'rol' && 
          key.toLowerCase().includes('admin') && 
          value === true
      )
      
      const isAdminByOtherField = !!otherAdminField
      const finalIsAdmin = isAdmin || isAdminByOtherField
      
      console.log(`[useAdminAuth] Verificación por 'role': ${isAdminByRole ? 'ES admin' : 'NO es admin'}`)
      console.log(`[useAdminAuth] Verificación por 'rol': ${isAdminByRol ? 'ES admin' : 'NO es admin'}`)
      console.log(`[useAdminAuth] Verificación por otros campos: ${isAdminByOtherField ? 'ES admin' : 'NO es admin'}`)
      console.log(`[useAdminAuth] Resultado final: Usuario ${finalIsAdmin ? 'ES' : 'NO es'} admin`)
      console.log(`[useAdminAuth] Detalles completos del perfil:`, JSON.stringify(profile, null, 2))
      
      if (isMounted.current) {
        const newState = {
          isLoading: false,
          isAdmin: finalIsAdmin,
          user: session.user,
          profile
        }
        setState(newState)
        completedRef.current = true
        console.log('[useAdminAuth] Estado establecido:', JSON.stringify(newState, null, 2))
        console.log('[useAdminAuth] Verificación completada exitosamente')
        
        // No redirigir automáticamente, solo establecer el estado
        // Esto permite que las páginas decidan qué hacer basado en isAdmin
      }
    } catch (error) {
      console.error('[useAdminAuth] Error verificando admin:', error)
      if (isMounted.current) {
        setState({
          isLoading: false,
          isAdmin: false,
          user: null,
          profile: null
        })
        completedRef.current = true
        
        // No redirigir automáticamente en caso de error
        // Solo actualizar el estado
      }
    } finally {
      if (isMounted.current) {
        checkingRef.current = false
        console.log('[useAdminAuth] ========== FIN VERIFICACIÓN ADMIN ==========');
      }
    }
  }

  // Efecto para verificar al montar el componente
  useEffect(() => {
    isMounted.current = true
    
    // Verificar inmediatamente
    checkAdminAuth()
    
    // Timeout de seguridad (5 segundos) - solo si realmente no se ha completado
    const timeoutId = setTimeout(() => {
      if (isMounted.current && !completedRef.current) {
        console.log('[useAdminAuth] Timeout alcanzado, forzando resolución por falta de respuesta')
        setState({
          isLoading: false,
          isAdmin: false,
          user: null,
          profile: null
        })
        checkingRef.current = false
        completedRef.current = true
      }
    }, 5000)
    
    // Verificar cada 30 segundos para mantener actualizado
    const intervalId = setInterval(() => {
      if (isMounted.current && !checkingRef.current) {
        checkAdminAuth()
      }
    }, 30000)
    
    return () => {
      isMounted.current = false
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [])

  return state
}
