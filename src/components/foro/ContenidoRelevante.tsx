"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Item = {
  id: string
  slug: string | null
  titulo: string
  ultima_respuesta_at: string | null
  respuestas: number
  votos: number
}

export default function ContenidoRelevante({ categoriaSlugOrId }: { categoriaSlugOrId: string }) {
  const [tab, setTab] = useState<'comentados' | 'votados' | 'sin'>('comentados')
  const [data, setData] = useState<{ masComentados: Item[]; masVotados: Item[]; sinResponder: Item[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    const run = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/foro/hilos/relevantes?categoriaSlug=${encodeURIComponent(categoriaSlugOrId)}`)
        const json = await res.json()
        if (!cancel) setData(json)
      } catch {
        if (!cancel) setData({ masComentados: [], masVotados: [], sinResponder: [] })
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    run()
    return () => { cancel = true }
  }, [categoriaSlugOrId])

  const items = tab === 'comentados' ? data?.masComentados || []
    : tab === 'votados' ? data?.masVotados || []
    : data?.sinResponder || []

  return (
    <div className="bg-card border rounded-lg">
      <div className="px-4 pt-4">
        <h3 className="font-semibold">Contenido más relevante</h3>
      </div>
      <div className="px-4 mt-3 flex gap-2 text-sm">
        <button
          onClick={() => setTab('comentados')}
          className={`px-3 py-1 rounded-full border ${tab === 'comentados' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}
        >
          Más comentados
        </button>
        <button
          onClick={() => setTab('votados')}
          className={`px-3 py-1 rounded-full border ${tab === 'votados' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}
        >
          Más votados
        </button>
        <button
          onClick={() => setTab('sin')}
          className={`px-3 py-1 rounded-full border ${tab === 'sin' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}
        >
          Sin responder
        </button>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay resultados por ahora.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => {
              const href = it.slug ? `/foro/hilos/${it.slug}` : `/foro/hilos/${it.id}`
              return (
                <li key={it.id} className="group">
                  <Link href={href} className="text-sm line-clamp-2 group-hover:underline">
                    {it.titulo}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    💬 {it.respuestas} · ⬆️ {it.votos}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
