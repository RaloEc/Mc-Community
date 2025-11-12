import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/social/[publicId]/status - Obtener estado de relación con un usuario
export async function GET(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { publicId } = params

    // Obtener ID del usuario objetivo
    const { data: targetProfile, error: profileError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('public_id', publicId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
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

    // Verificar si el usuario actual sigue al objetivo
    const { data: followData, error: followError } = await supabase
      .from('social_follows')
      .select('id')
      .eq('follower_id', currentProfile.id)
      .eq('followed_id', targetProfile.id)
      .maybeSingle()

    const isFollowing = !!followData
    console.log('[Social Status] Follow query result:', { isFollowing, followError })

    // Verificar estado de amistad - usar maybeSingle() en lugar de single()
    const { data: friendRequest, error: friendError } = await supabase
      .from('friend_requests')
      .select('id, status, requester_id')
      .eq('user_a_id', Math.min(currentProfile.id, targetProfile.id))
      .eq('user_b_id', Math.max(currentProfile.id, targetProfile.id))
      .maybeSingle()

    console.log('[Social Status] Friend request query result:', { friendRequest, friendError })

    // Verificar si está bloqueado (en cualquier dirección)
    const { data: blockData, error: blockError } = await supabase
      .from('social_blocks')
      .select('id')
      .or(`and(blocker_id.eq.${currentProfile.id},blocked_id.eq.${targetProfile.id}),and(blocker_id.eq.${targetProfile.id},blocked_id.eq.${currentProfile.id})`)
      .maybeSingle()

    const isBlocked = !!blockData

    // Determinar estado de amistad
    let friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' = 'none'
    let friendRequestId: string | null = null
    
    if (friendRequest) {
      friendRequestId = friendRequest.id
      if (friendRequest.status === 'accepted') {
        friendshipStatus = 'friends'
      } else if (friendRequest.status === 'pending') {
        friendshipStatus = friendRequest.requester_id === currentProfile.id 
          ? 'pending_sent' 
          : 'pending_received'
      }
    }
    
    console.log('[Social Status] Final response:', { friendshipStatus, friendRequestId, is_following: !!followData, is_blocked: isBlocked })

    const response = {
      is_following: isFollowing,
      friendship_status: friendshipStatus,
      is_blocked: isBlocked,
      friend_request_id: friendRequestId
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[Social Status GET] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
