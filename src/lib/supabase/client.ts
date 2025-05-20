import { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@/utils/supabase-browser';

// Asegúrate de que estas variables de entorno estén configuradas en tu archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar configuradas');
}

// Función para crear un cliente de Supabase (ahora usa el singleton de utils/supabase-browser.ts)
export function createClient(): SupabaseClient {
  // Usar el cliente singleton implementado en utils/supabase-browser.ts
  return createBrowserClient();
}

// Cliente de Supabase por defecto (también usa el singleton)
export const supabase = createClient();
