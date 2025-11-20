"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { useEffect, useState } from "react";

/**
 * ThemeProvider unificado para la aplicación
 *
 * Características:
 * - Soporte para tema claro y oscuro (AMOLED)
 * - Respeta prefers-color-scheme del sistema
 * - Guarda preferencia en localStorage
 * - Sin FOUC (Flash of Unstyled Content)
 * - Cambio de tema instantáneo sin animaciones
 */
export function ThemeProvider({
  children,
  userColor,
  ...props
}: ThemeProviderProps & { userColor?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (userColor) {
      document.documentElement.style.setProperty("--user-color", userColor);
    }
  }, [userColor]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      storageKey="korestats-theme"
      themes={["light", "dark"]}
      disableTransitionOnChange={true} // Crítico: evita transiciones CSS globales
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
