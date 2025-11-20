/**
 * API Route para obtener y sincronizar historial de partidas
 * GET /api/riot/matches - Obtiene partidas desde BD
 * POST /api/riot/matches/sync - Sincroniza partidas nuevas desde Riot
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import {
  getMatchHistory,
  syncMatchHistory,
  getPlayerStats,
} from "@/lib/riot/matches";

/**
 * GET /api/riot/matches
 * Obtiene el historial de partidas del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();

    // Obtener user_id del header (enviado por el cliente)
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener cuenta de Riot vinculada
    const { data: riotAccount, error: accountError } = await supabase
      .from("linked_accounts_riot")
      .select("puuid, active_shard")
      .eq("user_id", userId)
      .single();

    if (accountError || !riotAccount) {
      return NextResponse.json(
        { error: "No hay cuenta de Riot vinculada" },
        { status: 404 }
      );
    }

    // Obtener parámetro de límite
    const limit = parseInt(
      request.nextUrl.searchParams.get("limit") || "10",
      10
    );

    // Obtener historial de partidas
    const matches = await getMatchHistory(riotAccount.puuid, limit);

    // Obtener estadísticas agregadas
    const stats = await getPlayerStats(riotAccount.puuid, 20);

    return NextResponse.json({
      success: true,
      matches,
      stats,
    });
  } catch (error: any) {
    console.error("[GET /api/riot/matches] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener partidas" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/riot/matches/sync
 * Sincroniza el historial de partidas desde Riot API
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();

    // Obtener user_id del header
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener cuenta de Riot vinculada
    const { data: riotAccount, error: accountError } = await supabase
      .from("linked_accounts_riot")
      .select("puuid, active_shard, access_token")
      .eq("user_id", userId)
      .single();

    if (accountError || !riotAccount) {
      return NextResponse.json(
        { error: "No hay cuenta de Riot vinculada" },
        { status: 404 }
      );
    }

    // Obtener API Key de Riot
    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
      console.error(
        "[POST /api/riot/matches/sync] RIOT_API_KEY no configurada"
      );
      return NextResponse.json(
        { error: "Configuración de servidor incompleta" },
        { status: 500 }
      );
    }

    // Sincronizar partidas
    const result = await syncMatchHistory(
      riotAccount.puuid,
      riotAccount.active_shard || "la1",
      apiKey,
      20 // Sincronizar últimas 20 partidas
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al sincronizar" },
        { status: 500 }
      );
    }

    // Obtener historial actualizado
    const matches = await getMatchHistory(riotAccount.puuid, 10);
    const stats = await getPlayerStats(riotAccount.puuid, 20);

    return NextResponse.json({
      success: true,
      message: `${result.newMatches} partidas nuevas sincronizadas`,
      newMatches: result.newMatches,
      totalMatches: result.totalMatches,
      matches,
      stats,
    });
  } catch (error: any) {
    console.error("[POST /api/riot/matches/sync] Error:", error);
    return NextResponse.json(
      { error: "Error al sincronizar partidas" },
      { status: 500 }
    );
  }
}
