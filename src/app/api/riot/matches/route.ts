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

const DEFAULT_MATCH_LIMIT = 40;
const MAX_MATCH_LIMIT = 100;
const QUEUE_FILTERS: Record<string, number[]> = {
  normals: [400, 430],
  soloq: [420],
  flex: [440],
  aram: [450],
  urf: [900],
};

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
    const limitParam = request.nextUrl.searchParams.get("limit");
    const parsedLimit = limitParam ? Number(limitParam) : DEFAULT_MATCH_LIMIT;
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), MAX_MATCH_LIMIT)
      : DEFAULT_MATCH_LIMIT;

    const cursorParam = request.nextUrl.searchParams.get("cursor");
    const parsedCursor = cursorParam ? Number(cursorParam) : null;
    const cursor = Number.isFinite(parsedCursor) ? parsedCursor : null;

    const queueParam = request.nextUrl.searchParams.get("queue")?.toLowerCase();
    const queueIds = queueParam ? QUEUE_FILTERS[queueParam] : undefined;

    // Obtener historial de partidas
    const matchHistory = await getMatchHistory(riotAccount.puuid, {
      limit,
      cursor,
      queueIds,
    });

    // Obtener estadísticas agregadas
    const stats = await getPlayerStats(riotAccount.puuid, {
      limit,
      queueIds,
    });

    return NextResponse.json({
      success: true,
      matches: matchHistory.matches,
      hasMore: matchHistory.hasMore,
      nextCursor: matchHistory.nextCursor,
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
    const matchHistory = await getMatchHistory(riotAccount.puuid, {
      limit: DEFAULT_MATCH_LIMIT,
    });
    const stats = await getPlayerStats(riotAccount.puuid, DEFAULT_MATCH_LIMIT);

    return NextResponse.json({
      success: true,
      message: `${result.newMatches} partidas nuevas sincronizadas`,
      newMatches: result.newMatches,
      totalMatches: result.totalMatches,
      matches: matchHistory.matches,
      hasMore: matchHistory.hasMore,
      nextCursor: matchHistory.nextCursor,
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
