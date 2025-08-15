"use client"

import { useEffect, useState } from "react"

/**
 * Hook para detectar si el dispositivo es móvil basado en el ancho de la pantalla
 * @param breakpoint - Punto de quiebre para considerar un dispositivo como móvil (por defecto 768px)
 * @returns boolean que indica si el dispositivo es móvil
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Función para actualizar el estado basado en el tamaño de la ventana
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Verificar inicialmente
    checkMobile()

    // Agregar listener para cambios de tamaño
    window.addEventListener("resize", checkMobile)

    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [breakpoint])

  return isMobile
}
