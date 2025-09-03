import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Crear cliente de Supabase para Route Handlers
  const supabase = createRouteHandlerClient({ cookies });
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  try {
    if (code) {
      // Intercambiar el código por una sesión
      await supabase.auth.exchangeCodeForSession(code);
    }
    
    // Obtener la URL de redirección personalizada o usar la página principal
    const redirectParam = requestUrl.searchParams.get('redirect') || '/';
    
    // Obtener la URL base del sitio
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    console.log('URL base del sitio para redirección:', siteUrl);
    
    // Asegurar que la redirección sea una ruta válida (evitar redirecciones externas)
    let redirectUrl;
    if (redirectParam.startsWith('http')) {
      // Si es una URL externa, verificar si es del mismo dominio
      const redirectDomain = new URL(redirectParam).origin;
      if (redirectDomain === siteUrl) {
        // Si es del mismo dominio, permitir la redirección
        redirectUrl = new URL(redirectParam);
      } else {
        // Si es de otro dominio, redirigir a la página principal
        console.log('Redirección externa bloqueada:', redirectParam);
        redirectUrl = new URL('/', siteUrl);
      }
    } else {
      // Si es una ruta relativa, construir la URL completa
      redirectUrl = new URL(redirectParam, siteUrl);
    }
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error en el callback de autenticación:', error);
    // En caso de error, redirigir a la página de login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
