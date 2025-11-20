/**
 * Utilidades para OAuth 2.0 con Riot Games (RSO)
 *
 * Documentación: https://developer.riotgames.com/docs/rso
 */

export interface RiotTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RiotPlayerInfo {
  puuid: string;
  game_name: string;
  tag_line: string;
}

export interface RiotAccountResponse {
  puuid: string;
  game_name: string;
  tag_line: string;
}

/**
 * Construye la URL de autorización de Riot OAuth 2.0
 */
export function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  state?: string
): URL {
  const url = new URL("https://auth.riotgames.com/authorize");

  url.searchParams.append("response_type", "code");
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("scope", "openid"); // OBLIGATORIO para obtener PUUID

  if (state) {
    url.searchParams.append("state", state);
  }

  return url;
}

/**
 * Intercambia un código de autorización por tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<RiotTokenResponse> {
  const body = new URLSearchParams();
  body.append("grant_type", "authorization_code");
  body.append("code", code);
  body.append("redirect_uri", redirectUri);

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch("https://auth.riotgames.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error_description || error.error || "Token exchange failed"
    );
  }

  return response.json();
}

/**
 * Obtiene información del jugador usando el access token
 */
export async function getPlayerInfo(
  accessToken: string
): Promise<RiotPlayerInfo> {
  const response = await fetch(
    "https://americas.api.riotgames.com/riot/account/v1/accounts/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.status?.message || "Failed to get player info");
  }

  const data: RiotAccountResponse = await response.json();

  return {
    puuid: data.puuid,
    game_name: data.game_name,
    tag_line: data.tag_line,
  };
}

/**
 * Refresca un access token usando el refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<RiotTokenResponse> {
  const body = new URLSearchParams();
  body.append("grant_type", "refresh_token");
  body.append("refresh_token", refreshToken);

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch("https://auth.riotgames.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error_description || error.error || "Token refresh failed"
    );
  }

  return response.json();
}

/**
 * Determina la región basada en el PUUID
 *
 * Nota: Esta es una aproximación. En producción, deberías consultar
 * la API de Riot para obtener la región exacta del jugador.
 */
export function determineRegionFromPuuid(puuid: string): string {
  // El PUUID tiene un formato específico que contiene información de región
  // Esto es una simplificación; consulta la documentación de Riot para más detalles

  // Regiones disponibles: la1, la2, br1, na1, euw1, eun1, kr, ru, tr1, jp1, vn2, ph2, sg2, th2
  // Por ahora, retornamos un valor por defecto
  return "la1"; // Latinoamérica
}

/**
 * Valida que las variables de entorno necesarias estén configuradas
 */
export function validateRiotConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.RIOT_CLIENT_ID) {
    errors.push("RIOT_CLIENT_ID no está configurado");
  }

  if (!process.env.RIOT_CLIENT_SECRET) {
    errors.push("RIOT_CLIENT_SECRET no está configurado");
  }

  if (!process.env.RIOT_REDIRECT_URI) {
    errors.push("RIOT_REDIRECT_URI no está configurado");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
