import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: 'Se requiere el ID del hilo' }, { status: 400 });
    }
    
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const limite = parseInt(searchParams.get('limite') || '50');
    
    // Calcular offset para paginación
    const offset = (pagina - 1) * limite;
    
    // Inicializar cliente de Supabase
    const supabase = getServiceClient();
    
    // Obtener posts del hilo
    // Obtener el orden desde los parámetros de la URL
    const orden = searchParams.get('orden') || 'asc';
    const ascending = orden === 'asc';
    
    const { data: posts, error } = await supabase
      .from('foro_posts')
      .select(`
        id,
        contenido,
        created_at,
        updated_at,
        es_solucion,
        autor_id,
        autor:perfiles (username, avatar_url, role),
        foro_reacciones(count)
      `)
      .eq('hilo_id', params.id)
      .order('created_at', { ascending })
      .range(offset, offset + limite - 1);
    
    if (error) {
      console.error('Error al obtener posts:', error);
      return NextResponse.json({ error: 'Error al obtener posts' }, { status: 500 });
    }
    
    // Formatear datos para el frontend
    const postsMapeados = posts.map((post: any) => ({
      id: post.id,
      contenido: post.contenido,
      created_at: post.created_at,
      updated_at: post.created_at, // Si no hay campo updated_at, usar created_at
      hilo_id: params.id,
      autor_id: post.autor_id,
      autor: post.autor ? {
        username: post.autor.username,
        avatar_url: post.autor.avatar_url,
        role: post.autor.role
      } : {
        username: 'Usuario eliminado',
        avatar_url: null,
        role: 'user'
      },
      es_solucion: post.es_solucion,
      reacciones: post.foro_reacciones[0]?.count || 0
    }));
    
    // Obtener el total de posts para este hilo
    const { count, error: countError } = await supabase
      .from('foro_posts')
      .select('id', { count: 'exact', head: true })
      .eq('hilo_id', params.id);
    
    if (countError) {
      console.error('Error al obtener el total de posts:', countError);
    }
    
    // Devolver los datos en la estructura esperada por el componente ForoRespuestas
    return NextResponse.json({
      data: postsMapeados,
      total: count || postsMapeados.length
    });
    
  } catch (error) {
    console.error('Error en la API de posts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
