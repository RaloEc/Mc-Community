import { NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';


// Hacer que la ruta sea dinámica
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getServiceClient();
    
    // Obtener todas las categorías activas ordenadas por nivel y orden
    const { data: categorias, error } = await supabase
      .from('foro_categorias')
      .select(`
        id,
        nombre,
        descripcion,
        imagen_url,
        slug,
        orden,
        es_activa,
        parent_id,
        nivel,
        color
      `)
      .eq('es_activa', true)
      .order('nivel', { ascending: true })
      .order('orden', { ascending: true });
    
    if (error) {
      console.error('Error al obtener categorías del foro:', error);
      return NextResponse.json({ error: 'Error al obtener categorías del foro' }, { status: 500 });
    }

    // Para cada categoría, obtener el número de hilos y mensajes
    const categoriasConEstadisticas = await Promise.all(
      categorias.map(async (categoria) => {
        // Contar hilos en esta categoría
        const { count: hilosCount, error: hilosError } = await supabase
          .from('foro_hilos')
          .select('*', { count: 'exact', head: true })
          .eq('categoria_id', categoria.id);
        
        // Contar todos los posts en hilos de esta categoría
        const { data: posts, error: postsError } = await supabase
          .from('foro_posts')
          .select('id')
          .eq('hilo_id', supabase.from('foro_hilos').select('id').eq('categoria_id', categoria.id));
        
        const mensajesCount = posts?.length || 0;
        
        return {
          ...categoria,
          hilos: hilosCount || 0,
          mensajes: mensajesCount
        };
      })
    );
    
    return NextResponse.json({ 
      data: categoriasConEstadisticas,
      count: categoriasConEstadisticas.length
    });
    
  } catch (error) {
    console.error('Error inesperado al obtener categorías del foro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
