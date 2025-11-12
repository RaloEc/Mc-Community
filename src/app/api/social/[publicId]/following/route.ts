import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { FollowingResponse } from '@/types/social'

// GET /api/social/[publicId]/following?page=1&limit=20
export async function GET(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const supabase = await createClient()
    const { publicId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Obtener ID del usuario por public_id
    const { data: profile, error: profileError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('public_id', publicId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener usuarios seguidos con información de perfil
    const { data: following, error: followingError, count } = await supabase
      .from('social_follows')
      .select(`
        id,
        follower_id,
        followed_id,
        created_at,
        followed:perfiles!followed_id(
          id,
          username,
          public_id,
          avatar_url,
          color,
          role
        )
      `, { count: 'exact' })
      .eq('follower_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (followingError) {
      console.error('[Following GET] Error:', followingError)
      return NextResponse.json({ error: 'Error al obtener seguidos' }, { status: 500 })
    }

    const response: FollowingResponse = {
      following: (following || []) as any,
      total: count || 0,
      page,
      limit
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[Following GET] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
