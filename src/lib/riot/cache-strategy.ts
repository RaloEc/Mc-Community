/**
 * Estrategia de Caché para Rankings de Jugadores
 *
 * Este módulo documenta la estrategia de caché implementada para optimizar
 * las consultas de ranking sin saturar la API de Riot.
 *
 * Flujo:
 * 1. saveMatch() → getOrUpdateSummonerRank() para cada participante
 * 2. getOrUpdateSummonerRank() intenta obtener del caché (tabla summoners)
 * 3. Si caché fresco (< 1h) → devuelve datos
 * 4. Si no existe o expirado → consulta Riot API y actualiza caché
 * 5. Inserta en match_participant_ranks con datos completos
 */

/**
 * Interfaz de datos de ranking en caché
 */
export interface CachedRankData {
  tier: string | null;
  rank: string | null;
  league_points: number;
  wins: number;
  losses: number;
}

/**
 * Interfaz de entrada de jugador en tabla summoners
 */
export interface SummonerCacheEntry {
  id: string;
  puuid: string;
  summoner_id?: string;
  summoner_name?: string;
  summoner_level?: number;
  tier: string | null;
  rank: string | null;
  league_points: number;
  wins: number;
  losses: number;
  rank_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interfaz de snapshot de ranking en partida
 */
export interface MatchParticipantRankSnapshot {
  id: string;
  match_id: string;
  puuid: string;
  summoner_id: string;
  queue_type: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR";
  tier: string | null;
  rank: string | null;
  league_points: number;
  wins: number;
  losses: number;
  captured_at: string;
  created_at: string;
}

/**
 * Configuración de TTL para caché
 */
export const CACHE_CONFIG = {
  // Tiempo de vida del caché en milisegundos (1 hora)
  TTL_MS: 60 * 60 * 1000,

  // Delay entre consultas a Riot API (ms)
  RIOT_API_DELAY_MS: 100,

  // Número máximo de reintentos para rate limiting
  MAX_RETRIES: 3,

  // Delay inicial para exponential backoff (ms)
  BACKOFF_INITIAL_MS: 1000,
};

/**
 * Ejemplo de uso en saveMatch():
 *
 * ```typescript
 * import { getOrUpdateSummonerRank } from '@/lib/riot/league';
 *
 * async function saveMatch(matchData: MatchData): Promise<boolean> {
 *   const rankSnapshots: MatchParticipantRankSnapshot[] = [];
 *   const apiKey = process.env.RIOT_API_KEY;
 *
 *   for (const participant of matchData.info.participants) {
 *     if (!participant.summonerId || !participant.puuid) continue;
 *
 *     // Obtiene del caché o actualiza desde Riot
 *     const rankData = await getOrUpdateSummonerRank(
 *       participant.puuid,
 *       'la1',
 *       apiKey!
 *     );
 *
 *     rankSnapshots.push({
 *       match_id: matchId,
 *       puuid: participant.puuid,
 *       summoner_id: participant.summonerId,
 *       queue_type: 'RANKED_SOLO_5x5',
 *       tier: rankData?.tier || null,
 *       rank: rankData?.rank || null,
 *       league_points: rankData?.league_points || 0,
 *       wins: rankData?.wins || 0,
 *       losses: rankData?.losses || 0,
 *     });
 *
 *     await delay(100);
 *   }
 *
 *   // Insertar todos los snapshots con datos completos
 *   const { error } = await supabase
 *     .from('match_participant_ranks')
 *     .insert(rankSnapshots);
 *
 *   return !error;
 * }
 * ```
 */

/**
 * Estadísticas de caché (para monitoreo)
 */
export interface CacheStats {
  // Número de hits (datos obtenidos del caché)
  hits: number;

  // Número de misses (consultas a Riot API)
  misses: number;

  // Tasa de hit (hits / (hits + misses))
  hitRate: number;

  // Tiempo promedio de respuesta (ms)
  avgResponseTime: number;

