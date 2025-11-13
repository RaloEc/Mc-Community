import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('[API Categorías] Iniciando consulta de categorías...');
    const supabase = getServiceClient()
    
    console.log('[API Categorías] Cliente de servicio creado');
    
    // Obtener todas las categorías de tipo 'noticia'
    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('tipo', 'noticia')
      .order('orden', { ascending: true })
    
    console.log('[API Categorías] Categorías obtenidas:', categorias);
    console.log('[API Categorías] Total categorías:', categorias?.length);
    console.log('[API Categorías] Error completo:', JSON.stringify(error, null, 2));
    console.log('[API Categorías] Categorías con parent_id null:', categorias?.filter((c: any) => c.parent_id === null).length);
    console.log('[API Categorías] Categorías con parent_id no null:', categorias?.filter((c: any) => c.parent_id !== null).length);
    
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
      const filtered = items.filter(item => item.parent_id === parentId);
      console.log(`[API Categorías] Buscando items con parent_id=${parentId}, encontrados: ${filtered.length}`);
      
      return filtered.map(item => {
        const subcategorias = construirArbol(items, item.id);
        console.log(`[API Categorías] Item ${item.nombre} (${item.id}) tiene ${subcategorias.length} subcategorías`);
        return {
          ...item,
          subcategorias: subcategorias
        };
      });
    }
    
    // Construir árbol jerárquico - solo categorías raíz (sin parent_id)
    const arbolCategorias = construirArbol(categorias || [], null)
    
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
