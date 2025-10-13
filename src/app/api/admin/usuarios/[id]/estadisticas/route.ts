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

    // Llamar a la función RPC para obtener estadísticas
    const { data, error } = await supabase
      .rpc('obtener_estadisticas_usuario', { p_usuario_id: usuarioId })
      .single()

    if (error) {
      console.error('Error al obtener estadísticas:', error)
      return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
