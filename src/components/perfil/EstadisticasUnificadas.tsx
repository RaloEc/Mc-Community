'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Target, Clock, Newspaper } from 'lucide-react'
import { ProfileData } from '@/hooks/use-perfil-usuario'
import React from 'react'

interface EstadisticasUnificadasProps {
  stats: ProfileData['stats']
  userColor?: string
}

export const EstadisticasUnificadas = ({ stats, userColor = '#3b82f6' }: EstadisticasUnificadasProps) => {
  const colorStyle = {
    '--user-color': userColor,
  } as React.CSSProperties

  const formatearFecha = (fecha: string | null | undefined) => {
    if (!fecha) return 'Sin actividad'
    const date = new Date(fecha)
    const ahora = new Date()
    const diferencia = ahora.getTime() - date.getTime()
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

    if (dias === 0) return 'Hoy'
    if (dias === 1) return 'Ayer'
    if (dias < 7) return `Hace ${dias} días`
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const estadisticas = [
    {
      icon: Newspaper,
      label: 'Hilos creados',
      value: stats.hilos,
      suffix: '',
    },
    {
      icon: Target,
      label: 'Categoría favorita',
      value: stats.categoria_favorita || 'Sin categoría',
      suffix: '',
    },
    {
      icon: Clock,
      label: 'Última actividad',
      value: formatearFecha(stats.ultima_actividad),
      suffix: '',
    },
  ]

  return (
    <Card className="shadow-none border-none bg-transparent">
      <CardContent className="p-0 sm:p-0">
        <div className="flex items-center gap-2 mb-4">
          <Calendar 
            className="h-4 w-4"
            style={{
              color: `var(--user-color)`,
              ...colorStyle
            }}
          />
          <h3 className="font-semibold text-sm sm:text-base">Estadísticas</h3>
        </div>
        
        <div className="space-y-3">
          {estadisticas.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-card/80"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--user-color) 8%, transparent)`,
                  ...colorStyle
                }}
              >
                <Icon 
                  className="h-4 w-4 mt-0.5 flex-shrink-0"
                  style={{
                    color: `var(--user-color)`,
                    ...colorStyle
                  }}
                />
                <div className="flex-grow min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p 
                    className="text-sm font-semibold mt-1 truncate text-foreground"
                  >
                    {typeof stat.value === 'number' ? (
                      <span>{stat.value}</span>
                    ) : (
                      <span>{stat.value}</span>
                    )}
                    {stat.suffix && <span className="text-xs text-muted-foreground ml-1">{stat.suffix}</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
