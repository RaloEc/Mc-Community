import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/utils/supabase-service'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceClient()
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que sea admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!perfil || perfil.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden realizar acciones en lote' }, { status: 403 })
    }

    const body = await request.json()
    const { usuarioIds, accion, parametros = {} } = body

    // Validar datos
    if (!usuarioIds || !Array.isArray(usuarioIds) || usuarioIds.length === 0) {
      return NextResponse.json({ error: 'IDs de usuarios requeridos' }, { status: 400 })
    }

    if (!accion) {
      return NextResponse.json({ error: 'Acción requerida' }, { status: 400 })
    }

    let resultado
    let mensaje = ''

    switch (accion) {
      case 'activar':
        resultado = await serviceSupabase
          .from('perfiles')
          .update({ activo: true, updated_at: new Date().toISOString() })
          .in('id', usuarioIds)
        
        mensaje = `${usuarioIds.length} usuarios activados correctamente`
        break

      case 'desactivar':
        resultado = await serviceSupabase
          .from('perfiles')
          .update({ activo: false, updated_at: new Date().toISOString() })
          .in('id', usuarioIds)
        
        mensaje = `${usuarioIds.length} usuarios desactivados correctamente`
        break

      case 'cambiar_rol':
        if (!parametros.rol) {
          return NextResponse.json({ error: 'Rol requerido' }, { status: 400 })
        }

        resultado = await serviceSupabase
          .from('perfiles')
          .update({ role: parametros.rol, updated_at: new Date().toISOString() })
          .in('id', usuarioIds)
        
        mensaje = `Rol cambiado a ${parametros.rol} para ${usuarioIds.length} usuarios`
        break

      case 'eliminar':
        // Eliminar usuarios uno por uno (para respetar cascadas)
        for (const usuarioId of usuarioIds) {
          // Eliminar dependencias
          await serviceSupabase.from('foro_reacciones').delete().eq('user_id', usuarioId)
          await serviceSupabase.from('foro_seguimiento').delete().eq('user_id', usuarioId)
          await serviceSupabase.from('foro_posts').delete().eq('autor_id', usuarioId)
          await serviceSupabase.from('foro_hilos').delete().eq('autor_id', usuarioId)
          await serviceSupabase.from('noticias').delete().eq('autor_id', usuarioId)
          await serviceSupabase.from('perfiles').delete().eq('id', usuarioId)
          await serviceSupabase.auth.admin.deleteUser(usuarioId)
        }
        
        mensaje = `${usuarioIds.length} usuarios eliminados correctamente`
        break

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    if (resultado && resultado.error) {
      console.error('Error en acción en lote:', resultado.error)
      return NextResponse.json({ error: 'Error al ejecutar acción en lote' }, { status: 500 })
    }

    // Registrar en logs para cada usuario
    for (const usuarioId of usuarioIds) {
      await serviceSupabase.rpc('registrar_accion_admin', {
        p_admin_id: user.id,
        p_usuario_afectado_id: usuarioId,
        p_accion: `lote_${accion}`,
        p_detalles: { parametros, total_usuarios: usuarioIds.length }
      })
    }

    return NextResponse.json({ message: mensaje })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
