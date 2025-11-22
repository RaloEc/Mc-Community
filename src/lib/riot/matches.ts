/**
 * Servicio para sincronizar y gestionar historial de partidas de League of Legends
 * Utiliza la API Match-V5 de Riot Games
 */

import { getServiceClient } from "@/lib/supabase/server";

/**
 * Mapea una región de plataforma a su región de ruteo
 * La API Match-V5 requiere regiones de ruteo, no regiones de plataforma
 *
 * @param platformRegion - Región de plataforma (ej: 'la1', 'euw1', 'kr')
 * @returns Región de ruteo (ej: 'americas', 'europe', 'asia')
 */
export function getRoutingRegion(platformRegion: string): string {
  const region = platformRegion.toLowerCase();

  // Americas
  if (["la1", "la2", "na1", "br1"].includes(region)) {
    return "americas";
  }

  // Europe
  if (["euw1", "eune1", "tr1", "ru"].includes(region)) {
    return "europe";
  }

  // Asia
  if (["kr", "jp1"].includes(region)) {
    return "asia";
  }

  // Default
  console.warn(
    `[getRoutingRegion] Región desconocida: ${platformRegion}, usando 'americas'`
  );
  return "americas";
}

/**
 * Interfaz para la respuesta de Match-V5 (Riot API usa camelCase)
 */
interface MatchData {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    gameVersion: string;
    queueId: number;
    participants: ParticipantData[];
  };
}

interface ParticipantData {
  puuid: string;
  summonerName: string;
  championId: number;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealt: number;
  goldEarned: number;
  visionScore: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  perkPrimaryStyle: number;
  perkSubStyle: number;
  summoner1Id: number;
  summoner2Id: number;
  lane: string;
  role: string;
}

/**
 * Obtiene la lista de IDs de partidas recientes desde Riot API
 */
async function getMatchIds(
  puuid: string,
  routingRegion: string,
  apiKey: string,
  count: number = 20
): Promise<string[]> {
  try {
    console.log(
      `[getMatchIds] Obteniendo ${count} IDs de partidas para ${puuid}`
    );

    const url = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
    console.log(`[getMatchIds] URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        "X-Riot-Token": apiKey,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[getMatchIds] Error de Riot: ${response.status}`);
      console.error(`[getMatchIds] Response body:`, errorBody);
      return [];
    }

    const matchIds = await response.json();
    console.log(
      `[getMatchIds] ✅ Obtenidos ${matchIds.length} IDs de partidas`
    );
    return matchIds;
  } catch (error: any) {
    console.error("[getMatchIds] Error:", error.message);
    return [];
  }
}

/**
 * Obtiene los detalles completos de una partida desde Riot API
 */
async function getMatchDetails(
  matchId: string,
  routingRegion: string,
  apiKey: string
): Promise<MatchData | null> {
  try {
    const url = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;

    const response = await fetch(url, {
      headers: {
        "X-Riot-Token": apiKey,
      },
    });

    if (!response.ok) {
      console.error(
        `[getMatchDetails] Error para ${matchId}: ${response.status}`
      );
      return null;
    }

    const matchData = await response.json();
    return matchData;
  } catch (error: any) {
    console.error(`[getMatchDetails] Error para ${matchId}:`, error.message);
    return null;
  }
}

/**
 * Verifica si una partida ya existe en la base de datos
 */
async function matchExists(matchId: string): Promise<boolean> {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("matches")
      .select("match_id")
      .eq("match_id", matchId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[matchExists] Error:", error.message);
      return false;
    }

    return !!data;
  } catch (error: any) {
    console.error("[matchExists] Error:", error.message);
    return false;
  }
}

/**
 * Guarda una partida y sus participantes en la base de datos
 */
async function saveMatch(matchData: MatchData): Promise<boolean> {
  try {
    const supabase = getServiceClient();
    // Riot API devuelve camelCase: matchId
    const matchId = matchData?.metadata?.matchId;

    if (!matchId) {
      console.error(
        "[saveMatch] Error: matchId no encontrado en matchData. Estructura recibida:",
        JSON.stringify(matchData, null, 2)
      );
      return false;
    }

    // Guardar información general de la partida
    // Mapeamos de camelCase (API) a snake_case (DB)
    const { error: matchError } = await supabase.from("matches").insert({
      match_id: matchId,
      data_version: matchData.metadata.dataVersion,
      game_creation: matchData.info.gameCreation,
      game_duration: matchData.info.gameDuration,
      game_mode: matchData.info.gameMode,
      queue_id: matchData.info.queueId,
      full_json: matchData,
    });

    if (matchError) {
      console.error("[saveMatch] Error al guardar match:", matchError.message);
      return false;
    }

    // Guardar participantes
    const participants = matchData.info.participants.map((p) => ({
      match_id: matchId,
      puuid: p.puuid,
      summoner_name: p.summonerName,
      champion_id: p.championId,
      champion_name: p.championName,
      win: p.win,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      kda:
        p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists) / p.deaths,
      total_damage_dealt: p.totalDamageDealt,
      gold_earned: p.goldEarned,
      vision_score: p.visionScore,
      item0: p.item0,
      item1: p.item1,
      item2: p.item2,
      item3: p.item3,
      item4: p.item4,
      item5: p.item5,
      item6: p.item6,
      summoner1_id: p.summoner1Id,
      summoner2_id: p.summoner2Id,
      perk_primary_style: p.perkPrimaryStyle,
      perk_sub_style: p.perkSubStyle,
      lane: p.lane,
      role: p.role,
    }));

    const { error: participantsError } = await supabase
      .from("match_participants")
      .insert(participants);

    if (participantsError) {
      console.error(
        "[saveMatch] Error al guardar participantes:",
        participantsError.message
      );
      return false;
    }

    console.log(`[saveMatch] ✅ Partida ${matchId} guardada exitosamente`);
    return true;
  } catch (error: any) {
    console.error("[saveMatch] Error:", error.message);
    return false;
  }
}

