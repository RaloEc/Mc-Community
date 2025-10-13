import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/utils/supabase-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient()
    const usuarioId = params.id

    // Obtener hilos creados
    const { data: hilos } = await supabase
      .from('foro_hilos')
      .select('id, titulo, slug, votos, created_at, deleted')
      .eq('autor_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Obtener posts/respuestas
    const { data: posts } = await supabase
      .from('foro_posts')
      .select(`
        id, 
        contenido, 
        votos, 
        created_at, 
        deleted,
        foro_hilos!inner(id, titulo, slug)
      `)
      .eq('autor_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Obtener noticias publicadas
    const { data: noticias } = await supabase
      .from('noticias')
      .select('id, titulo, slug, vistas, created_at')
      .eq('autor_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Obtener comentarios
    const { data: comentarios } = await supabase
      .from('comentarios')
      .select('id, contenido, created_at, deleted, tipo_entidad, entidad_id')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Obtener logs de auditoría (acciones admin sobre este usuario)
    const { data: logsAdmin } = await supabase
      .from('admin_logs')
      .select(`
        id,
        accion,
        detalles,
        created_at,
        admin:admin_id(username, avatar_url)
      `)
      .eq('usuario_afectado_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      hilos: hilos || [],
      posts: posts || [],
      noticias: noticias || [],
      comentarios: comentarios || [],
      logsAdmin: logsAdmin || []
    })
  } catch (error) {
    console.error('Error al obtener historial:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
