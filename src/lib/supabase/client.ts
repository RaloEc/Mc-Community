import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Crea un cliente de Supabase para Client Components
 * Usa createBrowserClient de @supabase/ssr para manejar cookies automáticamente
 * IMPORTANTE: Solo debe usarse en componentes con 'use client'
 */
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}

