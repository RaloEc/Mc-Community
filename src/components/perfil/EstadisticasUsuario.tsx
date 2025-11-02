'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Newspaper, TrendingUp } from 'lucide-react'
import { ProfileData } from '@/hooks/use-perfil-usuario'

interface EstadisticasUsuarioProps {
  stats: ProfileData['stats']
  userColor?: string
}

export const EstadisticasUsuario = ({ stats, userColor = '#3b82f6' }: EstadisticasUsuarioProps) => {
  const totalActividad = stats.hilos + stats.posts

  const estadisticas = [
    {
      icon: Newspaper,
      label: 'Hilos creados',
      value: stats.hilos,
    },
    {
      icon: MessageSquare,
      label: 'Respuestas',
      value: stats.posts,
    },
    {
      icon: TrendingUp,
      label: 'Actividad total',
      value: totalActividad,
    }
  ]

  const colorStyle = {
    '--user-color': userColor,
  } as React.CSSProperties

  return (
    <Card className="transition-shadow hover:shadow-lg dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Estadísticas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {estadisticas.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center p-3 sm:p-4 rounded-lg border bg-card dark:border-gray-700 transition-all hover:scale-105 hover:shadow-md"
                style={{
                  borderColor: `color-mix(in srgb, var(--user-color) 30%, transparent)`,
                  backgroundColor: `color-mix(in srgb, var(--user-color) 5%, transparent)`,
                  ...colorStyle
                }}
              >
                <div 
                  className="p-2 sm:p-3 rounded-full mb-2 sm:mb-3"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--user-color) 15%, transparent)`,
                    ...colorStyle
                  }}
                >
                  <Icon 
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    style={{
                      color: `var(--user-color)`,
                      ...colorStyle
                    }}
                  />
                </div>
                <p 
                  className="text-2xl sm:text-3xl font-bold mb-1 text-foreground"
                >
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
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
