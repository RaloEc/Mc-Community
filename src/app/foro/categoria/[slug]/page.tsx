import CategoriaPageClient from '@/components/foro/CategoriaPageClient'
import ForoSidebar from '@/components/foro/ForoSidebar'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getCategoriasJerarquicas } from '@/lib/foro/server-actions'

async function getCategoriaBySlugOrId(slugOrId: string) {
  const supabase = createServerComponentClient({ cookies })
  // Intentar por slug primero, si no existe, por id
  let { data: categoria, error } = await supabase
    .from('foro_categorias')
    .select('*')
    .eq('slug', slugOrId)
    .single()

  if (!categoria) {
    // Fallback por id (UUID) si no se encontró por slug
    const byId = await supabase
      .from('foro_categorias')
      .select('*')
      .eq('id', slugOrId)
      .single()
    categoria = byId.data || null
    error = byId.error || null
  }

  if (error || !categoria || categoria.es_activa === false) return null
  return categoria
}

export default async function CategoriaPage({ params, searchParams }: { params: { slug: string }, searchParams: Record<string, string | string[]> }) {
  const categoria = await getCategoriaBySlugOrId(params.slug)
  if (!categoria) notFound()
  
  const categorias = await getCategoriasJerarquicas()

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <ForoSidebar categorias={categorias} />
      <main className="w-full lg:flex-1 min-w-0">
        <CategoriaPageClient
          categoria={categoria}
          initialFilters={{}}
          searchParams={searchParams}
        />
      </main>
    </div>
  )
}
