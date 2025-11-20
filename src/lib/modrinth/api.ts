/**
 * Cliente para la API de Modrinth
 * Documentación: https://docs.modrinth.com/api-spec/
 */

const MODRINTH_API_URL = "https://api.modrinth.com/v2";
const USER_AGENT = "KoreStats/1.0.0 (contact@korestats.com)";

/**
 * Opciones para la búsqueda de proyectos en Modrinth
 */
export interface SearchOptions {
  query?: string;
  facets?: string[];
  index?: "relevance" | "downloads" | "follows" | "newest" | "updated";
  offset?: number;
  limit?: number;
  gameVersions?: string[];
}

/**
 * Realiza una solicitud a la API de Modrinth
 * @param endpoint - Endpoint de la API
 * @param options - Opciones de la solicitud
 * @returns Respuesta de la API
 */
async function fetchModrinth(endpoint: string, options: RequestInit = {}) {
  const headers = {
    "User-Agent": USER_AGENT,
    ...options.headers,
  };

  const response = await fetch(`${MODRINTH_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Error en la API de Modrinth: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Busca proyectos en Modrinth
 * @param options - Opciones de búsqueda
 * @returns Lista de proyectos
 */
export async function searchProjects(options: SearchOptions = {}) {
  const params = new URLSearchParams();

  if (options.query) {
    params.append("query", options.query);
  }

  // Construir facets
  const facets: string[] = options.facets || [];

  // Añadir filtro por versión de Minecraft si se especifica
  if (options.gameVersions && options.gameVersions.length > 0) {
    options.gameVersions.forEach((version) => {
      facets.push(`["versions:${version}"]`);
    });
  }

  // Siempre filtrar por tipo de proyecto = mod
  if (!facets.some((facet) => facet.includes("project_type"))) {
    facets.push('["project_type:mod"]');
  }

  if (facets.length > 0) {
    params.append("facets", JSON.stringify(facets));
  }

  if (options.index) {
    params.append("index", options.index);
  }

  if (options.offset !== undefined) {
    params.append("offset", options.offset.toString());
  }

  if (options.limit !== undefined) {
    params.append("limit", options.limit.toString());
  }

  return fetchModrinth(`/search?${params.toString()}`);
}

/**
 * Obtiene un proyecto por su ID o slug
 * @param idOrSlug - ID o slug del proyecto
 * @returns Detalles del proyecto
 */
export async function getProject(idOrSlug: string) {
  return fetchModrinth(`/project/${idOrSlug}`);
}

/**
 * Obtiene las versiones de un proyecto
 * @param idOrSlug - ID o slug del proyecto
 * @returns Versiones del proyecto
 */
export async function getProjectVersions(idOrSlug: string) {
  return fetchModrinth(`/project/${idOrSlug}/version`);
}

/**
 * Obtiene múltiples proyectos por sus IDs
 * @param ids - IDs de los proyectos
 * @returns Lista de proyectos
 */
export async function getProjects(ids: string[]) {
  return fetchModrinth(`/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ids),
  });
}

/**
 * Obtiene las versiones de Minecraft disponibles
 * @returns Lista de versiones de Minecraft
 */
export async function getGameVersions() {
  return fetchModrinth(`/tag/game_version`);
}
