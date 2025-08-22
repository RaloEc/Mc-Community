'use client'

import { useState, useEffect, useRef } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { Session, SupabaseClient } from '@supabase/supabase-js'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/AuthContext'
import { createClient, getExistingClient } from '@/lib/supabase/client'
import { Toaster } from '@/components/ui/sonner'

export default function Providers({
  children,
  session
}: {
  children: React.ReactNode
  session: Session | null
}) {
  const [mounted, setMounted] = useState(false)
  const supabaseClientRef = useRef<SupabaseClient | null>(null)
  
  // Inicializar el cliente de Supabase solo en el lado del cliente
  useEffect(() => {
    setMounted(true)
    
    // Inicializar el cliente solo una vez
    if (!supabaseClientRef.current) {
      // Intentar obtener una instancia existente primero
      supabaseClientRef.current = getExistingClient() || createClient()
      console.log('[Providers] Cliente Supabase inicializado')
    }
  }, [])

  // Renderizar un esqueleto básico durante la hidratación
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-4">
          {/* Esqueleto básico para evitar saltos de layout */}
        </div>
      </div>
    )
  }

  // Usar el cliente singleton para evitar múltiples instancias
  // Si estamos en el servidor o no tenemos una instancia, crear una nueva
  const supabaseClient = typeof window === 'undefined' 
    ? createClient() 
    : (supabaseClientRef.current || getExistingClient() || createClient())
  
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SessionContextProvider supabaseClient={supabaseClient} initialSession={session}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </SessionContextProvider>
    </ThemeProvider>
  )
}
