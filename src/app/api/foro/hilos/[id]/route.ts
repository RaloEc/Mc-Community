import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processEditorContent } from "@/components/tiptap-editor/processImages";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el hilo para verificar que el usuario es el autor
    const { data: hilo, error: hiloError } = await supabase
      .from("foro_hilos")
      .select("autor_id")
      .eq("id", params.id)
      .single();

    if (hiloError || !hilo) {
      return NextResponse.json(
        { error: "Hilo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el autor
    if (hilo.autor_id !== user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para editar este hilo" },
        { status: 403 }
      );
    }

    // Obtener el contenido actualizado del body
    const body = await request.json();
    const { contenido } = body;

    if (!contenido || !contenido.trim()) {
      return NextResponse.json(
        { error: "El contenido no puede estar vacío" },
        { status: 400 }
      );
    }

    // Procesar imágenes temporales antes de actualizar
    let contenidoProcesado = contenido;
    try {
      console.log("Procesando imágenes temporales en la edición del hilo...");
      contenidoProcesado = await processEditorContent(contenido);
      console.log("Imágenes procesadas correctamente");
    } catch (error) {
      console.error("Error al procesar imágenes:", error);
      // Continuar con el contenido original si falla el procesamiento
    }

    // Actualizar el hilo
    const { data: hiloActualizado, error: updateError } = await supabase
      .from("foro_hilos")
      .update({
        contenido: contenidoProcesado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error al actualizar hilo:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar el hilo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      hilo: hiloActualizado,
    });
  } catch (error) {
    console.error("Error en PATCH /api/foro/hilos/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(
    "[DELETE /api/foro/hilos/[id]] Iniciando eliminación de hilo:",
    params.id
  );
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("[DELETE] Usuario autenticado:", user?.id);
    if (authError || !user) {
      console.error("[DELETE] Error de autenticación:", authError);
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el hilo para verificar que el usuario es el autor
    console.log("[DELETE] Buscando hilo con ID:", params.id);
    const { data: hilo, error: hiloError } = await supabase
      .from("foro_hilos")
      .select("autor_id, titulo")
      .eq("id", params.id)
      .single();

    console.log("[DELETE] Resultado de búsqueda:", { hilo, hiloError });
    if (hiloError || !hilo) {
      console.error("[DELETE] Hilo no encontrado:", hiloError);
      return NextResponse.json(
        { error: "Hilo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el autor
    console.log("[DELETE] Comparando autor_id:", {
      hiloAutor: hilo.autor_id,
      usuarioId: user.id,
    });
    if (hilo.autor_id !== user.id) {
      console.error("[DELETE] Usuario no es el autor del hilo");
      return NextResponse.json(
        { error: "No tienes permisos para eliminar este hilo" },
        { status: 403 }
      );
    }

    // Marcar el hilo como eliminado (soft delete)
    console.log("[DELETE] Marcando hilo como eliminado:", params.id);
    const { error: deleteError } = await supabase
      .from("foro_hilos")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (deleteError) {
      console.error("[DELETE] Error al actualizar hilo:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar el hilo" },
        { status: 500 }
      );
    }

    console.log("[DELETE] Hilo eliminado exitosamente:", params.id);
    return NextResponse.json({
      success: true,
      message: "Hilo eliminado correctamente",
      hiloId: params.id,
      titulo: hilo.titulo,
    });
  } catch (error) {
    console.error("[DELETE] Error en DELETE /api/foro/hilos/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
