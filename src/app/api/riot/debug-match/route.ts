/**
 * Endpoint temporal para debuggear estructura de datos de partidas
 * GET /api/riot/debug-match?matchId=LA1_1669358885
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const matchId =
      request.nextUrl.searchParams.get("matchId") || "LA1_1669358885";

    const supabase = getServiceClient();

    // Obtener el full_json de la partida
    const { data: match, error } = await supabase
      .from("matches")
      .select("full_json")
      .eq("match_id", matchId)
      .single();

    if (error || !match) {
      return NextResponse.json(
        { error: "Partida no encontrada" },
        { status: 404 }
      );
    }

    const participants = match.full_json?.info?.participants || [];

    if (participants.length === 0) {
      return NextResponse.json(
        { error: "No hay participantes en esta partida" },
        { status: 404 }
      );
    }

    const firstParticipant = participants[0];

    return NextResponse.json({
      matchId,
      totalParticipants: participants.length,
      fieldsAvailable: Object.keys(firstParticipant),
      summonerNameData: {
        summonerName: firstParticipant.summonerName,
        riotIdGameName: firstParticipant.riotIdGameName,
        riotIdTagLine: firstParticipant.riotIdTagLine,
      },
      perkData: {
        perkPrimaryStyle: firstParticipant.perkPrimaryStyle,
        perkSubStyle: firstParticipant.perkSubStyle,
        perks: firstParticipant.perks,
      },
      firstParticipantSample: firstParticipant,
    });
  } catch (error: any) {
    console.error("[GET /api/riot/debug-match] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener datos", details: error.message },
      { status: 500 }
    );
  }
}
