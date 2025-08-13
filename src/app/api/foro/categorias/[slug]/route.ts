import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = getServiceClient()
    const slugOrId = params.slug

    // Buscar categoría por slug o id
    let { data: categoria, error } = await supabase
      .from('foro_categorias')
      .select('id, slug, nombre, descripcion, imagen_url, parent_id, nivel, color, es_activa')
      .eq('slug', slugOrId)
      .single()

    if ((!categoria || error) && slugOrId) {
      const byId = await supabase
        .from('foro_categorias')
        .select('id, slug, nombre, descripcion, imagen_url, parent_id, nivel, color, es_activa')
        .eq('id', slugOrId)
        .single()
      categoria = byId.data
      error = byId.error
    }

    if (error || !categoria || categoria.es_activa === false) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // Subcategorías directas
    const { data: subcategorias } = await supabase
      .from('foro_categorias')
      .select('id, slug, nombre, color')
      .eq('parent_id', categoria.id)
      .eq('es_activa', true)
      .order('orden', { ascending: true })

    // Tags de la categoría
    const { data: tags } = await supabase
      .from('foro_etiquetas')
      .select('id, nombre, slug')
      .eq('categoria_id', categoria.id)
      .order('nombre', { ascending: true })

    return NextResponse.json({
      data: {
        categoria,
        subcategorias: subcategorias || [],
        tags: tags || [],
      },
    })
  } catch (e) {
    console.error('Error en GET /api/foro/categorias/[slug]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
