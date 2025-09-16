import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Detectar si estamos en el navegador o en el servidor
const isBrowser = typeof window !== 'undefined';

// Obtener las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Función para crear un cliente de Supabase
const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      storageKey: 'mc-community-auth',
    },
    global: {
      headers: {
        'x-application-name': 'mc-community',
      },
    },
  });
};

export default createClient;