  // Última actualización
  lastUpdated: Date;
}

/**
 * Función helper para calcular si el caché está fresco
 *
 * @param lastUpdated - Timestamp de última actualización
 * @param ttlMs - Tiempo de vida en milisegundos
 * @returns true si el caché es fresco, false si expiró
 */
export function isCacheFresh(
  lastUpdated: string | null,
  ttlMs: number = CACHE_CONFIG.TTL_MS
): boolean {
  if (!lastUpdated) return false;

  const lastUpdateTime = new Date(lastUpdated).getTime();
  const now = Date.now();

  return now - lastUpdateTime < ttlMs;
}

/**
 * Función helper para calcular tiempo restante de caché
 *
 * @param lastUpdated - Timestamp de última actualización
 * @param ttlMs - Tiempo de vida en milisegundos
 * @returns Tiempo restante en milisegundos, o 0 si expiró
 */
export function getCacheTimeRemaining(
  lastUpdated: string | null,
  ttlMs: number = CACHE_CONFIG.TTL_MS
): number {
  if (!lastUpdated) return 0;

  const lastUpdateTime = new Date(lastUpdated).getTime();
  const now = Date.now();
  const remaining = ttlMs - (now - lastUpdateTime);

  return Math.max(0, remaining);
}

/**
 * Función helper para formatear tiempo restante de caché
 *
 * @param remainingMs - Tiempo restante en milisegundos
 * @returns String formateado (ej: "45m 30s", "5h 20m")
 */
export function formatCacheTimeRemaining(remainingMs: number): string {
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Beneficios de la estrategia de caché:
 *
 * 1. REDUCCIÓN DE LLAMADAS A RIOT API
 *    - Sin caché: ~10 llamadas por partida (10 jugadores)
 *    - Con caché: ~1-2 llamadas por partida (solo nuevos jugadores)
 *    - Ahorro: ~80% de llamadas
 *
 * 2. MEJORA DE PERFORMANCE
 *    - Consultas al caché: ~10ms
 *    - Consultas a Riot API: ~500-1000ms
 *    - Promedio con caché: ~100-200ms por partida
 *
 * 3. INTEGRIDAD DE DATOS
 *    - match_participant_ranks siempre tiene datos completos
 *    - Histórico de rankings preservado
 *    - Sin operaciones en background (predecible)
 *
 * 4. ESCALABILIDAD
 *    - Soporta múltiples instancias
 *    - Caché compartido en Supabase
 *    - TTL automático evita datos obsoletos
 *
 * 5. RESPETO A RATE LIMITS
 *    - Exponential backoff para 429
 *    - Delay entre consultas
 *    - Reintentos automáticos
 */

/**
 * Monitoreo y debugging:
 *
 * Logs esperados en saveMatch():
 *
 * [getOrUpdateSummonerRank] Consultando Riot API para puuid123...
 * [getOrUpdateSummonerRank] ✅ Caché actualizado para puuid123...: GOLD II
 * [saveMatch] ✅ 10 snapshots de ranking guardados
 * [saveMatch] ✅ Partida LA1_match123 guardada exitosamente
 *
 * Segunda partida del mismo jugador:
 *
 * [getOrUpdateSummonerRank] Usando caché para puuid123...: GOLD II
 * [saveMatch] ✅ 10 snapshots de ranking guardados
 *
 * Queries útiles en Supabase:
 *
 * -- Ver caché de jugador
 * SELECT * FROM summoners WHERE puuid = 'puuid123';
 *
 * -- Ver snapshots de partida
 * SELECT * FROM match_participant_ranks WHERE match_id = 'LA1_match123';
 *
 * -- Ver caché expirado
 * SELECT * FROM summoners
 * WHERE rank_updated_at < NOW() - INTERVAL '1 hour';
 *
 * -- Estadísticas de caché
 * SELECT
 *   COUNT(*) as total_summoners,
 *   COUNT(CASE WHEN rank_updated_at > NOW() - INTERVAL '1 hour' THEN 1 END) as fresh_cache,
 *   COUNT(CASE WHEN rank_updated_at IS NULL THEN 1 END) as never_cached
 * FROM summoners;
 */
