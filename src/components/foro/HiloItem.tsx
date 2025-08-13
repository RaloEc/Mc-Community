import Link from 'next/link'
import Image from 'next/image'

export type HiloDTO = {
  id: string
  slug?: string | null
  titulo: string
  created_at: string
  vistas?: number | null
  respuestas_count?: number | null
  destacado?: boolean | null
  ultima_respuesta_at?: string | null
  subcategoria?: { id: string; nombre: string | null; slug: string | null } | null
  autor?: { id: string; username: string | null; avatar_url?: string | null } | null
  media_preview_url?: string | null
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'hace un momento'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'hace un momento'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function HiloItem({ hilo }: { hilo: HiloDTO }) {
  const href = hilo.slug ? `/foro/hilos/${hilo.slug}` : `/foro/hilos/${hilo.id}`
  return (
    <article className="flex gap-3 p-3 rounded-lg border bg-card">
      {hilo.media_preview_url && (
        <div className="relative w-24 h-16 rounded overflow-hidden border hidden sm:block">
          <Image src={hilo.media_preview_url} alt={hilo.titulo} fill className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {hilo.subcategoria?.nombre && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border">
              {hilo.subcategoria.nombre}
            </span>
          )}
          {hilo.destacado && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-yellow-500 text-yellow-600">
              Destacado
            </span>
          )}
        </div>
        <h3 className="font-semibold leading-snug mb-1 truncate">
          <Link href={href} className="hover:underline">
            {hilo.titulo}
          </Link>
        </h3>
        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          {hilo.autor?.username && <span>por <span className="font-medium">{hilo.autor.username}</span></span>}
          <span>•</span>
          <time>{formatDate(hilo.created_at)}</time>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between text-xs min-w-[80px]">
        <div className="text-muted-foreground">{/* Estado (por implementar) */}
          <span title="Estado del hilo">⏺️</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            💬 <strong>{hilo.respuestas_count ?? 0}</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            👁️ <strong>{hilo.vistas ?? 0}</strong>
          </span>
        </div>
      </div>
    </article>
  )
}
