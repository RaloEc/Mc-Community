"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * QueryProvider - Proveedor global de TanStack Query
 *
 * Características:
 * ✅ Singleton: El QueryClient se crea UNA SOLA VEZ por sesión del navegador
 * ✅ Lazy initialization: Se instancia dentro de useState para evitar recreaciones
 * ✅ Caché persistente: Los datos se mantienen en memoria durante la navegación
 * ✅ Sin refetch automático: Evita spinners innecesarios al volver a una página
 *
 * Configuración:
 * - staleTime: 5 minutos (datos frescos sin refetch automático)
 * - gcTime: 10 minutos (garbage collection - cuánto tiempo mantener datos sin usar)
 * - refetchOnWindowFocus: false (no refetch cuando la ventana recupera foco)
 * - refetchOnReconnect: false (no refetch cuando se recupera conexión)
 * - refetchOnMount: false (no refetch al montar componentes)
 *
 * Beneficios para UX:
 * - Al navegar de /perfil a /match y volver: datos instantáneos ✅
 * - Sin pantallas blancas de carga ✅
 * - Sin spinners innecesarios ✅
 * - Scroll infinito preservado ✅
 */
export default function QueryProvider({ children }: { children: ReactNode }) {
  // ✅ useState asegura que el cliente se cree UNA SOLA VEZ
  // Si lo creáramos fuera, se recrearía en cada render (problema)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ✅ 5 minutos: Tiempo que los datos se consideran "frescos"
            // Después de esto, si se hace refetch, se marcará como stale
            // PERO no hará refetch automático (porque refetchOnWindowFocus: false)
            staleTime: 1000 * 60 * 5,

            // ✅ 10 minutos: Tiempo que los datos permanecen en caché
            // Después de esto, se eliminan de memoria (garbage collection)
            // Esto es importante para no llenar la memoria con datos antiguos
            gcTime: 1000 * 60 * 10,

            // ✅ false: No refetch cuando la ventana recupera foco
            // Evita spinners cuando el usuario vuelve de otra pestaña
            refetchOnWindowFocus: false,

            // ✅ false: No refetch cuando se recupera la conexión
            // Evita recargas innecesarias en redes inestables
            refetchOnReconnect: false,

            // ✅ false: No refetch cuando un componente se monta
            // Los datos del caché se usan inmediatamente
            refetchOnMount: false,

            // ✅ Reintentos: 1 intento en caso de error (no bombardear servidor)
            retry: 1,

            // ✅ Delay entre reintentos: 1 segundo
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // ✅ Reintentos para mutaciones: 1 intento
            retry: 1,

            // ✅ Delay entre reintentos: 1 segundo
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
