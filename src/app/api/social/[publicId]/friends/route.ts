import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { FriendsResponse } from '@/types/social'

// GET /api/social/[publicId]/friends
export async function GET(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const supabase = await createClient()
    const { publicId } = params

    // Obtener ID del usuario por public_id
    const { data: profile, error: profileError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('public_id', publicId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener amistades
    const { data: friendships, error: friendshipsError, count } = await supabase
      .from('friendships')
      .select('*', { count: 'exact' })
      .or(`user_one_id.eq.${profile.id},user_two_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })

    if (friendshipsError) {
      console.error('[Friends GET] Error:', friendshipsError)
      return NextResponse.json({ error: 'Error al obtener amigos' }, { status: 500 })
    }

    // Enriquecer con información del amigo
    const enrichedFriendships = await Promise.all(
      (friendships || []).map(async (friendship) => {
        const friendId = friendship.user_one_id === profile.id 
          ? friendship.user_two_id 
          : friendship.user_one_id

        const { data: friendProfile } = await supabase
          .from('perfiles')
          .select('id, username, public_id, avatar_url, color, role')
          .eq('id', friendId)
          .single()

        return {
          ...friendship,
          friend: friendProfile
        }
      })
    )

    const response: FriendsResponse = {
      friends: enrichedFriendships as any,
      total: count || 0
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[Friends GET] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
