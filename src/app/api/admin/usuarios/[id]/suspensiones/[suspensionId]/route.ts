import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/utils/supabase-service'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// DELETE - Levantar suspensión
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; suspensionId: string } }
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

    const { suspensionId } = params

    // Desactivar la suspensión
    const { error } = await serviceSupabase
      .from('usuario_suspensiones')
      .update({ 
        activa: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', suspensionId)

    if (error) {
      console.error('Error al levantar suspensión:', error)
      return NextResponse.json({ error: 'Error al levantar suspensión' }, { status: 500 })
    }

    // Registrar en logs
    await serviceSupabase.rpc('registrar_accion_admin', {
      p_admin_id: user.id,
      p_usuario_afectado_id: params.id,
      p_accion: 'levantar_suspension',
      p_detalles: { suspension_id: suspensionId }
    })

    return NextResponse.json({ message: 'Suspensión levantada correctamente' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
