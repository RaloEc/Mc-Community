import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // No ejecutar el middleware para recursos estáticos o favicon
  if (
    req.nextUrl.pathname.includes('/_next/') ||
    req.nextUrl.pathname.includes('/favicon.ico') ||
    req.nextUrl.pathname.includes('/public/') ||
    req.nextUrl.pathname.includes('/images/') ||
    req.nextUrl.pathname.includes('/fonts/')
  ) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  
  try {
    const supabase = createMiddlewareClient({ req, res })

    // Obtener la sesión del usuario
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Rutas que requieren autenticación de admin
    const adminRoutes = [
      '/admin/dashboard',
      '/admin/noticias',
      '/admin/usuarios',
      '/admin/foro',
      '/admin/servidores',
      '/admin/mods',
      '/admin/recursos',
      '/admin/sync'
    ]

    // Verificar si la ruta actual es una ruta de admin
    const isAdminRoute = adminRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    )

    // Si es una ruta de admin y no hay sesión, redirigir a login
    if (isAdminRoute && !session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Si hay sesión y es una ruta de admin, verificar el rol
    if (isAdminRoute && session) {
      try {
        const { data: profile, error } = await supabase
          .from('perfiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        // Si hay error al obtener el perfil o el usuario no es admin
        if (error || !profile || profile.role !== 'admin') {
          // Redirigir a la página principal
          return NextResponse.redirect(new URL('/', req.url))
        }
      } catch (error) {
        // En caso de error, simplemente continuar (más tolerante en producción)
        console.error('Error verificando rol de admin:', error)
        return res
      }
    }
  } catch (error) {
    // En caso de error con Supabase, permitir que la solicitud continúe
    console.error('Error en middleware:', error)
    return res
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
