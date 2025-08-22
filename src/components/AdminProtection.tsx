'use client'

import { useEffect, useState } from 'react'
import { Loader2, Shield, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { getExistingClient, createClient } from '@/lib/supabase/client'
import AdminDebug from '@/components/admin/AdminDebug'

interface AdminProtectionProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallbackUrl?: string
  loadingMessage?: string
}

// Componente AdminProtection simplificado y directo
export default function AdminProtection({ 
  children, 
  requireAdmin = true, 
  fallbackUrl = '/login',
  loadingMessage = 'Verificando permisos de administrador...'
}: AdminProtectionProps) {
  const [state, setState] = useState({
    isLoading: true,
    isAdmin: false,
    user: null as any,
    profile: null as any,
    error: null as string | null,
    bypassChecks: false // Para casos extremos
  })

  // Función para verificar directamente con Supabase
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout
    
    // Limpiar caché al iniciar
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('admin_auth_state')
        localStorage.removeItem('admin_auth_state')
      }
    } catch (e) {}
    
    async function checkAdmin() {
      try {
        // Usar cliente existente o crear uno nuevo si no existe
        // Esto evita crear múltiples instancias de GoTrueClient
        const supabase = getExistingClient() || createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          if (isMounted) {
            setState(prev => ({ ...prev, isLoading: false, error: 'No hay sesión activa' }))
          }
          return
        }
        
        // Obtener perfil directamente con todos los campos
        const { data: profile, error } = await supabase
          .from('perfiles')
          .select('*') // Seleccionamos todos los campos para verificar role y rol
          .eq('id', session.user.id)
          .single()
        
        if (error) {
          console.error('[AdminProtection] Error obteniendo perfil:', error)
          if (isMounted) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              user: session.user,
              error: 'Error al verificar perfil'
            }))
          }
          return
        }
        
        // Verificar tanto 'role' como 'rol' por si acaso hay inconsistencia
        const isAdminByRole = profile?.role === 'admin'
        const isAdminByRol = profile?.rol === 'admin'
        
        // Buscar otros campos que puedan indicar que es admin
        const otherAdminField = profile && Object.entries(profile).find(
          ([key, value]) => 
            key !== 'role' && 
            key !== 'rol' && 
            key.toLowerCase().includes('admin') && 
            value === true
        )
        
        const isAdminByOtherField = !!otherAdminField
        const isAdmin = isAdminByRole || isAdminByRol || isAdminByOtherField
        
        console.log(`[AdminProtection] Usuario verificación:`);
        console.log(`- Por 'role': ${isAdminByRole ? 'ES admin' : 'NO es admin'}. Valor: ${profile?.role}`);
        console.log(`- Por 'rol': ${isAdminByRol ? 'ES admin' : 'NO es admin'}. Valor: ${profile?.rol}`);
        console.log(`- Por otros campos: ${isAdminByOtherField ? 'ES admin' : 'NO es admin'}`);
        console.log(`- Resultado final: ${isAdmin ? 'ES' : 'NO es'} admin`);
        console.log(`- Campos disponibles:`, Object.keys(profile || {}).join(', '));
        
        if (isMounted) {
          setState({
            isLoading: false,
            isAdmin,
            user: session.user,
            profile,
            error: null,
            bypassChecks: false
          })
        }
      } catch (error) {
        console.error('[AdminProtection] Error verificando admin:', error)
        if (isMounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Error inesperado'
          }))
        }
      }
    }
    
    checkAdmin()
    
    // Timeout de seguridad (1.5 segundos)
    timeoutId = setTimeout(() => {
      if (isMounted && state.isLoading) {
        console.log('[AdminProtection] Timeout alcanzado, forzando resolución')
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Tiempo de espera agotado'
        }))
      }
    }, 1500)
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  // Botón para forzar acceso en casos extremos
  const forceAccess = () => {
    setState(prev => ({
      ...prev,
      bypassChecks: true,
      isAdmin: true
    }))
  }

  // Mostrar loading mientras se verifica la autenticación
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">{loadingMessage}</p>
            <p className="text-sm text-muted-foreground">
              Esto puede tomar unos segundos...
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={forceAccess}
            >
              Forzar acceso (emergencia)
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Si se ha activado el bypass o el usuario es admin, mostrar contenido
  if (state.bypassChecks || !requireAdmin || state.isAdmin) {
    return (
      <>
        <AdminDebug />
        {children}
      </>
    )
  }

  // Si se requiere admin y el usuario no es admin, mostrar mensaje de acceso denegado
  console.log('======== ACCESO RESTRINGIDO ========');
  console.log('URL actual:', typeof window !== 'undefined' ? window.location.pathname : 'No disponible');
  console.log('Estado:', JSON.stringify(state, null, 2));
  console.log('requireAdmin:', requireAdmin);
  console.log('bypassChecks:', state.bypassChecks);
  console.log('isAdmin:', state.isAdmin);
  console.log('user:', state.user ? 'Existe' : 'No existe');
  console.log('profile:', state.profile ? 'Existe' : 'No existe');
  console.log('profile.role:', state.profile?.role);
  console.log('======== FIN ACCESO RESTRINGIDO ========');
  
  // Incluir componente de depuración invisible
  return (
    <>  
      <AdminDebug />
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Acceso Restringido</CardTitle>
            <CardDescription>
              {state.error || 'No tienes permisos para acceder a esta sección'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Esta página requiere permisos de administrador.
              </p>
              {state.user && state.profile && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p><strong>Usuario:</strong> {state.profile.username || state.user.email}</p>
                  <p><strong>Rol:</strong> {state.profile.role || 'usuario'}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Recargar página
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  Volver al inicio
                </Link>
              </Button>
              <Button variant="destructive" onClick={forceAccess}>
                Forzar acceso (emergencia)
              </Button>
              <Button variant="outline" asChild>
                <Link href="/clear-cache.html" target="_blank">
                  Limpiar caché del navegador
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
