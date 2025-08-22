'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, RefreshCw, Check, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function AdminDebugPage() {
  const [state, setState] = useState({
    loading: true,
    session: null as any,
    profile: null as any,
    error: null as string | null,
    logs: [] as string[]
  })

  const addLog = (message: string) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, `${new Date().toLocaleTimeString()}: ${message}`]
    }))
  }

  const checkAuth = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    addLog('Iniciando verificación de autenticación')
    
    try {
      // Limpiar caché
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('admin_auth_state')
          localStorage.removeItem('admin_auth_state')
          addLog('Caché limpiada correctamente')
        } catch (e) {
          addLog('Error al limpiar caché')
        }
      }
      
      // Verificar sesión
      const supabase = createClient()
      addLog('Cliente Supabase creado')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        addLog(`Error al obtener sesión: ${sessionError.message}`)
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: `Error al obtener sesión: ${sessionError.message}` 
        }))
        return
      }
      
      if (!session) {
        addLog('No hay sesión activa')
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          session: null,
          profile: null,
          error: 'No hay sesión activa' 
        }))
        return
      }
      
      addLog(`Sesión encontrada para: ${session.user.email || session.user.id}`)
      
      // Obtener perfil
      const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileError) {
        addLog(`Error al obtener perfil: ${profileError.message}`)
        setState(prev => ({ 
          ...prev, 
          loading: false,
          session,
          error: `Error al obtener perfil: ${profileError.message}` 
        }))
        return
      }
      
      addLog(`Perfil obtenido: role=${profile.role}`)
      
      setState({
        loading: false,
        session,
        profile,
        error: null,
        logs: state.logs
      })
    } catch (error: any) {
      addLog(`Error inesperado: ${error.message || 'Desconocido'}`)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Error inesperado: ${error.message || 'Desconocido'}` 
      }))
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Depuración de Autenticación Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Autenticación</CardTitle>
            <CardDescription>Información detallada sobre tu sesión actual</CardDescription>
          </CardHeader>
          <CardContent>
            {state.loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span>Verificando...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="mr-2">
                    {state.session ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Sesión activa</p>
                    <p className="text-sm text-muted-foreground">
                      {state.session ? 'Sesión encontrada' : 'No hay sesión activa'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-2">
                    {state.profile ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Perfil de usuario</p>
                    <p className="text-sm text-muted-foreground">
                      {state.profile ? `Perfil encontrado (${state.profile.username})` : 'No hay perfil'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-2">
                    {state.profile?.role === 'admin' ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Rol de administrador</p>
                    <p className="text-sm text-muted-foreground">
                      {state.profile?.role === 'admin' 
                        ? 'Tienes permisos de administrador' 
                        : `Rol actual: ${state.profile?.role || 'desconocido'}`}
                    </p>
                  </div>
                </div>
                
                {state.error && (
                  <div className="bg-destructive/10 p-3 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                    <p className="text-sm">{state.error}</p>
                  </div>
                )}
                
                <div className="pt-4 space-y-2">
                  <Button onClick={checkAuth} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" /> Verificar de nuevo
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/clear-cache.html" target="_blank">
                      Limpiar caché del navegador
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/admin">
                      Volver al panel de administración
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Registro de actividad</CardTitle>
            <CardDescription>Logs de verificación de autenticación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-md p-3 h-[300px] overflow-y-auto font-mono text-xs">
              {state.logs.length > 0 ? (
                <ul className="space-y-1">
                  {state.logs.map((log, index) => (
                    <li key={index}>{log}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No hay logs disponibles</p>
              )}
            </div>
            
            {state.session && (
              <div className="mt-4">
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Datos de sesión (expandir)</summary>
                  <pre className="mt-2 bg-muted/50 p-2 rounded-md overflow-x-auto">
                    {JSON.stringify({
                      user: {
                        id: state.session.user.id,
                        email: state.session.user.email,
                        role: state.profile?.role
                      },
                      auth: {
                        accessToken: state.session.access_token ? '✓ Presente' : '✗ Ausente',
                        refreshToken: state.session.refresh_token ? '✓ Presente' : '✗ Ausente',
                        expires: new Date(state.session.expires_at || 0).toLocaleString()
                      }
                    }, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
