'use client'

// NOTA: Este es un archivo de respaldo (.bak) y no se utiliza en la aplicación.
// El archivo principal es ComentariosNuevo.tsx, que contiene la implementación correcta.
// Este archivo se mantiene solo como referencia histórica.

interface ComentariosProps {
  tipoEntidad: string
  entidadId: string
  limite?: number
}

export default function Comentarios({ tipoEntidad, entidadId, limite = 10 }: ComentariosProps) {
  // Este es un componente de respaldo simplificado para evitar errores de TypeScript
  // La implementación real está en ComentariosNuevo.tsx
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <p>Componente de respaldo - Ver ComentariosNuevo.tsx para la implementación real</p>
    </div>
  )
}
