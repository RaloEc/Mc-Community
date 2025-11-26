"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, ReactNode, useEffect } from "react";

/**
 * Configuración optimizada de TanStack Query para KoreStats
 *
 * Objetivo: Mantener datos en caché durante la navegación
 * para evitar pantallas blancas y spinners innecesarios
 *
 * Flujo ideal:
 * 1. Usuario en /perfil?tab=lol (datos en caché)
 * 2. Navega a /match/[id] (modal o página)
 * 3. Vuelve a /perfil (datos instantáneos del caché ✅)
 */
const queryClientOptions = {
  defaultOptions: {
    queries: {
      // ✅ 5 minutos: Datos se consideran "frescos" sin refetch automático
      // Después de esto, si se hace refetch, se marcará como stale
      // PERO no hará refetch automático (porque refetchOnWindowFocus: false)
      staleTime: 5 * 60 * 1000,

      // ✅ 10 minutos: Tiempo que los datos permanecen en caché
      // Después de esto, se eliminan de memoria (garbage collection)
      // Esto es importante para no llenar la memoria con datos antiguos
      gcTime: 10 * 60 * 1000,

      // ✅ false: No refetch cuando la ventana recupera foco
      // Evita spinners cuando el usuario vuelve de otra pestaña
      refetchOnWindowFocus: false,

      // ✅ false: No refetch cuando se recupera la conexión
      // Evita recargas innecesarias en redes inestables
      refetchOnReconnect: false,

      // ✅ false: No refetch cuando un componente se monta
      // Los datos del caché se usan inmediatamente
      refetchOnMount: false,

      // ✅ true: Mostrar datos anteriores mientras se revalidan
      // Evita "parpadeos" cuando se hace refetch en segundo plano
      keepPreviousData: true,

      // ✅ false: No refrescar datos en segundo plano automáticamente
      // Solo refetch cuando el usuario lo solicita explícitamente
      refetchInBackground: false,

      // ✅ 1 intento en caso de error (no bombardear servidor)
      retry: 1,

      // ✅ Delay entre reintentos: 1 segundo
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // ✅ 1 intento para mutaciones
      retry: 1,

      // ✅ Delay entre reintentos: 1 segundo
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
};

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Crear una instancia de QueryClient para cada sesión de usuario
  // Esto evita compartir estado entre diferentes usuarios en SSR
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  // Optimización: Pausar consultas cuando la página no está visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Pausar consultas cuando la página no está visible
      if (document.visibilityState === "hidden") {
        queryClient.cancelQueries();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
