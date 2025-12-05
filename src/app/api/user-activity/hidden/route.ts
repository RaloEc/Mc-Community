import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

    // Obtener actividades ocultas
    const { data, error } = await supabase
      .from("activity_visibility")
      .select("activity_type, activity_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("[Activity Hidden] Error:", error);
      return NextResponse.json(
        { error: "Error al obtener actividades ocultas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("[Activity Hidden] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
