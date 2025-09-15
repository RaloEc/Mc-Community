"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback } from "react"

type Theme = "light" | "dark"

type ThemeTogglerButtonProps = {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  direction?: "horizontal" | "vertical"
  className?: string
  showLabel?: boolean
}

export function ThemeTogglerButton({
  variant = "outline",
  size = "icon",
  direction = "horizontal",
  className,
  showLabel = false,
}: ThemeTogglerButtonProps) {
  const { theme, setTheme } = useTheme()
  const [isClient, setIsClient] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<Theme>(theme as Theme)

  // Solo se ejecuta en el cliente
  useEffect(() => {
    setIsClient(true)
    setCurrentTheme(theme as Theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    setCurrentTheme(nextTheme)
  }, [currentTheme, setTheme])

  // Renderizar un placeholder mientras se monta el componente
  if (!isClient) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("relative", className)}
        disabled
      >
        <div className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn("relative transition-colors duration-200", className)}
      aria-label="Cambiar tema"
    >
      <div className="relative inline-flex items-center">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        
        {showLabel && (
          <span className="ml-2">
            {currentTheme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          </span>
        )}
      </div>
    </Button>
  )
}
