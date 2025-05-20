'use client';

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SupabaseClient } from '@supabase/supabase-js';

// Variable para almacenar la instancia única del cliente
let supabaseInstance: SupabaseClient | null = null;

// Cliente para el navegador (implementación singleton)
export const createBrowserClient = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  // Solo crear una nueva instancia si no existe
  supabaseInstance = createClientComponentClient();
  return supabaseInstance;
};
