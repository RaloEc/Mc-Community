import { NextResponse } from 'next/server';
import { syncModrinthMod, syncModrinthMods } from '@/lib/modrinth/sync';
import { getServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

/**
 * Endpoint para sincronizar un mod específico de Modrinth
 * GET /api/sync/modrinth?id={id}
 * o
 * GET /api/sync/modrinth?query={query}&limit={limit}
 */
export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar si el usuario es administrador
    const { data: userRoles } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', session.user.id)
      .single();
      
    if (!userRoles || userRoles.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Se requieren permisos de administrador para esta operación' },
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
