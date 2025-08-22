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
  '/clear-cache.html'
]

export async function middleware(req: NextRequest) {
  // No ejecutar el middleware para rutas públicas
  if (PUBLIC_ROUTES.some(route => req.nextUrl.pathname.includes(route))) {
    return NextResponse.next()
  }

  // Verificar si la ruta actual es una ruta de admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    try {
      console.log('[Middleware] Verificando acceso a ruta admin:', req.nextUrl.pathname)
      
      // Crear cliente de Supabase para el middleware
      const res = NextResponse.next()
      const supabase = createMiddlewareClient({ req, res })
      
      // Verificar si hay sesión activa
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('[Middleware] No hay sesión activa, redirigiendo a login')
        const redirectUrl = new URL('/login', req.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Verificar si el usuario tiene rol de administrador
      try {
        // Consulta directa y simple
        const { data: perfil, error } = await supabase
          .from('perfiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        // Log detallado para depuración
        console.log('[Middleware] Resultado consulta perfil:', {
          userId: session.user.id,
          perfilData: perfil,
          error: error?.message,
          timestamp: new Date().toISOString()
        })
        
        if (error) {
          console.error('[Middleware] Error al obtener perfil:', error.message)
          return NextResponse.redirect(new URL('/login', req.url))
        }
        
        // Verificación estricta del rol admin
        if (!perfil || perfil.role !== 'admin') {
          console.log('[Middleware] Usuario no es admin:', perfil?.role || 'sin rol')
          return NextResponse.redirect(new URL('/', req.url))
        }
        
        console.log('[Middleware] Acceso admin verificado para:', session.user.email)
        return res
      } catch (perfilError) {
        console.error('[Middleware] Excepción al verificar perfil admin:', perfilError)
        return NextResponse.redirect(new URL('/login', req.url))
      }
    } catch (error) {
      console.error('[Middleware] Error general en middleware:', error)
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Para rutas no admin, permitir acceso
  return NextResponse.next()
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
