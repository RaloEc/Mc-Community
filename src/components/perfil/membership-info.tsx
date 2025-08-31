'use client'

import { Card, CardBody, CardHeader, Chip, Progress } from '@nextui-org/react'
import { Calendar, Clock, Award, Star, Trophy, Target } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface MembershipInfoProps {
  perfil: {
    created_at?: string
    ultimo_acceso?: string
    activo?: boolean
    role: 'user' | 'admin' | 'moderator'
  }
  estadisticas: {
    noticias: number
    comentarios: number
    hilos?: number
    respuestas?: number
  }
}

export default function MembershipInfo({ perfil, estadisticas }: MembershipInfoProps) {
  // Calcular logros basados en estadísticas
  const totalActividad = estadisticas.noticias + estadisticas.comentarios + (estadisticas.hilos || 0) + (estadisticas.respuestas || 0)
  
  const logros = [
    {
      id: 'primer-post',
      nombre: 'Primer Post',
      descripcion: 'Publicó su primera contribución',
      icono: Star,
      obtenido: estadisticas.noticias > 0 || estadisticas.comentarios > 0,
      color: 'text-yellow-500'
    },
    {
      id: 'comunicador',
      nombre: 'Comunicador',
      descripcion: 'Realizó 10 comentarios',
      icono: Award,
      obtenido: estadisticas.comentarios >= 10,
      color: 'text-blue-500'
    },
    {
      id: 'creador',
      nombre: 'Creador',
      descripcion: 'Publicó 5 posts',
      icono: Trophy,
      obtenido: estadisticas.noticias >= 5,
      color: 'text-purple-500'
    },
    {
      id: 'veterano',
      nombre: 'Veterano',
      descripcion: 'Más de 50 contribuciones',
      icono: Target,
      obtenido: totalActividad >= 50,
      color: 'text-green-500'
    }
  ]

  const logrosObtenidos = logros.filter(logro => logro.obtenido)
  const progresoGeneral = Math.min((totalActividad / 100) * 100, 100) // Progreso hacia 100 contribuciones

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
          {/* Barra de progreso general */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 amoled:text-gray-400">
                Progreso hacia Veterano
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 amoled:text-gray-400">
                {totalActividad}/100
              </span>
            </div>
            <Progress
              value={progresoGeneral}
              color="primary"
              className="w-full"
              size="sm"
            />
          </div>

          {/* Grid de logros */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-100 amoled:text-gray-100">
              Logros ({logrosObtenidos.length}/{logros.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {logros.map((logro) => {
                const IconoLogro = logro.icono
                return (
                  <div
                    key={logro.id}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      logro.obtenido
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 amoled:from-yellow-900/20 amoled:to-orange-900/20 border-yellow-200 dark:border-yellow-800 amoled:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 amoled:bg-gray-700/50 border-gray-200 dark:border-gray-600 amoled:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        logro.obtenido 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 amoled:bg-yellow-900/30' 
                          : 'bg-gray-100 dark:bg-gray-600 amoled:bg-gray-600'
                      }`}>
                        <IconoLogro className={`w-4 h-4 ${
                          logro.obtenido 
                            ? logro.color 
                            : 'text-gray-400 dark:text-gray-500 amoled:text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm ${
                          logro.obtenido 
                            ? 'text-gray-900 dark:text-gray-100 amoled:text-gray-100' 
                            : 'text-gray-600 dark:text-gray-400 amoled:text-gray-400'
                        }`}>
                          {logro.nombre}
                        </h4>
                        <p className={`text-xs ${
                          logro.obtenido 
                            ? 'text-gray-700 dark:text-gray-300 amoled:text-gray-300' 
                            : 'text-gray-500 dark:text-gray-500 amoled:text-gray-500'
                        }`}>
                          {logro.descripcion}
                        </p>
                      </div>
                      {logro.obtenido && (
                        <div className="text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
