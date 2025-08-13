import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
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

  // Verificar si la ruta actual es una ruta de admin (excluyendo login)
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
        console.log('Usuario sin permisos de admin intentando acceder:', {
          userId: session.user.id,
          role: profile?.role,
          error: error?.message
        })
        
        // Redirigir a la página principal
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch (error) {
      console.error('Error verificando rol de admin en middleware:', error)
      return NextResponse.redirect(new URL('/login', req.url))
    }
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
