'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

// Opciones de configuración para el QueryClient
const queryClientOptions = {
  defaultOptions: {
    queries: {
      // No revalidar automáticamente al recuperar el foco
      refetchOnWindowFocus: false,
      // Mantener los datos en caché durante 5 minutos
      staleTime: 5 * 60 * 1000,
      // Reintentar 1 vez en caso de error
      retry: 1,
      // Tiempo de caché para datos inactivos (10 minutos)
      gcTime: 10 * 60 * 1000,
    },
  },
};

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Crear una instancia de QueryClient para cada sesión de usuario
  // Esto evita compartir estado entre diferentes usuarios en SSR
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
