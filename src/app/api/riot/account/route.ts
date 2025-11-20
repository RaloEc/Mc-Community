import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/riot/account
 *
 * Obtiene la información de la cuenta de Riot vinculada del usuario autenticado
 *
 * Respuesta:
 * - 200: Información de la cuenta de Riot
 * - 404: No hay cuenta de Riot vinculada
 * - 401: Usuario no autenticado
 * - 500: Error interno del servidor
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[GET /api/riot/account] Iniciando...");

    // Obtener sesión del usuario autenticado
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.error(
        "[GET /api/riot/account] Usuario no autenticado:",
        sessionError
      );
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("[GET /api/riot/account] Usuario:", userId);

    // Obtener cuenta de Riot vinculada
    const { data: riotAccount, error: queryError } = await supabase
      .from("linked_accounts_riot")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (queryError) {
      if (queryError.code === "PGRST116") {
        // No hay resultados
        console.log("[GET /api/riot/account] No hay cuenta de Riot vinculada");
        return NextResponse.json(
          { error: "No hay cuenta de Riot vinculada" },
          { status: 404 }
        );
      }

      console.error("[GET /api/riot/account] Error en query:", queryError);
      return NextResponse.json(
        { error: "Error al obtener cuenta de Riot" },
        { status: 500 }
      );
    }

    console.log("[GET /api/riot/account] ✅ Cuenta encontrada:", {
      gameName: riotAccount.game_name,
      tagLine: riotAccount.tag_line,
    });

    return NextResponse.json({ account: riotAccount }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/riot/account] Error inesperado:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/riot/account
 *
 * Desvincula la cuenta de Riot del usuario autenticado
 *
 * Respuesta:
 * - 200: Cuenta desvinculada exitosamente
 * - 404: No hay cuenta de Riot vinculada
 * - 401: Usuario no autenticado
 * - 500: Error interno del servidor
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("[DELETE /api/riot/account] Iniciando...");

    // Obtener sesión del usuario autenticado
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.error(
        "[DELETE /api/riot/account] Usuario no autenticado:",
        sessionError
      );
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("[DELETE /api/riot/account] Usuario:", userId);

    // Eliminar cuenta de Riot vinculada
    const { error: deleteError } = await supabase
      .from("linked_accounts_riot")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error(
        "[DELETE /api/riot/account] Error al eliminar:",
        deleteError
      );
      return NextResponse.json(
        { error: "Error al desvincular cuenta de Riot" },
        { status: 500 }
      );
    }

    console.log(
      "[DELETE /api/riot/account] ✅ Cuenta desvinculada exitosamente"
    );

    return NextResponse.json(
      { message: "Cuenta desvinculada exitosamente" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[DELETE /api/riot/account] Error inesperado:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
