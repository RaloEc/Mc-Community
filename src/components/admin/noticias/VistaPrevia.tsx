import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Calendar, Eye, User } from 'lucide-react'
import { NoticiaAdmin } from '@/components/noticias/hooks/useAdminNoticias'
import Image from 'next/image'

interface VistaPreviaProps {
  noticia: NoticiaAdmin | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VistaPrevia({ noticia, open, onOpenChange }: VistaPreviaProps) {
  if (!noticia) return null

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{noticia.titulo}</SheetTitle>
          <SheetDescription>
            Vista previa de la noticia
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Imagen */}
          {noticia.imagen_url && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <Image
                src={noticia.imagen_url}
                alt={noticia.titulo}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Metadatos */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{noticia.autor_nombre || noticia.autor || 'Anónimo'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatearFecha(noticia.fecha_publicacion)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{noticia.vistas || 0} vistas</span>
            </div>
          </div>

          {/* Categorías */}
          {noticia.categorias && noticia.categorias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {noticia.categorias.map((cat) => (
                <Badge
                  key={cat.categoria_id}
                  variant="secondary"
                  style={{
                    backgroundColor: cat.categoria?.color + '20',
                    color: cat.categoria?.color,
                    borderColor: cat.categoria?.color,
                  }}
                  className="border"
                >
                  {cat.categoria?.nombre}
                </Badge>
              ))}
            </div>
          )}

          {/* Estados */}
          <div className="flex gap-2">
            {noticia.destacada && (
              <Badge variant="default">Destacada</Badge>
            )}
            <Badge variant={noticia.es_activa !== false ? 'default' : 'outline'}>
              {noticia.es_activa !== false ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>

          {/* Resumen */}
          {noticia.resumen && (
            <div>
              <h3 className="font-semibold mb-2">Resumen</h3>
              <p className="text-sm text-muted-foreground">{noticia.resumen}</p>
            </div>
          )}

          {/* Contenido */}
          <div>
            <h3 className="font-semibold mb-2">Contenido</h3>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: noticia.contenido }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
