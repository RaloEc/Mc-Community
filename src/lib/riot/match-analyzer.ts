/**
 * Analizador de partidas para generar etiquetas/badges automáticas
 * Utiliza lógica matemática simple (sin IA)
 */

export type MatchTag = "MVP" | "Stomper" | "Muralla" | "Farmeador";

export interface MatchTagInfo {
  tag: MatchTag;
  color: string;
  label: string;
  description: string;
}

/**
 * Mapeo de tags a información visual
 */
const TAG_INFO: Record<MatchTag, MatchTagInfo> = {
  MVP: {
    tag: "MVP",
    color: "bg-yellow-500 text-yellow-900",
    label: "MVP",
    description: "KDA excepcional",
  },
  Stomper: {
    tag: "Stomper",
    color: "bg-red-600 text-red-50",
    label: "Stomper",
    description: "Victoria rápida",
  },
  Muralla: {
    tag: "Muralla",
    color: "bg-slate-600 text-slate-50",
    label: "Muralla",
    description: "Defensa sólida",
  },
  Farmeador: {
    tag: "Farmeador",
    color: "bg-amber-500 text-amber-900",
    label: "Farmeador",
    description: "CS excelente",
  },
};

/**
 * Analiza una partida y retorna un array de tags
 *
 * @param stats - Estadísticas de la partida
 * @returns Array de tags aplicables
 */
export function analyzeMatchTags(stats: {
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  gameDuration: number;
  totalDamageDealt: number;
  goldEarned: number;
  championLevel?: number;
}): MatchTag[] {
  const tags: MatchTag[] = [];

  // Calcular KDA
  const kda =
    stats.deaths === 0
      ? stats.kills + stats.assists
      : (stats.kills + stats.assists) / stats.deaths;

  // MVP: KDA > 10 o perfecto (0 muertes)
  if (kda > 10 || (stats.deaths === 0 && stats.kills + stats.assists >= 10)) {
    tags.push("MVP");
  }

  // Stomper: Partida < 20 min y ganó
  if (stats.win && stats.gameDuration < 1200) {
    // 1200 segundos = 20 minutos
    tags.push("Stomper");
  }

  // Muralla: Daño recibido > 30k y muertes < 5
  // Nota: No tenemos daño recibido en los datos, usamos daño infligido como proxy
  if (stats.totalDamageDealt > 30000 && stats.deaths < 5) {
    tags.push("Muralla");
  }

  // Farmeador: CS/minuto > 7.5
  // Nota: No tenemos CS directo, estimamos basado en oro
  const minutesPlayed = stats.gameDuration / 60;
  const estimatedCS = stats.goldEarned / 50; // Aproximación: ~50 oro por CS
  const csPerMinute = estimatedCS / minutesPlayed;

  if (csPerMinute > 7.5) {
    tags.push("Farmeador");
  }

  return tags;
}

/**
 * Obtiene información visual de un tag
 */
export function getTagInfo(tag: MatchTag): MatchTagInfo {
  return TAG_INFO[tag];
}

/**
 * Obtiene todos los tags con su información visual
 */
export function getTagsInfo(tags: MatchTag[]): MatchTagInfo[] {
  return tags.map((tag) => getTagInfo(tag));
}

/**
 * Calcula el KDA de una partida
 */
export function calculateKDA(
  kills: number,
  deaths: number,
  assists: number
): number {
  if (deaths === 0) {
    return kills + assists;
  }
  return (kills + assists) / deaths;
}

/**
 * Calcula CS por minuto (estimado)
 */
export function estimateCSPerMinute(
  goldEarned: number,
  gameDuration: number
): number {
  const minutesPlayed = gameDuration / 60;
  const estimatedCS = goldEarned / 50; // ~50 oro por CS
  return estimatedCS / minutesPlayed;
}

/**
 * Obtiene descripción legible de un tag
 */
export function getTagDescription(tag: MatchTag): string {
  return TAG_INFO[tag].description;
}
