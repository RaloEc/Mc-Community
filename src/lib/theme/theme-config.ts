/**
 * Configuración del Sistema de Tema
 * 
 * Sistema simple con transición fade in/out suave y elegante
 */

export const themeConfig = {
  /**
   * Duración de la transición fade en milisegundos
   * 
   * Recomendaciones:
   * - 300ms: Rápido
   * - 500ms: Moderado
   * - 700ms: Suave y lento (actual)
   * - 1000ms: Muy lento
   */
  transitionDuration: 2000,
  
  /**
   * Función de timing para la transición
   * 
   * Para fade suave in/out, se recomienda "ease-in-out"
   * 
   * Opciones:
   * - "ease": Transición suave
   * - "ease-in-out": Fade in/out suave (recomendado)
   * - "cubic-bezier(0.4, 0, 0.2, 1)": Personalizado suave
   */
  transitionTiming: "ease-in-out" as const,
}

// Tipo para TypeScript
export type ThemeConfig = typeof themeConfig