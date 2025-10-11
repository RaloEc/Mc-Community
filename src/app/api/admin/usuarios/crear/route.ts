import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/utils/supabase-service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('perfiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acción no permitida' }, { status: 403 })
  }

  const { username, email, password, role, activo } = await request.json()
  const avatar_url = `https://api.dicebear.com/7.x/initials/svg?seed=${username}`

  if (!username || !email || !password || !role) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }

  const supabaseAdmin = getServiceClient()

  // 1. Crear el usuario en auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // El admin crea el usuario, se asume confirmado
  })

  if (authError) {
    console.error('Error al crear usuario en Supabase Auth:', authError)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'No se pudo crear el usuario en el sistema de autenticación.' }, { status: 500 })
  }

  // 2. Crear el perfil del usuario en la tabla 'perfiles'
  const { error: profileError } = await supabaseAdmin
    .from('perfiles')
    .insert({
      id: authData.user.id,
      username,
      role,
      activo,
      avatar_url
    })

  if (profileError) {
    console.error('Error al crear perfil de usuario:', profileError)
    // Si falla la creación del perfil, debemos eliminar el usuario de auth para evitar inconsistencias
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Error al crear el perfil del usuario. Se ha revertido la creación.' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Usuario creado exitosamente' })
}
