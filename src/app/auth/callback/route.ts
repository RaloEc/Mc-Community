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
    
    // Asegurar que la redirección sea una ruta válida (evitar redirecciones externas)
    const redirectUrl = redirectParam.startsWith('http') 
      ? new URL('/', request.url) // Si es una URL externa, redirigir a la página principal
      : new URL(redirectParam, request.url);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error en el callback de autenticación:', error);
    // En caso de error, redirigir a la página de login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
