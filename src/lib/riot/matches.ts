/**
 * Servicio para sincronizar y gestionar historial de partidas de League of Legends
 * Utiliza la API Match-V5 de Riot Games
 */

import { getServiceClient } from "@/lib/supabase/server";
import {
  updateMatchRankings,
  getOrUpdateSummonerRank,
} from "@/lib/riot/league";

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_BACKFILL_BATCH_SIZE = 50;
const MAX_BACKFILL_BATCHES = 10;
const API_REQUEST_DELAY_MS = 120;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface MatchCreationRow {
  matches?: {
    game_creation?: number | null;
  } | null;
}

interface SyncMatchHistoryOptions {
  ensureWeeks?: number;
}

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
  summonerId: string;
  summonerLevel: number;
  championId: number;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  damageDealtToBuildings: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  damageSelfMitigated: number;
  goldEarned: number;
  totalDamageTaken: number;
  totalHeal: number;
  visionScore: number;
  detectorWardsPlaced: number;
  wardsKilled: number;
  wardsPlaced: number;
  totalTimeCCDealt: number;
  totalTimeSpentDead: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  totalAllyJungleMinionsKilled: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  perks?: {
    styles?: Array<{
      style?: number;
      description?: string;
    }>;
  };
  riotIdGameName?: string;
  riotIdTagline?: string; // ← Lowercase 'l'
  summoner1Id: number;
  summoner2Id: number;
  lane: string;
  role: string;
  pentaKills: number;
  quadraKills: number;
  assistMePings?: number;
  dangerPings?: number;
  commandPings?: number;
  allInPings?: number;
  baitPings?: number;
  basicPings?: number;
  enemyMissingPings?: number;
  enemyVisionPings?: number;
  getBackPings?: number;
  holdPings?: number;
  needVisionPings?: number;
  onMyWayPings?: number;
  pushPings?: number;
  visionClearedPings?: number;
}

/**
 * Obtiene la lista de IDs de partidas recientes desde Riot API
 */
interface GetMatchIdsParams {
  puuid: string;
  routingRegion: string;
  apiKey: string;
  start?: number;
  count?: number;
  startTime?: number;
  endTime?: number;
}

