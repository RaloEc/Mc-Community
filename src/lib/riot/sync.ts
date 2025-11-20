/**
 * Sincronización de estadísticas de Riot Games
 *
 * Este módulo obtiene información actualizada del jugador desde la API de Riot
 * incluyendo: shard activo, nivel, ícono, rango, puntos de liga, etc.
 */

import { RiotRegion, PLATFORM_TO_ROUTING_REGION } from "@/types/riot";

export interface RiotSyncResult {
  success: boolean;
  data?: {
    activeShard: string;
    summonerId: string;
    summonerLevel: number;
    profileIconId: number;
    tier: string;
    rank: string | null;
    leaguePoints: number;
    wins: number;
    losses: number;
  };
  error?: string;
}

/**
 * Sincroniza las estadísticas del jugador desde la API de Riot
 *
 * Proceso:
 * 1. Detecta el shard activo (región exacta)
 * 2. Obtiene datos del invocador (nivel, ícono)
 * 3. Obtiene información de rango (tier, rank, LP, W/L)
 * 4. Retorna toda la información
 *
 * @param puuid - PUUID del jugador
 * @param accessToken - Access token de Riot RSO
 * @param routingRegion - Región de enrutamiento (americas, europe, asia, sea)
 * @returns Resultado con datos sincronizados o error
 */
