import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { updateMatchRankings } from "@/lib/riot/league";

/**
 * POST /api/riot/matches/update-rankings
 * Actualiza los rankings de los participantes de una partida
 * Consulta League-V4 y guarda los datos en match_participant_ranks
 */
export async function POST(request: NextRequest) {
  try {
    const { matchId, participants, platformRegion } = await request.json();

    if (!matchId || !participants || !platformRegion) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RIOT_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const supabase = getServiceClient();

    // Actualizar rankings
    await updateMatchRankings(
      matchId,
      participants,
      platformRegion,
      apiKey,
      supabase
    );

    return NextResponse.json({
      success: true,
      message: "Rankings actualizados exitosamente",
    });
  } catch (error: any) {
    console.error("[update-rankings] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
