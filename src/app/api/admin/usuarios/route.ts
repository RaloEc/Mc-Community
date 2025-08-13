import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const activo = searchParams.get('activo')

    const offset = (page - 1) * limit

    // Construir la consulta base
    let query = supabase
      .from('perfiles')
      .select(`
        id,
        username,
        role,
        avatar_url,
        created_at,
        updated_at,
        activo,
        fecha_ultimo_acceso,
        bio,
        ubicacion,
        sitio_web
      `)

    // Aplicar filtros
    if (search) {
      query = query.ilike('username', `%${search}%`)
    }

    if (role) {
      query = query.eq('role', role)
    }

    if (activo !== null && activo !== '') {
      query = query.eq('activo', activo === 'true')
    }

    // Obtener el total de registros para la paginación
    const { count } = await supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: true })

    // Aplicar paginación y ordenamiento
    const { data: perfiles, error } = await query
      .order('role', { ascending: true })
      .order('username', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error al obtener usuarios:', error)
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
    }

    // Para cada perfil, obtener información adicional de auth.users si es necesario
    const usuariosCompletos = await Promise.all(
      perfiles.map(async (perfil) => {
        try {
          // Obtener información del usuario de auth.users
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(perfil.id)
          
          if (authError) {
            console.warn(`Error al obtener datos auth para usuario ${perfil.id}:`, authError)
          }
          
          return {
            auth_id: perfil.id,
            email: authUser?.user?.email || '',
            username: perfil.username,
            role: perfil.role,
            avatar_url: perfil.avatar_url,
            created_at: perfil.created_at,
            updated_at: perfil.updated_at,
            activo: perfil.activo ?? true,
            fecha_ultimo_acceso: perfil.fecha_ultimo_acceso,
            bio: perfil.bio,
            ubicacion: perfil.ubicacion,
            sitio_web: perfil.sitio_web
          }
        } catch (error) {
          console.warn(`Error al procesar usuario ${perfil.id}:`, error)
          // Retornar datos básicos si falla la obtención de auth
          return {
            auth_id: perfil.id,
            email: '',
            username: perfil.username,
            role: perfil.role,
            avatar_url: perfil.avatar_url,
            created_at: perfil.created_at,
            updated_at: perfil.updated_at,
            activo: perfil.activo ?? true,
            fecha_ultimo_acceso: perfil.fecha_ultimo_acceso,
            bio: perfil.bio,
            ubicacion: perfil.ubicacion,
            sitio_web: perfil.sitio_web
          }
        }
      })
    )

    return NextResponse.json({
      usuarios: usuariosCompletos,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Error en API de usuarios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const body = await request.json()
    const { userId, updates } = body

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    // Separar actualizaciones de perfil y de auth
    const { email, password, ...perfilUpdates } = updates

    // Actualizar perfil en la tabla perfiles
    if (Object.keys(perfilUpdates).length > 0) {
      const { error: perfilError } = await supabase
        .from('perfiles')
        .update({
          ...perfilUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (perfilError) {
        console.error('Error al actualizar perfil:', perfilError)
        return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
      }
    }

    // Actualizar email o password en auth.users si se proporcionan
    if (email || password) {
      const authUpdates: any = {}
      if (email) authUpdates.email = email
      if (password) authUpdates.password = password

      const { error: authError } = await supabase.auth.admin.updateUserById(userId, authUpdates)

      if (authError) {
        console.error('Error al actualizar auth:', authError)
        return NextResponse.json({ error: 'Error al actualizar autenticación' }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Usuario actualizado correctamente' })

  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    // --- INICIO DE LÓGICA DE ELIMINACIÓN EN CASCADA MANUAL ---
    // Es crucial eliminar las dependencias en el orden correcto para evitar errores de foreign key.

    // 1. Eliminar reacciones, seguimientos, etc. (tablas que apuntan a posts, hilos o perfiles)
    await supabase.from('foro_reacciones').delete().eq('user_id', userId)
    await supabase.from('foro_seguimiento').delete().eq('user_id', userId)

    // 2. Eliminar posts del foro
    await supabase.from('foro_posts').delete().eq('autor_id', userId)

    // 3. Eliminar hilos del foro
    await supabase.from('foro_hilos').delete().eq('autor_id', userId)

    // 4. Eliminar noticias
    await supabase.from('noticias').delete().eq('autor_id', userId)

    // 5. Eliminar el perfil del usuario
    // Aunque auth.deleteUser podría tener CASCADE, es más seguro hacerlo explícitamente.
    const { error: perfilError } = await supabase.from('perfiles').delete().eq('id', userId)
    if (perfilError) {
      console.error('Error al eliminar perfil:', perfilError)
      // No detenemos el proceso, intentamos eliminar el usuario de auth de todas formas
    }

    // 6. Finalmente, eliminar el usuario de auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error al eliminar usuario de Supabase Auth:', authError)
      // Si esto falla, puede que el usuario ya no exista o haya otro problema.
      // Podríamos intentar recrear el perfil si la eliminación de auth falla, pero por ahora solo logueamos.
      return NextResponse.json({ error: 'Error al eliminar el usuario del sistema de autenticación.' }, { status: 500 })
    }

    // --- FIN DE LÓGICA DE ELIMINACIÓN ---

    return NextResponse.json({ message: 'Usuario y todos sus datos asociados eliminados correctamente' })

  } catch (error) {
    console.error('Error catastrófico al eliminar usuario:', error)
    return NextResponse.json({ error: 'Error interno del servidor al procesar la eliminación.' }, { status: 500 })
  }
}
