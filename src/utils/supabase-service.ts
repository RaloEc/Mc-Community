import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Cliente de servicio para operaciones administrativas
export const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Faltan variables de entorno para el cliente de servicio de Supabase');
  }
  
  // Solo usar cookies en el servidor
  const cookieStore = typeof window === 'undefined' ? cookies() : null;
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: 'mc-community-auth',
      storage: {
        getItem: async (key: string) => {
          if (typeof window !== 'undefined') return null; // No usar en el cliente
          const cookie = cookieStore?.get(key);
          return cookie?.value || null;
        },
        setItem: async (key: string, value: string) => {
          if (typeof window !== 'undefined') return; // No usar en el cliente
          cookieStore?.set(key, value, { path: '/' });
        },
        removeItem: async (key: string) => {
          if (typeof window !== 'undefined') return; // No usar en el cliente
          cookieStore?.delete(key);
        },
      },
    },
  });
};
