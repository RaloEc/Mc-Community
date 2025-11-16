import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/utils/supabase-service";

export async function POST(request: Request) {
  try {
    console.log("[API Comentarios Reply] Recibiendo solicitud POST");
    const body = await request.json();
    const { parent_id, text, gif_url } = body;

    // Obtener usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Debes iniciar sesión para responder" },
        { status: 401 }
      );
    }

    console.log("[API Comentarios Reply] Datos recibidos:", {
      parent_id,
      text: text?.substring(0, 20) + "...",
      user_id: user.id,
    });

    // Validar datos requeridos - permitir respuesta sin texto si hay GIF
    if (!parent_id || ((!text || text.trim() === "") && !gif_url)) {
      console.log("[API Comentarios Reply] Error: Faltan campos requeridos");
      return NextResponse.json(
        { success: false, error: "Debes proporcionar texto o un GIF" },
        { status: 400 }
      );
    }

    // Verificar que el comentario padre existe
    const serviceSupabase = getServiceClient();

    // Primero intentamos buscar en la tabla comentarios
    console.log(
      "[API Comentarios Reply] Buscando comentario padre con ID:",
      parent_id
    );

    const { data: parentComment, error: parentError } = await serviceSupabase
      .from("comentarios")
      .select(
        "id, tipo_entidad, entidad_id, contenido, usuario_id, comentario_padre_id"
      )
      .eq("id", parent_id)
      .single();

    console.log(
      "[API Comentarios Reply] Resultado de búsqueda del comentario padre en comentarios:",
      {
        encontrado: !!parentComment,
        error: parentError ? parentError.message : null,
      }
    );

    // Si no se encuentra en comentarios, buscar en foro_posts
    let isForoPost = false;
    let parentForoPost = null;
    let hiloId = null;

    if (parentError || !parentComment) {
      console.log("[API Comentarios Reply] Buscando en foro_posts...");
      const { data: forumPost, error: forumError } = await serviceSupabase
        .from("foro_posts")
        .select("id, contenido, autor_id, hilo_id")
        .eq("id", parent_id)
        .single();

      if (!forumError && forumPost) {
        isForoPost = true;
        parentForoPost = forumPost;
        hiloId = forumPost.hilo_id;
        console.log(
          "[API Comentarios Reply] Encontrado post del foro como padre:",
          forumPost.id
        );
      } else {
        console.error(
          "[API Comentarios Reply] Error: El comentario padre no existe en ninguna tabla"
        );
        return NextResponse.json(
          { success: false, error: "El comentario padre no existe" },
          { status: 404 }
        );
      }
    }

    // Obtener el perfil del autor del comentario padre
    let authorUsername = "Usuario";
    let authorColor = "#3b82f6";
    let authorId = null;

    if (isForoPost && parentForoPost) {
      authorId = parentForoPost.autor_id;
    } else if (parentComment) {
      authorId = parentComment.usuario_id;
    }

    if (authorId) {
      const { data: authorData } = await serviceSupabase
        .from("perfiles")
        .select("username, color")
        .eq("id", authorId)
        .single();

      if (authorData) {
        authorUsername = authorData.username;
        authorColor = authorData.color || "#3b82f6";
      }
    }

    // Obtener datos del comentario padre para la cita
    let parentCommentData;
    let parentAuthor;
    let parentAuthorColor;
    let isParentEdited = false;
    let isParentDeleted = false;

    if (isForoPost) {
      // Buscar en foro_posts (no tiene columna deleted)
      const { data: parentForoPostData, error: parentForoError } =
        await serviceSupabase
          .from("foro_posts")
          .select("id, contenido, autor_id, created_at, editado")
          .eq("id", parent_id)
          .single();

      if (parentForoError) {
        console.error(
          "[API Comentarios Reply] Error al obtener post padre:",
          parentForoError
        );
        return NextResponse.json(
          { success: false, error: "No se pudo obtener el post padre" },
          { status: 500 }
        );
      }

      parentCommentData = parentForoPostData;
      isParentEdited = parentForoPostData.editado || false;
      // foro_posts no tiene soft delete, verificar en foro_posts_eliminados
      const { data: deletedPost } = await serviceSupabase
        .from("foro_posts_eliminados")
        .select("id")
        .eq("id", parent_id)
        .single();
      isParentDeleted = !!deletedPost;
    } else {
      // Buscar en comentarios (sin asumir que existe la columna 'deleted')
      const { data: parentComentarioData, error: parentComentarioError } =
        await serviceSupabase
          .from("comentarios")
          .select("id, contenido, usuario_id, created_at, editado")
          .eq("id", parent_id)
          .single();

      if (parentComentarioError || !parentComentarioData) {
        console.error(
          "[API Comentarios Reply] Error al obtener comentario padre:",
          parentComentarioError
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "No se pudo obtener el comentario padre. Detalles: " +
              (parentComentarioError?.message || "Comentario no encontrado"),
          },
          { status: 500 }
        );
      }

      parentCommentData = parentComentarioData;
      isParentEdited = parentComentarioData.editado || false;
      // Compatibilidad: si la columna 'deleted' no existe en la tabla, asumir false
      // @ts-ignore
      isParentDeleted = (parentComentarioData as any).deleted || false;
    }

    // Insertar la respuesta en la tabla correspondiente
    if (isForoPost) {
      // Si el padre es un post del foro, guardar en foro_posts
      console.log("[API Comentarios Reply] Guardando respuesta en foro_posts");
      const { data: replyPostData, error: replyPostError } =
        await serviceSupabase
          .from("foro_posts")
          .insert({
            contenido: text,
            autor_id: user.id,
            hilo_id: hiloId,
            post_padre_id: parent_id,
            gif_url: gif_url || null,
          })
          .select("*")
          .single();

      if (replyPostError) {
        console.error(
          "[API Comentarios Reply] Error al crear respuesta en foro_posts:",
          replyPostError
        );
        return NextResponse.json(
          {
            success: false,
            error: `Error al crear la respuesta: ${replyPostError.message}`,
          },
          { status: 500 }
        );
      }

      console.log(
        "[API Comentarios Reply] Respuesta guardada en BD - gif_url:",
        replyPostData.gif_url || null
      );

      // Obtener el perfil del autor
      const { data: perfilData } = await serviceSupabase
        .from("perfiles")
        .select("id, username, avatar_url, role, color")
        .eq("id", user.id)
        .single();

      // Formatear respuesta para compatibilidad con el frontend
      const respuestaFormateada = {
        id: replyPostData.id,
        content_type: "hilo",
        content_id: hiloId,
        author_id: user.id,
        text: replyPostData.contenido,
        parent_id: parent_id,
        created_at: replyPostData.created_at,
        updated_at: replyPostData.created_at,
        gif_url: replyPostData.gif_url || null,
        autor: perfilData,
        replies: [], // Las respuestas nuevas no tienen sub-respuestas
        repliedTo: {
          id: parent_id,
          author: authorUsername,
          text: parentCommentData.contenido,
          color: authorColor,
          isEdited: isParentEdited,
          isDeleted: isParentDeleted,
        },
      };

      console.log(
        "[API Comentarios Reply] Respuesta en foro_posts creada exitosamente:",
        respuestaFormateada.id
      );
      return NextResponse.json(respuestaFormateada);
    } else {
      // Si el padre es un comentario normal, guardar en comentarios
      // Necesitamos asegurarnos de usar el tipo_entidad y entidad_id correctos
      // Si el comentario padre tiene su propio padre, debemos usar los valores del comentario raíz
      if (!parentComment) {
        console.error(
          "[API Comentarios Reply] Error: parentComment es null o undefined"
        );
        return NextResponse.json(
          {
            success: false,
            error: "Error interno: datos del comentario padre no disponibles",
          },
          { status: 500 }
        );
      }

      let tipo_entidad = parentComment.tipo_entidad;
      let entidad_id = parentComment.entidad_id;

      // Si el comentario padre es a su vez una respuesta, necesitamos obtener la entidad raíz
      if (parentComment.comentario_padre_id) {
        console.log(
          "[API Comentarios Reply] El comentario padre es a su vez una respuesta, buscando comentario raíz"
        );

        // Buscar el comentario raíz recursivamente
        let currentParentId = parentComment.comentario_padre_id;
        let foundRoot = false;

        // Limitar la recursión para evitar bucles infinitos
        for (let i = 0; i < 10 && !foundRoot; i++) {
          const { data: rootComment, error: rootError } = await serviceSupabase
            .from("comentarios")
            .select("id, tipo_entidad, entidad_id, comentario_padre_id")
            .eq("id", currentParentId)
            .single();

          if (rootError || !rootComment) {
            console.error(
              "[API Comentarios Reply] Error al buscar comentario raíz:",
              rootError
            );
            // No devolvemos error aquí, solo usamos los valores que ya tenemos
            foundRoot = true; // Forzamos salir del bucle
            break;
          }

          if (!rootComment.comentario_padre_id) {
            // Encontramos el comentario raíz
            tipo_entidad = rootComment.tipo_entidad;
            entidad_id = rootComment.entidad_id;
            foundRoot = true;
            console.log(
              "[API Comentarios Reply] Encontrado comentario raíz:",
              rootComment.id
            );
          } else {
            // Seguir buscando hacia arriba
            currentParentId = rootComment.comentario_padre_id;
          }
        }
      }

      console.log(
        "[API Comentarios Reply] Usando tipo_entidad:",
        tipo_entidad,
        "y entidad_id:",
        entidad_id
      );

      const { data: replyData, error } = await serviceSupabase
        .from("comentarios")
        .insert({
          contenido: text,
          usuario_id: user.id,
          tipo_entidad: tipo_entidad,
          entidad_id: entidad_id,
          comentario_padre_id: parent_id,
          gif_url: gif_url || null,
        })
        .select(
          `
          *,
          perfiles:usuario_id(id, username, avatar_url, role, color)
        `
        )
        .single();

      if (error) {
        console.error(
          "[API Comentarios Reply] Error al crear respuesta:",
          error
        );
        return NextResponse.json(
          {
            success: false,
            error: `Error al crear la respuesta: ${error.message}`,
          },
          { status: 500 }
        );
      }

      // Formatear respuesta para compatibilidad con el frontend
      const respuestaFormateada = {
        id: replyData.id,
        content_type: replyData.tipo_entidad,
        content_id: replyData.entidad_id,
        author_id: replyData.usuario_id,
        text: replyData.contenido,
        parent_id: replyData.comentario_padre_id,
        created_at: replyData.created_at,
        updated_at: replyData.updated_at,
        gif_url: replyData.gif_url || null,
        autor: replyData.perfiles,
        replies: [], // Las respuestas nuevas no tienen sub-respuestas
        repliedTo: {
          id: parentComment.id,
          author: authorUsername,
          text: parentCommentData.contenido,
          color: authorColor,
          isEdited: isParentEdited,
          isDeleted: isParentDeleted,
        },
      };

      console.log(
        "[API Comentarios Reply] Respuesta creada exitosamente:",
        respuestaFormateada.id
      );

      return NextResponse.json(respuestaFormateada);
    }
  } catch (error) {
    console.error("Error en API de respuestas:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
