import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(req.url)

    const categoriaSlug = searchParams.get('categoriaSlug') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20)

    if (!categoriaSlug) return NextResponse.json({ masComentados: [], masVotados: [], sinResponder: [] })

    // Resolver categoría id
    let categoriaId: string | null = null
    {
      const bySlug = await supabase.from('foro_categorias').select('id').eq('slug', categoriaSlug).single()
      if (bySlug.data?.id) categoriaId = bySlug.data.id
      if (!categoriaId) {
        const byId = await supabase.from('foro_categorias').select('id').eq('id', categoriaSlug).single()
        if (byId.data?.id) categoriaId = byId.data.id
      }
    }
    if (!categoriaId) return NextResponse.json({ masComentados: [], masVotados: [], sinResponder: [] })

    // Categorías válidas = categoría + subcategorías
    const categoriaIds: string[] = [categoriaId]
    {
      const subs = await supabase.from('foro_categorias').select('id').eq('parent_id', categoriaId).eq('es_activa', true)
      if (subs.data?.length) categoriaIds.push(...subs.data.map(s => s.id))
    }

    // Obtiene hasta 200 hilos recientes en el conjunto de categorías para calcular métricas
    const maxPool = 200
    const { data: hilos } = await supabase
      .from('foro_hilos')
      .select('id, slug, titulo, ultimo_post_at, created_at, categoria_id')
      .in('categoria_id', categoriaIds)
      .order('ultimo_post_at', { ascending: false })
      .limit(maxPool)

    if (!hilos || hilos.length === 0) {
      return NextResponse.json({ masComentados: [], masVotados: [], sinResponder: [] })
    }

    const hiloIds = hilos.map(h => h.id as string)

    // Conteo de respuestas por hilo
    const { data: posts } = await supabase
      .from('foro_posts')
      .select('hilo_id')
      .in('hilo_id', hiloIds)

    const respuestasMap = new Map<string, number>()
    for (const p of posts || []) {
      const k = p.hilo_id as string
      respuestasMap.set(k, (respuestasMap.get(k) || 0) + 1)
    }

    // Votos por hilo a partir de reacciones en posts
    // Paso 1: obtener posts ids por hilo
    const postsByHilo = new Map<string, string[]>()
    for (const p of posts || []) {
      const hid = p.hilo_id as string
      const arr = postsByHilo.get(hid) || []
      postsByHilo.set(hid, arr)
    }

    // Paso 2: obtener reacciones por post y sumar por hilo
    let votosMap = new Map<string, number>()
    if ((posts || []).length > 0) {
      // Necesitamos los ids de post; volver a consultarlos con sus ids si no estaban
      const { data: postsWithIds } = await supabase
        .from('foro_posts')
        .select('id, hilo_id')
        .in('hilo_id', hiloIds)

      const postIds = (postsWithIds || []).map(p => p.id as string)
      if (postIds.length > 0) {
        const { data: reacts } = await supabase
          .from('foro_reacciones')
          .select('post_id')
          .in('post_id', postIds)
        // sumamos todas las reacciones como "votos"
        votosMap = new Map<string, number>()
        const hiloByPost = new Map<string, string>()
        for (const p of postsWithIds || []) hiloByPost.set(p.id as string, p.hilo_id as string)
        for (const r of reacts || []) {
          const postId = r.post_id as string
          const hid = hiloByPost.get(postId)
          if (!hid) continue
          votosMap.set(hid, (votosMap.get(hid) || 0) + 1)
        }
      }
    }

    const base = hilos.map(h => ({
      id: h.id as string,
      slug: h.slug as string | null,
      titulo: h.titulo as string,
      ultima_respuesta_at: (h.ultimo_post_at as string | null) || (h.created_at as string),
      respuestas: respuestasMap.get(h.id as string) || 0,
      votos: votosMap.get(h.id as string) || 0,
    }))

    const masComentados = [...base].sort((a, b) => b.respuestas - a.respuestas).slice(0, limit)
    const masVotados = [...base].sort((a, b) => b.votos - a.votos).slice(0, limit)
    const sinResponder = base.filter(b => b.respuestas === 0).slice(0, limit)

    return NextResponse.json({ masComentados, masVotados, sinResponder })
  } catch (e) {
    console.error('Error en GET /api/foro/hilos/relevantes', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
