'use client'

import { Card, CardBody, CardHeader, Chip } from '@nextui-org/react'
import { Calendar, Clock, Trophy } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface MembershipInfoProps {
  perfil: {
    created_at?: string
    ultimo_acceso?: string
    activo?: boolean
    role: 'user' | 'admin' | 'moderator'
  }
}

export default function MembershipInfo({ perfil }: MembershipInfoProps) {
  return (
    <div className="space-y-6">
      {/* Información de membresía */}
      <Card className="bg-white dark:bg-black amoled:bg-black">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white amoled:text-white">
            Información de Membresía
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 amoled:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 amoled:text-gray-400">Miembro desde</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 amoled:text-gray-100">
                {formatDistanceToNow(new Date(perfil.created_at || new Date()), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 amoled:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 amoled:text-gray-400">Último acceso</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 amoled:text-gray-100">
                {formatDistanceToNow(new Date(perfil.ultimo_acceso || new Date()), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 amoled:text-gray-400">
              Estado de la cuenta
            </span>
            <Chip
              color={perfil.activo ? 'success' : 'default'}
              variant="flat"
              size="sm"
            >
              {perfil.activo ? 'Activa' : 'Inactiva'}
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* Progreso y logros */}
      <Card className="bg-white dark:bg-black amoled:bg-black">
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-white amoled:text-white">
            <Trophy className="w-5 h-5" />
            Progreso y Logros
          </h2>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Mensaje de próximamente */}
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 amoled:from-purple-900/30 amoled:to-blue-900/30 mb-4">
              <Trophy className="w-8 h-8 text-purple-600 dark:text-purple-400 amoled:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 amoled:text-gray-100 mb-2">
              Próximamente
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 amoled:text-gray-400 max-w-xs mx-auto">
              Estamos trabajando en un sistema de logros y progreso para recompensar tu participación en la comunidad.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
