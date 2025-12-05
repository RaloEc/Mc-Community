import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { activityType, activityId } = await request.json();

    if (!activityType || !activityId) {
      return NextResponse.json(
        { error: "activityType y activityId requeridos" },
        { status: 400 }
      );
    }

    // Validar tipo de actividad
    const validTypes = [
      "forum_thread",
      "forum_post",
      "weapon_stats",
      "lol_match",
      "noticia",
      "comentario",
    ];
    if (!validTypes.includes(activityType)) {
      return NextResponse.json(
        { error: "Tipo de actividad inválido" },
        { status: 400 }
      );
    }

    // Insertar en activity_visibility
    const { data, error } = await supabase
      .from("activity_visibility")
      .insert({
        user_id: user.id,
        activity_type: activityType,
        activity_id: activityId,
      })
      .select()
      .single();

    if (error) {
      // Si es error de constraint único (ya oculta)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Esta actividad ya está oculta" },
          { status: 409 }
        );
      }
      console.error("[Activity Hide] Error:", error);
      return NextResponse.json(
        { error: "Error al ocultar actividad" },
        { status: 500 }
      );
    }

    // Registrar en auditoría
    await supabase.from("activity_audit_logs").insert({
      user_id: user.id,
      action: "hide",
      activity_type: activityType,
      activity_id: activityId,
    });

    console.log("[Activity Hide] Success:", {
      user_id: user.id,
      activity_type: activityType,
      activity_id: activityId,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[Activity Hide] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
