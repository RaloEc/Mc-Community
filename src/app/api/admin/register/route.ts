import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json()
    
    // Crear cliente de Supabase con clave de servicio
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    // 1. Crear usuario
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    
    if (authError) throw authError
    
    // 2. Crear perfil
    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .insert([
        { 
          id: authData.user.id,
          username,
          role: 'admin'
        }
      ])
    
    if (profileError) throw profileError
    
    return NextResponse.json({ success: true, user: authData.user })
  } catch (error: any) {
    console.error('Error creando admin:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario administrador' },
      { status: 400 }
    )
  }
}