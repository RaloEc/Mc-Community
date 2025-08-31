'use client'

import { Card, CardBody, CardHeader, Chip, Spinner } from '@nextui-org/react'
import { Activity, FileText, MessageCircle, MessageSquare, Reply, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useRef, useState } from 'react'

interface ActivityItem {
  id: string
  type: 'noticia' | 'comentario' | 'hilo' | 'respuesta'
  title: string
  timestamp: string
  category?: string
}

interface ActivityFeedProps {
  activities?: ActivityItem[]
  fetchActivities?: (page: number, limit: number) => Promise<ActivityItem[]>
  initialPage?: number
  itemsPerPage?: number
}

export default function ActivityFeed({ 
  activities = [], 
  fetchActivities, 
  initialPage = 1, 
  itemsPerPage = 5 
}: ActivityFeedProps) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [displayedActivities, setDisplayedActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  // Datos mock para demostración
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'noticia',
      title: 'Nueva actualización de Minecraft 1.21',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
      category: 'Noticias'
    },
    {
      id: '2',
      type: 'hilo',
      title: '¿Cuál es vuestro bioma favorito?',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
      category: 'General'
    },
    {
      id: '3',
      type: 'comentario',
      title: 'Comentario en "Guía de construcción medieval"',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
      category: 'Tutoriales'
    },
    {
      id: '4',
      type: 'respuesta',
      title: 'Respuesta en "Problemas con mods"',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días atrás
      category: 'Soporte'
    },
    {
      id: '5',
      type: 'noticia',
      title: 'Servidor de la semana: SkyBlock Adventures',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días atrás
      category: 'Servidores'
    }
  ]

  // Cargar actividades iniciales o usar las proporcionadas
  useEffect(() => {
    // Solo inicializamos una vez al montar el componente
    const inicializarActividades = async () => {
      if (activities.length > 0) {
        setDisplayedActivities(activities)
        setHasMore(false) // Si se proporcionan actividades, no hay más para cargar
      } else if (fetchActivities) {
        await loadActivities()
      } else {
        setDisplayedActivities(mockActivities)
        setHasMore(false)
      }
    }
    
    inicializarActividades()
    // Eliminamos activities de las dependencias para evitar re-renderizados
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Configurar el observer para detectar cuando el usuario llega al final
  useEffect(() => {
    if (!hasMore || !fetchActivities) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          loadMoreActivities()
        }
      },
      { threshold: 0.5 }
    )

    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isLoading, hasMore, currentPage])

  // Función para cargar actividades iniciales
  const loadActivities = async () => {
    if (!fetchActivities) return
    
    setIsLoading(true)
    try {
      const newActivities = await fetchActivities(initialPage, itemsPerPage)
      setDisplayedActivities(newActivities)
      // Cambiamos la lógica para determinar si hay más actividades
      setHasMore(newActivities.length >= itemsPerPage)
      setCurrentPage(initialPage + 1)
    } catch (error) {
      console.error('Error al cargar actividades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para cargar más actividades al hacer scroll
  const loadMoreActivities = async () => {
    if (!fetchActivities || isLoading || !hasMore) return
    
    setIsLoading(true)
    try {
      const newActivities = await fetchActivities(currentPage, itemsPerPage)
      if (newActivities.length === 0) {
        setHasMore(false)
      } else {
        setDisplayedActivities(prev => [...prev, ...newActivities])
        // Usamos la misma lógica que en loadActivities
        setHasMore(newActivities.length >= itemsPerPage)
        setCurrentPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error al cargar más actividades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'noticia': return FileText
      case 'comentario': return MessageCircle
      case 'hilo': return MessageSquare
      case 'respuesta': return Reply
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'noticia': return 'primary'
      case 'comentario': return 'success'
      case 'hilo': return 'secondary'
      case 'respuesta': return 'warning'
      default: return 'default'
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'noticia': return 'Publicó'
      case 'comentario': return 'Comentó'
      case 'hilo': return 'Creó hilo'
      case 'respuesta': return 'Respondió'
      default: return 'Actividad'
    }
  }

  return (
    <Card className="bg-white dark:bg-black amoled:bg-black">
      <CardHeader>
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-white amoled:text-white">
          <Activity className="w-5 h-5" />
          Actividad Reciente
        </h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {displayedActivities.map((activity) => {
            const IconComponent = getActivityIcon(activity.type)
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 amoled:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer group"
              >
                <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 amoled:bg-gray-700 group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-300 amoled:text-gray-300" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Chip
                      size="sm"
                      color={getActivityColor(activity.type) as any}
                      variant="flat"
                      className="text-xs"
                    >
                      {getActivityLabel(activity.type)}
                    </Chip>
                    {activity.category && (
                      <Chip
                        size="sm"
                        variant="bordered"
                        className="text-xs"
                      >
                        {activity.category}
                      </Chip>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 amoled:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 amoled:group-hover:text-blue-400 transition-colors duration-200">
                    {activity.title}
                  </p>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500 amoled:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 amoled:text-gray-400">
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {displayedActivities.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 amoled:text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay actividad reciente</p>
          </div>
        )}
        
        {/* Indicador de carga y punto de observación para infinite scroll */}
        {fetchActivities && hasMore && (
          <div 
            ref={loadingRef} 
            className="flex justify-center items-center py-4"
          >
            {isLoading && <Spinner size="sm" color="primary" />}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
