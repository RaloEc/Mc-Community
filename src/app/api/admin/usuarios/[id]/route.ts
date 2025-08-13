import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] Buscando usuario con ID: ${params.id}`)
    const supabase = getServiceClient()
    const id = params.id

    // Obtener perfil del usuario directamente por id (uuid)
    console.log(`[API] Ejecutando consulta a perfiles con id=${id}`)
    const { data: usuario, error: usuarioError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', id)
      .single()
    
    console.log(`[API] Resultado de la consulta:`, usuario ? 'Usuario encontrado' : 'Usuario no encontrado', usuarioError ? `Error: ${usuarioError.message}` : 'Sin errores')

    if (usuarioError || !usuario) {
      console.error('[API] Error DB:', usuarioError)
      // Intentemos una consulta adicional para verificar si la tabla tiene registros
      const { count } = await supabase.from('perfiles').select('*', { count: 'exact', head: true })
      console.log(`[API] La tabla perfiles tiene ${count} registros en total`)
      
      return NextResponse.json({ 
        error: 'Usuario no encontrado en la base de datos.', 
        detalles: usuarioError ? usuarioError.message : 'ID no encontrado',
        idBuscado: id
      }, { status: 404 })
    }

    let authUser = null;

    // Solo buscar datos de autenticación si tenemos un auth_id válido
    if (usuario.auth_id && typeof usuario.auth_id === 'string' && usuario.auth_id.length > 0) {
      console.log(`[API] auth_id del perfil encontrado: '${usuario.auth_id}'. Intentando buscar en Supabase Auth...`);
      const { data, error: authError } = await supabase.auth.admin.getUserById(usuario.auth_id);

      if (authError) {
        console.error('Error Auth:', authError);
        // No devolvemos un error 404, simplemente no tendremos datos de auth
      } else {
        authUser = data.user;
      }
    } else {
      console.warn(`[API] El perfil con id ${usuario.id} no tiene un auth_id válido.`);
    }

    // Combinar datos del perfil y de autenticación (si existen)
    const usuarioCompleto = {
      ...usuario,
      ...(authUser || {}),
      id: usuario.id, // Priorizar el id de perfiles (uuid)
      email: authUser?.email || '',
      role: usuario.role,
      activo: usuario.activo,
      auth_id: usuario.auth_id,
      // Asegurarnos de que los campos de authUser no sobreescriban los de perfiles si son nulos
      created_at: authUser?.created_at || usuario.created_at,
      updated_at: authUser?.updated_at || null,
    };

    return NextResponse.json(usuarioCompleto, { status: 200 })

  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient()
    const userId = params.id
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'reset_password':
        // Generar una nueva contraseña temporal
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
        
        const { error: resetError } = await supabase.auth.admin.updateUserById(userId, {
          password: tempPassword
        })

        if (resetError) {
          return NextResponse.json({ error: 'Error al restablecer contraseña' }, { status: 500 })
        }

        return NextResponse.json({ 
          message: 'Contraseña restablecida correctamente',
          tempPassword 
        })

      case 'toggle_active':
        const { error: toggleError } = await supabase
          .from('perfiles')
          .update({ 
            activo: data.activo,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (toggleError) {
          return NextResponse.json({ error: 'Error al cambiar estado del usuario' }, { status: 500 })
        }

        return NextResponse.json({ 
          message: data.activo ? 'Usuario activado' : 'Usuario desactivado' 
        })

      case 'send_reset_email':
        // Obtener el email del usuario
        const { data: authUser } = await supabase.auth.admin.getUserById(userId)
        
        if (!authUser.user?.email) {
          return NextResponse.json({ error: 'Usuario no tiene email configurado' }, { status: 400 })
        }

        const { error: emailError } = await supabase.auth.resetPasswordForEmail(authUser.user.email)

        if (emailError) {
          return NextResponse.json({ error: 'Error al enviar email de restablecimiento' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Email de restablecimiento enviado' })

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error en acción de usuario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
