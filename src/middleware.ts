import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lista de rutas que no necesitan verificación de autenticación
const PUBLIC_ROUTES = [
  '/_next/',
  '/favicon.ico',
  '/public/',
  '/images/',
  '/fonts/',
  '/api/',
  '/login',
  '/register',
  '/logout',
  '/reset-password',
]

// Rutas que requieren autenticación de admin
const ADMIN_ROUTES = [
  '/admin/dashboard',
  '/admin/noticias',
  '/admin/usuarios',
  '/admin/foro',
  '/admin/servidores',
  '/admin/mods',
  '/admin/recursos',
  '/admin/sync'
]

export async function middleware(req: NextRequest) {
  // No ejecutar el middleware para rutas públicas
  if (PUBLIC_ROUTES.some(route => req.nextUrl.pathname.includes(route))) {
    return NextResponse.next()
  }

  // Verificar si la ruta actual es una ruta de admin
  const isAdminRoute = ADMIN_ROUTES.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Si no es una ruta de admin, no necesitamos verificar nada
  if (!isAdminRoute) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  
  try {
    const supabase = createMiddlewareClient({ req, res })

    // Obtener la sesión del usuario solo para rutas de admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Si es una ruta de admin y no hay sesión, redirigir a login
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Verificar el rol solo si es necesario (ruta de admin y hay sesión)
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
      console.error('Error verificando rol de admin:', error)
      return res
    }
  } catch (error) {
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
