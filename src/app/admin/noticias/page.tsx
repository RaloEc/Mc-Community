'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminProtection from '@/components/AdminProtection'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Newspaper, 
  Plus, 
  BarChart2, 
  Tag, 
  ListFilter, 
  Settings, 
  Eye, 
  Calendar, 
  Users, 
  Clock,
  FileText
} from 'lucide-react'

// Componente para tarjetas de estadísticas
function EstadisticaCard({ icon, title, value, description, loading = false }: { 
  icon: React.ReactNode
  title: string
  value: string | number
  description?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para enlaces de navegación
function NavCard({ href, icon, title, description }: { 
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full hover:bg-accent/50 transition-colors">
        <CardHeader>
          <div className="flex items-center space-x-2">
            {icon}
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

function AdminNoticiasContent() {
  const [estadisticas, setEstadisticas] = useState({
    total_noticias: 0,
    total_vistas: 0,
    total_categorias: 0,
    noticias_recientes: 0,
    noticias_pendientes: 0
  })
  const [loading, setLoading] = useState(true)
  const [noticiasRecientes, setNoticiasRecientes] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true)
        // Cargar estadísticas
        const respuestaEstadisticas = await fetch('/api/admin/noticias/estadisticas')
        if (respuestaEstadisticas.ok) {
          const datos = await respuestaEstadisticas.json()
          setEstadisticas({
            total_noticias: datos.total_noticias || 0,
            total_vistas: datos.total_vistas || 0,
            total_categorias: datos.total_categorias || 0,
            noticias_recientes: datos.noticias_recientes || 0,
            noticias_pendientes: datos.noticias_pendientes || 0
          })
        }

        // Cargar noticias recientes
        const respuestaNoticias = await fetch('/api/noticias?admin=true&limit=5')
        if (respuestaNoticias.ok) {
          const datos = await respuestaNoticias.json()
          if (datos.success && datos.data) {
            setNoticiasRecientes(datos.data.slice(0, 5))
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // Función para formatear fecha
  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'Sin fecha';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(fecha).toLocaleDateString('es-ES', options)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de Noticias</h1>
          <p className="text-muted-foreground">
            Gestiona todos los aspectos de las noticias del sitio
          </p>
        </div>
        <Button onClick={() => router.push('/admin/noticias/crear')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Noticia
        </Button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <EstadisticaCard 
          icon={<Newspaper className="h-5 w-5 text-primary" />} 
          title="Total Noticias" 
          value={estadisticas.total_noticias.toLocaleString()}
          loading={loading}
        />
        <EstadisticaCard 
          icon={<Eye className="h-5 w-5 text-primary" />} 
          title="Total Vistas" 
          value={estadisticas.total_vistas.toLocaleString()}
          loading={loading}
        />
        <EstadisticaCard 
          icon={<Tag className="h-5 w-5 text-primary" />} 
          title="Categorías" 
          value={estadisticas.total_categorias.toLocaleString()}
          loading={loading}
        />
        <EstadisticaCard 
          icon={<Clock className="h-5 w-5 text-primary" />} 
          title="Últimos 30 días" 
          value={estadisticas.noticias_recientes.toLocaleString()}
          loading={loading}
        />
        <EstadisticaCard 
          icon={<Calendar className="h-5 w-5 text-primary" />} 
          title="Pendientes" 
          value={estadisticas.noticias_pendientes.toLocaleString()}
          loading={loading}
        />
      </div>

      {/* Navegación y contenido principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NavCard 
          href="/admin/noticias/listado"
          icon={<ListFilter className="h-5 w-5 text-primary" />}
          title="Listado de Noticias"
          description="Gestiona todas las noticias publicadas"
        />
        <NavCard 
          href="/admin/noticias/categorias"
          icon={<Tag className="h-5 w-5 text-primary" />}
          title="Categorías"
          description="Administra las categorías de noticias"
        />
        <NavCard 
          href="/admin/noticias/estadisticas"
          icon={<BarChart2 className="h-5 w-5 text-primary" />}
          title="Estadísticas"
          description="Analiza el rendimiento de tus noticias"
        />
      </div>

      {/* Noticias recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Noticias Recientes</CardTitle>
          <CardDescription>Las últimas noticias publicadas en el sitio</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : noticiasRecientes.length > 0 ? (
            <div className="space-y-4">
              {noticiasRecientes.map((noticia) => (
                <div key={noticia.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <h3 className="font-medium">{noticia.titulo}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatearFecha(noticia.fecha_publicacion)} • 
                      <span style={{ color: noticia.autor?.color || 'inherit' }}>
                        {noticia.autor?.username || 'Desconocido'}
                      </span>
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/admin/noticias/editar/${noticia.id}`)}
                  >
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No hay noticias recientes</p>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.push('/admin/noticias/listado')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Ver todas las noticias
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function AdminNoticias() {
  return (
    <AdminProtection>
      <AdminNoticiasContent />
    </AdminProtection>
  )
}
