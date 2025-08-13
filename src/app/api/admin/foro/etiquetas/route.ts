import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/admin'

// GET - Obtener todas las etiquetas
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar si el usuario es administrador
    const isUserAdmin = await isAdmin(supabase)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción.' },
        { status: 403 }
      )
    }

    // Obtener todas las etiquetas ordenadas por nombre
    const { data: etiquetas, error } = await supabase
      .from('foro_etiquetas')
      .select('*')
      .order('nombre')

    if (error) throw error

    return NextResponse.json(etiquetas)
  } catch (error: any) {
    console.error('Error al obtener etiquetas:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener etiquetas.' },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva etiqueta
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar si el usuario es administrador
    const isUserAdmin = await isAdmin(supabase)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción.' },
        { status: 403 }
      )
    }

    // Obtener datos de la etiqueta del cuerpo de la solicitud
    const { nombre, descripcion, color } = await request.json()

    // Validar datos requeridos
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre de la etiqueta es obligatorio.' },
        { status: 400 }
      )
    }

    // Insertar la nueva etiqueta
    const { data, error } = await supabase
      .from('foro_etiquetas')
      .insert([{ nombre, descripcion, color }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear etiqueta:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear la etiqueta.' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una etiqueta existente
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar si el usuario es administrador
    const isUserAdmin = await isAdmin(supabase)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción.' },
        { status: 403 }
      )
    }

    // Obtener el ID de la etiqueta de los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere un ID de etiqueta válido.' },
        { status: 400 }
      )
    }

    // Obtener datos actualizados de la etiqueta
    const { nombre, descripcion, color } = await request.json()

    // Validar datos requeridos
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre de la etiqueta es obligatorio.' },
        { status: 400 }
      )
    }

    // Actualizar la etiqueta
    const { data, error } = await supabase
      .from('foro_etiquetas')
      .update({ nombre, descripcion, color })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error al actualizar etiqueta:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la etiqueta.' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una etiqueta
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar si el usuario es administrador
    const isUserAdmin = await isAdmin(supabase)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción.' },
        { status: 403 }
      )
    }

    // Obtener el ID de la etiqueta de los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere un ID de etiqueta válido.' },
        { status: 400 }
      )
    }

    // Verificar si la etiqueta está siendo utilizada en hilos
    const { data: hilosEtiquetas, error: errorCheck } = await supabase
      .from('foro_hilos_etiquetas')
      .select('id')
      .eq('etiqueta_id', id)
      .limit(1)

    if (errorCheck) throw errorCheck

    // Si la etiqueta está siendo utilizada, no permitir eliminarla
    if (hilosEtiquetas && hilosEtiquetas.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la etiqueta porque está siendo utilizada en hilos del foro.' },
        { status: 400 }
      )
    }

    // Eliminar la etiqueta
    const { error } = await supabase
      .from('foro_etiquetas')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar etiqueta:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la etiqueta.' },
      { status: 500 }
    )
  }
}
