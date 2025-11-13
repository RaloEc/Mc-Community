import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Valida si una URL de redirección es segura
 * @param url URL a validar
 * @param baseUrl URL base del sitio
 * @returns true si la URL es válida y segura
 */
function isValidRedirectUrl(url: string, baseUrl: string): boolean {
  try {
    const parsed = new URL(url, baseUrl);
    const base = new URL(baseUrl);

    // Verificar que el origen sea el mismo
    if (parsed.origin !== base.origin) {
      return false;
    }

    // Verificar que la ruta comience con /
    if (!parsed.pathname.startsWith("/")) {
      return false;
    }

    // Evitar redirecciones a rutas de autenticación
    const blockedPaths = ["/login", "/signup", "/auth"];
    if (blockedPaths.some((path) => parsed.pathname.startsWith(path))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Crear cliente de Supabase para Route Handlers
  const supabase = await createClient();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  try {
    if (code) {
      // Intercambiar el código por una sesión
      await supabase.auth.exchangeCodeForSession(code);

      // Pequeño delay para permitir que las cookies se sincronicen completamente
      // Esto evita que el cliente vea una sesión vacía al cargar la página
      await new Promise((resolve) => setTimeout(resolve, 100));

      logger.success("auth/callback", "Sesión intercambiada exitosamente");
    }

    // Obtener la URL de redirección personalizada o usar la página principal
    const redirectParam = requestUrl.searchParams.get("redirect") || "/";

    // Obtener la URL base del sitio
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    // Validar que la redirección sea segura
    if (!isValidRedirectUrl(redirectParam, siteUrl)) {
      logger.warn("auth/callback", `Redirección bloqueada: ${redirectParam}`);
      return NextResponse.redirect(new URL("/", siteUrl));
    }

    // Construir la URL de redirección
    const redirectUrl = new URL(redirectParam, siteUrl);

    logger.info("auth/callback", `Redirigiendo a: ${redirectUrl.pathname}`);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      "auth/callback",
      "Error en el callback de autenticación",
      errorMessage
    );
    // En caso de error, redirigir a la página de login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
