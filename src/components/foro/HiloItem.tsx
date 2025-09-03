import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUserInitials } from '@/lib/utils/avatar-utils'
import { ArrowUp, ArrowDown, MessageSquare, Eye } from 'lucide-react'

export type HiloDTO = {
  id: string
  slug?: string | null
  titulo: string
  created_at: string
  vistas?: number | null
  respuestas_count?: number | null
  destacado?: boolean | null
  ultima_respuesta_at?: string | null
  subcategoria?: { id: string; nombre: string | null; slug: string | null; color?: string | null } | null
  autor?: { id: string; username: string | null; avatar_url?: string | null } | null
  media_preview_url?: string | null
  votos?: number | null
  contenido?: string | null
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'hace un momento'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'hace un momento'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getExcerpt(contenido?: string | null, maxLength: number = 100) {
  if (!contenido) return ''
  // Eliminar etiquetas HTML
  const plainText = contenido.replace(/<[^>]*>/g, '')
  return plainText.length > maxLength
    ? plainText.substring(0, maxLength) + '...'
    : plainText
}

export default function HiloItem({ hilo }: { hilo: HiloDTO }) {
  const href = hilo.slug ? `/foro/hilos/${hilo.slug}` : `/foro/hilos/${hilo.id}`
  
  // Determinar el color de la categoría o usar un color por defecto
  const categoriaColor = hilo.subcategoria?.color || '#4f46e5'
  
  // Determinar si el hilo tiene votos positivos para mostrar flecha hacia arriba o abajo
  const votosPositivos = (hilo.votos ?? 0) >= 0
  
  return (
    <article className="flex gap-3 p-0 rounded-lg border border-border/50 bg-card dark:bg-black/90 overflow-hidden">
      {/* Columna de votos */}
      <div className="flex flex-col items-center justify-center py-2 px-3 bg-accent/30 dark:bg-black min-w-[42px] text-center">
        <ArrowUp 
          className={`h-4 w-4 ${votosPositivos ? 'text-green-500' : 'text-muted-foreground'}`} 
          strokeWidth={3}
        />
        <span className={`text-base font-bold my-1 ${votosPositivos ? 'text-green-500' : 'text-red-500'}`}>
          {Math.abs(hilo.votos ?? 0)}
        </span>
        <ArrowDown 
          className={`h-4 w-4 ${!votosPositivos ? 'text-red-500' : 'text-muted-foreground'}`}
          strokeWidth={3}
        />
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 min-w-0 py-3 pr-3">
        {/* Categoría */}
        <div className="flex items-center gap-2 text-xs mb-1">
          {hilo.subcategoria?.nombre && (
            <span 
              className="inline-flex items-center px-3 py-1 rounded-full text-white text-xs font-medium"
              style={{ backgroundColor: categoriaColor }}
            >
              {hilo.subcategoria.nombre}
            </span>
          )}
          {hilo.destacado && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-yellow-500 text-yellow-600 dark:text-yellow-500 ml-2">
              Destacado
            </span>
          )}
        </div>
        
        {/* Título */}
        <h3 className="font-bold text-base leading-tight mb-2 break-words">
          <Link href={href} className="hover:underline text-foreground dark:text-white">
            {hilo.titulo}
          </Link>
        </h3>
        
        {/* Extracto del contenido */}
        {hilo.contenido && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {getExcerpt(hilo.contenido)}
          </p>
        )}
        
        {/* Metadatos */}
        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
          {hilo.autor?.username && (
            <span className="flex items-center gap-1">
              por <span className="font-medium text-primary">{hilo.autor.username}</span>
            </span>
          )}
          <span>•</span>
          <time>{formatDate(hilo.created_at)}</time>
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="flex flex-col items-end justify-between text-xs min-w-[80px] py-3 pr-3">
        {/* Comentarios */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <strong>{hilo.respuestas_count ?? 0}</strong>
        </div>
        
        {/* Vistas */}
        <div className="flex items-center gap-1 text-muted-foreground mt-2">
          <Eye className="h-4 w-4" />
          <strong>{hilo.vistas ?? 0}</strong>
        </div>
      </div>
    </article>
  )
}
