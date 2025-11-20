import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncRiotStats, getRoutingRegionFromShard } from "@/lib/riot/sync";

/**
 * POST /api/riot/sync
 *
 * Sincroniza manualmente las estadísticas de Riot del usuario autenticado
 *
 * Respuesta:
 * - 200: Estadísticas sincronizadas exitosamente
 * - 404: No hay cuenta de Riot vinculada
 * - 401: Usuario no autenticado
 * - 500: Error interno del servidor
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[POST /api/riot/sync] Iniciando sincronización manual...");

    // Obtener sesión del usuario autenticado
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.error(
        "[POST /api/riot/sync] Usuario no autenticado:",
        sessionError
      );
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("[POST /api/riot/sync] Usuario:", userId);

    // Obtener cuenta de Riot vinculada
    const { data: riotAccount, error: queryError } = await supabase
      .from("linked_accounts_riot")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (queryError || !riotAccount) {
      console.error(
        "[POST /api/riot/sync] No hay cuenta de Riot vinculada:",
        queryError
      );
      return NextResponse.json(
        { error: "No hay cuenta de Riot vinculada" },
        { status: 404 }
      );
    }

    const { puuid, region } = riotAccount;

    // Sincronizar estadísticas
    console.log(
      "[POST /api/riot/sync] Sincronizando estadísticas para PUUID:",
      puuid
    );

    const routingRegion = region === "americas" ? "americas" : "europe";
    const syncResult = await syncRiotStats(
      puuid,
      process.env.RIOT_API_KEY || "",
      routingRegion
    );

    if (!syncResult.success) {
      console.error(
        "[POST /api/riot/sync] Error al sincronizar:",
        syncResult.error
      );
      return NextResponse.json(
        {
          error: "Error al sincronizar estadísticas",
          details: syncResult.error,
        },
        { status: 500 }
      );
    }

    const statsData = syncResult.data!;

    // Actualizar base de datos
    console.log("[POST /api/riot/sync] Actualizando base de datos...");

    const { error: updateError } = await supabase
      .from("linked_accounts_riot")
      .update({
        active_shard: statsData.activeShard,
        summoner_id: statsData.summonerId,
        profile_icon_id: statsData.profileIconId,
        summoner_level: statsData.summonerLevel,
        tier: statsData.tier,
        rank: statsData.rank,
        league_points: statsData.leaguePoints,
        wins: statsData.wins,
        losses: statsData.losses,
        last_updated: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[POST /api/riot/sync] Error al actualizar:", updateError);
      return NextResponse.json(
        {
          error: "Error al guardar estadísticas",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log(
      "[POST /api/riot/sync] ✅ Estadísticas sincronizadas exitosamente"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Estadísticas sincronizadas exitosamente",
        data: statsData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/riot/sync] Error inesperado:", error);

    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
