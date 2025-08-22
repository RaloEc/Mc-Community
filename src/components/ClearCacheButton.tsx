import React from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'

interface ClearCacheButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  redirectTo?: string
}

export default function ClearCacheButton({
  variant = 'outline',
  size = 'sm',
  className = '',
  redirectTo
}: ClearCacheButtonProps) {
  const router = useRouter()

  const handleClearCache = () => {
    try {
      // Limpiar localStorage
      localStorage.clear()
      console.log('✅ localStorage limpiado correctamente')
      
      // Limpiar sessionStorage
      sessionStorage.clear()
      console.log('✅ sessionStorage limpiado correctamente')
      
      // Intentar limpiar caché de aplicación
      if ('caches' in window) {
        caches.keys().then(function(names) {
          for (let name of names) {
            caches.delete(name)
          }
          console.log('✅ Cache API limpiada correctamente')
        })
      }
      
      // Redirigir si se especificó una URL
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        // Recargar la página para aplicar los cambios
        window.location.reload()
      }
    } catch (error) {
      console.error('Error al limpiar caché:', error)
      alert('Error al limpiar la caché: ' + (error as Error).message)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClearCache}
    >
      Limpiar caché
    </Button>
  )
}
