import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SupabaseClient } from '@supabase/supabase-js'

// Variable para almacenar la instancia única del cliente
let supabaseInstance: SupabaseClient | null = null

// Función para crear un cliente de Supabase
export function createClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  // Solo crear una nueva instancia si no existe
  supabaseInstance = createClientComponentClient()
  return supabaseInstance
}

// Cliente de Supabase por defecto
export const supabase = createClient()
