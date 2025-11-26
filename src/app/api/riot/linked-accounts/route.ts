import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/riot/linked-accounts
 * Retorna todos los PUUIDs de jugadores que tienen cuenta enlazada
 */
export async function GET() {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("linked_accounts_riot")
      .select("puuid, user_id");

    if (error) {
      console.error("[GET /api/riot/linked-accounts] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const linkedAccounts = data || [];
    const userIds = linkedAccounts.map((account) => account.user_id);

    let publicIdMap: Record<string, string | null> = {};

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("perfiles")
        .select("id, public_id")
        .in("id", userIds);

      if (profilesError) {
        console.error(
          "[GET /api/riot/linked-accounts] Error al obtener perfiles:",
          profilesError
        );
      } else {
        const map: Record<string, string | null> = {};
        for (const profile of profiles || []) {
          map[profile.id] = profile.public_id;
        }
        publicIdMap = map;
      }
    }

    const accounts = linkedAccounts.map((account) => ({
      puuid: account.puuid,
      userId: account.user_id,
      publicId: publicIdMap[account.user_id] || null,
    }));

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("[GET /api/riot/linked-accounts] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener cuentas enlazadas" },
      { status: 500 }
    );
  }
}
