"use client"

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes"; // Asumiendo que esta es la importación correcta para el tipo

// Definimos el tipo Theme para compatibilidad con ThemeSwitcher, aunque next-themes maneja strings.
type Theme = 'light' | 'dark';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Forzamos a que solo existan los temas 'light' y 'dark' (AMOLED)
  const modifiedProps = {
    ...props,
    themes: ['light', 'dark'], // 'dark' se usa como modo AMOLED
    forcedTheme: props.forcedTheme,
    enableSystem: false, // Desactivamos el tema del sistema para forzar nuestra configuración
  };
  
  return <NextThemesProvider {...modifiedProps}>{children}</NextThemesProvider>;
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme, themes: availableThemes } = useNextTheme();

  // Usamos el setTheme original de next-themes directamente.
  // El ThemeSwitcher espera 'light' | 'dark', lo cual es compatible.
  const customSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  return {
    theme: theme as Theme | undefined, // El tema actual puede ser undefined inicialmente
    setTheme: customSetTheme,
    resolvedTheme: resolvedTheme as Theme | undefined,
    availableThemes: availableThemes || ['light', 'dark'], // Aseguramos que availableThemes tenga un valor
    // La lógica isDark se puede reconstruir después si es necesaria, 
    // o derivarse de `theme === 'dark'` o `resolvedTheme`
  };
}
