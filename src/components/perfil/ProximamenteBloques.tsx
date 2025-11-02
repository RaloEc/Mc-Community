'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, UserPlus, Lock } from 'lucide-react'

interface ProximamenteBloquesProps {
  userColor?: string
}

export const ProximamenteBloques = ({ userColor = '#3b82f6' }: ProximamenteBloquesProps) => {
  const colorStyle = {
    '--user-color': userColor,
  } as React.CSSProperties

  const features = [
    {
      icon: UserPlus,
      title: 'Seguir usuario',
      description: 'Próximamente podrás seguir a este usuario',
    },
    {
      icon: MessageCircle,
      title: 'Enviar mensaje',
      description: 'Próximamente podrás enviar mensajes privados',
    },
  ]

  return (
    <Card className="transition-shadow dark:border-gray-800">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock 
            className="h-4 w-4"
            style={{
              color: `var(--user-color)`,
              ...colorStyle
            }}
          />
          <h3 className="font-semibold text-sm sm:text-base">Próximamente</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="p-3 rounded-lg border bg-muted/30 dark:border-gray-700"
                style={{
                  borderColor: `color-mix(in srgb, var(--user-color) 20%, transparent)`,
                  backgroundColor: `color-mix(in srgb, var(--user-color) 5%, transparent)`,
                  ...colorStyle
                }}
              >
                <div className="flex items-start gap-2">
                  <Icon 
                    className="h-4 w-4 mt-0.5 flex-shrink-0"
                    style={{
                      color: `var(--user-color)`,
                      ...colorStyle
                    }}
                  />
                  <div className="min-w-0">
                    <p 
                      className="text-xs sm:text-sm font-medium text-foreground"
                    >
                      {feature.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
