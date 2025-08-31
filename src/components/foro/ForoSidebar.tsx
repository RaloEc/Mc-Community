'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Database } from '@/lib/database.types'

// Definición local del tipo Categoria basada en la estructura de la DB
export type Categoria = Database['public']['Tables']['foro_categorias']['Row'] & {
  parent_id?: string | null; // Añadido manualmente para que coincida con la DB
  subcategorias?: Categoria[];
};

// Componente para un solo elemento de categoría, maneja la lógica de despliegue
const CategoryItem = ({ category }: { category: Categoria }) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const hasSubcategories = !!(category.subcategorias && category.subcategorias.length > 0)

  const catSlug = category.slug || category.id
  const isActive = pathname?.startsWith(`/foro/categoria/${catSlug}`)

  return (
    <li>
      <div className="group flex items-center justify-between">
        <Link
          href={`/foro/categoria/${catSlug}`}
          className={
            `flex-grow rounded-lg px-3 py-2 flex items-center gap-2 transition-colors outline-none ` +
            `text-gray-800 hover:bg-gray-100 focus:bg-gray-100 ` +
            `dark:text-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800 ` +
            `amoled:text-gray-100 amoled:hover:bg-[#0d0d0d] amoled:focus:bg-[#0d0d0d] ` +
            `${isActive ? 'ring-1 ring-gray-300 dark:ring-gray-700 amoled:ring-[#1a1a1a] bg-gray-100 dark:bg-gray-800 amoled:bg-[#0d0d0d]' : ''}`
          }
        >
          <span className="truncate">{category.nombre}</span>
        </Link>

        {hasSubcategories && (
          <button
            type="button"
            aria-label={isOpen ? 'Colapsar subcategorías' : 'Expandir subcategorías'}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
            className="ml-1 p-1 rounded-md text-gray-600 hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800 amoled:hover:bg-[#0d0d0d] amoled:focus:bg-[#0d0d0d]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {hasSubcategories && isOpen && (
        <ul className="ml-3 mt-1 pl-3 border-l border-gray-200 dark:border-gray-800">
          {category.subcategorias?.map((sub) => {
            const subSlug = sub.slug || sub.id
            const subActive = pathname?.startsWith(`/foro/categoria/${subSlug}`)
            return (
              <li key={sub.id}>
                <Link
                  href={`/foro/categoria/${subSlug}`}
                  className={
                    `block rounded-md px-3 py-1.5 text-sm transition-colors ` +
                    `text-gray-700 hover:bg-gray-100 focus:bg-gray-100 ` +
                    `dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800 ` +
                    `amoled:text-gray-200 amoled:hover:bg-[#0d0d0d] amoled:focus:bg-[#0d0d0d] ` +
                    `${subActive ? 'ring-1 ring-gray-300 dark:ring-gray-700 amoled:ring-[#1a1a1a] bg-gray-100 dark:bg-gray-800 amoled:bg-[#0d0d0d]' : ''}`
                  }
                >
                  <span className="truncate align-middle">{sub.nombre}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

// Props para el componente principal del Sidebar
interface ForoSidebarProps {
  categorias: Categoria[];
}

export default function ForoSidebar({ categorias }: ForoSidebarProps) {
  const [query, setQuery] = useState('')

  const nestedCategorias = useMemo(() => {
    const parents = categorias.filter((c) => c.parent_id === null)
    const childrenByParent = new Map<string, Categoria[]>()
    for (const child of categorias) {
      if (child.parent_id) {
        const list = childrenByParent.get(child.parent_id) || []
        list.push(child as Categoria)
        childrenByParent.set(child.parent_id, list)
      }
    }

    const tree = parents.map((parent) => ({
      ...parent,
      subcategorias: childrenByParent.get(parent.id) || [],
    }))

    if (!query.trim()) return tree
    const q = query.toLowerCase()
    // Filtra manteniendo padres que coincidan o aquellos con subcategorías coincidentes
    return tree
      .map((p) => {
        const matchParent = p.nombre?.toLowerCase().includes(q)
        const filteredSubs = (p.subcategorias || []).filter((s) => s.nombre?.toLowerCase().includes(q))
        if (matchParent) return { ...p, subcategorias: filteredSubs }
        if (filteredSubs.length > 0) return { ...p, subcategorias: filteredSubs }
        return null
      })
      .filter(Boolean) as Categoria[]
  }, [categorias, query])

  return (
    <aside
      className={
        `sticky top-[var(--header-height)] h-[calc(100vh-var(--header-height))] ` +
        `hidden lg:flex lg:flex-col w-60 xl:w-64 flex-shrink-0 ` +
        `bg-white dark:bg-black ` +
        `border-r border-gray-200 dark:border-gray-800`
      }
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 amoled:border-gray-800/70">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white amoled:text-white">Categorías</h3>
        <div className="mt-3 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar categorías..."
            className={
              `w-full rounded-md pl-9 pr-3 py-2 text-sm ` +
              `bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-gray-400 focus:outline-none ` +
              `dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-700 dark:focus:border-gray-600 ` +
              `amoled:bg-[#0a0a0a] amoled:text-gray-100 amoled:placeholder:text-gray-500 amoled:border-gray-800`
            }
          />
          <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {nestedCategorias.map((cat) => (
            <CategoryItem key={cat.id} category={cat} />
          ))}
        </ul>
        {nestedCategorias.length === 0 && (
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 amoled:text-gray-400">No se encontraron categorías.</p>
        )}
      </nav>
    </aside>
  )
}
