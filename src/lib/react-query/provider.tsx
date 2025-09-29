'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode, useEffect } from 'react';

// Opciones de configuración para el QueryClient
const queryClientOptions = {
  defaultOptions: {
    queries: {
      // No revalidar automáticamente al recuperar el foco
      refetchOnWindowFocus: false,
      // Mantener los datos en caché durante 10 minutos (optimizado)
      staleTime: 10 * 60 * 1000,
      // Reintentar 2 veces en caso de error con backoff exponencial
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Tiempo de caché para datos inactivos (30 minutos)
      gcTime: 30 * 60 * 1000,
      // Priorizar datos en caché mientras se revalidan
      keepPreviousData: true,
      // Refrescar datos en segundo plano
      refetchInBackground: true,
    },
    mutations: {
      // Reintentar 1 vez en caso de error
      retry: 1,
      retryDelay: 1000,
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
      if (document.visibilityState === 'hidden') {
        queryClient.cancelQueries();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
