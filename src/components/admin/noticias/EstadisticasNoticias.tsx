import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Eye, Star, XCircle } from 'lucide-react'
import { useEstadisticasNoticias } from '@/components/noticias/hooks/useAdminNoticias'

export function EstadisticasNoticias() {
  const { data: estadisticas, isLoading } = useEstadisticasNoticias()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
              <Skeleton className="h-3 w-[120px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Noticias',
      value: estadisticas?.total_noticias || 0,
      description: 'Noticias publicadas',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Total Vistas',
      value: estadisticas?.total_vistas || 0,
      description: `Promedio: ${estadisticas?.total_noticias ? Math.round((estadisticas?.total_vistas || 0) / estadisticas.total_noticias) : 0} por noticia`,
      icon: Eye,
      color: 'text-green-600',
    },
    {
      title: 'Destacadas',
      value: estadisticas?.noticias_destacadas || 0,
      description: 'Noticias destacadas',
      icon: Star,
      color: 'text-yellow-600',
    },
    {
      title: 'Inactivas',
      value: estadisticas?.noticias_inactivas || 0,
      description: 'Noticias desactivadas',
      icon: XCircle,
      color: 'text-red-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
