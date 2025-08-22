'use client'

import { useState, useEffect } from 'react'
import AdminProtection from '@/components/AdminProtection'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Newspaper, Users, Eye, Calendar, BarChart2, TrendingUp, Clock, Award } from 'lucide-react'

interface EstadisticasNoticias {
  total_noticias: number
  total_vistas: number
  total_categorias: number
  total_autores: number
  noticias_por_mes: {
    mes: string
    cantidad: number
  }[]
  noticias_por_categoria: {
    categoria: string
    cantidad: number
  }[]
  noticias_por_autor: {
    autor: string
    cantidad: number
  }[]
  noticias_mas_vistas: {
    id: number
    titulo: string
    vistas: number
    fecha_publicacion: string
  }[]
}

function EstadisticasCard({ icon, title, value, description, className = '' }: { 
  icon: React.ReactNode
  title: string
  value: string | number
  description?: string
  className?: string
}) {
  return (
    <Card className={`${className}`}>
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

function EstadisticasNoticiasContent() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasNoticias | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarEstadisticas() {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/noticias/estadisticas?admin=true')
        
        if (!response.ok) {
          throw new Error('Error al cargar las estadísticas')
        }
        
        const data = await response.json()
        setEstadisticas(data)
      } catch (err: any) {
        console.error('Error al cargar estadísticas:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    cargarEstadisticas()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
        <p>Error al cargar las estadísticas: {error}</p>
      </div>
    )
  }

  // Si no hay datos, mostrar datos de ejemplo
  const stats = estadisticas || {
    total_noticias: 0,
    total_vistas: 0,
    total_categorias: 0,
    total_autores: 0,
    noticias_por_mes: [],
    noticias_por_categoria: [],
    noticias_por_autor: [],
    noticias_mas_vistas: []
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <EstadisticasCard 
          icon={<Newspaper className="h-5 w-5 text-primary" />} 
          title="Total Noticias" 
          value={stats.total_noticias.toLocaleString()}
        />
        <EstadisticasCard 
          icon={<Eye className="h-5 w-5 text-primary" />} 
          title="Total Vistas" 
          value={stats.total_vistas.toLocaleString()}
        />
        <EstadisticasCard 
          icon={<Award className="h-5 w-5 text-primary" />} 
          title="Categorías" 
          value={stats.total_categorias.toLocaleString()}
        />
        <EstadisticasCard 
          icon={<Users className="h-5 w-5 text-primary" />} 
          title="Autores" 
          value={stats.total_autores.toLocaleString()}
        />
      </div>

      <Tabs defaultValue="por_categoria">
        <TabsList className="mb-4">
          <TabsTrigger value="por_categoria">
            <Award className="h-4 w-4 mr-2" />
            Por Categoría
          </TabsTrigger>
          <TabsTrigger value="por_autor">
            <Users className="h-4 w-4 mr-2" />
            Por Autor
          </TabsTrigger>
          <TabsTrigger value="por_mes">
            <Calendar className="h-4 w-4 mr-2" />
            Por Mes
          </TabsTrigger>
          <TabsTrigger value="mas_vistas">
            <TrendingUp className="h-4 w-4 mr-2" />
            Más Vistas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="por_categoria">
          <Card>
            <CardHeader>
              <CardTitle>Noticias por Categoría</CardTitle>
              <CardDescription>Distribución de noticias por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.noticias_por_categoria.length > 0 ? (
                  stats.noticias_por_categoria.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span>{item.categoria}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (item.cantidad / Math.max(...stats.noticias_por_categoria.map(c => c.cantidad))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.cantidad}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No hay datos disponibles</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="por_autor">
          <Card>
            <CardHeader>
              <CardTitle>Noticias por Autor</CardTitle>
              <CardDescription>Distribución de noticias por autor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.noticias_por_autor.length > 0 ? (
                  stats.noticias_por_autor.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>{item.autor}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (item.cantidad / Math.max(...stats.noticias_por_autor.map(a => a.cantidad))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.cantidad}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No hay datos disponibles</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="por_mes">
          <Card>
            <CardHeader>
              <CardTitle>Noticias por Mes</CardTitle>
              <CardDescription>Publicaciones mensuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.noticias_por_mes.length > 0 ? (
                  stats.noticias_por_mes.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>{item.mes}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (item.cantidad / Math.max(...stats.noticias_por_mes.map(m => m.cantidad))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.cantidad}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No hay datos disponibles</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mas_vistas">
          <Card>
            <CardHeader>
              <CardTitle>Noticias Más Vistas</CardTitle>
              <CardDescription>Las noticias con mayor número de visitas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.noticias_mas_vistas.length > 0 ? (
                  stats.noticias_mas_vistas.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-lg text-muted-foreground">{index + 1}</span>
                        <div>
                          <p className="font-medium">{item.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.fecha_publicacion).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.vistas.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No hay datos disponibles</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function EstadisticasNoticias() {
  return (
    <AdminProtection>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Estadísticas de Noticias</h1>
            <p className="text-muted-foreground">
              Análisis y métricas de las noticias publicadas
            </p>
          </div>
        </div>
        <EstadisticasNoticiasContent />
      </div>
    </AdminProtection>
  )
}
