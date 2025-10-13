'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, MessageSquare, Newspaper, Clock } from 'lucide-react'
import { ProfileData } from '@/hooks/use-perfil-usuario'

interface TabsActividadProps {
  ultimosHilos: ProfileData['ultimosHilos']
  ultimosPosts: ProfileData['ultimosPosts']
}

export const TabsActividad = ({ ultimosHilos, ultimosPosts }: TabsActividadProps) => {
  const formatearFecha = (fecha: string) => {
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

  return (
    <Tabs defaultValue="hilos" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="hilos" className="flex items-center gap-2">
          <Newspaper className="h-4 w-4" />
          Hilos ({ultimosHilos?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="respuestas" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Respuestas ({ultimosPosts?.length || 0})
        </TabsTrigger>
      </TabsList>

      {/* Tab de Hilos */}
      <TabsContent value="hilos" className="mt-4">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Últimos Hilos Creados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimosHilos?.length > 0 ? (
              <ul className="space-y-3">
                {ultimosHilos.map((hilo) => (
                  <li
                    key={hilo.id}
                    className="group p-4 rounded-lg border bg-card transition-all hover:shadow-md hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-grow min-w-0">
                        <Link
                          href={`/foro/hilos/${hilo.id}`}
                          className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2"
                        >
                          {hilo.titulo}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary">
                            {hilo.categoria_titulo}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatearFecha(hilo.created_at)}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/foro/hilos/${hilo.id}`}
                        className="flex-shrink-0 p-2 rounded-md hover:bg-primary/10 transition-colors"
                        aria-label="Ver hilo"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <Newspaper className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Este usuario no ha creado ningún hilo todavía.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab de Respuestas */}
      <TabsContent value="respuestas" className="mt-4">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Últimas Respuestas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimosPosts?.length > 0 ? (
              <ul className="space-y-3">
                {ultimosPosts.map((post) => (
                  <li
                    key={post.id}
                    className="group p-4 rounded-lg border bg-card transition-all hover:shadow-md hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-grow min-w-0">
                        <p className="text-sm italic text-muted-foreground line-clamp-2 mb-2">
                          "{post.contenido}"
                        </p>
                        <Link
                          href={`/foro/hilos/${post.hilo_id}#post-${post.id}`}
                          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          en {post.hilo_titulo}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatearFecha(post.created_at)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Este usuario no ha publicado ninguna respuesta todavía.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
