'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { getRedirectUrl } from '@/lib/utils/auth-utils'

type Provider = 'discord' | 'facebook' | 'google' | 'twitch'

interface OAuthButtonsProps {
  redirectTo?: string
  className?: string
  onSuccess?: () => void
}

export function OAuthButtons({ redirectTo = '/', className = '', onSuccess }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState<Provider | null>(null)
  const supabase = createClient()

  const handleOAuthSignIn = async (provider: Provider) => {
    try {
      setIsLoading(provider)
      // Usar URL absoluta completa para evitar problemas de redirección
      // Usar NEXT_PUBLIC_SITE_URL si está disponible, de lo contrario usar window.location.origin
      const baseUrl = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL 
        ? process.env.NEXT_PUBLIC_SITE_URL 
        : window.location.origin
      
      console.log('Base URL para redirección OAuth:', baseUrl)
      
      const redirectUrl = new URL('/auth/callback', baseUrl)
      // Obtener la URL guardada para redirección o usar la página principal
      const targetRedirect = getRedirectUrl('/')
      redirectUrl.searchParams.set('redirect', targetRedirect)
      
      console.log('Iniciando OAuth con:', {
        provider,
        redirectTo: redirectUrl.toString()
      })
      
      // Configuración específica para cada proveedor
      const options: {
        redirectTo: string;
        skipBrowserRedirect: boolean;
        queryParams?: Record<string, string>;
      } = {
        redirectTo: redirectUrl.toString(),
        skipBrowserRedirect: false,
      }
      
      // Google requiere configuración adicional para asegurar que funcione correctamente
      if (provider === 'google') {
        options.queryParams = {
          // Solicitar acceso al email y perfil básico
          access_type: 'offline',
          prompt: 'consent',
        }
      }
      
      console.log(`Iniciando OAuth con ${provider}, opciones:`, options)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      })
      
      // Verificar si tenemos una URL para redireccionar
      if (data?.url) {
        console.log(`Redirigiendo a: ${data.url}`)
      }

      if (error) {
        toast.error(`Error al iniciar sesión con ${provider}: ${error.message}`)
      }
    } catch (error) {
      console.error(`Error OAuth ${provider}:`, error)
      toast.error(`Ocurrió un error al conectar con ${provider}`)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>

      {/*DISCORD*/}
      {/* <Button
        variant="outline"
        onClick={() => handleOAuthSignIn('discord')}
        disabled={isLoading !== null}
        className="flex items-center justify-center gap-2"
      >
        {isLoading === 'discord' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="font-bold text-indigo-500">D</span>
        )}
        Discord
      </Button> */}
      
      {/*FACEBOOK*/}
      {/* <Button
        variant="outline"
        onClick={() => handleOAuthSignIn('facebook')}
        disabled={isLoading !== null}
        className="flex items-center justify-center gap-2"
      >
        {isLoading === 'facebook' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="font-bold text-blue-600">f</span>
        )}
        Facebook
      </Button> */}
      
      {/*GOOGLE*/}
      <Button
        variant="outline"
        onClick={() => handleOAuthSignIn('google')}
        disabled={isLoading !== null}
        className="flex items-center justify-center gap-2"
      >
        {isLoading === 'google' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="font-bold text-red-500">G</span>
        )}
        Google
      </Button>
      
      {/*TWITCH*/}
      {/* <Button
        variant="outline"
        onClick={() => handleOAuthSignIn('twitch')}
        disabled={isLoading !== null}
        className="flex items-center justify-center gap-2"
      >
        {isLoading === 'twitch' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="font-bold text-purple-600">T</span>
        )}
        Twitch
      </Button> */}
    </div>
  )
}
