"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback, useRef } from "react"

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
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number>()

  // Solo se ejecuta en el cliente
  useEffect(() => {
    setIsClient(true)
    setCurrentTheme(theme as Theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    if (isAnimating) return;
    
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light'
    
    // Iniciar animación
    setIsAnimating(true)
    
    // Cambiar el tema después de un breve retraso para permitir que la animación comience
    setTimeout(() => {
      setTheme(nextTheme)
      setCurrentTheme(nextTheme)
      
      // Restablecer el estado de animación después de que termine
      setTimeout(() => {
        setIsAnimating(false)
      }, 300) // Tiempo de la animación
    }, 10)
  }, [currentTheme, setTheme, isAnimating])

  // Limpiar el timeout si el componente se desmonta
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

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
      className={cn(
        "relative overflow-hidden transition-colors duration-200",
        className,
        isAnimating && "pointer-events-none"
      )}
      aria-label="Cambiar tema"
      disabled={isAnimating}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sol */}
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-300",
            currentTheme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-75'
          )}
        >
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        </div>
        
        {/* Luna */}
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-300",
            currentTheme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-75'
          )}
        >
          <Moon className="h-[1.2rem] w-[1.2rem]" />
        </div>
        
        {/* Efecto de destello */}
        {isAnimating && (
          <div className={cn(
            "absolute inset-0 rounded-full bg-white/20",
            "animate-ping-slow opacity-0"
          )} />
        )}
      </div>
      
      {showLabel && (
        <span className="ml-2">
          {currentTheme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        </span>
      )}
    </Button>
  )
}
