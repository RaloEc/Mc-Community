import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/social/block - Bloquear usuario
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { targetPublicId } = await request.json()
    
    if (!targetPublicId) {
      return NextResponse.json({ error: 'targetPublicId requerido' }, { status: 400 })
    }

    // Obtener ID del usuario a bloquear
    const { data: targetProfile, error: profileError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('public_id', targetPublicId)
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

    // No puedes bloquearte a ti mismo
    if (currentProfile.id === targetProfile.id) {
      return NextResponse.json({ error: 'No puedes bloquearte a ti mismo' }, { status: 400 })
    }

    // Crear bloqueo (el trigger limpiará relaciones existentes)
    const { data: block, error: blockError } = await supabase
      .from('social_blocks')
      .insert({
        blocker_id: currentProfile.id,
        blocked_id: targetProfile.id
      })
      .select()
      .single()

    if (blockError) {
      // Si ya existe el bloqueo
      if (blockError.code === '23505') {
        return NextResponse.json({ error: 'Usuario ya está bloqueado' }, { status: 409 })
      }
      console.error('[Block POST] Error:', blockError)
      return NextResponse.json({ error: 'Error al bloquear usuario' }, { status: 500 })
    }

    return NextResponse.json({ success: true, block }, { status: 201 })
  } catch (error) {
    console.error('[Block POST] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/social/block?targetPublicId=xxx - Desbloquear usuario
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetPublicId = searchParams.get('targetPublicId')
    
    if (!targetPublicId) {
      return NextResponse.json({ error: 'targetPublicId requerido' }, { status: 400 })
    }

    // Obtener ID del usuario a desbloquear
    const { data: targetProfile, error: profileError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('public_id', targetPublicId)
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

    // Eliminar bloqueo
    const { error: deleteError } = await supabase
      .from('social_blocks')
      .delete()
      .eq('blocker_id', currentProfile.id)
      .eq('blocked_id', targetProfile.id)

    if (deleteError) {
      console.error('[Block DELETE] Error:', deleteError)
      return NextResponse.json({ error: 'Error al desbloquear usuario' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Block DELETE] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
