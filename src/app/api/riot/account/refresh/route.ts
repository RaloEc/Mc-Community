import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/riot/account/refresh
 *
 * Refresca la información de la cuenta de Riot vinculada
 * Obtiene un nuevo PUUID y actualiza los datos de la cuenta
 *
 * Requiere:
 * - Header: Authorization con Bearer token (access_token de Riot)
 *
 * Respuesta:
 * - 200: Cuenta actualizada exitosamente
 * - 400: Access token no proporcionado
 * - 401: Usuario no autenticado
 * - 500: Error interno del servidor
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[POST /api/riot/account/refresh] Iniciando...");

    // Obtener sesión del usuario autenticado
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.error(
        "[POST /api/riot/account/refresh] Usuario no autenticado:",
        sessionError
      );
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("[POST /api/riot/account/refresh] Usuario:", userId);

    // Obtener access token del body
    const body = await request.json();
    const accessToken = body.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token no proporcionado" },
        { status: 400 }
      );
    }

    // Obtener información actualizada del jugador
    console.log(
      "[POST /api/riot/account/refresh] Obteniendo información del jugador..."
    );

    const playerResponse = await fetch(
      "https://americas.api.riotgames.com/riot/account/v1/accounts/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const playerData = await playerResponse.json();

    if (!playerResponse.ok) {
      console.error(
        "[POST /api/riot/account/refresh] Error al obtener info del jugador:",
        playerData
      );
      return NextResponse.json(
        { error: "Error al obtener información del jugador" },
        { status: 500 }
      );
    }

    const puuid = playerData.puuid;
    const gameName = playerData.game_name;
    const tagLine = playerData.tag_line;

    console.log("[POST /api/riot/account/refresh] ✅ Información obtenida:", {
      gameName,
      tagLine,
      puuid,
    });

    // Actualizar la cuenta en Supabase
    const { error: updateError } = await supabase
      .from("linked_accounts_riot")
      .update({
        puuid,
        game_name: gameName,
        tag_line: tagLine,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(
        "[POST /api/riot/account/refresh] Error al actualizar:",
        updateError
      );
      return NextResponse.json(
        { error: "Error al actualizar cuenta de Riot" },
        { status: 500 }
      );
    }

    console.log(
      "[POST /api/riot/account/refresh] ✅ Cuenta actualizada exitosamente"
    );

    return NextResponse.json(
      {
        message: "Cuenta actualizada exitosamente",
        account: {
          puuid,
          gameName,
          tagLine,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/riot/account/refresh] Error inesperado:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
