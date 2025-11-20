/**
 * Mapea roles de la API de Riot a nombres de archivos de CommunityDragon
 */

export type RiotRole = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";
export type CDRole = "top" | "jungle" | "mid" | "bottom" | "support";

/**
 * Mapea roles de Riot API a nombres de CommunityDragon
 */
export function mapRiotRoleToCD(role: string): CDRole {
  const roleMap: Record<string, CDRole> = {
    TOP: "top",
    JUNGLE: "jungle",
    MIDDLE: "mid",
    BOTTOM: "bottom",
    UTILITY: "support",
    // Aliases
    top: "top",
    jungle: "jungle",
    mid: "mid",
    middle: "mid",
    bottom: "bottom",
    support: "support",
    utility: "support",
  };

  return roleMap[role.toUpperCase()] || "mid";
}

/**
 * Obtiene la URL de la imagen del rol desde CommunityDragon
 */
export function getRoleImageUrl(role: string): string {
  const cdRole = mapRiotRoleToCD(role);
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-positions/position-${cdRole}.png`;
}

/**
 * Obtiene el nombre legible del rol
 */
export function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    BOTTOM: "ADC",
    UTILITY: "Support",
  };

  return roleNames[role.toUpperCase()] || role;
}
