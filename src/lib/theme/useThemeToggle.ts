"use client"

import { useTheme } from "next-themes"
import { useCallback, useEffect, useState } from "react"

/**
 * Hook simple para cambiar el tema con fade suave
 * 
 * El fade se aplica automáticamente por CSS en todos los elementos
 * No requiere animaciones complejas ni overlays
 */
export function useThemeToggle() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  /**
   * Cambia entre tema claro y oscuro
   * La transición fade se aplica automáticamente por CSS
   */
  const toggleTheme = useCallback(() => {
    if (!mounted) return

    const currentTheme = resolvedTheme || systemTheme || "dark"
    const newTheme = currentTheme === "light" ? "dark" : "light"
    
    setTheme(newTheme)
  }, [mounted, resolvedTheme, systemTheme, setTheme])

  /**
   * Establece un tema específico
   */
  const setThemeWithTransition = useCallback((newTheme: "light" | "dark") => {
    if (!mounted) return
    setTheme(newTheme)
  }, [mounted, setTheme])

  return {
    theme: (resolvedTheme || systemTheme || "dark") as "light" | "dark",
    toggleTheme,
    setTheme: setThemeWithTransition,
    mounted,
  }
}