export async function syncRiotStats(
  puuid: string,
  accessToken: string,
  routingRegion: string = "americas"
): Promise<RiotSyncResult> {
  try {
    console.log("[syncRiotStats] Iniciando sincronización de estadísticas...");
    console.log("[syncRiotStats] PUUID:", puuid, "Región:", routingRegion);

    // PASO 1: Detectar shard activo
    console.log("[syncRiotStats] PASO 1: Detectando shard activo...");
    const activeShard = await detectActiveShard(puuid, routingRegion);

    if (!activeShard) {
      throw new Error("No se pudo detectar el shard activo");
    }

    console.log("[syncRiotStats] ✅ Shard detectado:", activeShard);

    // PASO 2: Obtener datos del invocador
    console.log("[syncRiotStats] PASO 2: Obteniendo datos del invocador...");
    const summonerData = await getSummonerData(puuid, activeShard);

    if (!summonerData) {
      throw new Error("No se pudo obtener datos del invocador");
    }

    console.log("[syncRiotStats] ✅ Datos del invocador obtenidos:", {
      summonerId: summonerData.id,
      level: summonerData.summonerLevel,
      icon: summonerData.profileIconId,
    });

    // PASO 3: Obtener información de rango
    console.log("[syncRiotStats] PASO 3: Obteniendo información de rango...");
    const rankData = await getRankData(summonerData.id, activeShard);

    console.log("[syncRiotStats] ✅ Información de rango obtenida:", {
      tier: rankData.tier,
      rank: rankData.rank,
      lp: rankData.leaguePoints,
    });

    // PASO 4: Compilar resultado
    const result: RiotSyncResult = {
      success: true,
      data: {
        activeShard,
        summonerId: summonerData.id,
        summonerLevel: summonerData.summonerLevel,
        profileIconId: summonerData.profileIconId,
        tier: rankData.tier,
        rank: rankData.rank,
        leaguePoints: rankData.leaguePoints,
        wins: rankData.wins,
        losses: rankData.losses,
      },
    };

    console.log("[syncRiotStats] ✅ Sincronización completada exitosamente");
    return result;
  } catch (error: any) {
    console.error("[syncRiotStats] Error durante sincronización:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Detecta el shard activo (región exacta) del jugador
 *
 * Consulta: https://{routingRegion}.api.riotgames.com/riot/account/v1/active-shards/by-game/lol/by-puuid/{puuid}
 *
 * @param puuid - PUUID del jugador
 * @param routingRegion - Región de enrutamiento
 * @returns Shard activo (ej: 'la1', 'euw1', 'kr')
 */
async function detectActiveShard(
  puuid: string,
  routingRegion: string
): Promise<string | null> {
  try {
    const url = `https://${routingRegion}.api.riotgames.com/riot/account/v1/active-shards/by-game/lol/by-puuid/${puuid}`;

    console.log("[detectActiveShard] Consultando:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.RIOT_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[detectActiveShard] Error de Riot:", error);
      throw new Error(error.status?.message || "Failed to detect active shard");
    }

    const data = await response.json();
    console.log("[detectActiveShard] Respuesta:", data);

    return data.activeShard || null;
  } catch (error: any) {
    console.error("[detectActiveShard] Error:", error);
    throw error;
  }
}

/**
 * Obtiene datos del invocador (nivel, ícono, ID)
 *
 * Consulta: https://{activeShard}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}
 *
 * @param puuid - PUUID del jugador
 * @param activeShard - Shard activo
 * @returns Datos del invocador
 */
async function getSummonerData(
  puuid: string,
  activeShard: string
): Promise<{
  id: string;
  summonerLevel: number;
  profileIconId: number;
} | null> {
  try {
    const url = `https://${activeShard}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;

    console.log("[getSummonerData] Consultando:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.RIOT_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[getSummonerData] Error de Riot:", error);
      throw new Error(error.status?.message || "Failed to get summoner data");
    }

    const data = await response.json();
    console.log("[getSummonerData] Respuesta:", {
      id: data.id,
      level: data.summonerLevel,
      icon: data.profileIconId,
    });

    return {
      id: data.id,
      summonerLevel: data.summonerLevel,
      profileIconId: data.profileIconId,
    };
  } catch (error: any) {
    console.error("[getSummonerData] Error:", error);
    throw error;
  }
}

/**
 * Obtiene información de rango del jugador
 *
 * Consulta: https://{activeShard}.api.riotgames.com/lol/league/v4/entries/by-summoner/{summonerId}
 *
 * Filtra por queueType === 'RANKED_SOLO_5x5'
 * Si no hay datos de rango, retorna UNRANKED
 *
 * @param summonerId - ID encriptado del invocador
 * @param activeShard - Shard activo
 * @returns Información de rango
 */
async function getRankData(
  summonerId: string,
  activeShard: string
): Promise<{
  tier: string;
  rank: string | null;
  leaguePoints: number;
  wins: number;
  losses: number;
}> {
  try {
    const url = `https://${activeShard}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;

    console.log("[getRankData] Consultando:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.RIOT_API_KEY}`,
      },
    });

    // Si el usuario no tiene datos de rango (404), retorna UNRANKED
    if (response.status === 404) {
      console.log(
        "[getRankData] Usuario sin datos de rango (404) - Retornando UNRANKED"
      );
      return {
        tier: "UNRANKED",
        rank: null,
        leaguePoints: 0,
        wins: 0,
        losses: 0,
      };
    }

    if (!response.ok) {
      const error = await response.json();
      console.error("[getRankData] Error de Riot:", error);
      throw new Error(error.status?.message || "Failed to get rank data");
    }

    const data = await response.json();
    console.log("[getRankData] Respuesta completa:", data);

    // Filtrar por RANKED_SOLO_5x5
    const soloRankData = data.find(
      (entry: any) => entry.queueType === "RANKED_SOLO_5x5"
    );

    if (!soloRankData) {
      console.log(
        "[getRankData] No hay datos de RANKED_SOLO_5x5 - Retornando UNRANKED"
      );
      return {
        tier: "UNRANKED",
        rank: null,
        leaguePoints: 0,
        wins: 0,
        losses: 0,
      };
    }

    console.log("[getRankData] Datos de RANKED_SOLO_5x5:", {
      tier: soloRankData.tier,
      rank: soloRankData.rank,
      lp: soloRankData.leaguePoints,
      wins: soloRankData.wins,
      losses: soloRankData.losses,
    });

    return {
      tier: soloRankData.tier,
      rank: soloRankData.rank,
      leaguePoints: soloRankData.leaguePoints,
      wins: soloRankData.wins,
      losses: soloRankData.losses,
    };
  } catch (error: any) {
    console.error("[getRankData] Error:", error);

    // Si hay error, retorna UNRANKED como fallback
    console.log(
      "[getRankData] Error al obtener datos de rango - Retornando UNRANKED"
    );
    return {
      tier: "UNRANKED",
      rank: null,
      leaguePoints: 0,
      wins: 0,
      losses: 0,
    };
  }
}

/**
 * Determina la región de enrutamiento basada en el shard
 *
 * @param activeShard - Shard activo (ej: 'la1', 'euw1', 'kr')
 * @returns Región de enrutamiento (ej: 'americas', 'europe', 'asia')
 */
export function getRoutingRegionFromShard(activeShard: string): string {
  const regionMap: Record<string, string> = {
    la1: "americas",
    la2: "americas",
    br1: "americas",
    na1: "americas",
    euw1: "europe",
    eun1: "europe",
    kr: "asia",
    ru: "europe",
    tr1: "europe",
    jp1: "asia",
    vn2: "sea",
    ph2: "sea",
    sg2: "sea",
    th2: "sea",
  };

  return regionMap[activeShard] || "americas";
}
