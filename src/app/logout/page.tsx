'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Cerrando sesión...')

  useEffect(() => {
    async function cerrarSesion() {
      try {
        const supabase = createClient()
        
        // Intentar cerrar sesión
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.error('Error al cerrar sesión:', error)
          setMessage('Error al cerrar sesión: ' + error.message)
          return
        }
        
        // Limpiar localStorage manualmente por si acaso
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('supabase.auth.expires_at')
        localStorage.removeItem('supabase.auth.refresh_token')
        
        setMessage('Sesión cerrada correctamente. Redirigiendo...')
        
        // Redirigir después de un breve retraso
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 2000)
      } catch (error) {
        console.error('Error inesperado:', error)
        setMessage('Error inesperado al cerrar sesión')
      }
    }
    
    cerrarSesion()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-md">
        <h1 className="text-center text-2xl font-bold">Cerrar Sesión</h1>
        <p className="text-center">{message}</p>
      </div>
    </div>
  )
}
