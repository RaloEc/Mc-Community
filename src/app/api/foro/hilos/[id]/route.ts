import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
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

    // Actualizar el hilo
    const { data: hiloActualizado, error: updateError } = await supabase
      .from("foro_hilos")
      .update({
        contenido,
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
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
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
        { error: "No tienes permisos para eliminar este hilo" },
        { status: 403 }
      );
    }

    // Marcar el hilo como eliminado (soft delete)
    const { error: deleteError } = await supabase
      .from("foro_hilos")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (deleteError) {
      console.error("Error al eliminar hilo:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar el hilo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Hilo eliminado correctamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/foro/hilos/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
