import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/utils/supabase-service';

export async function POST(request: Request) {
  try {
    // Obtener el ID del comentario de la URL
    const url = new URL(request.url);
    const comment_id = url.searchParams.get('id');
    
    console.log('[API Comentarios Restore] Recibiendo solicitud POST para restaurar comentario ID:', comment_id);
    
    if (!comment_id) {
      return NextResponse.json(
        { success: false, error: 'ID de comentario no proporcionado' },
        { status: 400 }
      );
    }
    
    // Obtener usuario autenticado
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión para restaurar un comentario' },
        { status: 401 }
      );
    }
    
    const serviceSupabase = getServiceClient();
    
    // Verificar que el usuario actual es moderador o administrador
    const { data: perfil, error: perfilError } = await serviceSupabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (perfilError || !perfil || !['admin', 'moderator'].includes(perfil.role)) {
      console.error('[API Comentarios Restore] Error: El usuario no tiene permisos de moderador');
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para restaurar comentarios' },
        { status: 403 }
      );
    }
    
    // Primero intentamos buscar en la tabla comentarios
    console.log('[API Comentarios Restore] Buscando comentario con ID:', comment_id);
    
    const { data: existingComment, error: commentError } = await serviceSupabase
      .from('comentarios')
      .select('id, deleted')
      .eq('id', comment_id)
      .single();
      
    // Si no se encuentra en comentarios, buscar en foro_posts
    let isForoPost = false;
    let existingForoPost = null;
    
    if (commentError || !existingComment) {
      console.log('[API Comentarios Restore] Buscando en foro_posts...');
      const { data: forumPost, error: forumError } = await serviceSupabase
        .from('foro_posts')
        .select('id, deleted')
        .eq('id', comment_id)
        .single();
        
      if (!forumError && forumPost) {
        isForoPost = true;
        existingForoPost = forumPost;
        console.log('[API Comentarios Restore] Encontrado post del foro:', forumPost.id);
      } else {
        console.error('[API Comentarios Restore] Error: El comentario no existe en ninguna tabla');
        return NextResponse.json(
          { success: false, error: 'El comentario no existe' },
          { status: 404 }
        );
      }
    }
    
    // Verificar que el comentario está marcado como eliminado
    const isDeleted = isForoPost ? existingForoPost.deleted : existingComment.deleted;
    
    if (!isDeleted) {
      console.log('[API Comentarios Restore] El comentario no está eliminado');
      return NextResponse.json(
        { success: false, error: 'El comentario no está eliminado' },
        { status: 400 }
      );
    }
    
    // Restaurar el comentario
    if (isForoPost) {
      // Actualizar foro_posts para restaurar
      const { error: updateError } = await serviceSupabase
        .from('foro_posts')
        .update({
          deleted: false,
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', comment_id);
        
      if (updateError) {
        console.error('[API Comentarios Restore] Error al restaurar post:', updateError);
        return NextResponse.json(
          { success: false, error: `Error al restaurar el comentario: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Actualizar comentarios para restaurar
      const { error: updateError } = await serviceSupabase
        .from('comentarios')
        .update({
          deleted: false,
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', comment_id);
        
      if (updateError) {
        console.error('[API Comentarios Restore] Error al restaurar comentario:', updateError);
        return NextResponse.json(
          { success: false, error: `Error al restaurar el comentario: ${updateError.message}` },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Comentario restaurado correctamente'
    });
  } catch (error) {
    console.error('[API Comentarios Restore] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
