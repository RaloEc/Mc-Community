'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Button } from '@/components/ui/button'
import { Shield, AlertCircle } from 'lucide-react'

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
  const { isLoading, isAdmin, user } = useAdminAuth()
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    // Si no está cargando y no hay usuario, redirigir al login
    if (!isLoading && !user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const redirectUrl = `${fallbackUrl}?redirect=${encodeURIComponent(currentPath)}`
      console.log('[AdminProtection] No hay sesión, redirigiendo a:', redirectUrl)
      router.push(redirectUrl)
      return
    }

    // Si no está cargando, hay usuario pero no es admin, mostrar error
    if (!isLoading && user && !isAdmin) {
      console.log('[AdminProtection] Usuario no es admin:', user.id)
      setShowError(true)
    }
  }, [isLoading, isAdmin, user, router, fallbackUrl])

  // Mientras está cargando, mostrar spinner
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-center text-muted-foreground">{loadingMessage}</p>
      </div>
    )
  }

  // Si hay error de permisos, mostrar mensaje
  if (showError) {
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

  // Si todo está bien, mostrar el contenido
  return (
    <>
      {children}
    </>
  )
}
