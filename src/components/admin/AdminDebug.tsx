'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createClient } from '@/lib/supabase/client'

export default function AdminDebug() {
  // Obtener datos del contexto de autenticación global
  const { session, user, loading, authInitialized } = useAuth()
  
  // Obtener datos del hook de autenticación de admin
  const { isAdmin, isLoading, user: adminUser, profile } = useAdminAuth()

  useEffect(() => {
    console.log('======== ADMIN DEBUG COMPONENT ========')
    console.log('URL actual:', window.location.pathname)
    
    // Datos del contexto de autenticación
    console.log('AuthContext - session:', session ? 'Existe' : 'No existe')
    console.log('AuthContext - user:', user ? 'Existe' : 'No existe')
    console.log('AuthContext - user.role:', user?.role)
    console.log('AuthContext - loading:', loading)
    console.log('AuthContext - authInitialized:', authInitialized)
    
    // Datos del hook de autenticación de admin
    console.log('useAdminAuth - isAdmin:', isAdmin)
    console.log('useAdminAuth - isLoading:', isLoading)
    console.log('useAdminAuth - user:', adminUser ? 'Existe' : 'No existe')
    console.log('useAdminAuth - profile:', profile ? 'Existe' : 'No existe')
    console.log('useAdminAuth - profile.role:', profile?.role)
    
    // Verificar sesión directamente con Supabase
    const verificarSesionDirecta = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        console.log('Supabase directo - session:', session ? 'Existe' : 'No existe')
        
        if (session?.user) {
          console.log('Supabase directo - user.id:', session.user.id)
          
          // Consultar perfil directamente
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          console.log('Supabase directo - perfil:', perfil ? 'Existe' : 'No existe')
          console.log('Supabase directo - campos del perfil:', perfil ? Object.keys(perfil).join(', ') : 'Ninguno')
          console.log('Supabase directo - perfil.role:', perfil?.role)
          console.log('Supabase directo - perfil.rol:', perfil?.rol)
          
          // Verificar ambos campos role y rol
          const isAdminByRole = perfil?.role === 'admin'
          const isAdminByRol = perfil?.rol === 'admin'
          
          // Buscar otros campos que puedan indicar que es admin
          const otherAdminField = perfil && Object.entries(perfil).find(
            ([key, value]) => 
              key !== 'role' && 
              key !== 'rol' && 
              key.toLowerCase().includes('admin') && 
              value === true
          )
          
          const isAdminByOtherField = !!otherAdminField
          const finalIsAdmin = isAdminByRole || isAdminByRol || isAdminByOtherField
          
          console.log('Supabase directo - es admin por role:', isAdminByRole)
          console.log('Supabase directo - es admin por rol:', isAdminByRol)
          console.log('Supabase directo - es admin por otro campo:', isAdminByOtherField)
          console.log('Supabase directo - es admin (final):', finalIsAdmin)
          console.log('Supabase directo - perfil completo:', JSON.stringify(perfil, null, 2))
        }
      } catch (error) {
        console.error('Error verificando sesión directa:', error)
      }
    }
    
    verificarSesionDirecta()
    console.log('======== FIN ADMIN DEBUG COMPONENT ========')
  }, [session, user, loading, authInitialized, isAdmin, isLoading, adminUser, profile])

  // Este componente no renderiza nada visible
  return null
}
