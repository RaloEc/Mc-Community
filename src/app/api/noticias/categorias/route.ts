import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('[API Categorías] Iniciando consulta de categorías...');
    const supabase = createClient()
    
    console.log('[API Categorías] Cliente Supabase creado');
    
    // Obtener todas las categorías activas
    const { data: categorias, error } = await supabase
      .from('categorias_noticias')
      .select('*')
      .eq('es_activa', true)
      .order('orden', { ascending: true })
    
    console.log('[API Categorías] Categorías obtenidas:', categorias);
    console.log('[API Categorías] Total categorías:', categorias?.length);
    console.log('[API Categorías] Error completo:', JSON.stringify(error, null, 2));
    
    if (error) {
      console.error('[API Categorías] Error al obtener categorías:', error)
      console.error('[API Categorías] Error code:', error.code);
      console.error('[API Categorías] Error message:', error.message);
      console.error('[API Categorías] Error details:', error.details);
      return NextResponse.json(
        { success: false, error: 'Error al cargar las categorías', details: error },
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
    
    console.log('[API Categorías] Árbol construido:', arbolCategorias);
    console.log('[API Categorías] Total nodos raíz:', arbolCategorias.length);
    
    const response = {
      success: true,
      data: arbolCategorias
    };
    
    console.log('[API Categorías] Respuesta final:', response);
    
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[API Categorías] Error al procesar categorías:', error)
    console.error('[API Categorías] Error stack:', error?.stack)
    console.error('[API Categorías] Error message:', error?.message)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: error?.message,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}
