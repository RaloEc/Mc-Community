import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface DeleteActivityRequest {
  entryId: string;
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar sesión
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      );
    }

    const { entryId } = (await request.json()) as DeleteActivityRequest;

    if (!entryId) {
      return NextResponse.json(
        { success: false, message: "entryId es requerido" },
        { status: 400 }
      );
    }

    // 1. Obtener la entrada para verificar que pertenece al usuario
    const { data: entry, error: fetchError } = await supabase
      .from("user_activity_entries")
      .select("id, user_id, type")
      .eq("id", entryId)
      .single();

    if (fetchError || !entry) {
      console.error("[Delete Activity] Error fetching entry:", fetchError);
      return NextResponse.json(
        { success: false, message: "Entrada no encontrada" },
        { status: 404 }
      );
    }

    // 2. Validar que el usuario es el propietario
    if (entry.user_id !== session.user.id) {
      console.warn("[Delete Activity] Unauthorized delete attempt", {
        entryId,
        userId: session.user.id,
        ownerId: entry.user_id,
      });
      return NextResponse.json(
        {
          success: false,
          message: "No tienes permiso para eliminar esta entrada",
        },
        { status: 403 }
      );
    }

    // 3. Marcar como eliminada (soft delete)
    const { error: updateError } = await supabase
      .from("user_activity_entries")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", entryId);

    if (updateError) {
      console.error("[Delete Activity] Error deleting entry:", updateError);
      return NextResponse.json(
        { success: false, message: "Error al eliminar la entrada" },
        { status: 500 }
      );
    }

    console.log("[Delete Activity] ✅ Entrada eliminada:", {
      entryId,
      userId: session.user.id,
      type: entry.type,
    });

    return NextResponse.json({
      success: true,
      message: "Entrada eliminada exitosamente",
    });
  } catch (error) {
    console.error("[Delete Activity] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
