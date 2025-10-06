"use client"

import { ThemeToggleButton } from "@/lib/theme"

/**
 * Componente de demostración del ThemeTogglerButton
 * Muestra todas las variantes y tamaños disponibles
 */
export function ThemeTogglerDemo() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">ThemeToggler Demo</h2>
        <p className="text-muted-foreground mb-6">
          Ejemplos de todas las variantes y tamaños del botón de tema
        </p>
      </div>

      {/* Variantes válidas (shadcn Button variants) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Variantes</h3>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <ThemeToggleButton variant="default" size="sm" modes={["light","dark"]} />
            <span className="text-xs text-muted-foreground">default / sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ThemeToggleButton variant="ghost" size="default" modes={["light","dark"]} />
            <span className="text-xs text-muted-foreground">ghost / md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ThemeToggleButton variant="outline" size="lg" modes={["light","dark"]} />
            <span className="text-xs text-muted-foreground">outline / lg</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ThemeToggleButton variant="secondary" size="default" modes={["light","dark"]} />
            <span className="text-xs text-muted-foreground">secondary / md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ThemeToggleButton variant="destructive" size="default" modes={["light","dark"]} />
            <span className="text-xs text-muted-foreground">destructive / md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ThemeToggleButton variant="link" size="default" modes={["light","dark"]} />
            <span className="text-xs text-muted-foreground">link / md</span>
          </div>
        </div>
      </div>

      {/* Tamaños */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tamaños</h3>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <ThemeToggleButton size="sm" modes={["light","dark"]} />
            <span className="text-xs text-muted-foreground">sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ThemeToggleButton size="default" modes={["light","dark"]} />
            <span className="text-xs text-muted-foreground">default</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ThemeToggleButton size="lg" modes={["light","dark"]} />
            <span className="text-xs text-muted-foreground">lg</span>
          </div>
        </div>
      </div>
      {/* Nota: Solo se muestran modos ['light','dark'] sin 'system' */}
    </div>
  )
}

