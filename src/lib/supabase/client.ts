import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SupabaseClient, createClient as createSupabaseClient } from '@supabase/supabase-js'

// Variables para almacenar instancias singleton
// Usamos un objeto global para evitar reinicializaciones en hot reloading
declare global {
  var _persistentClientInstance: SupabaseClient | undefined
  var _nonPersistentClientInstance: SupabaseClient | undefined
  var _clientInitialized: boolean | undefined
}

// Inicializar las variables globales si no existen
if (typeof window !== 'undefined' && !global._clientInitialized) {
  global._persistentClientInstance = undefined;
  global._nonPersistentClientInstance = undefined;
  global._clientInitialized = true;
  console.log('[client.ts] Inicializando variables globales de Supabase');
}

/**
 * Crea o reutiliza un cliente de Supabase
 * Implementa un patrón singleton estricto para evitar múltiples instancias
 */
export function createClient(options?: { disablePersistence?: boolean }): SupabaseClient {
  // Si estamos en el servidor, siempre creamos una nueva instancia
  const isServer = typeof window === 'undefined';
  
  // Si se solicita explícitamente desactivar la persistencia
  if (options?.disablePersistence) {
    // En el servidor, crear una nueva instancia
    if (isServer) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      
      return createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'no-persist-key'
        }
      })
    }
    
    // En el cliente, reutilizar la instancia si existe
    if (!global._nonPersistentClientInstance) {
      console.log('[client.ts] Creando nueva instancia de cliente no persistente');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      
      global._nonPersistentClientInstance = createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'no-persist-key'
        }
      })
    } else {
      console.log('[client.ts] Reutilizando instancia existente de cliente no persistente');
    }
    
    return global._nonPersistentClientInstance
  }
  
  // Para cliente con persistencia normal
  // En el servidor, crear una nueva instancia
  if (isServer) {
    return createClientComponentClient()
  }
  
  // En el cliente, reutilizar la instancia si existe
  if (!global._persistentClientInstance) {
    console.log('[client.ts] Creando nueva instancia de cliente persistente');
    global._persistentClientInstance = createClientComponentClient()
  } else {
    console.log('[client.ts] Reutilizando instancia existente de cliente persistente');
  }
  
  return global._persistentClientInstance
}

/**
 * Crea o reutiliza un cliente sin persistencia
 * Útil para operaciones de logout o verificación de sesión
 */
export function createNonPersistentClient(): SupabaseClient {
  return createClient({ disablePersistence: true })
}

// Función para limpiar instancias (útil para testing y depuración)
export function clearClientInstances() {
  if (typeof window !== 'undefined') {
    console.log('[client.ts] Limpiando instancias de cliente Supabase');
    global._persistentClientInstance = undefined;
    global._nonPersistentClientInstance = undefined;
  }
}

/**
 * Obtiene la instancia existente del cliente sin crear una nueva
 * @param nonPersistent Si es true, devuelve la instancia no persistente
 * @returns La instancia existente o undefined si no existe
 */
export function getExistingClient(nonPersistent?: boolean): SupabaseClient | undefined {
  if (typeof window === 'undefined') return undefined; // En servidor siempre undefined
  
  return nonPersistent 
    ? global._nonPersistentClientInstance 
    : global._persistentClientInstance;
}

