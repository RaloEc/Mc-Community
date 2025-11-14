import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { logger } from "@/lib/logger";

// Rutas que requieren autenticación de administrador (usando regex para mayor cobertura)
const ADMIN_ROUTES = [
  /^\/admin(?:\/|$)/, // /admin, /admin/, /admin/...
  /^\/api\/admin(?:\/|$)/, // /api/admin, /api/admin/, /api/admin/...
] as const;

// Rutas públicas que NO requieren autenticación (aunque estén bajo /api/admin)
const PUBLIC_API_ROUTES = [
  /^\/api\/admin\/news-ticker$/, // GET /api/admin/news-ticker es público
] as const;

/**
 * Verifica si una ruta es administrativa
 * @param pathname Ruta a verificar
 * @returns true si es una ruta administrativa
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => route.test(pathname));
}

/**
 * Verifica si una ruta es pública (no requiere autenticación)
 * @param pathname Ruta a verificar
 * @returns true si es una ruta pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => route.test(pathname));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  logger.info("Middleware", "Procesando ruta:", pathname);

  // ✅ Excluir rutas públicas del middleware de admin
  if (isPublicRoute(pathname)) {
    logger.info(
      "Middleware",
      "Ruta pública detectada, permitiendo acceso sin autenticación"
    );
    return NextResponse.next();
  }

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

  // ✅ OPTIMIZADO: Obtener sesión actual (sin refrescar innecesariamente)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  logger.info("Middleware", "Sesión obtenida", {
    hasSession: !!session,
    userId: session?.user?.id,
    expiresAt: session?.expires_at,
    error: sessionError?.message,
  });

  // ✅ OPTIMIZADO: Refrescar SOLO si el token está próximo a expirar (< 30 segundos)
  if (session?.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    const timeUntilExpiry = expiresAt - now;

    // Si expira en menos de 30 segundos, refrescar
    if (timeUntilExpiry < 30) {
      logger.info("Middleware", "Token próximo a expirar, refrescando...");
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError || !refreshed.session) {
        logger.warn(
          "Middleware",
          "No se pudo refrescar el token",
          refreshError
        );
      } else {
        logger.success("Middleware", "Token refrescado exitosamente");
      }
    }
  }

  // Si hay sesión, agregar header para indicar al cliente
  if (session) {
    response.headers.set("X-Auth-Session", "true");
    response.headers.set("X-User-Id", session.user.id);
    logger.info("Middleware", "Sesión activa detectada");
  }

  // Verificar si la ruta es administrativa
  const isAdmin = isAdminRoute(pathname);

  if (isAdmin) {
    // Si no hay sesión, redirigir al login con parámetro de redirección
    if (!session) {
      logger.warn("Middleware", "No hay sesión, redirigiendo a login");
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // ✅ OPTIMIZADO: Verificar role usando app_metadata (SIN consultar BD)
    // El role debe estar guardado en app_metadata durante el signup/update
    const userRole = session.user?.app_metadata?.role as string | undefined;

    logger.info("Middleware", "Verificación de role (app_metadata)", {
      userId: session.user.id,
      role: userRole,
    });

    // Si no es admin, redirigir a la página principal
    if (userRole !== "admin") {
      logger.warn("Middleware", "Usuario no es admin, redirigiendo a home");
      return NextResponse.redirect(new URL("/", request.url));
    }

    logger.success("Middleware", "Usuario es admin, permitiendo acceso");
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
