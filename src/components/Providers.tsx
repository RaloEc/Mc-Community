'use client'

import { useState, useEffect } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { Session } from '@supabase/supabase-js'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Toaster } from '@/components/ui/sonner'

export default function Providers({
  children,
  session
}: {
  children: React.ReactNode
  session: Session | null
}) {
  const [mounted, setMounted] = useState(false)
  const [supabaseClient, setSupabaseClient] = useState<any>(null)
  
  // Inicializar el cliente de Supabase solo en el lado del cliente
  useEffect(() => {
    // Crear el cliente solo una vez en el lado del cliente
    const client = createClient()
    setSupabaseClient(client)
    setMounted(true)
  }, [])

  // No renderizar nada hasta que estemos montados en el cliente
  // Esto evita problemas de hidratación
  if (!mounted || !supabaseClient) {
    return null
  }

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
