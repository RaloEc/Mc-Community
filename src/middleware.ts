import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rutas que requieren autenticación de administrador
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('[Middleware] Procesando ruta:', pathname)

  // Crear respuesta que será retornada
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Crear cliente de Supabase para refrescar la sesión
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Solo actualizar cookies si hay cambios reales
          if (cookiesToSet.length === 0) return
          
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refrescar la sesión si es necesario
  // Esto actualizará automáticamente las cookies a través de los métodos set/remove
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  console.log('[Middleware] Sesión refrescada:', {
    hasSession: !!session,
    userId: session?.user?.id,
    error: sessionError?.message
  })
  
  // Si es la página principal después de un callback OAuth, asegurar que la sesión se propague
  if (pathname === '/' && session) {
    // Agregar header para indicar que hay sesión activa
    response.headers.set('X-Auth-Session', 'true')
    console.log('[Middleware] Sesión activa detectada en página principal')
  }

  // Verificar si la ruta es administrativa
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))

  if (isAdminRoute) {
    try {
      // Si no hay sesión, redirigir al login con parámetro de redirección
      if (!session) {
        console.log('[Middleware] No hay sesión, redirigiendo a login')
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Si hay sesión, verificar si es admin consultando la tabla perfiles
      const { data: profile, error } = await supabase
        .from('perfiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      console.log('[Middleware] Verificación de perfil:', {
        hasProfile: !!profile,
        role: profile?.role,
        error: error?.message
      })

      // Si hay error o el usuario no es admin, redirigir a la página principal
      if (error || !profile || profile.role !== 'admin') {
        console.log('[Middleware] Usuario no es admin, redirigiendo a home')
        return NextResponse.redirect(new URL('/', request.url))
      }

      console.log('[Middleware] ✅ Usuario es admin, permitiendo acceso')
    } catch (error) {
      console.error('[Middleware] Error inesperado:', error)
      // En caso de error en rutas admin, redirigir a home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Retornar la respuesta con las cookies actualizadas
  return response
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
