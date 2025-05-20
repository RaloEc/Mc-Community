/**
 * Servicio para sincronizar mods de Modrinth con nuestra base de datos
 */
import { getServiceClient } from '@/lib/supabase';
import * as modrinthApi from './api';

/**
 * Convierte un proyecto de Modrinth al formato de nuestra base de datos
 * @param project - Proyecto de Modrinth
 * @param versions - Versiones del proyecto (opcional)
 * @returns Datos formateados para nuestra tabla de mods
 */
export function convertModrinthProjectToMod(project: any, versions?: any[]) {
  // Obtener la versión más reciente si se proporcionan versiones
  const latestVersion = versions && versions.length > 0 ? versions[0] : null;
  
  // Extraer las versiones de Minecraft soportadas
  let gameVersions: string[] = [];
  if (latestVersion && latestVersion.game_versions) {
    gameVersions = latestVersion.game_versions;
  } else if (project.game_versions) {
    gameVersions = project.game_versions;
  }
  
  // Extraer los loaders soportados (Fabric, Forge, etc.)
  let modLoaders: string[] = [];
  if (latestVersion && latestVersion.loaders) {
    modLoaders = latestVersion.loaders;
  } else if (project.loaders) {
    modLoaders = project.loaders;
  }
  
  return {
    source: 'modrinth',
    source_id: project.id,
    name: project.title,
    slug: project.slug,
    summary: project.description,
    description_html: project.body,
    logo_url: project.icon_url,
    website_url: `https://modrinth.com/mod/${project.slug}`,
    total_downloads: project.downloads,
    author_name: project.author,
    categories: project.categories || [],
    game_versions: gameVersions,
    mod_loader: modLoaders,
    date_created_api: project.published,
    date_modified_api: project.updated,
    first_synced_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Sincroniza un mod de Modrinth con nuestra base de datos
 * @param idOrSlug - ID o slug del proyecto en Modrinth
 * @returns El mod sincronizado
 */
export async function syncModrinthMod(idOrSlug: string) {
  try {
    // Obtener datos del proyecto y sus versiones
    const project = await modrinthApi.getProject(idOrSlug);
    const versions = await modrinthApi.getProjectVersions(idOrSlug);
    
    // Convertir al formato de nuestra base de datos
    const modData = convertModrinthProjectToMod(project, versions);
    
    // Crear cliente de servicio de Supabase para saltarse las restricciones RLS
    const supabase = getServiceClient();
    
    // Verificar si el mod ya existe
    const { data: existingMod } = await supabase
      .from('mods')
      .select('id')
      .eq('source', 'modrinth')
      .eq('source_id', project.id)
      .single();
    
    let result;
    
    if (existingMod) {
      // Actualizar mod existente
      const { data, error } = await supabase
        .from('mods')
        .update({
          ...modData,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', existingMod.id)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    } else {
      // Insertar nuevo mod
      const { data, error } = await supabase
        .from('mods')
        .insert(modData)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    }
    
    return result;
  } catch (error) {
    console.error('Error al sincronizar mod de Modrinth:', error);
    throw error;
  }
}

/**
 * Sincroniza múltiples mods de Modrinth con nuestra base de datos
 * @param query - Consulta de búsqueda
 * @param limit - Límite de resultados (máximo 100)
 * @param gameVersions - Versiones de Minecraft para filtrar
 * @returns Los mods sincronizados
 */
export async function syncModrinthMods(query: string, limit: number = 10, gameVersions?: string[]) {
  try {
    // Limitar a un máximo de 100 resultados
    const actualLimit = Math.min(limit, 100);
    
    // Buscar proyectos en Modrinth
    const searchResults = await modrinthApi.searchProjects({
      query,
      limit: actualLimit,
      index: 'downloads',
      gameVersions: gameVersions,
    });
    
    if (!searchResults.hits || searchResults.hits.length === 0) {
      return [];
    }
    
    // Obtener detalles completos de los proyectos
    const projectIds = searchResults.hits.map((hit: any) => hit.project_id);
    const projects = await modrinthApi.getProjects(projectIds);
    
    // Crear cliente de servicio de Supabase para saltarse las restricciones RLS
    const supabase = getServiceClient();
    
    // Convertir y sincronizar cada proyecto
    const syncedMods = [];
    
    for (const project of projects) {
      // Convertir al formato de nuestra base de datos
      const modData = convertModrinthProjectToMod(project);
      
      // Verificar si el mod ya existe
      const { data: existingMod } = await supabase
        .from('mods')
        .select('id')
        .eq('source', 'modrinth')
        .eq('source_id', project.id)
        .single();
      
      let result;
      
      if (existingMod) {
        // Actualizar mod existente
        const { data, error } = await supabase
          .from('mods')
          .update({
            ...modData,
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', existingMod.id)
          .select()
          .single();
          
        if (error) {
          console.error(`Error al actualizar mod ${project.title}:`, error);
          continue;
        }
        
        result = data;
      } else {
        // Insertar nuevo mod
        const { data, error } = await supabase
          .from('mods')
          .insert(modData)
          .select()
          .single();
          
        if (error) {
          console.error(`Error al insertar mod ${project.title}:`, error);
          continue;
        }
        
        result = data;
      }
      
      syncedMods.push(result);
    }
    
    return syncedMods;
  } catch (error) {
    console.error('Error al sincronizar mods de Modrinth:', error);
    throw error;
  }
}
