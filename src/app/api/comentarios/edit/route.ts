import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/lib/supabase';

export async function PUT(request: Request) {
  try {
    console.log('[API Comentarios Edit] Recibiendo solicitud PUT');
    const body = await request.json();
    const { comment_id, text } = body;
    
    // Obtener usuario autenticado
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión para editar un comentario' },
        { status: 401 }
      );
    }
    
    console.log('[API Comentarios Edit] Datos recibidos:', { 
      comment_id,
      text: text?.substring(0, 20) + '...', 
      user_id: user.id
    });

    // Validar datos requeridos
    if (!comment_id || !text) {
      console.log('[API Comentarios Edit] Error: Faltan campos requeridos');
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    const serviceSupabase = getServiceClient();
    
    // Primero intentamos buscar en la tabla comentarios
    console.log('[API Comentarios Edit] Buscando comentario con ID:', comment_id);
    
    const { data: existingComment, error: commentError } = await serviceSupabase
      .from('comentarios')
      .select('id, usuario_id, contenido, created_at')
      .eq('id', comment_id)
      .single();
      
    // Si no se encuentra en comentarios, buscar en foro_posts
    let isForoPost = false;
    let existingForoPost = null;
    
    if (commentError || !existingComment) {
      console.log('[API Comentarios Edit] Buscando en foro_posts...');
      const { data: forumPost, error: forumError } = await serviceSupabase
        .from('foro_posts')
        .select('id, autor_id, contenido, created_at')
        .eq('id', comment_id)
        .single();
        
      if (!forumError && forumPost) {
        isForoPost = true;
        existingForoPost = forumPost;
        console.log('[API Comentarios Edit] Encontrado post del foro:', forumPost.id);
      } else {
        console.error('[API Comentarios Edit] Error: El comentario no existe en ninguna tabla');
        return NextResponse.json(
          { success: false, error: 'El comentario no existe' },
          { status: 404 }
        );
      }
    }
    
    // Verificar que el usuario actual es el autor del comentario
    const authorId = isForoPost ? existingForoPost.autor_id : existingComment.usuario_id;
    
    if (authorId !== user.id) {
      console.error('[API Comentarios Edit] Error: El usuario no es el autor del comentario');
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para editar este comentario' },
        { status: 403 }
      );
    }
    
    // Guardar el contenido original para el historial
    const originalContent = isForoPost ? existingForoPost.contenido : existingComment.contenido;
    const createdAt = isForoPost ? existingForoPost.created_at : existingComment.created_at;
    
    // Actualizar el comentario en la tabla correspondiente
    if (isForoPost) {
      // Actualizar en foro_posts
      console.log('[API Comentarios Edit] Actualizando post del foro');
      
      // Primero, verificar si ya existe un historial
      const { data: existingHistory } = await serviceSupabase
        .from('foro_posts_historial')
        .select('id, versiones')
        .eq('post_id', comment_id)
        .single();
      
      // Preparar la nueva versión
      const now = new Date().toISOString();
      const newVersion = {
        contenido: originalContent,
        fecha: now,
        version: existingHistory ? existingHistory.versiones.length + 1 : 1
      };
      
      // Actualizar o crear el historial
      if (existingHistory) {
        await serviceSupabase
          .from('foro_posts_historial')
          .update({
            versiones: [...existingHistory.versiones, newVersion]
          })
          .eq('id', existingHistory.id);
      } else {
        await serviceSupabase
          .from('foro_posts_historial')
          .insert({
            post_id: comment_id,
            contenido_original: originalContent,
            versiones: [newVersion]
          });
      }
      
      // Actualizar el post
      const { data: updatedPost, error: updateError } = await serviceSupabase
        .from('foro_posts')
        .update({
          contenido: text,
          editado: true,
          editado_en: now,
          historial_ediciones: existingHistory ? [...existingHistory.versiones, newVersion] : [newVersion]
        })
        .eq('id', comment_id)
        .select('*, perfiles:autor_id(id, username, avatar_url, color)')
        .single();
        
      if (updateError) {
        console.error('[API Comentarios Edit] Error al actualizar post del foro:', updateError);
        return NextResponse.json(
          { success: false, error: `Error al actualizar el comentario: ${updateError.message}` },
          { status: 500 }
        );
      }
      
      // Formatear respuesta
      const respuestaFormateada = {
        id: updatedPost.id,
        text: updatedPost.contenido,
        author: updatedPost.perfiles.username,
        authorId: updatedPost.autor_id,
        avatarUrl: updatedPost.perfiles.avatar_url,
        authorColor: updatedPost.perfiles.color,
        timestamp: updatedPost.created_at,
        isEdited: true,
        editedAt: updatedPost.editado_en,
        replies: []
      };
      
      console.log('[API Comentarios Edit] Post del foro actualizado exitosamente');
      return NextResponse.json({
        success: true,
        comentario: respuestaFormateada
      });
    } else {
      // Actualizar en comentarios
      console.log('[API Comentarios Edit] Actualizando comentario');
      
      // Primero, verificar si ya existe un historial
      const { data: existingHistory } = await serviceSupabase
        .from('comentarios_historial')
        .select('id, versiones')
        .eq('comentario_id', comment_id)
        .single();
      
      // Preparar la nueva versión
      const now = new Date().toISOString();
      const newVersion = {
        contenido: originalContent,
        fecha: now,
        version: existingHistory ? existingHistory.versiones.length + 1 : 1
      };
      
      // Actualizar o crear el historial
      if (existingHistory) {
        await serviceSupabase
          .from('comentarios_historial')
          .update({
            versiones: [...existingHistory.versiones, newVersion]
          })
          .eq('id', existingHistory.id);
      } else {
        await serviceSupabase
          .from('comentarios_historial')
          .insert({
            comentario_id: comment_id,
            contenido_original: originalContent,
            versiones: [newVersion]
          });
      }
      
      // Actualizar el comentario
      const { data: updatedComment, error: updateError } = await serviceSupabase
        .from('comentarios')
        .update({
          contenido: text,
          editado: true,
          editado_en: now,
          historial_ediciones: existingHistory ? [...existingHistory.versiones, newVersion] : [newVersion]
        })
        .eq('id', comment_id)
        .select('*, perfiles:usuario_id(id, username, avatar_url, color)')
        .single();
        
      if (updateError) {
        console.error('[API Comentarios Edit] Error al actualizar comentario:', updateError);
        return NextResponse.json(
          { success: false, error: `Error al actualizar el comentario: ${updateError.message}` },
          { status: 500 }
        );
      }
      
      // Formatear respuesta
      const respuestaFormateada = {
        id: updatedComment.id,
        text: updatedComment.contenido,
        author: updatedComment.perfiles.username,
        authorId: updatedComment.usuario_id,
        avatarUrl: updatedComment.perfiles.avatar_url,
        authorColor: updatedComment.perfiles.color,
        timestamp: updatedComment.created_at,
        isEdited: true,
        editedAt: updatedComment.editado_en,
        replies: []
      };
      
      console.log('[API Comentarios Edit] Comentario actualizado exitosamente');
      return NextResponse.json({
        success: true,
        comentario: respuestaFormateada
      });
    }
  } catch (error) {
    console.error('[API Comentarios Edit] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
