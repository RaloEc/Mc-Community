"use client";

import React from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Contexto para proporcionar una instancia única de Supabase
 * Evita crear múltiples instancias del cliente
 */
const SupabaseContext = React.createContext<SupabaseClient | null>(null);

/**
 * Proveedor de Supabase
 * Debe envolver la aplicación para que los hooks puedan acceder al cliente
 */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = React.useState(() => createClient());

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

/**
 * Hook para acceder al cliente de Supabase
 * @throws Error si se usa fuera de SupabaseProvider
 */
export function useSupabaseClient(): SupabaseClient {
  const supabase = React.useContext(SupabaseContext);

  if (!supabase) {
    throw new Error(
      "useSupabaseClient debe ser usado dentro de <SupabaseProvider>"
    );
  }

  return supabase;
}
