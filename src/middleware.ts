import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Rutas que requieren autenticación de administrador
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar si la ruta es administrativa
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))

  if (isAdminRoute) {
    // Crear cliente de Supabase para el servidor
    const supabase = createClient()

    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()

    // Si no hay sesión, redirigir al login con parámetro de redirección
    if (!session) {
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

    // Si hay error o el usuario no es admin, redirigir a la página principal
    if (error || !profile || profile.role !== 'admin') {
      // Opcionalmente podríamos redirigir a una página de acceso denegado
      return NextResponse.redirect(new URL('/', request.url))
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
