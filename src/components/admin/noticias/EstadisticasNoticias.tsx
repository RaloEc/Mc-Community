import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Eye, Calendar, Clock } from 'lucide-react'
import { useEstadisticasNoticias } from '@/components/noticias/hooks/useAdminNoticias'

export function EstadisticasNoticias() {
  const { data: estadisticas, isLoading, realtimeEnabled } = useEstadisticasNoticias()

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

  // Calcular porcentajes de cambio (simulado para demo)
  const calcularPorcentaje = (valor: number, base: number = 100) => {
    if (!base) return 0
    return Math.round(((valor - base) / base) * 100)
  }

  const stats = [
    {
      title: 'Total Noticias',
      value: estadisticas?.total_noticias || 0,
      description: `${estadisticas?.total_noticias ? '+12%' : '0%'} del mes anterior`,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      trend: 'up' as const,
    },
    {
      title: 'Total Vistas',
      value: estadisticas?.total_vistas || 0,
      description: `${estadisticas?.total_vistas ? '+8%' : '0%'} del mes anterior`,
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      trend: 'up' as const,
    },
    {
      title: 'Últimos 30 días',
      value: (estadisticas as any)?.noticias_recientes || 0,
      description: `${(estadisticas as any)?.noticias_recientes ? '+5%' : '0%'} del mes anterior`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      trend: 'up' as const,
    },
    {
      title: 'Pendientes',
      value: (estadisticas as any)?.noticias_pendientes || 0,
      description: `${(estadisticas as any)?.noticias_pendientes ? '-3%' : '0%'} del mes anterior`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      trend: 'down' as const,
    },
  ]

  return (
    <div>
      {/* Indicador de conexión en tiempo real */}
      {realtimeEnabled && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <span>Estadísticas en tiempo real activas</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const trendColor = stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
          const trendSymbol = stat.trend === 'up' ? '↑' : '↓'
          
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className={`text-xs mt-1 flex items-center gap-1 ${trendColor}`}>
                  <span>{trendSymbol}</span>
                  <span>{stat.description}</span>
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
