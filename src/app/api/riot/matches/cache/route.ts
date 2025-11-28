import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import {
  getCachedMatchHistory,
  getMatchHistory,
  refreshMatchHistoryCache,
} from "@/lib/riot/matches";

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: riotAccount, error: accountError } = await supabase
      .from("linked_accounts_riot")
      .select("puuid")
      .eq("user_id", userId)
      .single();

    if (accountError || !riotAccount) {
      return NextResponse.json(
        { error: "No hay cuenta de Riot vinculada" },
        { status: 404 }
      );
    }

    // Intentar usar caché
    const cachedMatches = await getCachedMatchHistory(
      userId,
      riotAccount.puuid
    );

    if (cachedMatches.length > 0) {
      return NextResponse.json({ matches: cachedMatches, fromCache: true });
    }

    // Fallback: obtener primeras 5 partidas y refrescar caché
    const { matches } = await getMatchHistory(riotAccount.puuid, { limit: 5 });

    // Actualizar caché en background
    (async () => {
      try {
        await refreshMatchHistoryCache(userId, riotAccount.puuid);
      } catch (err) {
        console.error(
          "[GET /api/riot/matches/cache] Error refrescando caché:",
          err
        );
      }
    })();

    return NextResponse.json({ matches: matches ?? [], fromCache: false });
  } catch (error: any) {
    console.error("[GET /api/riot/matches/cache] Error:", error.message);
    return NextResponse.json(
      { error: "Error al obtener caché de partidas" },
      { status: 500 }
    );
  }
}