async function getMatchIds({
  puuid,
  routingRegion,
  apiKey,
  start = 0,
  count = 20,
  startTime,
  endTime,
}: GetMatchIdsParams): Promise<string[]> {
  try {
    console.log(
      `[getMatchIds] Obteniendo ${count} IDs de partidas para ${puuid} (start=${start}, startTime=${startTime})`
    );

    const params = new URLSearchParams();
    params.set("start", Math.max(0, start).toString());
    params.set("count", Math.max(1, Math.min(count, 100)).toString());

    if (typeof startTime === "number" && !Number.isNaN(startTime)) {
      params.set("startTime", Math.max(0, Math.floor(startTime)).toString());
    }

    if (typeof endTime === "number" && !Number.isNaN(endTime)) {
      params.set("endTime", Math.max(0, Math.floor(endTime)).toString());
    }

    const url = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?${params.toString()}`;
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

async function filterExistingMatchIds(matchIds: string[]): Promise<string[]> {
  if (matchIds.length === 0) {
    return [];
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("matches")
      .select("match_id")
      .in("match_id", matchIds);

    if (error) {
      console.error("[filterExistingMatchIds] Error:", error.message);
      return matchIds;
    }

    const existing = new Set((data || []).map((row: any) => row.match_id));
    return matchIds.filter((id) => !existing.has(id));
  } catch (error: any) {
    console.error("[filterExistingMatchIds] Error:", error.message);
    return matchIds;
  }
}

async function getMatchCreationBoundary(
  puuid: string,
  ascending: boolean
): Promise<number | null> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("match_participants")
      .select("matches!inner(game_creation)")
      .eq("puuid", puuid)
      .order("matches(game_creation)", {
        ascending,
      })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0] as MatchCreationRow;
    return row?.matches?.game_creation ?? null;
  } catch (error: any) {
    console.error("[getMatchCreationBoundary] Error:", error.message);
    return null;
  }
}

async function getLatestMatchCreation(puuid: string) {
  return getMatchCreationBoundary(puuid, false);
}

async function getOldestMatchCreation(puuid: string) {
  return getMatchCreationBoundary(puuid, true);
}

async function ensureHistoricalCoverage(
  puuid: string,
  routingRegion: string,
  apiKey: string,
  ensureWeeks: number
): Promise<number> {
  if (!ensureWeeks || ensureWeeks <= 0) {
    return 0;
  }

  const threshold = Date.now() - ensureWeeks * WEEK_IN_MS;
  let batches = 0;
  let start = 0;
  let backfilledMatches = 0;

  while (batches < MAX_BACKFILL_BATCHES) {
    const oldestMatch = await getOldestMatchCreation(puuid);
    if (oldestMatch && oldestMatch <= threshold) {
      break;
    }

    const matchIds = await getMatchIds({
      puuid,
      routingRegion,
      apiKey,
      start,
      count: DEFAULT_BACKFILL_BATCH_SIZE,
    });

    if (matchIds.length === 0) {
      break;
    }

    const matchesToDownload = await filterExistingMatchIds(matchIds);

    if (matchesToDownload.length === 0) {
      start += DEFAULT_BACKFILL_BATCH_SIZE;
      batches++;
      continue;
    }

    for (const matchId of matchesToDownload) {
      const matchData = await getMatchDetails(matchId, routingRegion, apiKey);
      if (matchData) {
        const saved = await saveMatch(matchData);
        if (saved) {
          backfilledMatches++;
        }
      }

      await delay(API_REQUEST_DELAY_MS);
    }

    start += DEFAULT_BACKFILL_BATCH_SIZE;
    batches++;
  }

  return backfilledMatches;
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
      summoner_id: p.summonerId,
      summoner_level: p.summonerLevel,
      summoner_name: p.riotIdGameName || p.summonerName || "Unknown",
      champion_id: p.championId,
      champion_name: p.championName,
      win: p.win,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      kda:
        p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists) / p.deaths,
      total_damage_dealt: p.totalDamageDealt,
      total_damage_dealt_to_champions: p.totalDamageDealtToChampions,
      damage_dealt_to_buildings: p.damageDealtToBuildings,
      damage_dealt_to_objectives: p.damageDealtToObjectives,
      damage_dealt_to_turrets: p.damageDealtToTurrets,
      damage_self_mitigated: p.damageSelfMitigated,
      gold_earned: p.goldEarned,
      total_damage_taken: p.totalDamageTaken,
      total_heal: p.totalHeal,
      vision_score: p.visionScore,
      detector_wards_placed: p.detectorWardsPlaced,
      wards_killed: p.wardsKilled,
      wards_placed: p.wardsPlaced,
      total_time_cc_dealt: p.totalTimeCCDealt,
      total_time_spent_dead: p.totalTimeSpentDead,
      total_minions_killed: p.totalMinionsKilled,
      neutral_minions_killed: p.neutralMinionsKilled,
      total_ally_jungle_minions_killed: p.totalAllyJungleMinionsKilled,
      item0: p.item0,
      item1: p.item1,
      item2: p.item2,
      item3: p.item3,
      item4: p.item4,
      item5: p.item5,
      item6: p.item6,
      summoner1_id: p.summoner1Id,
      summoner2_id: p.summoner2Id,
      perk_primary_style: p.perks?.styles?.[0]?.style ?? null,
      perk_sub_style: p.perks?.styles?.[1]?.style ?? null,
      lane: p.lane,
      role: p.role,
      penta_kills: p.pentaKills,
      quadra_kills: p.quadraKills,
      assist_me_pings: p.assistMePings ?? 0,
      danger_pings: p.dangerPings ?? 0,
      command_pings: p.commandPings ?? 0,
      all_in_pings: p.allInPings ?? 0,
      bait_pings: p.baitPings ?? 0,
      basic_pings: p.basicPings ?? 0,
      enemy_missing_pings: p.enemyMissingPings ?? 0,
      enemy_vision_pings: p.enemyVisionPings ?? 0,
      get_back_pings: p.getBackPings ?? 0,
      hold_pings: p.holdPings ?? 0,
      need_vision_pings: p.needVisionPings ?? 0,
      on_my_way_pings: p.onMyWayPings ?? 0,
      push_pings: p.pushPings ?? 0,
      vision_cleared_pings: p.visionClearedPings ?? 0,
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

    // Guardar snapshots de ranking para cada participante usando caché
    console.log(
      `[saveMatch] Obteniendo rankings desde caché para ${matchId}...`
    );

    const platformRegion = "la1"; // Default, se puede mejorar pasándolo como parámetro
    const apiKey = process.env.RIOT_API_KEY;

    if (!apiKey) {
      console.warn("[saveMatch] RIOT_API_KEY no está configurada");
    }

    const rankSnapshots: any[] = [];

    // Procesar cada participante para obtener su rango actual desde caché o Riot API
    for (const participant of matchData.info.participants) {
      if (!participant.summonerId || !participant.puuid) {
        continue;
      }

      let rankData = null;

      // Obtener rango desde caché o actualizar desde Riot API
      if (apiKey) {
        rankData = await getOrUpdateSummonerRank(
          participant.puuid,
          platformRegion,
          apiKey
        );
      }

      rankSnapshots.push({
        match_id: matchId,
        puuid: participant.puuid,
        summoner_id: participant.summonerId,
        queue_type: "RANKED_SOLO_5x5",
        tier: rankData?.tier || null,
        rank: rankData?.rank || null,
        league_points: rankData?.league_points || 0,
        wins: rankData?.wins || 0,
        losses: rankData?.losses || 0,
      });

      // Pequeño delay para no saturar
      await delay(100);
    }

    if (rankSnapshots.length > 0) {
      const { error: rankError } = await supabase
        .from("match_participant_ranks")
        .insert(rankSnapshots);

      if (rankError) {
        console.warn(
          "[saveMatch] Advertencia al guardar ranks (no crítico):",
          rankError.message
        );
      } else {
        console.log(
          `[saveMatch] ✅ ${rankSnapshots.length} snapshots de ranking guardados`
        );
      }
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
  count: number = 20,
  options: SyncMatchHistoryOptions = {}
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

    const { ensureWeeks = 3 } = options;

    const latestMatchCreation = await getLatestMatchCreation(puuid);
    const startTime =
      typeof latestMatchCreation === "number"
        ? Math.floor(latestMatchCreation / 1000) + 1
        : undefined;

    // Obtener IDs de partidas recientes posteriores a la última guardada
    const matchIds = await getMatchIds({
      puuid,
      routingRegion,
      apiKey,
      count,
      startTime,
    });

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
    const matchesToDownload = await filterExistingMatchIds(matchIds);

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
      await delay(API_REQUEST_DELAY_MS);
    }

    const backfilledMatches = await ensureHistoricalCoverage(
      puuid,
      routingRegion,
      apiKey,
      ensureWeeks
    );

    const totalSynced = newMatchCount + backfilledMatches;

    console.log(
      `[syncMatchHistory] ✅ Sincronización completada: ${totalSynced} partidas nuevas (recientes: ${newMatchCount}, backfill: ${backfilledMatches})`
    );

    return {
      success: true,
      newMatches: totalSynced,
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
 * @param options.limit - Número máximo de partidas a retornar (default: 10)
 * @param options.cursor - Timestamp (game_creation) para paginación descendente
 * @param options.queueIds - Lista de colas permitidas (queue_id)
 * @returns Partidas y metadatos de paginación
 */
export async function getMatchHistory(
  puuid: string,
  options:
    | number
    | { limit?: number; cursor?: number | null; queueIds?: number[] } = {}
): Promise<{
  matches: any[];
  hasMore: boolean;
  nextCursor: number | null;
}> {
  try {
    const supabase = getServiceClient();
    const normalizedOptions =
      typeof options === "number" ? { limit: options } : options ?? {};
    const limit = normalizedOptions.limit ?? 10;
    const cursor = Number.isFinite(normalizedOptions.cursor ?? null)
      ? Number(normalizedOptions.cursor)
      : null;
    const queueIds = normalizedOptions.queueIds;

    let query = supabase
      .from("match_participants")
      .select(
        `
        id,
        match_id,
        puuid,
        summoner_name,
        summoner_id,
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
        matches!inner (
          match_id,
          game_creation,
          game_duration,
          game_mode,
          queue_id,
          full_json
        )
      `
      )
      .eq("puuid", puuid);

    if (queueIds && queueIds.length > 0) {
      query = query.in("matches.queue_id", queueIds);
    }

    // Aplicar filtro de cursor para paginación (obtener partidas más antiguas)
    if (cursor) {
      query = query.filter("matches.game_creation", "lt", cursor);
    }

    const { data, error } = await query
      .order("matches(game_creation)", {
        ascending: false,
      })
      .limit(limit + 1);

    if (error) {
      console.error("[getMatchHistory] Error:", error.message);
      return { matches: [], hasMore: false, nextCursor: null };
    }

    // Debug logging
    if (data && data.length > 0) {
      console.log("[getMatchHistory] Primera partida:", {
        match_id: data[0].match_id,
        game_creation: data[0].matches?.game_creation,
        game_time: new Date(data[0].matches?.game_creation).toISOString(),
      });
      console.log("[getMatchHistory] Última partida:", {
        match_id: data[data.length - 1].match_id,
        game_creation: data[data.length - 1].matches?.game_creation,
        game_time: new Date(
          data[data.length - 1].matches?.game_creation
        ).toISOString(),
      });
    }

    // Obtener rankings para todas las partidas
    const matchIds = (data || []).map((p: any) => p.match_id);
    let rankingMap = new Map();

    if (matchIds.length > 0) {
      const { data: rankings, error: rankingsError } = await supabase
        .from("match_participant_ranks")
        .select(
          "summoner_id, match_id, tier, rank, league_points, wins, losses"
        )
        .in("match_id", matchIds);

      if (!rankingsError && rankings) {
        // Crear mapa con clave "summoner_id-match_id"
        rankingMap = new Map(
          rankings.map((r: any) => [`${r.summoner_id}-${r.match_id}`, r])
        );
      }
    }

    // Mapear datos de ranking
    const enrichedData = (data || []).map((p: any) => {
      const rankData = rankingMap.get(`${p.summoner_id}-${p.match_id}`) as any;
      return {
        ...p,
        tier: rankData?.tier || null,
        rank: rankData?.rank || null,
        league_points: rankData?.league_points || 0,
        wins: rankData?.wins || 0,
        losses: rankData?.losses || 0,
      };
    });

    const hasMore = enrichedData.length > limit;
    const matches = hasMore ? enrichedData.slice(0, limit) : enrichedData;
    const nextCursor = hasMore
      ? matches[matches.length - 1]?.matches?.game_creation || null
      : null;

    return { matches, hasMore, nextCursor };
  } catch (error: any) {
    console.error("[getMatchHistory] Error:", error.message);
    return { matches: [], hasMore: false, nextCursor: null };
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
  options: number | { limit?: number; queueIds?: number[] } = {}
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
    const normalizedOptions =
      typeof options === "number" ? { limit: options } : options ?? {};
    const limit = normalizedOptions.limit ?? 20;
    const queueIds = normalizedOptions.queueIds;

    let query = supabase
      .from("match_participants")
      .select(
        `win, kda, total_damage_dealt, gold_earned, matches!inner(queue_id)`
      )
      .eq("puuid", puuid)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (queueIds && queueIds.length > 0) {
      query = query.in("matches.queue_id", queueIds);
    }

    const { data, error } = await query;

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

/**
 * Obtiene los detalles completos de una partida incluyendo participantes desde la BD
 *
 * @param matchId - ID de la partida (ej: LA1_12345)
 * @returns Datos de la partida y participantes
 */
export async function getMatchById(matchId: string): Promise<{
  match: any;
  participants: any[];
} | null> {
  try {
    const supabase = getServiceClient();

    // Obtener datos de la partida
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("match_id", matchId)
      .single();

    if (matchError || !match) {
      console.error(
        "[getMatchById] Error al obtener match:",
        matchError?.message
      );
      return null;
    }

    // Obtener participantes
    const { data: participants, error: participantsError } = await supabase
      .from("match_participants")
      .select("*")
      .eq("match_id", matchId)
      // Ordenar por victoria (agrupa equipos) y luego por rol
      .order("win", { ascending: false })
      .order("role", { ascending: true });

    if (participantsError) {
      console.error(
        "[getMatchById] Error al obtener participantes:",
        participantsError.message
      );
      return { match, participants: [] };
    }

    // Obtener rankings por separado (si existen)
    const { data: rankings, error: rankingsError } = await supabase
      .from("match_participant_ranks")
      .select("summoner_id, tier, rank, league_points, wins, losses")
      .eq("match_id", matchId);

    if (rankingsError) {
      console.warn(
        "[getMatchById] Advertencia al obtener rankings:",
        rankingsError.message
      );
    }

    // Mapear los datos de ranking al nivel superior para facilitar acceso
    const rankingMap = new Map(
      (rankings || []).map((r: any) => [r.summoner_id, r])
    );

    const participantsWithRanks = (participants || []).map((p: any) => {
      const rankData = rankingMap.get(p.summoner_id) as any;
      return {
        ...p,
        tier: rankData?.tier || null,
        rank: rankData?.rank || null,
        league_points: rankData?.league_points || 0,
        wins: rankData?.wins || 0,
        losses: rankData?.losses || 0,
      };
    });

    return { match, participants: participantsWithRanks };
  } catch (error: any) {
    console.error("[getMatchById] Error:", error.message);
    return null;
  }
}

/**
 * Obtiene la línea de tiempo de una partida desde Riot API
 * (No se guarda en BD por ahora, caché simple en memoria/Next.js)
 *
 * @param matchId - ID de la partida
 * @param platformRegion - Región de plataforma (ej: 'la1') - Necesario para la API
 * @param apiKey - API Key de Riot
 */
export async function getMatchTimeline(
  matchId: string,
  platformRegion: string,
  apiKey: string
): Promise<any | null> {
  try {
    const routingRegion = getRoutingRegion(platformRegion);
    const url = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;

    console.log(`[getMatchTimeline] Fetching timeline for ${matchId}`);

    const response = await fetch(url, {
      headers: {
        "X-Riot-Token": apiKey,
      },
      next: { revalidate: 3600 }, // Cache por 1 hora
    });

    if (!response.ok) {
      console.error(
        `[getMatchTimeline] Error ${response.status} al obtener timeline`
      );
      return null;
    }

    return await response.json();
  } catch (error: any) {
    console.error("[getMatchTimeline] Error:", error.message);
    return null;
  }
}
