import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { getServiceClient } from '@/utils/supabase-service'
import { revalidatePath } from 'next/cache'

// Función para verificar si el usuario es administrador
async function esAdmin(supabase: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return perfil?.role === 'admin'
  } catch (error) {
    console.error('Error al verificar rol de administrador:', error)
    return false
  }
}

// PATCH - Actualizar estado de una noticia (destacada, es_activa)
export async function PATCH(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const searchParams = request.nextUrl.searchParams
  const admin = searchParams.get('admin') === 'true'
  
  // Verificar permisos de admin
  if (admin) {
    const esUsuarioAdmin = await esAdmin(supabase)
    if (!esUsuarioAdmin) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de administrador.' },
        { status: 403 }
      )
    }
  }

  try {
    const body = await request.json()
    const { id, campo, valor } = body

    if (!id || !campo || valor === undefined) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: id, campo, valor' },
        { status: 400 }
      )
    }

    // Validar que el campo sea permitido
    const camposPermitidos = ['destacada', 'es_activa']
    if (!camposPermitidos.includes(campo)) {
      return NextResponse.json(
        { error: `Campo no permitido: ${campo}` },
        { status: 400 }
      )
    }

    const serviceClient = getServiceClient()

    // Actualizar el campo específico
    const { error } = await serviceClient
      .from('noticias')
      .update({ [campo]: valor })
      .eq('id', id)

    if (error) {
      console.error('Error al actualizar estado:', error)
      return NextResponse.json(
        { error: `Error al actualizar estado: ${error.message}` },
        { status: 500 }
      )
    }

    // Revalidar rutas
    revalidatePath('/noticias')
    revalidatePath('/admin/noticias/listado')

    return NextResponse.json({ 
      success: true, 
      message: 'Estado actualizado correctamente' 
    })
  } catch (error: any) {
    console.error('Error al procesar la solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
