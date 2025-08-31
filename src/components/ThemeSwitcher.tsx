'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './theme-provider'
import { Sun, Moon, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Efecto para manejar la hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determinar el modo actual (AMOLED)
  const isAmoledMode = theme === 'dark'

  const toggleTheme = () => {
    // Evitar múltiples clics durante la animación
    if (isAnimating) return
    
    setIsAnimating(true)
    
    // Alternar solo entre modo claro y modo AMOLED
    let newTheme: 'light' | 'dark' = 'light';
    if (theme === 'light') {
      newTheme = 'dark'; // AMOLED
    } else {
      newTheme = 'light';
    }
    
    // Pequeño retraso para que la animación se vea antes de cambiar el tema
    setTimeout(() => {
      setTheme(newTheme)
      setTimeout(() => setIsAnimating(false), 300)
    }, 150)
  }

  return (
    <button
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center justify-between w-14 h-7 rounded-full p-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary border",
        mounted ? (isAmoledMode ? 'bg-black border-indigo-900' : 'bg-blue-100 border-blue-300') : 'bg-gray-500 border-gray-600',
        isAnimating ? 'scale-105' : '',
        isHovered ? 'shadow-lg' : 'shadow-md'
      )}
      aria-label="Cambiar tema"
      disabled={isAnimating}
    >
      {/* Fondo con gradiente */}
      <div className={cn(
        "absolute inset-0 rounded-full z-0 transition-opacity duration-300",
        mounted ? (isAmoledMode ? 'opacity-100' : 'opacity-0') : 'opacity-0'
      )}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 rounded-full">
          {/* Estrellas (solo visibles en modo AMOLED) */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300",
            mounted ? (isAmoledMode ? 'opacity-100' : 'opacity-0') : 'opacity-0'
          )}>
            <div className="absolute top-1 left-2 h-0.5 w-0.5 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-3 left-5 h-0.5 w-0.5 bg-white rounded-full animate-pulse delay-75"></div>
            <div className="absolute top-2 left-9 h-0.5 w-0.5 bg-white rounded-full animate-pulse delay-150"></div>
            <div className="absolute top-4 left-11 h-0.5 w-0.5 bg-white rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      </div>

      {/* Fondo modo claro */}
      <div className={cn(
        "absolute inset-0 rounded-full z-0 transition-opacity duration-300",
        mounted ? (!isAmoledMode ? 'opacity-100' : 'opacity-0') : 'opacity-0'
      )}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-sky-100 to-blue-100 rounded-full"></div>
      </div>

      {/* Icono del sol para modo claro */}
      <div className={cn(
        "relative z-10 flex items-center justify-center h-5 w-5 rounded-full transition-all duration-300 ease-[bounce] shadow-md",
        mounted ? (!isAmoledMode ? 'bg-amber-400 scale-100 translate-x-7' : 'bg-amber-500 scale-75 translate-x-0') : 'bg-amber-500 scale-75 translate-x-0'
      )}>
        <Sun className={cn(
          "h-3 w-3 text-amber-100 transition-all duration-300",
          mounted ? (!isAmoledMode ? 'opacity-100 scale-100' : 'opacity-0 scale-0') : 'opacity-0 scale-0'
        )} />
      </div>

      {/* Icono de la luna para modo AMOLED (antes llamado dark) */}
      <div className={cn(
        "absolute z-20 flex items-center justify-center h-5 w-5 rounded-full transition-all duration-300 ease-[bounce] shadow-md",
        mounted ? (isAmoledMode ? 'bg-gray-800 scale-100 translate-x-7' : 'bg-gray-700 scale-75 translate-x-0') : 'bg-gray-700 scale-75 translate-x-0'
      )}>
        <div className="relative flex items-center justify-center">
          <Moon className={cn(
            "h-3 w-3 text-gray-100 transition-all duration-300",
            mounted ? (isAmoledMode ? 'opacity-100 scale-100' : 'opacity-0 scale-0') : 'opacity-0 scale-0'
          )} />
          <Star className={cn(
            "absolute -top-1 -right-1 h-1.5 w-1.5 text-white transition-all duration-300",
            mounted ? (isAmoledMode ? 'opacity-100 scale-100' : 'opacity-0 scale-0') : 'opacity-0 scale-0'
          )} />
        </div>
      </div>

      {/* Efecto de brillo al pasar el cursor */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent rounded-full animate-pulse z-0"></div>
      )}
    </button>
  )
}
