import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '5');
    const categoria = searchParams.get('categoria') || null;
    
    const supabase = getServiceClient();
    
    // Construir la consulta base
    let query = supabase
      .from('foro_hilos')
      .select(`
        id,
        titulo,
        created_at,
        ultimo_post_at,
        vistas,
        categoria_id,
        autor_id,
        foro_categorias (
          nombre,
          slug
        )
      `)
      .order('ultimo_post_at', { ascending: false })
      .limit(limite);
    
    // Filtrar por categoría si se especifica
    if (categoria) {
      // Podemos buscar por ID o por slug de la categoría
      if (categoria.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Es un UUID, buscar por ID
        query = query.eq('categoria_id', categoria);
      } else {
        // Es un slug, buscar por slug de la categoría
        query = query.eq('foro_categorias.slug', categoria);
      }
    }
    
    const { data: hilos, error } = await query;
    
    if (error) {
      console.error('Error al obtener hilos recientes:', error);
      return NextResponse.json({ error: 'Error al obtener hilos recientes' }, { status: 500 });
    }

    // Para cada hilo, obtener información adicional
    const hilosConDetalles = await Promise.all(
      hilos.map(async (hilo) => {
        // Obtener nombre del autor
        const { data: autor } = await supabase
          .from('perfiles')
          .select('nombre_usuario, avatar_url')
          .eq('id', hilo.autor_id)
          .single();
        
        // Contar respuestas
        const { count: respuestasCount } = await supabase
          .from('foro_posts')
          .select('*', { count: 'exact', head: true })
          .eq('hilo_id', hilo.id);
        
        return {
          id: hilo.id,
          titulo: hilo.titulo,
          fecha_creacion: hilo.created_at,
          fecha_actualizacion: hilo.ultimo_post_at,
          vistas: hilo.vistas,
          autor_id: hilo.autor_id,
          autor_nombre: autor?.nombre_usuario || 'Usuario desconocido',
          autor_avatar: autor?.avatar_url,
          categoria_id: hilo.categoria_id,
          categoria_nombre: hilo.foro_categorias?.[0]?.nombre || 'General',
          categoria_slug: hilo.foro_categorias?.[0]?.slug || 'general',
          respuestas: respuestasCount || 0
        };
      })
    );
    
    return NextResponse.json({ 
      data: hilosConDetalles,
      count: hilosConDetalles.length
    });
    
  } catch (error) {
    console.error('Error inesperado al obtener hilos recientes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
