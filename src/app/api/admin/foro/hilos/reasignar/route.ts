import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const supabase = getServiceClient()
    const body = await request.json()
    const { fromCategoriaId, toCategoriaId } = body as { fromCategoriaId?: string; toCategoriaId?: string }

    if (!fromCategoriaId || !toCategoriaId) {
      return NextResponse.json({ error: 'fromCategoriaId y toCategoriaId son obligatorios.' }, { status: 400 })
    }

    if (fromCategoriaId === toCategoriaId) {
      return NextResponse.json({ error: 'La categoría de destino debe ser diferente a la de origen.' }, { status: 400 })
    }

    // Verificar existencia de categorías
    const { data: catFrom, error: errFrom } = await supabase
      .from('foro_categorias')
      .select('id')
      .eq('id', fromCategoriaId)
      .single()

    if (errFrom || !catFrom) {
      return NextResponse.json({ error: 'La categoría origen no existe.' }, { status: 404 })
    }

    const { data: catTo, error: errTo } = await supabase
      .from('foro_categorias')
      .select('id')
      .eq('id', toCategoriaId)
      .single()

    if (errTo || !catTo) {
      return NextResponse.json({ error: 'La categoría destino no existe.' }, { status: 404 })
    }

    // Reasignar en bloque
    const { data, error } = await supabase
      .from('foro_hilos')
      .update({ categoria_id: toCategoriaId })
      .eq('categoria_id', fromCategoriaId)
      .select('id')

    if (error) {
      console.error('Error reasignando hilos:', error)
      return NextResponse.json({ error: 'Error interno al reasignar los hilos.' }, { status: 500 })
    }

    const count = Array.isArray(data) ? data.length : 0
    return NextResponse.json({ message: 'Hilos reasignados correctamente', count }, { status: 200 })
  } catch (e) {
    console.error('Error en API de reasignar hilos:', e)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
