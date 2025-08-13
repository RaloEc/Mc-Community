'use client'

import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface AdminProtectionProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallbackUrl?: string
  loadingMessage?: string
}

export default function AdminProtection({ 
  children, 
  requireAdmin = true, 
  fallbackUrl = '/login',
  loadingMessage = 'Verificando permisos de administrador...'
}: AdminProtectionProps) {
  const { isLoading, isAdmin, user, profile } = useAdminAuth()

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">{loadingMessage}</p>
            <p className="text-sm text-muted-foreground">
              Esto puede tomar unos segundos...
            </p>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Si se requiere admin y el usuario no es admin, mostrar mensaje de acceso denegado
  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Acceso Restringido</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a esta sección
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Esta página requiere permisos de administrador.
              </p>
              {user && profile && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p><strong>Usuario:</strong> {profile.username || user.email}</p>
                  <p><strong>Rol:</strong> {profile.role || 'usuario'}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href="/">
                  Volver al inicio
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">
                  Iniciar sesión
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si no se requiere admin o el usuario es admin, mostrar el contenido
  if (!requireAdmin || isAdmin) {
    return <>{children}</>
  }

  // Fallback - no debería llegar aquí
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-warning/10 p-3">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </div>
          <CardTitle className="text-xl">Error de Autenticación</CardTitle>
          <CardDescription>
            Ocurrió un error al verificar tus permisos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Por favor, intenta recargar la página o contacta al soporte técnico.
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <Button onClick={() => window.location.reload()}>
              Recargar página
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                Volver al inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
