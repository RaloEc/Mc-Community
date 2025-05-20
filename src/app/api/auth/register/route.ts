import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServiceClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();
    
    // Validaciones básicas
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Cliente normal para autenticación
    const supabase = createRouteHandlerClient({ cookies });
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Registrar al usuario
    console.log('Intentando registrar usuario con email:', email);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (signUpError) {
      console.error('Error en signUp:', signUpError);
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    // Si el registro fue exitoso, ahora creamos el perfil usando el cliente de servicio
    if (data.user) {
      try {
        // Cliente de servicio para saltarse RLS
        const serviceClient = getServiceClient();
        
        console.log('Intentando crear perfil con ID:', data.user.id, 'username:', username, 'email:', email);
        
        // Intentar crear el perfil sin usar la columna email
        let profileError = null;
        
        try {
          // Intentar crear el perfil usando SQL directo para evitar problemas
          console.log('Intentando insertar perfil con SQL directo:', {
            id: data.user.id,
            username,
            role: 'user'
          });
          
          // Intentar insertar directamente con el método estándar
          const { error: sqlError } = await serviceClient
            .from('perfiles')
            .upsert({
              id: data.user.id,
              username,
              role: 'user'
            }, {
              onConflict: 'id',
              ignoreDuplicates: true
            });
          
          if (sqlError) {
            console.error('Error al insertar perfil con SQL directo:', sqlError);
            
            // Intento alternativo con el método estándar
            console.log('Intentando método alternativo de inserción...');
            const { error: insertError } = await serviceClient
              .from('perfiles')
              .insert({
                id: data.user.id,
                username,
                role: 'user'
              });
              
            if (insertError) {
              console.error('Error en método alternativo:', insertError);
              profileError = insertError;
            } else {
              console.log('Perfil creado exitosamente con método alternativo');
            }
          } else {
            console.log('Perfil creado exitosamente con SQL directo');
          }
        } catch (err) {
          console.error('Error al crear perfil:', err);
          profileError = err;
        }

        if (profileError) {
          // Si hay error al crear el perfil, registramos detalles para depuración
          console.error('Error al crear perfil:', profileError);
          
          // Verificar si el error está relacionado con la columna email
          if (profileError.message && profileError.message.includes('email')) {
            return NextResponse.json(
              { error: 'Error con el campo email: ' + profileError.message },
              { status: 400 }
            );
          }
          
          return NextResponse.json(
            { error: 'Error al crear el perfil de usuario: ' + profileError.message },
            { status: 500 }
          );
        }
      } catch (profileCreationError) {
        console.error('Error inesperado al crear perfil:', profileCreationError);
        return NextResponse.json(
          { error: 'Error inesperado al crear el perfil de usuario' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
