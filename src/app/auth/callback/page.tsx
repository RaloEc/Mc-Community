'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
  const searchParams = useSearchParams()
  // Siempre redirigir a la página principal
  const redirectTo = '/'

  useEffect(() => {
    let mounted = true;
    
    // Función para manejar el callback de OAuth
    const handleCallback = async () => {
      try {
        const supabase = createClient()
        
        // Obtener el código de la URL y otros parámetros
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        console.log('Parámetros de callback:', { code, errorParam, redirectTo })
        
        // Si hay un error en la URL, lo mostramos y redirigimos
        if (errorParam) {
          console.error('Error OAuth:', errorParam, errorDescription)
          toast.error(`Error de autenticación: ${errorDescription || errorParam}`)
          window.location.href = '/login'
          return
        }
        
        // Si hay un código en la URL, procesarlo
        if (code) {
          console.log('Código OAuth detectado, procesando...')
          
          // Intercambiar el código por una sesión
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Error en intercambio:', exchangeError)
            toast.error(`Error: ${exchangeError.message}`)
            window.location.href = '/login'
            return
          }
          
          if (!exchangeData?.session) {
            console.error('No se recibió sesión')
            toast.error('No se pudo completar la autenticación')
            window.location.href = '/login'
            return
          }
        }

        // Obtener la sesión actual (debería estar disponible después del intercambio)
        const { data } = await supabase.auth.getSession()
        
        if (data?.session) {
          // Verificar si el usuario ya tiene un perfil
          const { data: profileData } = await supabase
            .from('perfiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single()

          // Si no tiene perfil, crearlo
          if (!profileData) {
            const username = data.session.user.user_metadata.full_name || 
                            data.session.user.user_metadata.name ||
                            data.session.user.user_metadata.user_name ||
                            data.session.user.user_metadata.preferred_username ||
                            data.session.user.email?.split('@')[0] ||
                            `user_${Math.floor(Math.random() * 10000)}`

            console.log('Creando perfil para usuario:', username)
            const { error: insertError } = await supabase
              .from('perfiles')
              .insert([
                {
                  id: data.session.user.id,
                  username,
                  role: 'user',
                  avatar_url: data.session.user.user_metadata.avatar_url || null,
                  updated_at: new Date().toISOString()
                }
              ])
              
            if (insertError) {
              console.error('Error al crear perfil:', insertError)
              // Continuamos aunque haya error, para no bloquear el login
            } else {
              console.log('Perfil creado exitosamente')
            }
          }

          // Mostrar mensaje de éxito y redirigir inmediatamente
          toast.success('Inicio de sesión exitoso')
          
          // Redirección inmediata
          if (mounted) {
            console.log('Redirigiendo a:', redirectTo)
            window.location.href = redirectTo
          }
        } else {
          // No hay sesión, redirigir a login
          console.error('No se encontró sesión después del proceso')
          toast.error('No se pudo completar la autenticación')
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Error inesperado en callback:', error)
        toast.error('Ocurrió un error inesperado')
        window.location.href = '/login'
      }
    }

    // Ejecutar el callback inmediatamente
    handleCallback()
    
    // Limpieza
    return () => {
      mounted = false
    }
  }, [redirectTo, searchParams])

  // Renderizamos una página HTML con redirección automática
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content="0;url=/" />
        <title>Redirigiendo...</title>
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #121212;
            color: white;
            text-align: center;
          }
          .container {
            max-width: 500px;
            padding: 20px;
          }
          .loader {
            border: 5px solid #333;
            border-radius: 50%;
            border-top: 5px solid #4CAF50;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </head>
      <body>
        <div className="container">
          <h1>Inicio de sesión exitoso</h1>
          <div className="loader"></div>
          <p>Redirigiendo a la página principal...</p>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          // Redirección inmediata a la página principal
          window.onload = function() {
            window.location.href = '/';
          };
        `}} />
      </body>
    </html>
  )
}
