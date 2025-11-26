import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncRiotStats, getRoutingRegionFromShard } from "@/lib/riot/sync";

const UNRANKED_RANK = {
  tier: "UNRANKED",
  rank: null,
  leaguePoints: 0,
  wins: 0,
  losses: 0,
};

/**
 * GET /api/riot/callback
 *
 * Endpoint de callback de Riot OAuth 2.0
 * Riot redirige aquí después de que el usuario autoriza la aplicación
 *
 * Parámetros en la URL:
 * - code: Código de autorización (intercambiable por tokens)
 * - state: Estado para validar CSRF
 *
 * Parámetros requeridos en .env.local:
 * - RIOT_CLIENT_ID: Tu ID de cliente RSO
 * - RIOT_CLIENT_SECRET: Tu secreto de cliente RSO
 * - RIOT_REDIRECT_URI: URL de callback
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    console.log("[Riot OAuth Callback] Iniciando callback:", {
      code: !!code,
      state,
      error,
    });

    // Validar que no haya error de Riot
    if (error) {
      console.error("[Riot OAuth Callback] Error de Riot:", {
        error,
        errorDescription,
      });
      return NextResponse.redirect(
        new URL(
          `/perfil?riot_error=${error}&description=${errorDescription}`,
          request.url
        )
      );
    }

    // Validar que recibimos el código
    if (!code) {
      console.error("[Riot OAuth Callback] Código de autorización no recibido");
      return NextResponse.redirect(
        new URL("/perfil?riot_error=missing_code", request.url)
      );
    }

    // Obtener variables de entorno
    const clientId = process.env.RIOT_CLIENT_ID;
    const clientSecret = process.env.RIOT_CLIENT_SECRET;
    const redirectUri = process.env.RIOT_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("[Riot OAuth Callback] Variables de entorno faltantes:", {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        redirectUri: !!redirectUri,
      });

      return NextResponse.redirect(
        new URL("/perfil?riot_error=server_config_error", request.url)
      );
    }

    // PASO 1: Intercambiar código por tokens
    console.log("[Riot OAuth Callback] Intercambiando código por tokens...");

    const tokenResponse = await exchangeCodeForTokens(
      code,
      clientId,
      clientSecret,
      redirectUri
    );

    if (!tokenResponse.success) {
      console.error(
        "[Riot OAuth Callback] Error al intercambiar código:",
        tokenResponse.error
      );
      return NextResponse.redirect(
        new URL(
          `/perfil?riot_error=token_exchange_failed&message=${tokenResponse.error}`,
          request.url
        )
      );
    }

    const { accessToken, refreshToken } = tokenResponse;

    // PASO 2: Obtener información del jugador usando el access token
    console.log("[Riot OAuth Callback] Obteniendo información del jugador...");

    const playerInfo = await getPlayerInfo(accessToken);

    if (!playerInfo.success) {
      console.error(
        "[Riot OAuth Callback] Error al obtener info del jugador:",
        playerInfo.error
      );
      return NextResponse.redirect(
        new URL(
          `/perfil?riot_error=player_info_failed&message=${playerInfo.error}`,
          request.url
        )
      );
    }

    const { puuid, gameName, tagLine, region } = playerInfo;

    // PASO 3: Obtener sesión del usuario autenticado
    console.log("[Riot OAuth Callback] Obteniendo sesión del usuario...");

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.error(
        "[Riot OAuth Callback] Usuario no autenticado:",
        sessionError
      );
      return NextResponse.redirect(
        new URL("/login?riot_error=not_authenticated", request.url)
      );
    }

    const userId = session.user.id;

    // PASO 4: Sincronizar estadísticas del jugador
    console.log(
      "[Riot OAuth Callback] Sincronizando estadísticas del jugador..."
    );

    // Determinar región de enrutamiento basada en la región general
    const routingRegion = region === "americas" ? "americas" : "europe";

    const syncResult = await syncRiotStats(
      puuid,
      process.env.RIOT_API_KEY || "",
      routingRegion
    );

    if (!syncResult.success) {
      console.warn(
        "[Riot OAuth Callback] Advertencia: No se pudieron sincronizar estadísticas:",
        syncResult.error
      );
      // No es un error fatal, continuamos con valores por defecto
    }

    const statsData = syncResult.data || {
      activeShard: region,
      summonerId: null,
      summonerLevel: 1,
      profileIconId: 0,
      soloRank: { ...UNRANKED_RANK },
      flexRank: { ...UNRANKED_RANK },
    };

    const soloRank = statsData.soloRank || { ...UNRANKED_RANK };
    const flexRank = statsData.flexRank || { ...UNRANKED_RANK };

    console.log("[Riot OAuth Callback] ✅ Estadísticas sincronizadas:", {
      solo: soloRank,
      flex: flexRank,
      level: statsData.summonerLevel,
    });

    // PASO 5: UPSERT en tabla linked_accounts_riot
    console.log("[Riot OAuth Callback] Guardando cuenta de Riot vinculada...", {
      userId,
      puuid,
      gameName,
      tagLine,
    });

    const { error: upsertError } = await supabase
      .from("linked_accounts_riot")
      .upsert(
        {
          user_id: userId,
          puuid,
          game_name: gameName,
          tag_line: tagLine,
          region,
          access_token: accessToken,
          refresh_token: refreshToken,
          profile_icon_id: statsData.profileIconId,
          summoner_level: statsData.summonerLevel,
          active_shard: statsData.activeShard,
          summoner_id: statsData.summonerId,
          solo_tier: soloRank.tier,
          solo_rank: soloRank.rank,
          solo_league_points: soloRank.leaguePoints,
          solo_wins: soloRank.wins,
          solo_losses: soloRank.losses,
          flex_tier: flexRank.tier,
          flex_rank: flexRank.rank,
          flex_league_points: flexRank.leaguePoints,
          flex_wins: flexRank.wins,
          flex_losses: flexRank.losses,
          updated_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error(
        "[Riot OAuth Callback] Error al guardar cuenta de Riot:",
        upsertError
      );
      return NextResponse.redirect(
        new URL(
          `/perfil?riot_error=save_failed&message=${upsertError.message}`,
          request.url
        )
      );
    }

    console.log(
      "[Riot OAuth Callback] ✅ Cuenta de Riot vinculada exitosamente con estadísticas"
    );

    // PASO 6: Redirigir al usuario a su perfil
    return NextResponse.redirect(
      new URL("/perfil?riot_success=true", request.url)
    );
  } catch (error: any) {
    console.error("[Riot OAuth Callback] Error inesperado:", error);

    return NextResponse.redirect(
      new URL(
        `/perfil?riot_error=unexpected_error&message=${error.message}`,
        request.url
      )
    );
  }
}

/**
 * Intercambia el código de autorización por access_token y refresh_token
 *
 * @param code - Código de autorización recibido de Riot
 * @param clientId - ID de cliente RSO
 * @param clientSecret - Secreto de cliente RSO
 * @param redirectUri - URI de callback registrado
 * @returns Objeto con tokens o error
 */
