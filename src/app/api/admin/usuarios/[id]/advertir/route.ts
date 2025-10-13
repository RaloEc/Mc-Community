import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/utils/supabase-service'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceClient()
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que sea admin o moderador
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!perfil || !['admin', 'moderator'].includes(perfil.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { razon, severidad = 1 } = body
    const usuarioId = params.id

    // Validar datos
    if (!razon) {
      return NextResponse.json({ error: 'Razón es requerida' }, { status: 400 })
    }

    if (severidad < 1 || severidad > 3) {
      return NextResponse.json({ error: 'Severidad debe estar entre 1 y 3' }, { status: 400 })
    }

    // Crear advertencia
    const { data: advertencia, error: advertenciaError } = await serviceSupabase
      .from('usuario_advertencias')
      .insert({
        usuario_id: usuarioId,
        razon,
        severidad,
        moderador_id: user.id,
        leida: false
      })
      .select()
      .single()

    if (advertenciaError) {
      console.error('Error al crear advertencia:', advertenciaError)
      return NextResponse.json({ error: 'Error al crear advertencia' }, { status: 500 })
    }

    // Contar advertencias del usuario
    const { count } = await serviceSupabase
      .from('usuario_advertencias')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)

    // Si tiene 3 o más advertencias, sugerir suspensión
    let mensaje = 'Advertencia enviada correctamente'
    if (count && count >= 3) {
      mensaje += '. El usuario tiene 3 o más advertencias, considera una suspensión.'
    }

    // Registrar en logs
    await serviceSupabase.rpc('registrar_accion_admin', {
      p_admin_id: user.id,
      p_usuario_afectado_id: usuarioId,
      p_accion: 'advertir',
      p_detalles: { razon, severidad, advertencia_id: advertencia.id, total_advertencias: count }
    })

    return NextResponse.json({ 
      message: mensaje,
      advertencia,
      totalAdvertencias: count 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
