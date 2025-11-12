import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/social/friend-requests/[id] - Responder solicitud
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = params
    const { action } = await request.json()
    
    if (!action || !['accept', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    // Obtener ID del usuario actual
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (currentProfileError || !currentProfile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    // Obtener la solicitud
    const { data: friendRequest, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (requestError || !friendRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    // Validar permisos según la acción
    const isRequester = friendRequest.requester_id === currentProfile.id
    const isReceiver = (friendRequest.user_a_id === currentProfile.id || friendRequest.user_b_id === currentProfile.id) && !isRequester

    if (action === 'cancel' && !isRequester) {
      return NextResponse.json({ error: 'Solo el remitente puede cancelar' }, { status: 403 })
    }

    if ((action === 'accept' || action === 'reject') && !isReceiver) {
      return NextResponse.json({ error: 'Solo el receptor puede aceptar/rechazar' }, { status: 403 })
    }

    // Mapear acción a estado
    const statusMap = {
      accept: 'accepted',
      reject: 'rejected',
      cancel: 'cancelled'
    }

    const newStatus = statusMap[action as keyof typeof statusMap]

    // Actualizar solicitud (el trigger creará la amistad si es 'accepted')
    const { data: updatedRequest, error: updateError } = await supabase
      .from('friend_requests')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[FriendRequest PATCH] Error:', updateError)
      return NextResponse.json({ error: 'Error al actualizar solicitud' }, { status: 500 })
    }

    return NextResponse.json({ success: true, friendRequest: updatedRequest }, { status: 200 })
  } catch (error) {
    console.error('[FriendRequest PATCH] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/social/friend-requests/[id] - Eliminar solicitud
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = params

    // Obtener ID del usuario actual
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (currentProfileError || !currentProfile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    // Eliminar solicitud (RLS validará que el usuario esté involucrado)
    const { error: deleteError } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[FriendRequest DELETE] Error:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar solicitud' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[FriendRequest DELETE] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
