'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient, createNonPersistentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoutLogs, setLogoutLogs] = useState<string[]>([])
  const [showLogoutInfo, setShowLogoutInfo] = useState(false)
  const redirectUrl = searchParams.get('redirect')
  const freshLogin = searchParams.get('fresh') === 'true'

  // Verificar si hay logs de cierre de sesión en sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedLogs = sessionStorage.getItem('logout_logs')
        const timestamp = sessionStorage.getItem('logout_timestamp')
        
        if (storedLogs && timestamp) {
          // Solo mostrar logs si son recientes (menos de 30 segundos)
          const logTime = parseInt(timestamp)
          const now = Date.now()
          
          if (now - logTime < 30000) { // 30 segundos
            setLogoutLogs(JSON.parse(storedLogs))
            setShowLogoutInfo(true)
            
            // Limpiar después de mostrarlos
            setTimeout(() => {
              sessionStorage.removeItem('logout_logs')
              sessionStorage.removeItem('logout_timestamp')
            }, 1000)
          } else {
            // Limpiar logs antiguos
            sessionStorage.removeItem('logout_logs')
            sessionStorage.removeItem('logout_timestamp')
          }
        }
      } catch (e) {
        console.error('Error al recuperar logs de cierre de sesión:', e)
      }
    }
    
    // Verificar y limpiar cualquier sesión fantasma al cargar la página
    async function checkAndClearGhostSession() {
      try {
        // Usar cliente sin persistencia para verificar sesión sin restaurarla
        const nonPersistentClient = createNonPersistentClient()
        const { data } = await nonPersistentClient.auth.getSession()
        
        if (data.session) {
          console.log('Detectada sesión fantasma en página de login, limpiando...')
          await nonPersistentClient.auth.signOut({ scope: 'global' })
        }
      } catch (e) {
        console.error('Error al verificar sesión fantasma:', e)
      }
    }
    
    // Solo ejecutar la limpieza si es un login fresco (después de logout)
    if (freshLogin) {
      checkAndClearGhostSession()
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Crear un nuevo cliente para cada login
      // Esto evita problemas con sesiones anteriores
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Manejar redirección después del login
      if (data.session) {
        // Si hay una URL de redirección, usarla
        if (redirectUrl) {
          router.push(redirectUrl)
        } else {
          // Si no hay redirección específica, verificar si es admin
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

          if (perfil && perfil.role === 'admin') {
            router.push('/admin/dashboard')
          } else {
            router.push('/') // Redirigir a la página principal para usuarios normales
          }
        }
      }
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {showLogoutInfo && logoutLogs.length > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription>
                  <p className="font-medium text-green-800 mb-2">Sesión cerrada correctamente</p>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="logout-logs">
                      <AccordionTrigger className="text-xs text-muted-foreground">
                        Ver detalles del cierre de sesión
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-slate-50 p-2 rounded text-xs font-mono max-h-40 overflow-y-auto">
                          {logoutLogs.map((log, i) => (
                            <div key={i} className="py-0.5">{log}</div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
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
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              ¿No tienes una cuenta? <a href="/register" className="underline">Regístrate</a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}