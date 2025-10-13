import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const supabase = createClient()
  const username = params.username

  try {
    // 1. Obtener el perfil del usuario
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id, username, created_at, avatar_url, banner_url, bio, role')
      .eq('username', username)
      .single()

    if (perfilError || !perfil) {
      console.error('Error fetching profile:', perfilError)
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
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
      // No es un error fatal, podemos continuar
    }

    // 3. Obtener últimos hilos creados
    const { data: ultimosHilos, error: hilosError } = await supabase
      .from('foro_hilos')
      .select('id, titulo, created_at, (select titulo from foro_categorias where id = foro_hilos.categoria_id) as categoria_titulo')
      .eq('autor_id', perfil.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)

    if (hilosError) {
      console.error('Error fetching threads:', hilosError)
    }

    // 4. Obtener últimos posts (respuestas) - solo posts no eliminados de hilos no eliminados
    const { data: ultimosPosts, error: postsError } = await supabase
      .from('foro_posts')
      .select('id, contenido, created_at, hilo_id, foro_hilos!inner(titulo, deleted_at)')
      .eq('autor_id', perfil.id)
      .is('deleted_at', null)
      .is('foro_hilos.deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)

    const limpiarHTML = (html: string) => {
      if (!html) return ''
      return html.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
    }

    let postsLimpios: any[] = []
    if (postsError) {
      console.error('Error fetching posts:', postsError)
    } else if (ultimosPosts) {
      postsLimpios = ultimosPosts.map(post => {
        const hilo = Array.isArray(post.foro_hilos) ? post.foro_hilos[0] : post.foro_hilos;
        return {
          id: post.id,
          contenido: limpiarHTML(post.contenido),
          created_at: post.created_at,
          hilo_id: post.hilo_id,
          hilo_titulo: hilo?.titulo ?? 'Hilo desconocido',
        }
      })
    }

    const publicProfile = {
      ...perfil,
      stats: {
        hilos: hilosCount ?? 0,
        posts: postsCount ?? 0,
      },
      ultimosHilos,
      ultimosPosts: postsLimpios,
    }

    return NextResponse.json(publicProfile)

  } catch (error) {
    console.error('Unexpected error fetching profile:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
