import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';

// Función para aclarar un color hexadecimal
const lightenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;

  return '#' + (
    0x1000000 + 
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
};

// Función para oscurecer un color hexadecimal
const darkenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;

  return '#' + (
    0x1000000 + 
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
};

// Función para convertir un color hexadecimal a RGBA con opacidad
export const hexToRgba = (hex: string, opacity: number): string => {
  // Eliminar el # si está presente
  const hexValue = hex.replace('#', '');
  
  // Convertir a valores RGB
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export function useUserTheme() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  
  // Color por defecto si no hay perfil o color definido
  const defaultColor = '#2563eb'; // blue-600
  const userColor = profile?.color || defaultColor;
  
  // Determinar si estamos en modo oscuro o claro
  const isDarkMode = theme === 'dark';
  
  // Ajustar el color según el modo
  const adjustedColor = isDarkMode 
    ? darkenColor(userColor, 10) // Un poco más oscuro en modo oscuro
    : lightenColor(userColor, 10); // Un poco más claro en modo claro
    
  // Obtener color con opacidad
  const getColorWithOpacity = (opacity: number): string => {
    return hexToRgba(userColor, opacity);
  };
  
  // Obtener color de fondo atenuado según el tema
  const getFadedBackground = (): string => {
    return isDarkMode 
      ? hexToRgba(darkenColor(userColor, 30), 0.2) // Más oscuro y más transparente en modo oscuro
      : hexToRgba(lightenColor(userColor, 40), 0.15); // Más claro y menos transparente en modo claro
  };
  
  // Genera clases de Tailwind con el color personalizado
  const getTextColor = () => ({
    color: userColor,
    '--tw-text-opacity': 1,
    '--tw-border-opacity': 1,
  });

  const getBgColor = (opacity = 1) => ({
    backgroundColor: `${userColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
  });

  const getHoverTextColor = () => ({
    '--tw-text-opacity': 1,
    '--tw-border-opacity': 1,
    '--tw-hover-text-opacity': 1,
    '--tw-hover-border-opacity': 1,
    '--tw-hover-bg-opacity': 0.1,
    '--tw-hover-bg': userColor,
  });

  const getBorderColor = () => ({
    borderColor: userColor,
    '--tw-border-opacity': 1,
  });

  const getRingColor = () => ({
    '--tw-ring-color': userColor,
    '--tw-ring-opacity': 0.5,
  });

  // Función para obtener el color del borde con opacidad ajustada según el tema
  const getThemeAdjustedBorderColor = (opacity = 1) => {
    return {
      borderColor: `${adjustedColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
      '--tw-border-opacity': 1,
    };
  };

  // Función para obtener el color de fondo con opacidad ajustada según el tema
  const getThemeAdjustedBgColor = (opacity = 0.1) => ({
    backgroundColor: `${adjustedColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
  });

  // Retornar solo las funciones y valores necesarios
  return {
    userColor,
    adjustedColor,
    getTextColor,
    getBgColor,
    getHoverTextColor,
    getBorderColor,
    getRingColor,
    getThemeAdjustedBorderColor,
    getThemeAdjustedBgColor,
    // Nuevas funciones añadidas
    getFadedBackground,
    getColorWithOpacity,
  } as const;
}
