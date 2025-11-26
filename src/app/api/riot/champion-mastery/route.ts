import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/riot/champion-mastery
 *
 * Obtiene los top 3 campeones con más maestría del usuario
 * Requiere headers: x-user-id, x-puuid
 *
 * Respuesta:
 * - 200: Array con top 3 campeones
 * - 401: Usuario no autenticado
 * - 500: Error interno del servidor
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[GET /api/riot/champion-mastery] Iniciando...");

    // Obtener sesión del usuario autenticado
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.error(
        "[GET /api/riot/champion-mastery] Usuario no autenticado:",
        sessionError
      );
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener puuid del header
    const puuid = request.headers.get("x-puuid");
    if (!puuid) {
      console.error("[GET /api/riot/champion-mastery] PUUID no proporcionado");
      return NextResponse.json({ error: "PUUID requerido" }, { status: 400 });
    }

    console.log("[GET /api/riot/champion-mastery] PUUID:", puuid);

    // Obtener cuenta de Riot para el region/shard
    const { data: riotAccount, error: accountError } = await supabase
      .from("linked_accounts_riot")
      .select("active_shard")
      .eq("user_id", session.user.id)
      .single();

    if (accountError || !riotAccount) {
      console.error(
        "[GET /api/riot/champion-mastery] Error obteniendo cuenta:",
        accountError
      );
      return NextResponse.json(
        { error: "No hay cuenta de Riot vinculada" },
        { status: 404 }
      );
    }

    const region = riotAccount.active_shard || "la1";
    const apiKey = process.env.RIOT_API_KEY;

    if (!apiKey) {
      console.error(
        "[GET /api/riot/champion-mastery] RIOT_API_KEY no configurada"
      );
      return NextResponse.json(
        { error: "Configuración de servidor incompleta" },
        { status: 500 }
      );
    }

    // Construir URL del endpoint de Riot
    const riotApiUrl = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3`;

    console.log(
      "[GET /api/riot/champion-mastery] Fetching from Riot API:",
      riotApiUrl
    );

    // Hacer request a Riot API
    const response = await fetch(riotApiUrl, {
      headers: {
        "X-Riot-Token": apiKey,
      },
    });

    if (!response.ok) {
      console.error(
        "[GET /api/riot/champion-mastery] Error from Riot API:",
        response.status,
        await response.text()
      );
      return NextResponse.json(
        { error: "Error al obtener datos de Riot API" },
        { status: response.status }
      );
    }

    const masteryData = await response.json();
    console.log(
      "[GET /api/riot/champion-mastery] ✅ Datos obtenidos:",
      masteryData
    );

    return NextResponse.json(
      {
        success: true,
        masteries: masteryData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/riot/champion-mastery] Error inesperado:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
