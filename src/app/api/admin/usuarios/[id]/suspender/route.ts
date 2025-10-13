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
    const { tipo, razon, fin, notasInternas } = body
    const usuarioId = params.id

    // Validar datos
    if (!tipo || !razon) {
      return NextResponse.json({ error: 'Tipo y razón son requeridos' }, { status: 400 })
    }

    if (!['suspension_temporal', 'suspension_permanente', 'baneo'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo de suspensión no válido' }, { status: 400 })
    }

    // Crear suspensión
    const { data: suspension, error: suspensionError } = await serviceSupabase
      .from('usuario_suspensiones')
      .insert({
        usuario_id: usuarioId,
        tipo,
        razon,
        fin: fin || null,
        moderador_id: user.id,
        notas_internas: notasInternas || null,
        activa: true
      })
      .select()
      .single()

    if (suspensionError) {
      console.error('Error al crear suspensión:', suspensionError)
      return NextResponse.json({ error: 'Error al crear suspensión' }, { status: 500 })
    }

    // Si es baneo o suspensión permanente, desactivar el usuario
    if (tipo === 'baneo' || tipo === 'suspension_permanente') {
      await serviceSupabase
        .from('perfiles')
        .update({ activo: false })
        .eq('id', usuarioId)
    }

    // Registrar en logs
    await serviceSupabase.rpc('registrar_accion_admin', {
      p_admin_id: user.id,
      p_usuario_afectado_id: usuarioId,
      p_accion: 'suspender',
      p_detalles: { tipo, razon, fin, suspension_id: suspension.id }
    })

    return NextResponse.json({ 
      message: 'Usuario suspendido correctamente',
      suspension 
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
