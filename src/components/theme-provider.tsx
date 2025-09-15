"use client"

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useCallback, useMemo } from "react"

type Theme = 'light' | 'dark'

// Tema por defecto
export const DEFAULT_THEME: Theme = 'dark'

// Memoizamos el proveedor para evitar re-renderizados innecesarios
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const modifiedProps = useMemo(() => ({
    ...props,
    themes: ['light', 'dark'],
    defaultTheme: DEFAULT_THEME,
    enableSystem: false,
    disableTransitionOnChange: true, // Importante: desactiva la transición para cambios más rápidos
    storageKey: 'mc-community-theme',
  }), [props])
  
  return (
    <NextThemesProvider {...modifiedProps}>
      {children}
    </NextThemesProvider>
  )
}

// Hook optimizado para usar el tema
export function useTheme() {
  const { 
    theme, 
    setTheme: setNextTheme, 
    resolvedTheme, 
    themes: availableThemes 
  } = useNextTheme()

  // Función para cambiar el tema de forma instantánea
  const setTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    
    // Desactivar temporalmente las transiciones
    const originalTransition = root.style.transition;
    root.style.transition = 'none';
    
    // Aplicar el tema
    root.style.setProperty('color-scheme', newTheme);
    root.classList.toggle('dark', newTheme === 'dark');
    
    // Forzar reflow para asegurar que los cambios se apliquen
    void root.offsetHeight;
    
    // Restaurar transiciones
    root.style.transition = originalTransition;
    
    // Actualizar el estado
    setNextTheme(newTheme);
  }, [setNextTheme])

  // Memoizamos el valor del tema resuelto
  const currentTheme = useMemo<Theme | undefined>(() => {
    return (resolvedTheme as Theme) || DEFAULT_THEME
  }, [resolvedTheme])

  return {
    theme: currentTheme,
    setTheme,
    resolvedTheme: currentTheme,
    availableThemes: availableThemes as Theme[] || ['light', 'dark'],
    isDark: currentTheme === 'dark'
  }
}
