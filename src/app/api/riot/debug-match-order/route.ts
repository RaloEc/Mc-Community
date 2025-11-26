/**
 * Debug endpoint para verificar el orden de las partidas
 * GET /api/riot/debug-match-order?puuid=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const puuid = request.nextUrl.searchParams.get("puuid");

    if (!puuid) {
      return NextResponse.json({ error: "PUUID required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Obtener partidas con ambos métodos para comparar
    const { data: withForeignOrder, error: error1 } = await supabase
      .from("match_participants")
      .select(
        `
        match_id,
        champion_name,
        created_at,
        matches (
          match_id,
          game_creation
        )
      `
      )
      .eq("puuid", puuid)
      .order("game_creation", { foreignTable: "matches", ascending: false })
      .limit(10);

    const { data: withManualOrder, error: error2 } = await supabase
      .from("match_participants")
      .select(
        `
        match_id,
        champion_name,
        created_at,
        matches (
          match_id,
          game_creation
        )
      `
      )
      .eq("puuid", puuid)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      puuid,
      withForeignOrder: withForeignOrder?.map((m: any) => ({
        match_id: m.match_id,
        champion: m.champion_name,
        game_creation: m.matches?.game_creation,
        created_at: m.created_at,
      })),
      withManualOrder: withManualOrder?.map((m: any) => ({
        match_id: m.match_id,
        champion: m.champion_name,
        game_creation: m.matches?.game_creation,
        created_at: m.created_at,
      })),
      error1: error1?.message,
      error2: error2?.message,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
