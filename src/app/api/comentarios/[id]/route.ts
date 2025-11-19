import { getServiceClient } from "@/utils/supabase-service";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de comentario requerido" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Obtener el comentario con información del autor
    const { data: comentario, error } = await supabase
      .from("comentarios")
      .select(
        `
        id,
        contenido,
        created_at,
        usuario_id,
        gif_url,
        votos_totales,
        comentario_padre_id,
        autor:usuario_id(id, username, avatar_url, color)
      `
      )
      .eq("id", id)
      .single();

    if (error || !comentario) {
      console.error("[GET /api/comentarios/[id]] Error:", error);
      return NextResponse.json(
        { error: "Comentario no encontrado" },
        { status: 404 }
      );
    }

    // Si es una respuesta, obtener el comentario padre para contexto
    let comentarioPadre = null;
    if (comentario.comentario_padre_id) {
      const { data: padre } = await supabase
        .from("comentarios")
        .select(
          `
          id,
          contenido,
          created_at,
          usuario_id,
          votos_totales,
          autor:usuario_id(id, username, avatar_url, color)
        `
        )
        .eq("id", comentario.comentario_padre_id)
        .single();
      comentarioPadre = padre;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...comentario,
        text: comentario.contenido,
        votos_totales: comentario.votos_totales ?? 0,
        comentarioPadre: comentarioPadre
          ? {
              id: comentarioPadre.id,
              contenido: comentarioPadre.contenido,
              created_at: comentarioPadre.created_at,
              votos_totales: comentarioPadre.votos_totales ?? 0,
              autor: comentarioPadre.autor,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[GET /api/comentarios/[id]] Error interno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
