import { NextRequest, NextResponse } from "next/server";
import { createClient, getServiceClient } from "@/lib/supabase/server";
import { syncRiotStats, getRoutingRegionFromShard } from "@/lib/riot/sync";

const RIOT_API_KEY = process.env.RIOT_API_KEY!;
const DEFAULT_PLATFORM_REGION = "la1"; // Región por defecto para Latinoamérica

const UNRANKED_RANK = {
  tier: "UNRANKED",
  rank: null,
  leaguePoints: 0,
  wins: 0,
  losses: 0,
};

/**
 * POST /api/riot/account/link-manual
 *
 * Vincula manualmente una cuenta de Riot sin OAuth
 * Este es un endpoint TEMPORAL para uso mientras no se tienen credenciales RSO
 *
 * Body:
 * - puuid: PUUID de la cuenta a vincular (requerido)
 * - gameName: Nombre del jugador (requerido)
 * - tagLine: Tag del jugador (requerido)
 * - region: Región de la cuenta (opcional, default: la1)
 *
 * Respuesta:
 * - 200: Cuenta vinculada exitosamente
 * - 400: Parámetros faltantes
 * - 401: Usuario no autenticado
 * - 409: Cuenta ya vinculada a otro usuario
 * - 500: Error del servidor
 */
export async function POST(request: NextRequest) {
  try {
    console.log(
      "[POST /api/riot/account/link-manual] Iniciando vinculación manual..."
    );

    // Obtener sesión del usuario autenticado
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.error(
        "[POST /api/riot/account/link-manual] Usuario no autenticado"
      );
      return NextResponse.json(
        { error: "Debes iniciar sesión para vincular tu cuenta" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parsear body
    const body = await request.json();
    const { puuid, gameName, tagLine, region = DEFAULT_PLATFORM_REGION } = body;

    console.log("[POST /api/riot/account/link-manual] Datos recibidos:", {
      userId,
      puuid,
      gameName,
      tagLine,
      region,
    });

    // Validar parámetros requeridos
    if (!puuid || !gameName || !tagLine) {
      return NextResponse.json(
        { error: "puuid, gameName y tagLine son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el PUUID no esté vinculado a otro usuario
    const serviceClient = getServiceClient();
    const { data: existingAccount, error: checkError } = await serviceClient
      .from("linked_accounts_riot")
      .select("user_id, game_name, tag_line")
      .eq("puuid", puuid)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows found (OK)
      console.error(
        "[POST /api/riot/account/link-manual] Error al verificar cuenta:",
        checkError
      );
      return NextResponse.json(
        { error: "Error al verificar la cuenta" },
        { status: 500 }
      );
    }

    if (existingAccount && existingAccount.user_id !== userId) {
      console.log(
        "[POST /api/riot/account/link-manual] Cuenta ya vinculada a otro usuario"
      );
      return NextResponse.json(
        {
          error: `Esta cuenta de Riot (${existingAccount.game_name}#${existingAccount.tag_line}) ya está vinculada a otro usuario`,
        },
        { status: 409 }
      );
    }

    // Sincronizar estadísticas del jugador
    console.log(
      "[POST /api/riot/account/link-manual] Sincronizando estadísticas..."
    );

    const routingRegion = getRoutingRegionFromShard(region);
    const syncResult = await syncRiotStats(puuid, RIOT_API_KEY, region);

    let statsData = {
      activeShard: region,
      summonerId: null as string | null,
      summonerLevel: 1,
      profileIconId: 0,
      soloRank: { ...UNRANKED_RANK },
      flexRank: { ...UNRANKED_RANK },
    };

    if (syncResult.success && syncResult.data) {
      statsData = syncResult.data;
      console.log(
        "[POST /api/riot/account/link-manual] ✅ Estadísticas obtenidas:",
        {
          level: statsData.summonerLevel,
          icon: statsData.profileIconId,
          soloRank: statsData.soloRank,
        }
      );
    } else {
      console.warn(
        "[POST /api/riot/account/link-manual] No se pudieron obtener estadísticas:",
        syncResult.error
      );
    }

    const soloRank = statsData.soloRank || { ...UNRANKED_RANK };
    const flexRank = statsData.flexRank || { ...UNRANKED_RANK };

    // Insertar o actualizar en linked_accounts_riot
    const { error: upsertError } = await serviceClient
      .from("linked_accounts_riot")
      .upsert(
        {
          user_id: userId,
          puuid,
          game_name: gameName,
          tag_line: tagLine,
          region,
          active_shard: statsData.activeShard,
          summoner_id: statsData.summonerId,
          summoner_level: statsData.summonerLevel,
          profile_icon_id: statsData.profileIconId,
          solo_tier: soloRank.tier,
          solo_rank: soloRank.rank,
          solo_league_points: soloRank.leaguePoints,
          solo_wins: soloRank.wins,
          solo_losses: soloRank.losses,
          flex_tier: flexRank.tier,
          flex_rank: flexRank.rank,
          flex_league_points: flexRank.leaguePoints,
          flex_wins: flexRank.wins,
          flex_losses: flexRank.losses,
          // Sin tokens OAuth ya que es vinculación manual
          access_token: null,
          refresh_token: null,
          updated_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error(
        "[POST /api/riot/account/link-manual] Error al guardar:",
        upsertError
      );
      return NextResponse.json(
        { error: "Error al guardar la cuenta vinculada" },
        { status: 500 }
      );
    }

    console.log(
      "[POST /api/riot/account/link-manual] ✅ Cuenta vinculada exitosamente"
    );

    return NextResponse.json({
      success: true,
      message: "Cuenta vinculada exitosamente",
      account: {
        puuid,
        gameName,
        tagLine,
        region,
        summonerLevel: statsData.summonerLevel,
        profileIconId: statsData.profileIconId,
        soloTier: soloRank.tier,
        soloRank: soloRank.rank,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/riot/account/link-manual] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
