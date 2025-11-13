import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { logger } from "@/lib/logger";

// Rutas que requieren autenticación de administrador (usando regex para mayor cobertura)
const ADMIN_ROUTES = [
  /^\/admin(?:\/|$)/, // /admin, /admin/, /admin/...
  /^\/api\/admin(?:\/|$)/, // /api/admin, /api/admin/, /api/admin/...
] as const;

/**
 * Verifica si una ruta es administrativa
 * @param pathname Ruta a verificar
 * @returns true si es una ruta administrativa
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => route.test(pathname));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  logger.info("Middleware", "Procesando ruta:", pathname);

  // Crear respuesta que será retornada
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Crear cliente de Supabase para refrescar la sesión
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Actualizar cookies en request y response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ⚠️ CRÍTICO: Refrescar la sesión SIEMPRE
  // Esto asegura que las cookies estén actualizadas antes de que cargue la página
  // y evita el "falso logout" al recargar
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  logger.info("Middleware", "Sesión refrescada", {
    hasSession: !!session,
    userId: session?.user?.id,
    error: sessionError?.message,
  });

  // Si hay sesión, agregar header para indicar al cliente
  if (session) {
    response.headers.set("X-Auth-Session", "true");
    response.headers.set("X-User-Id", session.user.id);
    logger.info("Middleware", "Sesión activa detectada");
  }

  // Verificar si la ruta es administrativa
  const isAdmin = isAdminRoute(pathname);

  if (isAdmin) {
    try {
      // Si no hay sesión, redirigir al login con parámetro de redirección
      if (!session) {
        logger.warn("Middleware", "No hay sesión, redirigiendo a login");
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Si hay sesión, verificar si es admin consultando la tabla perfiles
      const { data: profile, error } = await supabase
        .from("perfiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      logger.info("Middleware", "Verificación de perfil", {
        hasProfile: !!profile,
        role: profile?.role,
        error: error?.message,
      });

      // Si hay error o el usuario no es admin, redirigir a la página principal
      if (error || !profile || profile.role !== "admin") {
        logger.warn("Middleware", "Usuario no es admin, redirigiendo a home");
        return NextResponse.redirect(new URL("/", request.url));
      }

      logger.success("Middleware", "Usuario es admin, permitiendo acceso");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error("Middleware", "Error inesperado", errorMessage);
      // En caso de error en rutas admin, redirigir a home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Retornar la respuesta con las cookies actualizadas
  return response;
}

// Configurar las rutas en las que se ejecutará el middleware
export const config = {
  matcher: [
    /*
     * Ejecutar en todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     * - Archivos públicos (imágenes, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
