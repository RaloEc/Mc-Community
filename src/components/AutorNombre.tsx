'use client';

import { useEffect, useState } from 'react';

interface AutorNombreProps {
  nombre: string;
  color?: string;
  className?: string;
}

export default function AutorNombre({ nombre, color, className = '' }: AutorNombreProps) {
  const [colorFinal, setColorFinal] = useState(color || '#3b82f6');
  
  useEffect(() => {
    // Intentar obtener el color personalizado del localStorage si coincide con el nombre
    try {
      const usuarioActual = localStorage.getItem('mc-community-username');
      const colorGuardado = localStorage.getItem('userColor');
      
      // Si el nombre del autor coincide con el nombre de usuario actual y hay un color guardado
      if (usuarioActual && colorGuardado && usuarioActual === nombre) {
        setColorFinal(colorGuardado);
      } else {
        // Usar el color proporcionado o el predeterminado
        setColorFinal(color || '#3b82f6');
      }
    } catch (e) {
      console.error('Error al acceder a localStorage:', e);
    }
  }, [nombre, color]);
  
  return (
    <span 
      className={`font-medium ${className}`}
      style={{ color: colorFinal }}
    >
      {nombre}
    </span>
  );
}
