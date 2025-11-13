"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, ThumbsUp, HelpCircle } from 'lucide-react'

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

  const tabConfig = {
    comentados: { icon: MessageSquare, label: 'Comentados', color: 'text-blue-500' },
    votados: { icon: ThumbsUp, label: 'Votados', color: 'text-green-500' },
    sin: { icon: HelpCircle, label: 'Sin responder', color: 'text-amber-500' }
  }

  const currentConfig = tabConfig[tab]
  const CurrentIcon = currentConfig.icon

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900/50 dark:to-transparent">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></span>
          Contenido Relevante
        </h3>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 flex justify-center gap-4 bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800/50">
        {(Object.entries(tabConfig) as [keyof typeof tabConfig, typeof tabConfig[keyof typeof tabConfig]][]).map(([key, config]) => {
          const TabIcon = config.icon
          const isActive = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              title={config.label}
              className={`p-1.5 rounded-md transition-all ${
                isActive
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <TabIcon className="w-4 h-4" />
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="p-3">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center">
            <CurrentIcon className={`w-8 h-8 mx-auto mb-2 opacity-30 ${currentConfig.color}`} />
            <p className="text-xs text-gray-500 dark:text-gray-400">No hay resultados</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 6).map((it, idx) => {
              const href = it.slug ? `/foro/hilos/${it.slug}` : `/foro/hilos/${it.id}`
              return (
                <li key={it.id} className="group">
                  <Link 
                    href={href} 
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-600 mt-0.5 min-w-fit">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {it.titulo}
                      </p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {it.respuestas}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {it.votos}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
