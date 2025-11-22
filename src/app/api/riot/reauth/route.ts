import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/riot/reauth
 *
 * Inicia el flujo de reautenticación de Riot OAuth 2.0
 * Permite al usuario actualizar su información de cuenta sin desvincularse
 *
 * Parámetros requeridos en .env.local:
 * - RIOT_CLIENT_ID: Tu ID de cliente RSO
 * - RIOT_REDIRECT_URI: URL de callback (ej: http://localhost:3000/api/riot/callback)
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener variables de entorno
    const clientId = process.env.RIOT_CLIENT_ID;
    const redirectUri = process.env.RIOT_REDIRECT_URI;

    // Validar que las variables de entorno estén configuradas
    if (!clientId || !redirectUri) {
      console.error("[Riot OAuth Reauth] Variables de entorno faltantes:", {
        clientId: !!clientId,
        redirectUri: !!redirectUri,
      });

      return NextResponse.json(
        {
          error: "Configuración incompleta",
          message:
            "Las variables RIOT_CLIENT_ID y RIOT_REDIRECT_URI deben estar configuradas",
        },
        { status: 500 }
      );
    }

    // Construir la URL de autorización de Riot
    const authorizationUrl = new URL("https://auth.riotgames.com/authorize");

    // Parámetros requeridos para OAuth 2.0
    authorizationUrl.searchParams.append("response_type", "code");
    authorizationUrl.searchParams.append("client_id", clientId);
    authorizationUrl.searchParams.append("redirect_uri", redirectUri);
    authorizationUrl.searchParams.append("scope", "openid"); // OBLIGATORIO para obtener PUUID
    authorizationUrl.searchParams.append("state", generateState()); // Para prevenir CSRF

    console.log(
      "[Riot OAuth Reauth] Redirigiendo a:",
      authorizationUrl.toString()
    );

    // Redirigir al usuario a la página de login de Riot
    return NextResponse.redirect(authorizationUrl.toString());
  } catch (error: any) {
    console.error("[Riot OAuth Reauth] Error en endpoint /reauth:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Genera un estado aleatorio para prevenir ataques CSRF
 * En producción, deberías almacenar esto en una sesión o base de datos
 */
function generateState(): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let state = "";
  for (let i = 0; i < 32; i++) {
    state += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return state;
}
