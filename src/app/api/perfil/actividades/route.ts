import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de paginación
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '5')
    const userId = searchParams.get('userId')

    // Validar parámetros
    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de usuario' },
        { status: 400 }
      )
    }

    // Calcular offset para paginación
    const offset = (page - 1) * limit

    // Crear cliente de Supabase
    const cookieStore = cookies()
    const supabase = await createClient()

    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener actividades del usuario
    const [noticias, comentarios, hilos, respuestas] = await Promise.all([
      // Noticias creadas por el usuario
      supabase
        .from('noticias')
        .select(`
          id, titulo, created_at, 
          categorias:noticias_categorias(categoria:categorias(nombre))
        `)
        .eq('autor_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      
      // Comentarios realizados por el usuario
      supabase
        .from('comentarios')
        .select(`
          id, contenido, created_at, 
          noticia:noticias(titulo)
        `)
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      
      // Hilos creados por el usuario
      supabase
        .from('foro_hilos')
        .select(`
          id, titulo, created_at, 
          categoria:foro_categorias(nombre)
        `)
        .eq('autor_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      
      // Respuestas en hilos
      supabase
        .from('foro_posts')
        .select(`
          id, contenido, created_at, 
          hilo:foro_hilos(titulo)
        `)
        .eq('autor_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    ])

    // Definir tipos para las respuestas de Supabase
    type NoticiaItem = {
      id: number;
      titulo: string;
      created_at: string;
      categorias?: Array<{categoria?: {nombre?: string}}> | null;
    }
    
    type ComentarioItem = {
      id: number;
      contenido: string;
      created_at: string;
      noticia?: {titulo?: string} | null;
    }
    
    type HiloItem = {
      id: number;
      titulo: string;
      created_at: string;
      categoria?: {nombre?: string} | null;
    }
    
    type RespuestaItem = {
      id: number;
      contenido: string;
      created_at: string;
      hilo?: {titulo?: string} | null;
    }
    
    // Transformar los resultados a formato ActivityItem
    const actividadesNoticias = (noticias.data as NoticiaItem[] || []).map(noticia => {
      // Asegurar que categorias es un array y acceder al primer elemento si existe
      const primeraCategoria = Array.isArray(noticia.categorias) && noticia.categorias.length > 0 
        ? noticia.categorias[0]?.categoria?.nombre 
        : 'Noticias'
      
      return {
        id: `noticia-${noticia.id}`,
        type: 'noticia',
        title: noticia.titulo,
        timestamp: noticia.created_at,
        category: primeraCategoria
      }
    })

    const actividadesComentarios = (comentarios.data as ComentarioItem[] || []).map(comentario => ({
      id: `comentario-${comentario.id}`,
      type: 'comentario',
      title: `Comentario en "${comentario.noticia?.titulo || 'una noticia'}"`,
      timestamp: comentario.created_at,
      category: 'Comentarios'
    }))

    const actividadesHilos = (hilos.data as HiloItem[] || []).map(hilo => ({
      id: `hilo-${hilo.id}`,
      type: 'hilo',
      title: hilo.titulo,
      timestamp: hilo.created_at,
      category: hilo.categoria?.nombre || 'Foro'
    }))

    const actividadesRespuestas = (respuestas.data as RespuestaItem[] || []).map(respuesta => ({
      id: `respuesta-${respuesta.id}`,
      type: 'respuesta',
      title: `Respuesta en "${respuesta.hilo?.titulo || 'un hilo'}"`,
      timestamp: respuesta.created_at,
      category: 'Foro'
    }))

    // Combinar todas las actividades
    const todasActividades = [
      ...actividadesNoticias,
      ...actividadesComentarios,
      ...actividadesHilos,
      ...actividadesRespuestas
    ]

    // Ordenar por fecha más reciente
    todasActividades.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Limitar al número solicitado
    const actividadesPaginadas = todasActividades.slice(0, limit)

    return NextResponse.json({
      items: actividadesPaginadas,
      page,
      limit,
      hasMore: todasActividades.length > limit
    })
    
    // La lógica anterior era incorrecta:
    // hasMore: todasActividades.length === limit
    // Esto siempre devolvía true cuando había exactamente 'limit' actividades,
    // lo que causaba un bucle infinito de solicitudes
  } catch (error) {
    console.error('Error al obtener actividades:', error)
    return NextResponse.json(
      { error: 'Error al obtener actividades' },
      { status: 500 }
    )
  }
}
