import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE /api/social/friends/[friendshipId] - Terminar amistad
export async function DELETE(
  request: Request,
  { params }: { params: { friendshipId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { friendshipId } = params

    // Obtener ID del usuario actual
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (currentProfileError || !currentProfile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    // Eliminar amistad (RLS validará que el usuario esté involucrado)
    const { error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (deleteError) {
      console.error('[Friendship DELETE] Error:', deleteError)
      return NextResponse.json({ error: 'Error al terminar amistad' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Friendship DELETE] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
