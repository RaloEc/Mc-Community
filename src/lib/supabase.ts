import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Variable para almacenar la instancia del cliente de servicio
let serviceClientInstance: ReturnType<typeof createClient> | null = null;

// Detectar si estamos en el navegador o en el servidor
const isBrowser = typeof window !== "undefined";

// Cliente principal de Supabase con configuración mejorada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser, // Solo persistir sesión en el navegador
    autoRefreshToken: isBrowser, // Solo refrescar token en el navegador
    detectSessionInUrl: isBrowser, // Solo detectar sesión en URL en el navegador
    storageKey: "korestats-auth",
    debug: true, // Activamos el modo debug para ver más información en la consola
    flowType: "pkce", // Usar PKCE para mayor seguridad
    storage: isBrowser
      ? {
          getItem: (key) => {
            try {
              const item = localStorage.getItem(key);
              console.log(
                `[Auth] Recuperando clave ${key}: ${
                  item ? "Encontrada" : "No encontrada"
                }`
              );
              return item;
            } catch (error) {
              console.error(`[Auth] Error al recuperar clave ${key}:`, error);
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              localStorage.setItem(key, value);
              console.log(`[Auth] Guardando clave ${key}: Éxito`);
            } catch (error) {
              console.error(`[Auth] Error al guardar clave ${key}:`, error);
            }
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key);
              console.log(`[Auth] Eliminando clave ${key}: Éxito`);
            } catch (error) {
              console.error(`[Auth] Error al eliminar clave ${key}:`, error);
            }
          },
        }
      : {
          // Implementación de almacenamiento para el servidor (no hace nada)
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
  },
  global: {
    headers: {
      "x-application-name": "korestats",
    },
  },
  realtime: {
    timeout: 10000,
  },
});

// Función para obtener el cliente de servicio (para operaciones administrativas)
export const getServiceClient = () => {
  try {
    // Si ya existe una instancia, la devolvemos
    if (serviceClientInstance) {
      return serviceClientInstance;
    }

    // Obtener la clave de servicio
    let serviceKey = process.env.SUPABASE_SERVICE_KEY;

    // Verificar si la clave de servicio está disponible y es válida
    if (!serviceKey || serviceKey.length < 30) {
      console.warn(
        "SUPABASE_SERVICE_KEY no válida, intentando con NEXT_PUBLIC_SUPABASE_SERVICE_KEY"
      );
      serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;
    }

    // Si ninguna clave de servicio es válida, usar la clave anónima como último recurso
    if (!serviceKey || serviceKey.length < 30) {
      console.warn(
        "No se encontró una clave de servicio válida, usando clave anónima (esto puede causar problemas con RLS)"
      );
      serviceKey = supabaseAnonKey;
    }

    // Verificar que tenemos una URL válida
    if (!supabaseUrl || supabaseUrl.length < 10) {
      console.error("URL de Supabase no válida");
      // En caso de error, devolvemos el cliente normal como último recurso
      return supabase;
    }

    console.log(
      `Creando cliente de servicio de Supabase con URL: ${supabaseUrl}`
    );

    // Crear nueva instancia y guardarla
    serviceClientInstance = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      },
      global: {
        headers: {
          "x-application-name": "korestats-admin", // Identificador para depuración
        },
      },
    });

    // Verificar que la instancia se creó correctamente
    if (!serviceClientInstance) {
      console.error(
        "No se pudo crear el cliente de servicio, usando cliente normal como fallback"
      );
      return supabase;
    }

    return serviceClientInstance;
  } catch (error) {
    console.error("Error al crear cliente de servicio de Supabase:", error);
    // En caso de error, devolvemos el cliente normal como último recurso
    return supabase;
  }
};

// Función para verificar la conexión a Supabase
export const checkSupabaseConnection = async () => {
  try {
    // Intenta hacer una consulta simple para verificar la conexión
    const { error } = await supabase.from("perfiles").select("id").limit(1);

    if (error) {
      console.error("Error al verificar conexión con Supabase:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error al verificar conexión con Supabase:", error);
    return { success: false, error: error.message };
  }
};
