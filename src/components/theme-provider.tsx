"use client"

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes"; // Asumiendo que esta es la importación correcta para el tipo

// Definimos el tipo Theme para compatibilidad con ThemeSwitcher, aunque next-themes maneja strings.
type Theme = 'light' | 'dark' | 'amoled' | 'system';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system" // Puedes cambiar a "light" o "dark" para simplificar aún más si es necesario
      enableSystem
      themes={['light', 'dark', 'amoled']} // Especificamos los temas soportados
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme, themes: availableThemes } = useNextTheme();

  // Usamos el setTheme original de next-themes directamente.
  // El ThemeSwitcher espera 'light' | 'amoled', lo cual es compatible.
  const customSetTheme = (newTheme: 'light' | 'dark' | 'amoled' | 'system') => {
    setTheme(newTheme);
  };

  return {
    theme: theme as Theme | undefined, // El tema actual puede ser undefined inicialmente
    setTheme: customSetTheme,
    resolvedTheme: resolvedTheme as Theme | undefined,
    availableThemes: availableThemes || ['light', 'dark', 'amoled', 'system'], // Aseguramos que availableThemes tenga un valor
    // La lógica isDark se puede reconstruir después si es necesaria, 
    // o derivarse de `theme === 'dark' || theme === 'amoled'` o `resolvedTheme`
  };
}
