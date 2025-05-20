// src/app/admin/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/utils/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true) // Inicialmente cargando para verificar sesión
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Verificar si ya hay una sesión activa al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        // Si hay sesión, verificamos si es admin
        if (session?.user) {
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          if (perfil?.role === 'admin') {
            // Es un admin, redirigir al dashboard
            router.push('/admin/dashboard')
            return
          }
        }
        
        // Si no hay sesión o no es admin, mostrar el formulario de login
        setLoading(false)
      } catch (error) {
        console.error('Error al verificar sesión:', error)
        setLoading(false)
      }
    }
    
    checkSession()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Crear un timeout para la operación completa
    const loginTimeout = setTimeout(() => {
      setLoading(false)
      setError('La operación ha tardado demasiado tiempo. Por favor, inténtalo de nuevo.')
    }, 15000) // 15 segundos de timeout

    try {
      // Usar el cliente del navegador para evitar problemas con localStorage
      const supabase = createBrowserClient()
      
      // Paso 1: Intentar iniciar sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Mensajes de error más amigables
        if (error.message.includes('Invalid login')) {
          throw new Error('Correo o contraseña incorrectos')
        } else if (error.message.includes('network')) {
          throw new Error('Error de conexión. Verifica tu conexión a internet')
        } else {
          throw error
        }
      }

      if (!data.user) {
        throw new Error('No se pudo obtener la información del usuario')
      }

      // Paso 2: Verificar si el usuario es admin
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (perfilError) {
        console.error('Error al verificar perfil:', perfilError)
        throw new Error('No se pudo verificar tu perfil de usuario')
      }

      if (!perfil || perfil.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('No tienes permisos de administrador')
      }

      // Limpiar el timeout ya que todo salió bien
      clearTimeout(loginTimeout)
      
      // Redirigir al dashboard
      router.push('/admin/dashboard')
    } catch (error: any) {
      console.error('Error en login:', error)
      setError(error.message || 'Error al iniciar sesión')
    } finally {
      clearTimeout(loginTimeout) // Asegurarse de limpiar el timeout en caso de error
      setLoading(false)
    }
  }

  // Si está cargando, mostrar un indicador de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Panel de Administración</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al panel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}