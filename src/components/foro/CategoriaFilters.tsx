"use client"

import { useMemo } from 'react'

export type CategoriaFiltersState = {
  subcategoriaId?: string
  tags: string[]
  estado?: string // placeholder
  popularidad?: string // placeholder (e.g., 'vistas', 'votos')
  fechaFrom?: string
  fechaTo?: string
  destacados?: boolean
  orderBy: 'ultimo' | 'creacion' | 'respuestas' | 'vistas' | 'destacados'
}

type Tag = { id: string; nombre: string; slug: string }

type Props = {
  tags: Tag[]
  value: CategoriaFiltersState
  onChange: (next: CategoriaFiltersState) => void
}

export default function CategoriaFilters({ tags, value, onChange }: Props) {
  const orderOptions = useMemo(() => ([
    { key: 'ultimo', label: 'Último mensaje' },
    { key: 'creacion', label: 'Fecha de creación' },
    { key: 'respuestas', label: 'Número de respuestas' },
    { key: 'vistas', label: 'Número de vistas' },
    { key: 'destacados', label: 'Hilos destacados' },
  ] as const), [])

  const toggleTag = (slug: string) => {
    const set = new Set(value.tags)
    if (set.has(slug)) set.delete(slug)
    else set.add(slug)
    onChange({ ...value, tags: Array.from(set) })
  }

  return (
    <section className="bg-card border rounded-lg p-3 sm:p-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground min-w-28">Ordenar por</label>
            <select
              value={value.orderBy}
              onChange={(e) => onChange({ ...value, orderBy: e.target.value as CategoriaFiltersState['orderBy'] })}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              {orderOptions.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground min-w-28">Estado</label>
            <select
              value={value.estado || ''}
              onChange={(e) => onChange({ ...value, estado: e.target.value || undefined })}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">(Próximamente)</option>
              <option value="abierto" disabled>Abierto</option>
              <option value="cerrado" disabled>Cerrado</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground min-w-28">Popularidad</label>
            <select
              value={value.popularidad || ''}
              onChange={(e) => onChange({ ...value, popularidad: e.target.value || undefined })}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">General</option>
              <option value="vistas">Más vistas</option>
              <option value="votos">Más votados</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-muted-foreground">Etiquetas</label>
          <div className="flex gap-2 flex-wrap">
            {tags.length === 0 && (
              <span className="text-sm text-muted-foreground">No hay etiquetas en esta categoría.</span>
            )}
            {tags.map(t => {
              const active = value.tags.includes(t.slug)
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent text-foreground border-border'}`}
                >
                  {t.nombre}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground min-w-28">Desde</label>
            <input
              type="date"
              value={value.fechaFrom || ''}
              onChange={(e) => onChange({ ...value, fechaFrom: e.target.value || undefined })}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground min-w-28">Hasta</label>
            <input
              type="date"
              value={value.fechaTo || ''}
              onChange={(e) => onChange({ ...value, fechaTo: e.target.value || undefined })}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground min-w-28">Destacados</label>
            <input
              type="checkbox"
              checked={!!value.destacados}
              onChange={(e) => onChange({ ...value, destacados: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
