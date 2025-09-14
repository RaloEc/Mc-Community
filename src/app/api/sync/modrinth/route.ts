import { NextResponse } from 'next/server';
import { syncModrinthMod, syncModrinthMods } from '@/lib/modrinth/sync';
import { getServiceClient } from '@/utils/supabase-service';

// Hacer que la ruta sea dinámica
export const dynamic = 'force-dynamic';

/**
 * Endpoint para sincronizar un mod específico de Modrinth
 * GET /api/sync/modrinth?id={id}
 * o
 * GET /api/sync/modrinth?query={query}&limit={limit}
 */
export async function GET(request: Request) {
  try {
    // Usar el cliente de servicio para operaciones administrativas
    const supabase = getServiceClient();
    
    // Verificar si el usuario es administrador
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar si el usuario es administrador
    const { data: userData, error: profileError } = await supabase
      .from('perfiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profileError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren privilegios de administrador' },
        { status: 403 }
      );
    }
    
    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const query = url.searchParams.get('query');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const gameVersion = url.searchParams.get('gameVersion');
    const gameVersions = gameVersion ? [gameVersion] : undefined;
    
    // Validar parámetros
    if (!id && !query) {
      return NextResponse.json(
        { error: 'Se requiere un ID o una consulta de búsqueda' },
        { status: 400 }
      );
    }
    
    let result;
    
    if (id) {
      // Sincronizar un mod específico
      result = await syncModrinthMod(id);
      return NextResponse.json(result);
    } else if (query) {
      // Sincronizar múltiples mods basados en una búsqueda
      result = await syncModrinthMods(query, limit, gameVersions);
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { error: 'Parámetros inválidos' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error al sincronizar mods de Modrinth:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar mods de Modrinth' },
      { status: 500 }
    );
  }
}