async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}> {
  try {
    // Construir el body de la solicitud
    const body = new URLSearchParams();
    body.append("grant_type", "authorization_code");
    body.append("code", code);
    body.append("redirect_uri", redirectUri);

    // Crear credenciales en Base64 (HTTP Basic Auth)
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    console.log("[exchangeCodeForTokens] Enviando solicitud a Riot...");

    // Hacer solicitud POST a Riot
    const response = await fetch("https://auth.riotgames.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    // Parsear respuesta
    const data = await response.json();

    if (!response.ok) {
      console.error("[exchangeCodeForTokens] Error de Riot:", data);
      return {
        success: false,
        error: data.error_description || data.error || "Error desconocido",
      };
    }

    console.log("[exchangeCodeForTokens] ✅ Tokens obtenidos exitosamente");

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } catch (error: any) {
    console.error("[exchangeCodeForTokens] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtiene información del jugador usando el access token
 *
 * @param accessToken - Access token de Riot
 * @returns Objeto con información del jugador o error
 */
async function getPlayerInfo(accessToken: string): Promise<{
  success: boolean;
  puuid?: string;
  gameName?: string;
  tagLine?: string;
  region?: string;
  error?: string;
}> {
  try {
    console.log("[getPlayerInfo] Obteniendo información del jugador...");

    // Hacer solicitud GET a la API de Riot para obtener información de la cuenta
    const response = await fetch(
      "https://americas.api.riotgames.com/riot/account/v1/accounts/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Parsear respuesta
    const data = await response.json();

    if (!response.ok) {
      console.error("[getPlayerInfo] Error de Riot:", data);
      return {
        success: false,
        error: data.status?.message || "Error desconocido",
      };
    }

    console.log("[getPlayerInfo] ✅ Información de cuenta obtenida:", {
      gameName: data.game_name,
      tagLine: data.tag_line,
    });

    // Usar gameName y tagLine para obtener el PUUID correcto del jugador
    // Este PUUID es el que funciona con la API Match-V5
    const puuid = data.puuid;
    const gameName = data.game_name;
    const tagLine = data.tag_line;

    // Determinar región basada en el PUUID o usar un valor por defecto
    const region = determineRegion(puuid);

    return {
      success: true,
      puuid,
      gameName,
      tagLine,
      region,
    };
  } catch (error: any) {
    console.error("[getPlayerInfo] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Determina la región basada en el PUUID
 * En producción, podrías hacer una llamada adicional a la API para obtener la región exacta
 *
 * @param puuid - PUUID del jugador
 * @returns Región (ej: 'la1', 'euw1', 'kr', 'br1', 'na1')
 */
function determineRegion(puuid: string): string {
  // El PUUID contiene información de región en los primeros caracteres
  // Esto es una simplificación; en producción, consulta la API de Riot
  // para obtener la región exacta

  // Por ahora, retornamos un valor por defecto
  // Puedes mejorar esto consultando otra endpoint de Riot
  return "la1"; // Latinoamérica
}
