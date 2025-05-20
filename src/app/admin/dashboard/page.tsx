// src/app/admin/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Server, 
  Newspaper, 
  BookOpen, 
  Users, 
  TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    servidores: 0,
    noticias: 0,
    items: 0,
    usuarios: 0
  })
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Verificar autenticación
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
    
    async function checkAuth() {
      try {
        // Usar el cliente del navegador para evitar problemas con localStorage
        const supabase = createClient()
        
        // Intentar obtener la sesión con timeout
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          console.log('No hay sesión activa, redirigiendo a login')
          router.push('/admin/login')
          return
        }
        
        // Verificar si es admin con timeout
        const { data: perfil, error } = await supabase
          .from('perfiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (error) {
          console.error('Error al verificar perfil:', error)
          if (error.code === 'PGRST116') {
            // Si el perfil no existe, cerrar sesión y redirigir
            await supabase.auth.signOut()
            router.push('/admin/login')
            return
          }
        }
        
        if (!perfil || perfil.role !== 'admin') {
          console.log('Usuario no es admin, redirigiendo a login')
          await supabase.auth.signOut()
          router.push('/admin/login')
          return
        }
        
        setAuthChecked(true)
      } catch (error: any) {
        console.error('Error verificando autenticación:', error)
        
        // Si es un error de timeout o red, mostrar mensaje más claro
        if (error.name === 'AbortError' || error.message?.includes('network')) {
          console.error('Timeout o error de red al verificar autenticación')
        }
        
        router.push('/admin/login')
      } finally {
        clearTimeout(timeoutId);
      }
    }
    
    checkAuth()
  }, [router])

  // Cargar estadísticas
  useEffect(() => {
    if (!authChecked) return
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos de timeout
    
    async function fetchStats() {
      setLoading(true)
      try {
        // Usar el cliente del navegador para evitar problemas con localStorage
        const supabase = createClient()
        
        // Usar Promise.allSettled para hacer todas las consultas en paralelo
        // y manejar errores individuales sin fallar todo el proceso
        const [servidoresResult, noticiasResult, itemsResult, usuariosResult] = await Promise.allSettled([
          // Contar servidores
          supabase
            .from('servidores')
            .select('*', { count: 'exact', head: true }),

          // Contar noticias
          supabase
            .from('noticias')
            .select('*', { count: 'exact', head: true }),

          // Contar items
          supabase
            .from('items')
            .select('*', { count: 'exact', head: true }),

          // Contar usuarios
          supabase
            .from('perfiles')
            .select('*', { count: 'exact', head: true })
        ])

        // Extraer los conteos de cada resultado, manejando posibles errores
        const servidoresCount = servidoresResult.status === 'fulfilled' ? servidoresResult.value.count : 0
        const noticiasCount = noticiasResult.status === 'fulfilled' ? noticiasResult.value.count : 0
        const itemsCount = itemsResult.status === 'fulfilled' ? itemsResult.value.count : 0
        const usuariosCount = usuariosResult.status === 'fulfilled' ? usuariosResult.value.count : 0

        setStats({
          servidores: servidoresCount || 0,
          noticias: noticiasCount || 0,
          items: itemsCount || 0,
          usuarios: usuariosCount || 0
        })
      } catch (error: any) {
        console.error('Error al cargar estadísticas:', error)
        
        // Si es un error de timeout, mostrar mensaje más claro
        if (error.name === 'AbortError') {
          console.error('Timeout al cargar estadísticas')
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false)
      }
    }

    fetchStats()
  }, [authChecked])

  // Si aún está verificando autenticación, mostrar cargando con mensaje más informativo
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando autenticación...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Si tarda demasiado, intenta <button 
              onClick={() => window.location.reload()} 
              className="text-primary underline"
            >
              recargar la página
            </button>
          </p>
        </div>
      </div>
    )
  }

  const statCards = [
    { title: 'Servidores', value: stats.servidores, icon: Server, color: 'text-blue-500', href: '/admin/servidores' },
    { title: 'Noticias', value: stats.noticias, icon: Newspaper, color: 'text-green-500', href: '/admin/noticias' },
    { title: 'Items Wiki', value: stats.items, icon: BookOpen, color: 'text-amber-500', href: '/admin/wiki' },
    { title: 'Usuarios', value: stats.usuarios, icon: Users, color: 'text-purple-500', href: '/admin/usuarios' }
  ]

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <div className="text-xs sm:text-sm text-zinc-400">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card 
              key={card.title} 
              className="overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg bg-zinc-900/30 border-zinc-800/50"
              onClick={() => router.push(card.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={cn("h-4 w-4", card.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-16" /> : card.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/30 border-zinc-800/50">
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>
              Últimas acciones en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-zinc-400">
              <p>Próximamente: Registro de actividad</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800/50">
          <CardHeader>
            <CardTitle>Rendimiento</CardTitle>
            <CardDescription>
              Estadísticas de uso del sitio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px]">
              <div className="text-center text-zinc-400">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-zinc-400">Próximamente: Gráficos de rendimiento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}