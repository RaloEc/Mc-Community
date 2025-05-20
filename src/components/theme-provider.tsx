"use client"
import { useState, useEffect } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  // Esto evita problemas de hidratación con el tema
  useEffect(() => {
    setMounted(true)
  }, [])

  // No renderizar el proveedor de tema hasta que estemos en el cliente
  // Esto evita que haya diferencias entre el renderizado del servidor y del cliente
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
