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
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 amoled:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400 amoled:text-blue-400'
    },
    {
      label: 'Comentarios',
      value: estadisticas.comentarios,
      icon: MessageCircle,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20 amoled:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400 amoled:text-green-400'
    },
    {
      label: 'Hilos',
      value: estadisticas.hilos || 0,
      icon: MessageSquare,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20 amoled:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400 amoled:text-purple-400'
    },
    {
      label: 'Respuestas',
      value: estadisticas.respuestas || 0,
      icon: Reply,
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20 amoled:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400 amoled:text-orange-400'
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
        {/* Grid 2x2 en móvil, 4x1 en desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div
                key={index}
                className={`text-center p-4 rounded-lg transition-all duration-200 hover:scale-105 ${stat.bgColor}`}
              >
                <IconComponent className={`w-8 h-8 mx-auto mb-2 ${stat.textColor}`} />
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 amoled:text-gray-400 font-medium">
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
