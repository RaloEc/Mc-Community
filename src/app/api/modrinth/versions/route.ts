import { NextResponse } from 'next/server';
import { getGameVersions } from '@/lib/modrinth/api';

/**
 * Endpoint para obtener las versiones de Minecraft disponibles en Modrinth
 * GET /api/modrinth/versions
 */
export async function GET() {
  try {
    // Obtener versiones de Minecraft desde la API de Modrinth
    const versions = await getGameVersions();
    
    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error al obtener versiones de Minecraft:', error);
    return NextResponse.json(
      { error: 'Error al obtener versiones de Minecraft' },
      { status: 500 }
    );
  }
}
