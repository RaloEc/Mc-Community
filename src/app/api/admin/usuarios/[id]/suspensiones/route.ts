import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/utils/supabase-service'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Obtener suspensiones de un usuario
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient()
    const usuarioId = params.id

    const { data, error } = await supabase
      .from('usuario_suspensiones')
      .select(`
        *,
        moderador:moderador_id(username, avatar_url)
      `)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener suspensiones:', error)
      return NextResponse.json({ error: 'Error al obtener suspensiones' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
