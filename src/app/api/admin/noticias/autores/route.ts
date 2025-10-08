import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { getServiceClient } from '@/utils/supabase-service'

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

// GET - Obtener lista de autores únicos que han escrito noticias
export async function GET(request: NextRequest) {
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
    const serviceClient = getServiceClient()

    // Obtener autores únicos de noticias
    const { data, error } = await serviceClient
      .from('noticias')
      .select('autor_id, autor:perfiles!noticias_autor_id_fkey(id, username)')
      .not('autor_id', 'is', null)

    if (error) {
      console.error('Error al obtener autores:', error)
      return NextResponse.json(
        { error: `Error al obtener autores: ${error.message}` },
        { status: 500 }
      )
    }

    // Extraer autores únicos
    const autoresUnicos = new Map()
    data?.forEach((item: any) => {
      if (item.autor && item.autor.id) {
        autoresUnicos.set(item.autor.id, {
          id: item.autor.id,
          username: item.autor.username || 'Usuario sin nombre'
        })
      }
    })

    const autores = Array.from(autoresUnicos.values()).sort((a, b) => 
      a.username.localeCompare(b.username)
    )

    return NextResponse.json(autores)
  } catch (error: any) {
    console.error('Error al procesar la solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
