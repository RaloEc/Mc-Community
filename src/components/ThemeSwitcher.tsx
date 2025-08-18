'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './theme-provider'
import { Sun, Moon, Star } from 'lucide-react'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Determinar si estamos en modo oscuro (amoled)
  const isDarkMode = theme === 'amoled' || theme === 'dark'

  const toggleTheme = () => {
    // Evitar múltiples clics durante la animación
    if (isAnimating) return
    
    setIsAnimating(true)
    const newTheme = isDarkMode ? 'light' : 'amoled'
    
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
      className={`
        relative flex items-center justify-between
        w-14 h-7 rounded-full p-1
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary
        ${isDarkMode ? 'bg-gray-900' : 'bg-blue-100'}
        ${isAnimating ? 'scale-105' : ''}
        ${isHovered ? 'shadow-lg' : 'shadow-md'}
        border ${isDarkMode ? 'border-indigo-900' : 'border-blue-300'}
      `}
      aria-label="Cambiar tema"
      disabled={isAnimating}
    >
      {/* Fondo con gradiente */}
      <div className={`
        absolute inset-0 rounded-full z-0 transition-opacity duration-300
        ${isDarkMode ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 rounded-full">
          {/* Estrellas (solo visibles en modo oscuro) */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-1 left-2 h-0.5 w-0.5 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-3 left-5 h-0.5 w-0.5 bg-white rounded-full animate-pulse delay-75"></div>
            <div className="absolute top-2 left-9 h-0.5 w-0.5 bg-white rounded-full animate-pulse delay-150"></div>
            <div className="absolute top-4 left-11 h-0.5 w-0.5 bg-white rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      </div>

      {/* Fondo modo claro */}
      <div className={`
        absolute inset-0 rounded-full z-0 transition-opacity duration-300
        ${!isDarkMode ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-sky-100 to-blue-100 rounded-full"></div>
      </div>

      {/* Indicador Sol (modo claro) */}
      <div className={`
        relative z-10 flex items-center justify-center
        h-5 w-5 rounded-full
        transition-all duration-300 ease-[bounce]
        ${!isDarkMode ? 'bg-amber-400 scale-100 translate-x-7' : 'bg-amber-500 scale-75 translate-x-0'}
        shadow-md
      `}>
        <Sun className={`
          h-3 w-3 text-amber-100
          transition-all duration-300
          ${!isDarkMode ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
        `} />
      </div>

      {/* Indicador Luna (modo oscuro) */}
      <div className={`
        absolute z-20 flex items-center justify-center
        h-5 w-5 rounded-full
        transition-all duration-300 ease-[bounce]
        ${isDarkMode ? 'bg-gray-800 scale-100 translate-x-7' : 'bg-gray-700 scale-75 translate-x-0'}
        shadow-md
      `}>
        <div className="relative flex items-center justify-center">
          <Moon className={`
            h-3 w-3 text-gray-100
            transition-all duration-300
            ${isDarkMode ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
          `} />
          <Star className={`
            absolute -top-1 -right-1 h-1.5 w-1.5 text-white
            transition-all duration-300
            ${isDarkMode ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
          `} />
        </div>
      </div>

      {/* Efecto de brillo al pasar el cursor */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent rounded-full animate-pulse z-0"></div>
      )}
    </button>
  )
}
