import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Rutas que requieren autenticación de administrador
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('[Middleware] Procesando ruta:', pathname)

  // Verificar si la ruta es administrativa
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))

  if (isAdminRoute) {
    try {
      // Crear cliente de Supabase para el servidor con las cookies de la request
      const response = NextResponse.next()
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value,
                ...options,
              })
              response.cookies.set({
                name,
                value,
                ...options,
              })
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value: '',
                ...options,
              })
              response.cookies.set({
                name,
                value: '',
                ...options,
              })
            },
          },
        }
      )

      // Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      console.log('[Middleware] Verificación de sesión:', {
        hasSession: !!session,
        userId: session?.user?.id,
        error: sessionError?.message
      })

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
      return response
    } catch (error) {
      console.error('[Middleware] Error inesperado:', error)
      // En caso de error, permitir que el componente cliente maneje la verificación
      return NextResponse.next()
    }
  }

  // Si todo está bien o no es una ruta protegida, continuar
  return NextResponse.next()
}

// Configurar las rutas en las que se ejecutará el middleware
export const config = {
  matcher: [
    // Rutas administrativas
    '/admin/:path*',
  ],
}