/**
 * Sincroniza el historial de partidas de un jugador
 * Descarga solo las partidas nuevas que no existan en la BD
 *
 * @param puuid - PUUID del jugador
 * @param platformRegion - Región de plataforma (ej: 'la1')
 * @param apiKey - API Key de Riot
 * @param count - Número de partidas a sincronizar (default: 20)
 * @returns Resumen de la sincronización
 */
export async function syncMatchHistory(
  puuid: string,
  platformRegion: string,
  apiKey: string,
  count: number = 20
): Promise<{
  success: boolean;
  newMatches: number;
  totalMatches: number;
  error?: string;
}> {
  try {
    console.log(`[syncMatchHistory] Iniciando sincronización para ${puuid}`);

    // Obtener región de ruteo
    const routingRegion = getRoutingRegion(platformRegion);
    console.log(`[syncMatchHistory] Región de ruteo: ${routingRegion}`);

    // Obtener IDs de partidas recientes
    const matchIds = await getMatchIds(puuid, routingRegion, apiKey, count);

    if (matchIds.length === 0) {
      return {
        success: false,
        newMatches: 0,
        totalMatches: 0,
        error: "No se obtuvieron IDs de partidas",
      };
    }

    console.log(
      `[syncMatchHistory] Verificando ${matchIds.length} partidas...`
    );

    // Filtrar partidas que ya existen
    let newMatchCount = 0;
    const matchesToDownload: string[] = [];

    for (const matchId of matchIds) {
      const exists = await matchExists(matchId);
      if (!exists) {
        matchesToDownload.push(matchId);
      }
    }

    console.log(
      `[syncMatchHistory] ${matchesToDownload.length} partidas nuevas para descargar`
    );

    // Descargar y guardar partidas nuevas
    for (const matchId of matchesToDownload) {
      const matchData = await getMatchDetails(matchId, routingRegion, apiKey);

      if (matchData) {
        const saved = await saveMatch(matchData);
        if (saved) {
          newMatchCount++;
        }
      }

      // Pequeño delay para no saturar la API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `[syncMatchHistory] ✅ Sincronización completada: ${newMatchCount} partidas nuevas`
    );

    return {
      success: true,
      newMatches: newMatchCount,
      totalMatches: matchIds.length,
    };
  } catch (error: any) {
    console.error("[syncMatchHistory] Error:", error.message);
    return {
      success: false,
      newMatches: 0,
      totalMatches: 0,
      error: error.message,
    };
  }
}

/**
 * Obtiene el historial de partidas de un jugador desde la BD
 *
 * @param puuid - PUUID del jugador
 * @param limit - Número máximo de partidas a retornar (default: 10)
 * @returns Array de partidas con información del jugador
 */
export async function getMatchHistory(
  puuid: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("match_participants")
      .select(
        `
        id,
        match_id,
        puuid,
        summoner_name,
        champion_id,
        champion_name,
        win,
        kills,
        deaths,
        assists,
        kda,
        total_damage_dealt,
        gold_earned,
        vision_score,
        item0,
        item1,
        item2,
        item3,
        item4,
        item5,
        item6,
        summoner1_id,
        summoner2_id,
        perk_primary_style,
        perk_sub_style,
        lane,
        role,
        created_at,
        matches (
          match_id,
          game_creation,
          game_duration,
          game_mode,
          queue_id
        )
      `
      )
      .eq("puuid", puuid)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getMatchHistory] Error:", error.message);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error("[getMatchHistory] Error:", error.message);
    return [];
  }
}

/**
 * Obtiene estadísticas agregadas de un jugador
 *
 * @param puuid - PUUID del jugador
 * @param limit - Número de partidas a considerar (default: 20)
 * @returns Estadísticas agregadas
 */
export async function getPlayerStats(
  puuid: string,
  limit: number = 20
): Promise<{
  totalGames: number;
  wins: number;
  losses: number;
  winrate: number;
  avgKda: number;
  avgDamage: number;
  avgGold: number;
}> {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("match_participants")
      .select("win, kda, total_damage_dealt, gold_earned")
      .eq("puuid", puuid)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winrate: 0,
        avgKda: 0,
        avgDamage: 0,
        avgGold: 0,
      };
    }

    const wins = data.filter((d) => d.win).length;
    const losses = data.length - wins;
    const avgKda = data.reduce((sum, d) => sum + (d.kda || 0), 0) / data.length;
    const avgDamage =
      data.reduce((sum, d) => sum + (d.total_damage_dealt || 0), 0) /
      data.length;
    const avgGold =
      data.reduce((sum, d) => sum + (d.gold_earned || 0), 0) / data.length;

    return {
      totalGames: data.length,
      wins,
      losses,
      winrate: Math.round((wins / data.length) * 100),
      avgKda: Math.round(avgKda * 100) / 100,
      avgDamage: Math.round(avgDamage),
      avgGold: Math.round(avgGold),
    };
  } catch (error: any) {
    console.error("[getPlayerStats] Error:", error.message);
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winrate: 0,
      avgKda: 0,
      avgDamage: 0,
      avgGold: 0,
    };
  }
}
