"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string | null;
  role: "user" | "admin" | string;
  created_at?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  color?: string | null;
  followers_count?: number;
  following_count?: number;
  friends_count?: number;
  connected_accounts?: Record<string, string> | string;
}

// Keys para las queries
export const authKeys = {
  session: ["auth", "session"] as const,
  profile: (userId: string) => ["auth", "profile", userId] as const,
};

/**
 * Hook para obtener la sesión actual usando React Query
 * CON MANEJO ROBUSTO DE ERRORES Y FALLBACK A CACHÉ
 */
export function useSessionQuery() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useQuery<Session | null>({
    queryKey: authKeys.session,
    queryFn: async () => {
      console.log("[useSessionQuery] Obteniendo sesión...");

      try {
        // Llamada directa sin timeout - dejar que Supabase maneje el timeout
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[useSessionQuery] Error al obtener sesión:", error);
          throw error;
        }

        console.log("[useSessionQuery] Sesión obtenida:", {
          hasSession: !!data.session,
          userId: data.session?.user?.id,
        });

        return data.session ?? null;
      } catch (error) {
        console.error("[useSessionQuery] Error al obtener sesión:", error);

        // CRÍTICO: Si falla, usar la sesión en caché
        const cachedSession = queryClient.getQueryData<Session | null>(
          authKeys.session
        );
        if (cachedSession) {
          console.log(
            "[useSessionQuery] Usando sesión en caché debido a error"
          );
          return cachedSession;
        }

        // Si no hay caché, retornar null en lugar de throw
        console.warn(
          "[useSessionQuery] No hay sesión en caché, retornando null"
        );
        return null;
      }
    },
    // Configuración optimizada para evitar refetches innecesarios
    staleTime: 10 * 60 * 1000, // 10 minutos - datos se consideran frescos
    gcTime: 30 * 60 * 1000, // 30 minutos - mantener en caché
    refetchOnMount: false, // No refetch al montar si hay datos frescos
    refetchOnReconnect: false, // No refetch al reconectar
    refetchOnWindowFocus: false, // CRÍTICO: No refetch al cambiar pestañas
    retry: false, // No reintentar automáticamente
    networkMode: "online", // Solo ejecutar si hay conexión
  });
}

/**
 * Hook para obtener el perfil del usuario usando React Query
 * CON MANEJO ROBUSTO DE ERRORES Y FALLBACK A CACHÉ
 */
export function useProfileQuery(userId: string | null | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: userId ? authKeys.profile(userId) : ["auth", "profile", "null"],
    queryFn: async () => {
      if (!userId) {
        console.log("[useProfileQuery] No hay userId, retornando null");
        return null;
      }

      console.log("[useProfileQuery] Obteniendo perfil para userId:", userId);

      try {
        // Intentar hasta 3 veces con backoff para casos de OAuth recién creado
        let lastError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { data, error } = await supabase
              .from("perfiles")
              .select("*")
              .eq("id", userId)
              .single();

            if (error) {
              lastError = error;
              console.log(
                `[useProfileQuery] Intento ${attempt + 1}/3 falló:`,
                error.message
              );

              // Si no es el último intento, esperar antes de reintentar
              if (attempt < 2) {
                await new Promise((resolve) =>
                  setTimeout(resolve, 300 * (attempt + 1))
                );
                continue;
              }
              throw error;
            }

            if (data) {
              const profile: Profile = {
                id: data.id,
                username: data.username ?? null,
                role: data.role ?? "user",
                created_at: data.created_at ?? null,
                avatar_url: data.avatar_url ?? null,
                banner_url: (data as any).banner_url ?? null,
                color: data.color ?? null,
                followers_count: (data as any).followers_count ?? 0,
                following_count: (data as any).following_count ?? 0,
                friends_count: (data as any).friends_count ?? 0,
                connected_accounts: (data as any).connected_accounts ?? {},
              };

              console.log("[useProfileQuery] Perfil obtenido exitosamente:", {
                username: profile.username,
                role: profile.role,
              });

              return profile;
            }
          } catch (err) {
            lastError = err;
            if (attempt === 2) {
              throw err;
            }
          }
        }

        throw lastError || new Error("No se pudo obtener el perfil");
      } catch (error) {
        console.error("[useProfileQuery] Error definitivo:", error);

        // CRÍTICO: Si falla, usar el perfil en caché
        const cachedProfile = queryClient.getQueryData<Profile | null>(
          authKeys.profile(userId)
        );
        if (cachedProfile) {
          console.log(
            "[useProfileQuery] Usando perfil en caché debido a error"
          );
          return cachedProfile;
        }

        // Si no hay caché, retornar null en lugar de throw
        console.warn(
          "[useProfileQuery] No hay perfil en caché, retornando null"
        );
        return null;
      }
    },
    enabled: !!userId, // Solo ejecutar si hay userId
    staleTime: 10 * 60 * 1000, // 10 minutos - datos se consideran frescos
    gcTime: 30 * 60 * 1000, // 30 minutos - mantener en caché
    refetchOnMount: false, // No refetch al montar si hay datos frescos
    refetchOnWindowFocus: false, // CRÍTICO: No refetch al cambiar pestañas
    retry: false, // Ya manejamos reintentos manualmente
    networkMode: "online", // Solo ejecutar si hay conexión
  });
}

/**
 * Hook combinado que proporciona sesión y perfil de forma sincronizada
 * Elimina race conditions al garantizar que el perfil solo se carga después de la sesión
 */
export function useAuthData(initialSession?: Session | null) {
  const queryClient = useQueryClient();

  // Establecer sesión inicial si existe (solo una vez)
  React.useEffect(() => {
    if (initialSession) {
      const currentData = queryClient.getQueryData<Session | null>(
        authKeys.session
      );
      if (!currentData) {
        console.log("[useAuthData] Estableciendo sesión inicial del servidor");
        queryClient.setQueryData(authKeys.session, initialSession);
      }
    }
  }, []); // Solo en el primer render

  // Primero obtener la sesión
  const sessionQuery = useSessionQuery();
  const session = sessionQuery.data ?? null;
  const user = session?.user ?? null;

  // Luego obtener el perfil basado en el userId de la sesión
  const profileQuery = useProfileQuery(user?.id);
  const profile = profileQuery.data ?? null;

  // Estado de carga combinado: está cargando si cualquiera está cargando
  const isLoading = sessionQuery.isLoading || (user && profileQuery.isLoading);

  // Estado de error combinado
  const error = sessionQuery.error || profileQuery.error;

  console.log("[useAuthData] Estado actual:", {
    sessionLoading: sessionQuery.isLoading,
    profileLoading: profileQuery.isLoading,
    isLoading,
    hasSession: !!session,
    hasUser: !!user,
    hasProfile: !!profile,
    profileRole: profile?.role,
  });

  // Funciones de utilidad
  const invalidateAuth = async () => {
    await queryClient.invalidateQueries({ queryKey: authKeys.session });
    if (user?.id) {
      await queryClient.invalidateQueries({
        queryKey: authKeys.profile(user.id),
      });
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({
        queryKey: authKeys.profile(user.id),
      });
    }
  };

  return {
    session,
    user,
    profile,
    isLoading,
    error,
    sessionQuery,
    profileQuery,
    invalidateAuth,
    refreshProfile,
  };
}
