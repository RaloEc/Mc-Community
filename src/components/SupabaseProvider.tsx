'use client'

import { useState } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export default function SupabaseProvider({
  initialSession,
  children,
}: {
  initialSession: Session | null
  children: React.ReactNode
}) {
  // Usar nuestro patrón singleton para evitar múltiples instancias
  const [supabaseClient] = useState(() => createClient())

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  )
}
