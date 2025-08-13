'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminLoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Obtener la URL de redirección si existe
    const redirect = searchParams.get('redirect') || '/admin/dashboard'
    
    // Redirigir a la página de login principal con el parámetro de redirección
    const loginUrl = new URL('/login', window.location.origin)
    loginUrl.searchParams.set('redirect', redirect)
    
    router.replace(loginUrl.toString())
  }, [router, searchParams])
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium">Redirigiendo al login...</p>
          <p className="text-sm text-muted-foreground">
            Serás redirigido a la página de inicio de sesión principal.
          </p>
        </div>
      </div>
    </div>
  )
}