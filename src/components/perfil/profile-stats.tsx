'use client'

import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { Activity, FileText, MessageCircle, MessageSquare, Reply } from 'lucide-react'

interface ProfileStatsProps {
  estadisticas: {
    noticias: number
    comentarios: number
    hilos?: number
    respuestas?: number
  }
}

export default function ProfileStats({ estadisticas }: ProfileStatsProps) {
  const stats = [
    {
      label: 'Posts',
      value: estadisticas.noticias,
      icon: FileText,
    },
    {
      label: 'Comentarios',
      value: estadisticas.comentarios,
      icon: MessageCircle,
    },
    {
      label: 'Hilos',
      value: estadisticas.hilos || 0,
      icon: MessageSquare,
    },
    {
      label: 'Respuestas',
      value: estadisticas.respuestas || 0,
      icon: Reply,
    }
  ]

  return (
    <Card className="bg-white dark:bg-black amoled:bg-black">
      <CardHeader>
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-white amoled:text-white">
          <Activity className="w-5 h-5" />
          Estadísticas
        </h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div
                key={index}
                className="text-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 amoled:hover:bg-gray-800 transition-colors"
              >
                <IconComponent className="w-5 h-5 mx-auto mb-2 text-gray-600 dark:text-gray-400 amoled:text-gray-400" />
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 amoled:text-gray-100">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 amoled:text-gray-400 font-medium">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
