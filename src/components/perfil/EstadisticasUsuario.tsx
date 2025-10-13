'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Newspaper, TrendingUp } from 'lucide-react'
import { ProfileData } from '@/hooks/use-perfil-usuario'

interface EstadisticasUsuarioProps {
  stats: ProfileData['stats']
}

export const EstadisticasUsuario = ({ stats }: EstadisticasUsuarioProps) => {
  const totalActividad = stats.hilos + stats.posts

  const estadisticas = [
    {
      icon: Newspaper,
      label: 'Hilos creados',
      value: stats.hilos,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: MessageSquare,
      label: 'Respuestas',
      value: stats.posts,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: TrendingUp,
      label: 'Actividad total',
      value: totalActividad,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ]

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Estadísticas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {estadisticas.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center p-4 rounded-lg border bg-card transition-all hover:scale-105 hover:shadow-md"
              >
                <div className={`p-3 rounded-full ${stat.bgColor} mb-3`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground text-center">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
