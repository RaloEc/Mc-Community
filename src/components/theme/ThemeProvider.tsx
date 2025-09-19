'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
  userColor?: string;
}

export function ThemeProvider({ children, userColor = '#3b82f6' }: ThemeProviderProps) {
  const { theme } = useTheme();

  useEffect(() => {
    // Aplicar estilos globales basados en el color del usuario
    const root = document.documentElement;
    
    // Función para convertir color HEX a RGB
    const hexToRgb = (hex: string) => {
      // Eliminar el # si está presente
      const hexValue = hex.replace('#', '');
      // Convertir a RGB
      const r = parseInt(hexValue.substring(0, 2), 16);
      const g = parseInt(hexValue.substring(2, 4), 16);
      const b = parseInt(hexValue.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    };

    const rgbColor = hexToRgb(userColor);
    
    // Ajustar el color de selección según el tema
    const selectionBg = theme === 'dark' 
      ? `rgba(${rgbColor}, 0.3)` 
      : `rgba(${rgbColor}, 0.2)`;

    // Aplicar las variables CSS
    root.style.setProperty('--user-color', userColor);
    root.style.setProperty('--user-color-rgb', rgbColor);
    root.style.setProperty('--selection-bg', selectionBg);
    root.style.setProperty('--selection-text', theme === 'dark' ? '#ffffff' : '#000000');
    root.style.setProperty('--caret-color', userColor);

  }, [userColor, theme]);

  return <>{children}</>;
}
