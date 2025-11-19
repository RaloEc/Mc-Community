import { NextResponse } from "next/server";
import { getServiceClient } from "@/utils/supabase-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params?.postId;
    if (!postId) {
      return NextResponse.json(
        { error: "Se requiere el ID del post" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    console.log("[GET /api/foro/post/:id] Buscando post", { postId });

    // Obtener el post sin embedding para evitar conflictos de relaciones
    const { data: post, error } = await supabase
      .from("foro_posts")
      .select(
        `
        id,
        contenido,
        created_at,
        updated_at,
        hilo_id,
        autor_id,
        es_solucion,
        gif_url
      `
      )
      .eq("id", postId)
      .single();

    if (error || !post) {
      console.error("[GET /api/foro/post/:id] Error obteniendo post:", error);
      return NextResponse.json(
        { error: "No se encontró el post" },
        { status: 404 }
      );
    }

    console.log("[GET /api/foro/post/:id] Post encontrado", {
      postId: post.id,
      hiloId: post.hilo_id,
      autorId: post.autor_id,
    });

    // Obtener datos del autor por separado
    const { data: autor, error: autorError } = await supabase
      .from("perfiles")
      .select("username, avatar_url, role")
      .eq("id", post.autor_id)
      .single();

    if (autorError) {
      console.warn(
        "[GET /api/foro/post/:id] Error obteniendo autor:",
        autorError
      );
    }

    const postConAutor = {
      ...post,
      autor: autor || {
        username: "Usuario eliminado",
        avatar_url: null,
        role: "user",
      },
    };

    console.log("[GET /api/foro/post/:id] Retornando post con autor");
    return NextResponse.json({ data: postConAutor });
  } catch (error) {
    console.error("[GET /api/foro/post/:id] Error interno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
