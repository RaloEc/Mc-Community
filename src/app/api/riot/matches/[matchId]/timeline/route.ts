import { NextRequest, NextResponse } from "next/server";
import { getMatchTimeline } from "@/lib/riot/matches";

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { matchId } = params;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RIOT_API_KEY;

    if (!apiKey) {
      console.error(
        "[GET /api/riot/matches/[matchId]/timeline] Missing RIOT_API_KEY"
      );
      return NextResponse.json(
        { error: "Configuración del servidor incompleta" },
        { status: 500 }
      );
    }

    const region = matchId.split("_")[0]?.toLowerCase() || "la1";
    const forceRefresh = request.nextUrl.searchParams.get("force") === "1";

    const timeline = await getMatchTimeline(matchId, region, apiKey, {
      forceRefresh,
    });

    if (!timeline) {
      return NextResponse.json({ timeline: null }, { status: 200 });
    }

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("[GET /api/riot/matches/[matchId]/timeline] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener timeline" },
      { status: 500 }
    );
  }
}
