import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Obtener todas las categorías activas
    const { data: categorias, error } = await supabase
      .from('categorias_noticias')
      .select('*')
      .eq('es_activa', true)
      .order('orden', { ascending: true })
    
    if (error) {
      console.error('Error al obtener categorías:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar las categorías' },
        { status: 500 }
      )
    }
    
    // Función para construir el árbol jerárquico
    const construirArbol = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          hijos: construirArbol(items, item.id)
        }))
    }
    
    // Construir árbol jerárquico
    const arbolCategorias = construirArbol(categorias || [])
    
    return NextResponse.json(arbolCategorias)
  } catch (error) {
    console.error('Error al procesar categorías:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
