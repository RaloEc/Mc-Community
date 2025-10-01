"use client"

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useCallback, useEffect, useMemo, useState } from "react"

type Theme = 'light' | 'dark'

// Tema por defecto
export const DEFAULT_THEME: Theme = 'dark'

// Duración de la transición en ms (150ms es un buen equilibrio entre suavidad y rapidez)
const TRANSITION_DURATION = 150

// Memoizamos el proveedor para evitar re-renderizados innecesarios
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const modifiedProps = useMemo(() => ({
    ...props,
    themes: ['light', 'dark'],
    defaultTheme: DEFAULT_THEME,
    enableSystem: false,
    // Desactivamos la transición nativa para manejarla nosotros
    disableTransitionOnChange: true,
    storageKey: 'mc-community-theme',
  }), [props])
  
  // Efecto para aplicar la clase de transición al documento
  useEffect(() => {
    // Añadir clase para habilitar transiciones suaves
    document.documentElement.classList.add('theme-transition');
    
    return () => {
      document.documentElement.classList.remove('theme-transition');
    }
  }, []);
  
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
  
  // Estado para controlar la animación
  const [isChanging, setIsChanging] = useState(false);

  // Función para cambiar el tema con animación suave
  const setTheme = useCallback((newTheme: Theme) => {
    if (isChanging) return; // Evitar cambios múltiples durante la animación
    
    setIsChanging(true);
    const root = document.documentElement;
    
    // Preparar el documento para la transición
    root.classList.add('theme-transition');
    
    // Aplicar el tema inmediatamente
    root.style.setProperty('color-scheme', newTheme);
    root.classList.toggle('dark', newTheme === 'dark');
    
    // Actualizar el estado en next-themes
    setNextTheme(newTheme);
    
    // Permitir que la transición ocurra y luego limpiar
    setTimeout(() => {
      setIsChanging(false);
    }, TRANSITION_DURATION);
  }, [setNextTheme, isChanging])

  // Memoizamos el valor del tema resuelto
  const currentTheme = useMemo<Theme | undefined>(() => {
    return (resolvedTheme as Theme) || DEFAULT_THEME
  }, [resolvedTheme])

  return {
    theme: currentTheme,
    setTheme,
    resolvedTheme: currentTheme,
    availableThemes: availableThemes as Theme[] || ['light', 'dark'],
    isDark: currentTheme === 'dark',
    isChanging
  }
}
