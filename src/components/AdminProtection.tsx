'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface AdminProtectionProps {
  children: React.ReactNode
  loadingMessage?: string
  fallbackUrl?: string
}

export default function AdminProtection({
  children,
  loadingMessage = 'Verificando permisos de administrador...',
  fallbackUrl = '/login'
}: AdminProtectionProps) {
  const router = useRouter()
  const { isLoading, isAdmin, user, profile } = useAdminAuth()
  const hasRedirectedRef = useRef(false)
  
  console.log('[AdminProtection] Render:', {
    isLoading,
    isAdmin,
    hasUser: !!user,
    hasProfile: !!profile,
    role: profile?.role,
  })

  useEffect(() => {
    // Solo actuar cuando ya no esté cargando
    if (isLoading) {
      console.log('[AdminProtection] Cargando autenticación...')
      return
    }

    console.log('[AdminProtection] Verificación completa:', {
      isAdmin,
      hasUser: !!user,
      hasProfile: !!profile,
      role: profile?.role,
    })

    // Si no hay usuario, redirigir al login (solo una vez)
    if (!user && !hasRedirectedRef.current) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const redirectUrl = `${fallbackUrl}?redirect=${encodeURIComponent(currentPath)}`
      console.log('[AdminProtection] No hay sesión, redirigiendo a:', redirectUrl)
      hasRedirectedRef.current = true
      router.push(redirectUrl)
      return
    }

    // Si hay usuario y es admin, todo bien
    if (user && isAdmin) {
      console.log('[AdminProtection] ✅ Usuario es admin, acceso permitido')
    }
  }, [isLoading, isAdmin, user, profile, router, fallbackUrl])

  // Mientras está cargando, mostrar spinner
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-center text-muted-foreground">{loadingMessage}</p>
      </div>
    )
  }

  // Si no hay usuario después de cargar, no mostrar nada (ya se redirigió)
  if (!user) {
    return null
  }

  // Si hay usuario pero no es admin, mostrar error de permisos
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 max-w-md mx-auto">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Acceso denegado</h2>
        <p className="text-center text-muted-foreground mb-6">
          No tienes permisos de administrador para acceder a esta página.
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
          >
            Ir al inicio
          </Button>
          <Button
            onClick={() => router.push('/login')}
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    )
  }

  // Si todo está bien (usuario autenticado y es admin), mostrar el contenido
  return <>{children}</>
}
