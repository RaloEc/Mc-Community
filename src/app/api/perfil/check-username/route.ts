import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const currentUserId = searchParams.get('userId')

  if (!username || username.trim().length === 0) {
    return NextResponse.json({ available: false, error: 'Username requerido' }, { status: 400 })
  }

  const normalizedUsername = username.trim()

  if (normalizedUsername.length < 3) {
    return NextResponse.json({ available: false, error: 'El username debe tener al menos 3 caracteres' }, { status: 400 })
  }

  if (normalizedUsername.length > 30) {
    return NextResponse.json({ available: false, error: 'El username no puede exceder 30 caracteres' }, { status: 400 })
  }

  // Validar que solo contenga letras, números, espacios, guiones y guiones bajos
  if (!/^[a-zA-Z0-9 _-]+$/.test(normalizedUsername)) {
    return NextResponse.json({ available: false, error: 'Solo se permiten letras, números, espacios, guiones y guiones bajos' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Buscar si el username ya existe
    const { data: existingUser, error } = await supabase
      .from('perfiles')
      .select('id')
      .eq('username', normalizedUsername)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 es el error de "no rows found"
      console.error('Error checking username:', error)
      return NextResponse.json({ available: false, error: 'Error al verificar username' }, { status: 500 })
    }

    // Si existe un usuario con ese username
    if (existingUser) {
      // Si es el mismo usuario (editando su propio perfil), está disponible
      if (currentUserId && existingUser.id === currentUserId) {
        return NextResponse.json({ available: true, message: 'Username actual' })
      }
      // Si es otro usuario, no está disponible
      return NextResponse.json({ available: false, error: 'Este username ya está en uso' })
    }

    // Username disponible
    return NextResponse.json({ available: true, message: 'Username disponible' })

  } catch (error) {
    console.error('Unexpected error checking username:', error)
    return NextResponse.json({ available: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
