'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

interface PerfilErrorProps {
  error: Error
  onRetry?: () => void
}

export const PerfilError = ({ error, onRetry }: PerfilErrorProps) => {
  const isNotFound = error.message.includes('no encontrado')

  return (
    <div className="container mx-auto py-20 px-4 animate-in fade-in duration-500">
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">
                {isNotFound ? 'Perfil no encontrado' : 'Error al cargar'}
              </h1>
              <p className="text-muted-foreground">
                {isNotFound 
                  ? 'El usuario que buscas no existe o ha sido eliminado.'
                  : 'Hubo un problema al cargar el perfil. Por favor, intenta de nuevo.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild variant="default">
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Volver al inicio
                </Link>
              </Button>
              
              {!isNotFound && onRetry && (
                <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
