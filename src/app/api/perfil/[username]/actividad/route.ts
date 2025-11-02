import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface ActivityResponse {
  hilos: Array<{
    id: string
    titulo: string
    created_at: string
    categoria_titulo: string
  }>
  posts: Array<{
    id: string
    contenido: string
    created_at: string
    hilo_id: string
    hilo_titulo: string
  }>
  stats: {
    hilos: number
    posts: number
  }
}

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const supabase = await createClient()
  const publicId = params.username
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '5')
  const offset = (page - 1) * limit

  try {
    // 1. Obtener el ID del usuario por public_id o username como fallback
    let { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('public_id', publicId)
      .single()

    // Si no encontramos por public_id, intentar por username
    if (perfilError || !perfil) {
      console.log(`[Perfil Actividad API] public_id "${publicId}" no encontrado, intentando por username...`)
      const { data: perfilPorUsername, error: errorUsername } = await supabase
        .from('perfiles')
        .select('id')
        .eq('username', publicId)
        .single()

      if (errorUsername || !perfilPorUsername) {
        console.error('Error fetching profile for activity by public_id or username:', perfilError, errorUsername)
        return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
      }

      perfil = perfilPorUsername
    }

    // 2. Obtener estadísticas de actividad (solo contenido no eliminado)
    const { count: hilosCount, error: hilosCountError } = await supabase
      .from('foro_hilos')
      .select('*', { count: 'exact', head: true })
      .eq('autor_id', perfil.id)
      .is('deleted_at', null)

    const { count: postsCount, error: postsCountError } = await supabase
      .from('foro_posts')
      .select('*', { count: 'exact', head: true })
      .eq('autor_id', perfil.id)
      .is('deleted_at', null)

    if (hilosCountError || postsCountError) {
      console.error('Error fetching stats:', hilosCountError, postsCountError)
    }

    // 3. Obtener últimos hilos creados con paginación
    const { data: ultimosHilos, error: hilosError } = await supabase
      .from('foro_hilos')
      .select('id, titulo, created_at, categoria_id, foro_categorias!inner(titulo)')
      .eq('autor_id', perfil.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (hilosError) {
      console.error('Error fetching threads:', hilosError)
    }

    // Mapear hilos con categoría
    const hilosMapeados: ActivityResponse['hilos'] = (ultimosHilos || []).map((hilo: any) => ({
      id: hilo.id,
      titulo: hilo.titulo,
      created_at: hilo.created_at,
      categoria_titulo: hilo.foro_categorias?.[0]?.titulo ?? 'Sin categoría',
    }))

    // 4. Obtener últimos posts (respuestas) con paginación
    const { data: ultimosPosts, error: postsError } = await supabase
      .from('foro_posts')
      .select('id, contenido, created_at, hilo_id, foro_hilos!inner(titulo, deleted_at)')
      .eq('autor_id', perfil.id)
      .is('deleted_at', null)
      .is('foro_hilos.deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const limpiarHTML = (html: string): string => {
      if (!html) return ''
      return html.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
    }

    let postsLimpios: ActivityResponse['posts'] = []
    if (postsError) {
      console.error('Error fetching posts:', postsError)
    } else if (ultimosPosts) {
      postsLimpios = ultimosPosts.map((post: any) => {
        const hilo = Array.isArray(post.foro_hilos) ? post.foro_hilos[0] : post.foro_hilos
        return {
          id: post.id,
          contenido: limpiarHTML(post.contenido),
          created_at: post.created_at,
          hilo_id: post.hilo_id,
          hilo_titulo: hilo?.titulo ?? 'Hilo desconocido',
        }
      })
    }

    const response: ActivityResponse = {
      hilos: hilosMapeados,
      posts: postsLimpios,
      stats: {
        hilos: hilosCount ?? 0,
        posts: postsCount ?? 0,
      },
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Unexpected error fetching activity:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
