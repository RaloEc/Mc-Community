import { NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Editar una respuesta
export async function PUT(
  request: Request, 
  { params }: { params: { id: string, postId: string } }
) {
  const supabase = await createClient();
  const hiloId = params.id;
  const postId = params.postId;

  // 1. Verificar la sesión del usuario
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado. Debes iniciar sesión para editar.' }, { status: 401 });
  }

  // 2. Obtener y validar el contenido de la respuesta
  const { contenido } = await request.json();
  if (!contenido || typeof contenido !== 'string' || contenido.trim().length === 0) {
    return NextResponse.json({ error: 'El contenido de la respuesta no puede estar vacío.' }, { status: 400 });
  }

  try {
    // 3. Verificar que el post existe y pertenece al usuario o es admin
    const { data: post, error: postError } = await supabase
      .from('foro_posts')
      .select('autor_id')
      .eq('id', postId)
      .eq('hilo_id', hiloId)
      .single();

    if (postError) {
      return NextResponse.json({ error: 'No se encontró la respuesta.' }, { status: 404 });
    }

    // Verificar si el usuario es el autor o es admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const esAdmin = perfil?.role === 'admin';
    const esAutor = post.autor_id === session.user.id;

    if (!esAutor && !esAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para editar esta respuesta.' }, { status: 403 });
    }

    // 4. Actualizar el post
    const { data: postActualizado, error } = await supabase
      .from('foro_posts')
      .update({
        contenido: contenido.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select(`
        id,
        contenido,
        created_at,
        updated_at,
        autor_id,
        usuario_id,
        autor:perfiles!left(username, avatar_url, role)
      `)
      .single();

    if (error) {
      console.error('Error al actualizar la respuesta:', error);
      return NextResponse.json({ error: 'No se pudo actualizar la respuesta.' }, { status: 500 });
    }

    // 5. Devolver la respuesta actualizada
    return NextResponse.json({ 
      message: 'Respuesta actualizada correctamente',
      data: postActualizado
    });

  } catch (error: any) {
    console.error('Error inesperado al editar la respuesta:', error);
    return NextResponse.json({ error: 'Error inesperado en el servidor.' }, { status: 500 });
  }
}

// Eliminar una respuesta (soft delete con cascada)
export async function DELETE(
  request: Request, 
  { params }: { params: { id: string, postId: string } }
) {
  const supabase = await createClient();
  const serviceSupabase = getServiceClient();
  const hiloId = params.id;
  const postId = params.postId;

  // 1. Verificar la sesión del usuario
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado. Debes iniciar sesión para eliminar.' }, { status: 401 });
  }

  try {
    // 2. Verificar que el post existe y pertenece al usuario o es admin
    const { data: post, error: postError } = await supabase
      .from('foro_posts')
      .select('autor_id, deleted')
      .eq('id', postId)
      .eq('hilo_id', hiloId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'No se encontró la respuesta.' }, { status: 404 });
    }

    // Verificar si ya está eliminado
    if (post.deleted) {
      return NextResponse.json({ error: 'Esta respuesta ya ha sido eliminada.' }, { status: 400 });
    }

    // Verificar si el usuario es el autor o es admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const esAdmin = perfil?.role === 'admin';
    const esAutor = post.autor_id === session.user.id;

    if (!esAutor && !esAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar esta respuesta.' }, { status: 403 });
    }

    // 3. Eliminar el post y sus respuestas en cascada usando la función RPC
    const { data: resultado, error } = await serviceSupabase.rpc('soft_delete_post_cascade', {
      p_post_id: postId,
      p_deleted_by: session.user.id
    });

    if (error) {
      console.error('Error al eliminar la respuesta:', error);
      return NextResponse.json({ error: 'No se pudo eliminar la respuesta.' }, { status: 500 });
    }

    // Verificar el resultado de la función
    if (!resultado.success) {
      console.error('Error en soft_delete_post_cascade:', resultado.error);
      return NextResponse.json({ error: resultado.error || 'No se pudo eliminar la respuesta.' }, { status: 500 });
    }

    // 4. Devolver respuesta exitosa
    return NextResponse.json({ 
      message: resultado.message || 'Respuesta eliminada correctamente',
      success: true,
      affected_count: resultado.affected_count,
      deleted_at: resultado.deleted_at
    });

  } catch (error: any) {
    console.error('Error inesperado al eliminar la respuesta:', error);
    return NextResponse.json({ error: 'Error inesperado en el servidor.' }, { status: 500 });
  }
}
