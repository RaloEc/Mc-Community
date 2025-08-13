"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import CategoriaHeader from './CategoriaHeader'
import CategoriaFilters, { CategoriaFiltersState } from './CategoriaFilters'
import SubcategoriasDestacadas from './SubcategoriasDestacadas'
import HilosLista, { HiloDTO } from './HilosLista'
import FloatingCreateButton from './FloatingCreateButton'
import ContenidoRelevante from './ContenidoRelevante'

type Categoria = {
  id: string
  slug: string | null
  nombre: string | null
  descripcion: string | null
  imagen_url?: string | null
  parent_id?: string | null
  nivel?: number | null
  color?: string | null
}

type TagsDTO = { id: string; nombre: string; slug: string }

type CategoriaMeta = {
  categoria: Categoria
  subcategorias: Categoria[]
  tags: TagsDTO[]
}

type Props = {
  categoria: Categoria
  searchParams?: Record<string, string | string[]>
  initialFilters?: Partial<CategoriaFiltersState>
}

export default function CategoriaPageClient({ categoria, searchParams, initialFilters }: Props) {
  const [meta, setMeta] = useState<CategoriaMeta | null>(null)
  const [hilos, setHilos] = useState<HiloDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const [filters, setFilters] = useState<CategoriaFiltersState>({
    subcategoriaId: typeof searchParams?.sub === 'string' ? searchParams?.sub : undefined,
    tags: typeof searchParams?.tags === 'string' ? searchParams?.tags.split(',') : [],
    estado: typeof searchParams?.estado === 'string' ? searchParams?.estado : undefined,
    popularidad: typeof searchParams?.pop === 'string' ? searchParams?.pop : undefined,
    fechaFrom: typeof searchParams?.from === 'string' ? searchParams?.from : undefined,
    fechaTo: typeof searchParams?.to === 'string' ? searchParams?.to : undefined,
    destacados: searchParams?.destacado === 'true',
    orderBy: (typeof searchParams?.order === 'string' ? searchParams?.order : 'ultimo') as CategoriaFiltersState['orderBy'],
    ...initialFilters,
  })

  const observerRef = useRef<HTMLDivElement | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('categoriaSlug', categoria.slug || categoria.id)
    if (filters.subcategoriaId) params.set('subcategoriaId', String(filters.subcategoriaId))
    if (filters.tags && filters.tags.length) params.set('tags', filters.tags.join(','))
    if (filters.estado) params.set('estado', filters.estado)
    if (filters.popularidad) params.set('popularidad', filters.popularidad)
    if (filters.fechaFrom) params.set('from', filters.fechaFrom)
    if (filters.fechaTo) params.set('to', filters.fechaTo)
    if (filters.destacados) params.set('destacado', 'true')
    if (filters.orderBy) params.set('orderBy', filters.orderBy)
    params.set('limit', '20')
    params.set('offset', String(page * 20))
    return params.toString()
  }, [categoria.slug, categoria.id, filters, page])

  useEffect(() => {
    let cancelled = false
    const loadMeta = async () => {
      try {
        const res = await fetch(`/api/foro/categorias/${categoria.slug || categoria.id}`)
        const json = await res.json()
        if (!cancelled) setMeta(json.data)
      } catch (e) {
        if (!cancelled) setMeta({ categoria, subcategorias: [], tags: [] })
      }
    }
    loadMeta()
  }, [categoria])

  const fetchHilos = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(0)
      } else {
        setIsFetchingMore(true)
      }
      const res = await fetch(`/api/foro/hilos?${queryString}`)
      const json = await res.json()
      const items: HiloDTO[] = json.items || []
      if (reset) {
        setHilos(items)
      } else {
        setHilos(prev => [...prev, ...items])
      }
      setHasMore(items.length === 20)
    } catch (e: any) {
      setError(e?.message || 'Error al cargar hilos')
    } finally {
      setLoading(false)
      setIsFetchingMore(false)
    }
  }

  useEffect(() => {
    // reset page when filters change
    setPage(0)
    fetchHilos(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  useEffect(() => {
    if (!observerRef.current) return
    const el = observerRef.current
    const io = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting && hasMore && !isFetchingMore) {
        setPage(p => p + 1)
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => {
      io.disconnect()
    }
  }, [hasMore, isFetchingMore])

  useEffect(() => {
    if (page > 0) fetchHilos(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div className="bg-white dark:bg-gray-950 amoled:bg-black min-h-screen">
      <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-6 lg:py-8">
        <CategoriaHeader categoria={meta?.categoria || categoria} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-9 space-y-6">
            <SubcategoriasDestacadas subcategorias={meta?.subcategorias || []} currentId={categoria.id} />
            <CategoriaFilters
              tags={meta?.tags || []}
              value={filters}
              onChange={setFilters}
            />
            <HilosLista hilos={hilos} loading={loading} />
            <div ref={observerRef} />
          </div>
          <aside className="lg:col-span-3 space-y-6">
            <ContenidoRelevante categoriaSlugOrId={categoria.slug || categoria.id} />
            {/* Placeholder reglas si se desea duplicar aquí más compacto */}
          </aside>
        </div>
      </div>
      <FloatingCreateButton categoriaId={categoria.id} />
    </div>
  )
}
